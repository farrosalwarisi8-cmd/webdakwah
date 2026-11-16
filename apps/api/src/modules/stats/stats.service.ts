import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

export interface RecentContentStat {
  id: string;
  title: string;
  type: string;
  status: string;
  authorName: string | null;
  updatedAt: string;
}

export interface StatsSummary {
  contentsByStatus: Record<string, number>;
  contentsByType: Record<string, number>;
  usersByRole: Record<string, number>;
  totalContents: number;
  totalUsers: number;
  recentContents: RecentContentStat[];
}

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(): Promise<StatsSummary> {
    const [statusGroups, typeGroups, roleGroups, recent] = await Promise.all([
      this.prisma.content.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.content.groupBy({
        by: ['type'],
        _count: { _all: true },
      }),
      this.prisma.profile.groupBy({
        by: ['role'],
        _count: { _all: true },
      }),
      this.prisma.content.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 8,
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          updatedAt: true,
          author: { select: { fullName: true, email: true } },
        },
      }),
    ]);

    const contentsByStatus: Record<string, number> = {};
    for (const group of statusGroups) {
      contentsByStatus[group.status] = group._count._all;
    }

    const contentsByType: Record<string, number> = {};
    for (const group of typeGroups) {
      contentsByType[group.type] = group._count._all;
    }

    const usersByRole: Record<string, number> = {};
    for (const group of roleGroups) {
      usersByRole[group.role] = group._count._all;
    }

    return {
      contentsByStatus,
      contentsByType,
      usersByRole,
      totalContents: Object.values(contentsByStatus).reduce((sum, value) => sum + value, 0),
      totalUsers: Object.values(usersByRole).reduce((sum, value) => sum + value, 0),
      recentContents: recent.map((content) => ({
        id: content.id,
        title: content.title,
        type: content.type,
        status: content.status,
        authorName: content.author.fullName ?? content.author.email,
        updatedAt: content.updatedAt.toISOString(),
      })),
    };
  }
}