import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  can,
  contentInputSchema,
  type ContentInput,
  type ContentListQuery,
  type ContentStatus,
  type Permission,
} from '@webdakwah/shared';
import { randomUUID } from 'node:crypto';

import type { AuthProfile } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';

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
};

const CONTENT_DETAIL_SELECT = { ...CONTENT_SUMMARY_SELECT, body: true };

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
  constructor(private readonly prisma: PrismaService) {}

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
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
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

    return content;
  }

  async create(profile: AuthProfile, input: ContentInput) {
    this.assertPermission(profile.role, 'content:create');

    return this.prisma.content.create({
      data: {
        authorId: profile.id,
        type: input.type,
        status: 'DRAFT',
        title: input.title,
        slug: await this.buildSlug(input.title),
        excerpt: emptyToNull(input.excerpt),
        body: emptyToNull(input.body),
        mediaUrl: emptyToNull(input.mediaUrl),
      },
      select: CONTENT_DETAIL_SELECT,
    });
  }

  async update(profile: AuthProfile, id: string, input: ContentInput) {
    const row = await this.findOwnedRow(id, profile);
    this.assertEditable(profile, row);

    const data = {
      type: input.type,
      title: input.title,
      excerpt: emptyToNull(input.excerpt),
      body: emptyToNull(input.body),
      mediaUrl: emptyToNull(input.mediaUrl),
      ...(input.title === row.title ? {} : { slug: await this.buildSlug(input.title) }),
    };

    return this.prisma.content.update({
      where: { id },
      data,
      select: CONTENT_DETAIL_SELECT,
    });
  }

  /** DRAFT/REJECTED -> PENDING_REVIEW; isian wajib diperiksa ulang di sini. */
  async submit(profile: AuthProfile, id: string) {
    this.assertPermission(profile.role, 'content:create');

    const row = await this.findOwnedRow(id, profile);

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

    return this.prisma.content.update({
      where: { id },
      data: { status: 'PENDING_REVIEW', reviewNote: null },
      select: CONTENT_DETAIL_SELECT,
    });
  }

  /** PENDING_REVIEW -> DRAFT agar penulis bisa memperbaiki kirimannya. */
  async withdraw(profile: AuthProfile, id: string) {
    const row = await this.findOwnedRow(id, profile);

    if (row.status !== 'PENDING_REVIEW') {
      throw new BadRequestException('Hanya konten yang sedang ditinjau yang bisa ditarik kembali.');
    }

    return this.prisma.content.update({
      where: { id },
      data: { status: 'DRAFT' },
      select: CONTENT_DETAIL_SELECT,
    });
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

    return { ok: true };
  }

  private assertPermission(role: AuthProfile['role'], permission: Permission): void {
    if (!can(role, permission)) {
      throw new ForbiddenException('Anda tidak memiliki izin untuk tindakan ini.');
    }
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
