import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  CategoryInput,
  SpeakerInput,
  TagRenameInput,
} from '@webdakwah/shared';
import { can } from '@webdakwah/shared';
import type { AuthProfile } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';

function slugify(value: string): string {
  const base = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return base;
}

@Injectable()
export class TaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  assertManager(profile: AuthProfile): void {
    if (!can(profile.role, 'taxonomy:manage')) {
      throw new ForbiddenException('Anda tidak memiliki izin untuk mengelola taksonomi.');
    }
  }

  // ---------- Kategori ----------

  async listPublicCategories() {
    return this.prisma.category.findMany({
      where: { contents: { some: { content: { status: 'PUBLISHED' } } } },
      select: { name: true, slug: true },
      orderBy: { name: 'asc' },
    });
  }

  async listCategoryOptions() {
    return this.prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
  }

  async listCategories() {
    return this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { contents: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(input: CategoryInput) {
    const slug = await this.uniqueSlug(slugify(input.name), 'categories', 'kategori');

    try {
      return await this.prisma.category.create({
        data: { name: input.name.trim(), slug },
        select: { id: true, name: true, slug: true, createdAt: true, updatedAt: true },
      });
    } catch {
      throw new BadRequestException('Nama atau slug kategori sudah dipakai.');
    }
  }

  async updateCategory(id: string, input: CategoryInput) {
    const existing = await this.prisma.category.findUnique({ where: { id }, select: { id: true } });

    if (!existing) {
      throw new NotFoundException('Kategori tidak ditemukan.');
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data: { name: input.name.trim() },
        select: { id: true, name: true, slug: true, createdAt: true, updatedAt: true },
      });
    } catch {
      throw new BadRequestException('Nama kategori sudah dipakai.');
    }
  }

  async deleteCategory(id: string) {
    const existing = await this.prisma.category.findUnique({ where: { id }, select: { id: true } });

    if (!existing) {
      throw new NotFoundException('Kategori tidak ditemukan.');
    }

    await this.prisma.category.delete({ where: { id } });

    return { ok: true };
  }

  // ---------- Penceramah ----------

  async listPublicSpeakers() {
    return this.prisma.speaker.findMany({
      where: { contents: { some: { status: 'PUBLISHED' } } },
      select: { name: true, slug: true },
      orderBy: { name: 'asc' },
    });
  }

  async listSpeakerOptions() {
    return this.prisma.speaker.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
  }

  async listSpeakers() {
    return this.prisma.speaker.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { contents: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createSpeaker(input: SpeakerInput) {
    const slug = await this.uniqueSlug(slugify(input.name), 'speakers', 'penceramah');

    return this.prisma.speaker.create({
      data: {
        name: input.name.trim(),
        slug,
        bio: input.bio?.trim() || null,
        avatarUrl: input.avatarUrl?.trim() || null,
      },
      select: { id: true, name: true, slug: true, bio: true, avatarUrl: true, createdAt: true, updatedAt: true },
    });
  }

  async updateSpeaker(id: string, input: SpeakerInput) {
    const existing = await this.prisma.speaker.findUnique({ where: { id }, select: { id: true } });

    if (!existing) {
      throw new NotFoundException('Penceramah tidak ditemukan.');
    }

    return this.prisma.speaker.update({
      where: { id },
      data: {
        name: input.name.trim(),
        bio: input.bio?.trim() || null,
        avatarUrl: input.avatarUrl?.trim() || null,
      },
      select: { id: true, name: true, slug: true, bio: true, avatarUrl: true, createdAt: true, updatedAt: true },
    });
  }

  async deleteSpeaker(id: string) {
    const existing = await this.prisma.speaker.findUnique({ where: { id }, select: { id: true } });

    if (!existing) {
      throw new NotFoundException('Penceramah tidak ditemukan.');
    }

    await this.prisma.speaker.delete({ where: { id } });

    return { ok: true };
  }

  // ---------- Tag ----------

  async listPublicTags() {
    return this.prisma.tag.findMany({
      where: { contents: { some: { content: { status: 'PUBLISHED' } } } },
      select: { name: true, slug: true },
      orderBy: { name: 'asc' },
    });
  }

  async listTags() {
    return this.prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { contents: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async renameTag(id: string, input: TagRenameInput) {
    const existing = await this.prisma.tag.findUnique({ where: { id }, select: { id: true } });

    if (!existing) {
      throw new NotFoundException('Tag tidak ditemukan.');
    }

    try {
      return await this.prisma.tag.update({
        where: { id },
        data: { name: input.name },
        select: { id: true, name: true, slug: true, createdAt: true, updatedAt: true },
      });
    } catch {
      throw new BadRequestException('Nama tag sudah dipakai.');
    }
  }

  async mergeTag(sourceId: string, targetId: string) {
    if (sourceId === targetId) {
      throw new BadRequestException('Tag sumber dan tujuan tidak boleh sama.');
    }

    const [source, target] = await Promise.all([
      this.prisma.tag.findUnique({ where: { id: sourceId }, select: { id: true } }),
      this.prisma.tag.findUnique({ where: { id: targetId }, select: { id: true } }),
    ]);

    if (!source || !target) {
      throw new NotFoundException('Tag tidak ditemukan.');
    }

    await this.prisma.$transaction(async (tx) => {
      const sourceRelations = await tx.contentTag.findMany({
        where: { tagId: sourceId },
        select: { contentId: true },
      });

      const targetRelations = await tx.contentTag.findMany({
        where: { tagId: targetId },
        select: { contentId: true },
      });

      const targetSet = new Set(targetRelations.map((item) => item.contentId));

      const toMove = sourceRelations
        .map((item) => item.contentId)
        .filter((contentId) => !targetSet.has(contentId));

      if (toMove.length > 0) {
        await tx.contentTag.updateMany({
          where: { tagId: sourceId, contentId: { in: toMove } },
          data: { tagId: targetId },
        });
      }

      await tx.contentTag.deleteMany({ where: { tagId: sourceId } });
      await tx.tag.delete({ where: { id: sourceId } });
    });

    return { ok: true };
  }

  async deleteTag(id: string) {
    const existing = await this.prisma.tag.findUnique({ where: { id }, select: { id: true } });

    if (!existing) {
      throw new NotFoundException('Tag tidak ditemukan.');
    }

    await this.prisma.tag.delete({ where: { id } });

    return { ok: true };
  }

  // ---------- Dipakai ContentsService ----------

  async ensureCategories(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const count = await this.prisma.category.count({ where: { id: { in: ids } } });

    if (count !== ids.length) {
      throw new BadRequestException('Kategori tidak ditemukan.');
    }
  }

  async ensureSpeaker(id: string | null): Promise<void> {
    if (!id) {
      return;
    }

    const speaker = await this.prisma.speaker.findUnique({ where: { id }, select: { id: true } });

    if (!speaker) {
      throw new BadRequestException('Penceramah tidak ditemukan.');
    }
  }

  async upsertTags(names: string[]): Promise<{ id: string; name: string; slug: string }[]> {
    const result: { id: string; name: string; slug: string }[] = [];

    for (const name of names) {
      const existing = await this.prisma.tag.findUnique({
        where: { name },
        select: { id: true, name: true, slug: true },
      });

      if (existing) {
        result.push(existing);
        continue;
      }

      const slug = await this.uniqueSlug(slugify(name), 'tags', 'tag');
      const created = await this.prisma.tag.create({
        data: { name, slug },
        select: { id: true, name: true, slug: true },
      });

      result.push(created);
    }

    return result;
  }

  async cleanupOrphanTags(): Promise<void> {
    try {
      await this.prisma.tag.deleteMany({
        where: { contents: { none: {} } },
      });
    } catch {
      // Best-effort: jangan gagalkan aksi utama.
    }
  }

  private async uniqueSlug(
    base: string,
    table: 'categories' | 'tags' | 'speakers',
    fallbackPrefix: string,
  ): Promise<string> {
    const exists = async (slug: string): Promise<boolean> => {
      if (table === 'categories') {
        return (await this.prisma.category.count({ where: { slug } })) > 0;
      }

      if (table === 'tags') {
        return (await this.prisma.tag.count({ where: { slug } })) > 0;
      }

      return (await this.prisma.speaker.count({ where: { slug } })) > 0;
    };

    const slug = base || `${fallbackPrefix}-${randomUUID().slice(0, 8)}`;

    if (!(await exists(slug))) {
      return slug;
    }

    let attempt = 2;

    while (attempt < 100) {
      const candidate = `${slug}-${attempt}`;

      if (!(await exists(candidate))) {
        return candidate;
      }

      attempt += 1;
    }

    return `${fallbackPrefix}-${randomUUID()}`;
  }
}
