import { Router } from 'express';
import { authMiddleware, type AuthRequest } from '../services/auth.js';
import { getUserNotifications, markAsRead, markAllAsRead, getUnreadCount } from '../services/notificationService.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req: AuthRequest, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const notifications = getUserNotifications(req.user!.userId, limit);
  res.json(notifications.map(n => ({
    id: n.id, userId: n.user_id, type: n.type, title: n.title,
    message: n.message, link: n.link, read: !!n.read, createdAt: n.created_at,
  })));
});

router.get('/unread-count', (req: AuthRequest, res) => {
  res.json({ count: getUnreadCount(req.user!.userId) });
});

router.put('/:id/read', (req: AuthRequest, res) => {
  markAsRead(req.user!.userId, String(req.params.id));
  res.json({ success: true });
});

router.put('/read-all', (req: AuthRequest, res) => {
  markAllAsRead(req.user!.userId);
  res.json({ success: true });
});

export { router as notificationsRouter };
