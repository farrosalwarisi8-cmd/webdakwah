import { z } from 'zod';

export const NOTIFICATION_TYPES = [
  'CONTENT_SUBMITTED',
  'CONTENT_PUBLISHED',
  'CONTENT_REJECTED',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  CONTENT_SUBMITTED: 'Review',
  CONTENT_PUBLISHED: 'Terbit',
  CONTENT_REJECTED: 'Perbaikan',
};

export const notificationItemSchema = z.object({
  id: z.uuid(),
  type: notificationTypeSchema,
  title: z.string(),
  message: z.string().nullable(),
  href: z.string().nullable(),
  isRead: z.boolean(),
  createdAt: z.string(),
});

export type NotificationItem = z.infer<typeof notificationItemSchema>;

export const notificationListSchema = z.object({
  items: z.array(notificationItemSchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
  unread: z.number().int().nonnegative(),
});

export type NotificationList = z.infer<typeof notificationListSchema>;

export const notificationUnreadSchema = z.object({
  unread: z.number().int().nonnegative(),
});

export type NotificationUnread = z.infer<typeof notificationUnreadSchema>;
