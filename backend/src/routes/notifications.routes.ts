import { Router } from 'express';
import notificationsController from '../controllers/notifications.controller';
import { authenticate, requireEmailVerification } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/v1/notifications
 * @desc    Get user notifications with pagination
 * @access  Private
 */
router.get('/', authenticate, requireEmailVerification, notificationsController.getUserNotifications);

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get unread notifications count
 * @access  Private
 */
router.get('/unread-count', authenticate, requireEmailVerification, notificationsController.getUnreadCount);

/**
 * @route   GET /api/v1/notifications/stats
 * @desc    Get notification statistics
 * @access  Private
 */
router.get('/stats', authenticate, requireEmailVerification, notificationsController.getNotificationStats);

/**
 * @route   PUT /api/v1/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', authenticate, requireEmailVerification, notificationsController.markAllAsRead);

/**
 * @route   DELETE /api/v1/notifications/clear-all
 * @desc    Clear all notifications (MUST come before /:notificationId route)
 * @access  Private
 */
router.delete('/clear-all', authenticate, requireEmailVerification, notificationsController.clearAllNotifications);

/**
 * @route   PUT /api/v1/notifications/:notificationId/read
 * @desc    Mark specific notification as read
 * @access  Private
 */
router.put('/:notificationId/read', authenticate, requireEmailVerification, notificationsController.markAsRead);

/**
 * @route   DELETE /api/v1/notifications/:notificationId
 * @desc    Delete specific notification (MUST come after /clear-all route)
 * @access  Private
 */
router.delete('/:notificationId', authenticate, requireEmailVerification, notificationsController.deleteNotification);

export default router;