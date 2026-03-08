import { v4 as uuid } from 'uuid';
import db from './database.js';

export function logActivity(userId: string, action: string, architectureId?: string, details?: string) {
  db.prepare(
    'INSERT INTO activity_log (id, architecture_id, user_id, action, details) VALUES (?, ?, ?, ?, ?)'
  ).run(uuid(), architectureId || null, userId, action, details || '');
}
