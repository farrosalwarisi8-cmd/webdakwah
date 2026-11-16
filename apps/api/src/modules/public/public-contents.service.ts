import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  PublicContentQuery,
  PublicContentSummary,
  PublicSearchQuery,
} from '@webdakwah/shared';

import { PrismaService } from '../prisma/prisma.service.js';

function mapPublicContent<T>(row: T): T {
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
        item && typeof item === 'object' && 'tag' in item ? (item as { tag: unknown }).tag : item,
      )
    : record.tags;
  const links = Array.isArray(record.links) ? record.links : [];

  return { ...record, categories, tags, links } as T;
}

const PUBLIC_CONTENT_TYPES = ['ARTICLE', 'AUDIO', 'VIDEO', 'LINK'] as const;

/** Hanya kolom aman untuk publik: tanpa email penulis dan tanpa data review. */
const PUBLIC_SUMMARY_SELECT = {
  id: true,
  type: true,
  title: true,
  slug: true,
  excerpt: true,
  mediaUrl: true,
  publishedAt: true,
  author: { select: { fullName: true } },
  categories: { select: { category: { select: { name: true, slug: true } } } },
  tags: { select: { tag: { select: { name: true, slug: true } } } },
  speaker: { select: { name: true, slug: true } },
};

const PUBLIC_DETAIL_SELECT = {
  ...PUBLIC_SUMMARY_SELECT,
  body: true,
  links: {
    select: { title: true, url: true, order: true },
    orderBy: { order: 'asc' as const },
  },
};

@Injectable()
export class PublicContentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PublicContentQuery) {
    const where = {
      status: 'PUBLISHED' as const,
      ...(query.type ? { type: query.type } : {}),
      ...(query.category ? { categories: { some: { category: { slug: query.category } } } } : {}),
      ...(query.tag ? { tags: { some: { tag: { slug: query.tag } } } } : {}),
      ...(query.speaker ? { speaker: { slug: query.speaker } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        select: PUBLIC_SUMMARY_SELECT,
        orderBy: { publishedAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.content.count({ where }),
    ]);

    return {
      items: items.map((item) => mapPublicContent(item)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  /** Pencarian sederhana (ILIKE) pada judul, ringkasan, dan isi konten terbit. */
  async search(query: PublicSearchQuery) {
    const where = {
      status: 'PUBLISHED' as const,
      ...(query.type ? { type: query.type } : {}),
      ...(query.category ? { categories: { some: { category: { slug: query.category } } } } : {}),
      ...(query.tag ? { tags: { some: { tag: { slug: query.tag } } } } : {}),
      ...(query.speaker ? { speaker: { slug: query.speaker } } : {}),
      OR: [
        { title: { contains: query.q, mode: 'insensitive' as const } },
        { excerpt: { contains: query.q, mode: 'insensitive' as const } },
        { body: { contains: query.q, mode: 'insensitive' as const } },
      ],
    };

    const [items, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        select: PUBLIC_SUMMARY_SELECT,
        orderBy: { publishedAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.content.count({ where }),
    ]);

    return {
      items: items.map((item) => mapPublicContent(item)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async latest(limit: number) {
    const items = await this.prisma.content.findMany({
      where: { status: 'PUBLISHED' },
      select: PUBLIC_SUMMARY_SELECT,
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    return { items: items.map((item) => mapPublicContent(item)) };
  }

  async getBySlug(slug: string) {
    const content = await this.prisma.content.findFirst({
      where: { slug, status: 'PUBLISHED' },
      select: PUBLIC_DETAIL_SELECT,
    });

    if (!content) {
      throw new NotFoundException('Konten tidak ditemukan.');
    }

    return mapPublicContent(content);
  }

  /** Satu terbitan terbaru per jenis; null bila jenis itu belum punya konten terbit. */
  async highlights() {
    const entries = await Promise.all(
      PUBLIC_CONTENT_TYPES.map(async (type) => {
        const item = await this.prisma.content.findFirst({
          where: { type, status: 'PUBLISHED' },
          select: PUBLIC_SUMMARY_SELECT,
          orderBy: { publishedAt: 'desc' },
        });

        return [type, item ? mapPublicContent(item) : null] as const;
      }),
    );

    return Object.fromEntries(entries) as Record<
      (typeof PUBLIC_CONTENT_TYPES)[number],
      PublicContentSummary | null
    >;
  }
}
