import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  can,
  contentInputSchema,
  contentRejectSchema,
  type ContentInput,
  type ContentListQuery,
  type ContentStatus,
  type ManagedContentQuery,
  type PaginationQuery,
  type Permission,
} from '@webdakwah/shared';
import { randomUUID } from 'node:crypto';

import type { AuthProfile } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RevalidationService } from '../revalidation/revalidation.service.js';
import { StorageService } from '../storage/storage.service.js';
import { TaxonomyService } from '../taxonomy/taxonomy.service.js';

const CONTENT_SUMMARY_SELECT = {
  id: true,
  type: true,
  status: true,
  title: true,
  slug: true,
  excerpt: true,
  mediaUrl: true,
  reviewNote: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, email: true, fullName: true } },
  categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
  tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
  speaker: { select: { id: true, name: true, slug: true } },
};

const CONTENT_DETAIL_SELECT = {
  ...CONTENT_SUMMARY_SELECT,
  body: true,
  links: {
    select: { id: true, title: true, url: true, order: true },
    orderBy: { order: 'asc' as const },
  },
};

/** Status yang masih boleh disunting penulis. */
const AUTHOR_EDITABLE: readonly ContentStatus[] = ['DRAFT', 'REJECTED'];

/** Status yang bisa diajukan untuk review. */
const SUBMITTABLE: readonly ContentStatus[] = ['DRAFT', 'REJECTED'];

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function slugify(value: string): string {
  const base = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return base || 'konten';
}

@Injectable()
export class ContentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revalidation?: RevalidationService,
    @Optional() private readonly storage?: StorageService,
    @Optional() private readonly taxonomy?: TaxonomyService,
  ) {}

  async listMine(profile: AuthProfile, query: ContentListQuery) {
    const where = {
      authorId: profile.id,
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        select: CONTENT_SUMMARY_SELECT,
        orderBy: { updatedAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.content.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapContent(item)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  /** Antrean moderasi: hanya admin, urut dari yang paling lama menunggu. */
  async listReviewQueue(profile: AuthProfile, query: PaginationQuery) {
    this.assertModerator(profile);

    const where = { status: 'PENDING_REVIEW' as const };

    const [items, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        select: CONTENT_SUMMARY_SELECT,
        orderBy: { updatedAt: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.content.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapContent(item)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  /** Daftar terbitan untuk admin, termasuk yang sudah diarsipkan. */
  async listManaged(profile: AuthProfile, query: ManagedContentQuery) {
    this.assertModerator(profile);

    const where = { status: query.status };

    const [items, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        select: CONTENT_SUMMARY_SELECT,
        orderBy: { publishedAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.content.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapContent(item)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  /** PUBLISHED -> ARCHIVED; konten hilang dari semua halaman publik. */
  async archive(profile: AuthProfile, id: string) {
    this.assertModerator(profile);

    const row = await this.findRow(id);

    if (row.status !== 'PUBLISHED') {
      throw new BadRequestException('Hanya konten yang sudah terbit yang bisa diarsipkan.');
    }

    const updated = await this.prisma.content.update({
      where: { id },
      data: { status: 'ARCHIVED' },
      select: CONTENT_DETAIL_SELECT,
    });

    await this.revalidation?.trigger();

    return this.mapContent(updated);
  }

  /** ARCHIVED -> PUBLISHED; tanggal terbit pertama dipertahankan. */
  async unarchive(profile: AuthProfile, id: string) {
    this.assertModerator(profile);

    const row = await this.findRow(id);

    if (row.status !== 'ARCHIVED') {
      throw new BadRequestException('Hanya konten yang diarsipkan yang bisa dipulihkan.');
    }

    const updated = await this.prisma.content.update({
      where: { id },
      data: { status: 'PUBLISHED' },
      select: CONTENT_DETAIL_SELECT,
    });

    await this.revalidation?.trigger();

    return this.mapContent(updated);
  }

  async publish(profile: AuthProfile, id: string) {
    this.assertModerator(profile);
    await this.findPendingRow(id);

    const updated = await this.prisma.content.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date(), reviewNote: null },
      select: CONTENT_DETAIL_SELECT,
    });

    await this.revalidation?.trigger();

    return this.mapContent(updated);
  }

  async reject(profile: AuthProfile, id: string, reviewNote: string) {
    this.assertModerator(profile);

    const parsed = contentRejectSchema.safeParse({ reviewNote });

    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
    }

    await this.findPendingRow(id);

    const updated = await this.prisma.content.update({
      where: { id },
      data: { status: 'REJECTED', reviewNote: parsed.data.reviewNote },
      select: CONTENT_DETAIL_SELECT,
    });

    return this.mapContent(updated);
  }

  async getById(profile: AuthProfile, id: string) {
    const content = await this.prisma.content.findFirst({
      where: {
        id,
        ...(profile.role === 'ADMIN' ? {} : { authorId: profile.id }),
      },
      select: CONTENT_DETAIL_SELECT,
    });

    if (!content) {
      throw new NotFoundException('Konten tidak ditemukan.');
    }

    return this.mapContent(content);
  }

  async create(profile: AuthProfile, input: ContentInput) {
    this.assertPermission(profile.role, 'content:create');

    await this.taxonomy?.ensureCategories(input.categoryIds);
    await this.taxonomy?.ensureSpeaker(input.speakerId ?? null);
    const tags = (await this.taxonomy?.upsertTags(input.tagNames)) ?? [];

    const created = await this.prisma.content.create({
      data: {
        authorId: profile.id,
        type: input.type,
        status: 'DRAFT',
        title: input.title,
        slug: await this.buildSlug(input.title),
        excerpt: emptyToNull(input.excerpt),
        body: emptyToNull(input.body),
        mediaUrl: emptyToNull(input.mediaUrl),
        speakerId: input.speakerId ?? null,
        categories: {
          create: input.categoryIds.map((categoryId) => ({ categoryId })),
        },
        tags: {
          create: tags.map((tag) => ({ tagId: tag.id })),
        },
        links: {
          create: (input.links ?? []).map((link, index) => ({
            title: link.title,
            url: link.url,
            order: link.order ?? index,
          })),
        },
      },
      select: CONTENT_DETAIL_SELECT,
    });

    await this.taxonomy?.cleanupOrphanTags();

    return this.mapContent(created);
  }

  async update(profile: AuthProfile, id: string, input: ContentInput) {
    const row = await this.findOwnedRow(id, profile);
    this.assertEditable(profile, row);

    await this.taxonomy?.ensureCategories(input.categoryIds);
    await this.taxonomy?.ensureSpeaker(input.speakerId ?? null);
    const tags = (await this.taxonomy?.upsertTags(input.tagNames)) ?? [];

    const mediaUrl = emptyToNull(input.mediaUrl);
    const data = {
      type: input.type,
      title: input.title,
      excerpt: emptyToNull(input.excerpt),
      body: emptyToNull(input.body),
      mediaUrl,
      speakerId: input.speakerId ?? null,
      categories: {
        deleteMany: {},
        create: input.categoryIds.map((categoryId) => ({ categoryId })),
      },
      tags: {
        deleteMany: {},
        create: tags.map((tag) => ({ tagId: tag.id })),
      },
      links: {
        deleteMany: {},
        create: (input.links ?? []).map((link, index) => ({
          title: link.title,
          url: link.url,
          order: link.order ?? index,
        })),
      },
      ...(input.title === row.title ? {} : { slug: await this.buildSlug(input.title) }),
    };

    const updated = await this.prisma.content.update({
      where: { id },
      data,
      select: CONTENT_DETAIL_SELECT,
    });

    // Hanya berkas milik penulis konten yang boleh dihapus; URL eksternal
    // atau URL milik pengguna lain diabaikan oleh StorageService.
    if (row.mediaUrl && row.mediaUrl !== mediaUrl) {
      await this.storage?.deleteByPublicUrl(row.mediaUrl, row.authorId);
    }

    await this.taxonomy?.cleanupOrphanTags();

    return this.mapContent(updated);
  }

  /** DRAFT/REJECTED -> PENDING_REVIEW; isian wajib diperiksa ulang di sini. */
  async submit(profile: AuthProfile, id: string) {
    this.assertPermission(profile.role, 'content:create');

    const row = await this.findOwnedRow(id, profile);

    if (row.categories.length === 0) {
      throw new BadRequestException('Minimal satu kategori wajib dipilih sebelum diajukan.');
    }

    if (!SUBMITTABLE.includes(row.status)) {
      throw new BadRequestException(
        'Hanya draft atau konten yang ditolak yang bisa diajukan untuk review.',
      );
    }

    const parsed = contentInputSchema.safeParse({
      type: row.type,
      title: row.title,
      excerpt: row.excerpt ?? '',
      body: row.body ?? '',
      mediaUrl: row.mediaUrl ?? '',
    });

    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
    }

    const updated = await this.prisma.content.update({
      where: { id },
      data: { status: 'PENDING_REVIEW', reviewNote: null },
      select: CONTENT_DETAIL_SELECT,
    });

    return this.mapContent(updated);
  }

  /** PENDING_REVIEW -> DRAFT agar penulis bisa memperbaiki kirimannya. */
  async withdraw(profile: AuthProfile, id: string) {
    const row = await this.findOwnedRow(id, profile);

    if (row.status !== 'PENDING_REVIEW') {
      throw new BadRequestException('Hanya konten yang sedang ditinjau yang bisa ditarik kembali.');
    }

    const updated = await this.prisma.content.update({
      where: { id },
      data: { status: 'DRAFT' },
      select: CONTENT_DETAIL_SELECT,
    });

    return this.mapContent(updated);
  }

  async remove(profile: AuthProfile, id: string) {
    const row = await this.findOwnedRow(id, profile);

    if (profile.role === 'ADMIN') {
      if (row.status === 'PUBLISHED' || row.status === 'ARCHIVED') {
        throw new ForbiddenException(
          'Konten yang sudah terbit atau diarsipkan tidak bisa dihapus.',
        );
      }
    } else {
      if (!can(profile.role, 'content:update-own') || !AUTHOR_EDITABLE.includes(row.status)) {
        throw new ForbiddenException('Hanya draft atau konten yang ditolak yang bisa dihapus.');
      }
    }

    await this.prisma.content.delete({ where: { id } });

    await this.taxonomy?.cleanupOrphanTags();

    if (row.mediaUrl) {
      await this.storage?.deleteByPublicUrl(row.mediaUrl, row.authorId);
    }

    return { ok: true };
  }

  private mapContent<T>(row: T): T {
    if (!row || Array.isArray(row)) {
      return row;
    }

    const record = row as Record<string, unknown>;
    const categories = Array.isArray(record.categories)
      ? record.categories.map((item) =>
          item && typeof item === 'object' && 'category' in item
            ? (item as { category: unknown }).category
            : item,
        )
      : record.categories;
    const tags = Array.isArray(record.tags)
      ? record.tags.map((item) =>
          item && typeof item === 'object' && 'tag' in item
            ? (item as { tag: unknown }).tag
            : item,
        )
      : record.tags;
    const links = Array.isArray(record.links) ? record.links : [];

    return { ...record, categories, tags, links } as T;
  }

  private assertPermission(role: AuthProfile['role'], permission: Permission): void {
    if (!can(role, permission)) {
      throw new ForbiddenException('Anda tidak memiliki izin untuk tindakan ini.');
    }
  }

  /** Moderasi memakai izin terbit, bukan hanya role yang dikirim klien. */
  private assertModerator(profile: AuthProfile): void {
    this.assertPermission(profile.role, 'content:publish');
  }

  private async findRow(id: string) {
    const row = await this.prisma.content.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!row) {
      throw new NotFoundException('Konten tidak ditemukan.');
    }

    return row;
  }

  private async findPendingRow(id: string) {
    const row = await this.findRow(id);

    if (row.status !== 'PENDING_REVIEW') {
      throw new BadRequestException(
        'Hanya konten yang menunggu review yang bisa diterbitkan atau ditolak.',
      );
    }

    return row;
  }

  /**
   * Menyembunyikan keberadaan konten milik orang lain: penulis lain mendapat
   * 404, bukan 403, supaya tidak bisa menebak id.
   */
  private async findOwnedRow(id: string, profile: AuthProfile) {
    const row = await this.prisma.content.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        status: true,
        title: true,
        type: true,
        excerpt: true,
        body: true,
        mediaUrl: true,
        categories: { select: { categoryId: true } },
        tags: { select: { tagId: true } },
        speaker: { select: { id: true } },
      },
    });

    if (!row || (profile.role !== 'ADMIN' && row.authorId !== profile.id)) {
      throw new NotFoundException('Konten tidak ditemukan.');
    }

    return row;
  }

  private assertEditable(profile: AuthProfile, row: { status: ContentStatus }): void {
    if (profile.role === 'ADMIN') {
      if (row.status === 'PUBLISHED' || row.status === 'ARCHIVED') {
        throw new ForbiddenException(
          'Konten yang sudah terbit atau diarsipkan tidak bisa disunting.',
        );
      }

      return;
    }

    if (!AUTHOR_EDITABLE.includes(row.status)) {
      throw new ForbiddenException(
        'Konten yang sedang ditinjau tidak bisa disunting. Tarik kembali dahulu.',
      );
    }
  }

  private async buildSlug(title: string): Promise<string> {
    const base = slugify(title);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = `${base}-${randomUUID().slice(0, 6)}`;
      const exists = await this.prisma.content.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });

      if (!exists) {
        return candidate;
      }
    }

    return `${base}-${randomUUID()}`;
  }
}
