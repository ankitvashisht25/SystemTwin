import { v4 as uuid } from 'uuid';
import db from './database.js';
import type { NotificationType } from '@systemtwin/shared';

export function createNotification(userId: string, type: NotificationType, title: string, message: string, link?: string) {
  const id = uuid();
  db.prepare(
    'INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, userId, type, title, message, link || '');
  return id;
}

export function getUserNotifications(userId: string, limit = 50) {
  return db.prepare(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(userId, limit) as Array<{
    id: string; user_id: string; type: string; title: string; message: string;
    link: string; read: number; created_at: string;
  }>;
}

export function markAsRead(userId: string, notificationId: string) {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(notificationId, userId);
}

export function markAllAsRead(userId: string) {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0').run(userId);
}

export function getUnreadCount(userId: string): number {
  const row = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0').get(userId) as { count: number };
  return row.count;
}
