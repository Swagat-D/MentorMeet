// backend/src/controllers/notifications.controller.ts - Notifications Controller
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { catchAsync } from '../middleware/error.middleware';
import notificationsService from '../services/notifications.service';
import { extractClientIP } from '../utils/ip.utils';

/**
 * Get user notifications
 */
export const getUserNotifications = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { 
    page = 1, 
    limit = 20, 
    unreadOnly = false,
    type 
  } = req.query;

  console.log('📬 [NOTIFICATIONS CONTROLLER] Request details:', {
    userId,
    userIdType: typeof userId,
    page,
    limit,
    unreadOnly,
    type,
    query: req.query
  });

  if (!userId) {
    console.error('❌ [NOTIFICATIONS CONTROLLER] No userId found');
    res.status(401).json({
      success: false,
      message: 'User ID not found in request'
    });
    return;
  }

  try {
    console.log('🔍 [NOTIFICATIONS CONTROLLER] Calling service...');
    
    const result = await notificationsService.getUserNotifications(
      userId,
      {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        unreadOnly: unreadOnly === 'true',
        type: type as string,
      }
    );

    console.log('📋 [NOTIFICATIONS CONTROLLER] Service response:', {
      success: result.success,
      message: result.message,
      hasData: !!result.data,
      dataKeys: result.data ? Object.keys(result.data) : null
    });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    console.error('💥 [NOTIFICATIONS CONTROLLER] Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications due to server error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Get notification statistics for a user
 */
export const getNotificationStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  console.log('📊 [NOTIFICATIONS] Get stats request:', {
    userId,
    clientIP: extractClientIP(req),
  });

  try {
    const result = await notificationsService.getNotificationStats(userId);

    console.log('📋 [NOTIFICATIONS] Get stats result:', {
      success: result.success,
      message: result.message,
      hasData: !!result.data,
    });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('💥 [NOTIFICATIONS] Get stats error:', {
      userId,
      error: error.message,
      stack: error.stack,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to get notification statistics due to server error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Mark notification as read
 */
export const markAsRead = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { notificationId } = req.params;

  console.log('👁️ [NOTIFICATIONS] Mark as read request:', {
    userId,
    notificationId,
    clientIP: extractClientIP(req),
  });

  try {
    const result = await notificationsService.markAsRead(userId, notificationId);

    console.log('📋 [NOTIFICATIONS] Mark as read result:', {
      success: result.success,
      message: result.message,
    });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('💥 [NOTIFICATIONS] Mark as read error:', {
      userId,
      notificationId,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read due to server error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  console.log('👁️ [NOTIFICATIONS] Mark all as read request:', {
    userId,
    clientIP: extractClientIP(req),
  });

  try {
    const result = await notificationsService.markAllAsRead(userId);

    console.log('📋 [NOTIFICATIONS] Mark all as read result:', {
      success: result.success,
      updatedCount: result.data?.updatedCount || 0,
    });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('💥 [NOTIFICATIONS] Mark all as read error:', {
      userId,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read due to server error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Delete notification
 */
export const deleteNotification = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { notificationId } = req.params;

  console.log('🗑️ [NOTIFICATIONS] Delete notification request:', {
    userId,
    notificationId,
    clientIP: extractClientIP(req),
  });

  try {
    const result = await notificationsService.deleteNotification(userId, notificationId);

    console.log('📋 [NOTIFICATIONS] Delete notification result:', {
      success: result.success,
      message: result.message,
    });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('💥 [NOTIFICATIONS] Delete notification error:', {
      userId,
      notificationId,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification due to server error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Clear all notifications
 */
export const clearAllNotifications = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  console.log('🧹 [NOTIFICATIONS CONTROLLER] Clear all request:', {
    userId,
    // Should NOT have notificationId here
  });

  try {
    // Call service with ONLY userId - no notificationId parameter
    const result = await notificationsService.clearAllNotifications(userId);

    console.log('📋 [NOTIFICATIONS CONTROLLER] Clear all result:', {
      success: result.success,
      message: result.message,
      deletedCount: result.data?.deletedCount || 0
    });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('💥 [NOTIFICATIONS CONTROLLER] Clear all error:', {
      userId,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to clear all notifications due to server error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Get unread notifications count
 */
export const getUnreadCount = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  console.log('🔢 [NOTIFICATIONS] Get unread count request:', {
    userId,
    clientIP: extractClientIP(req),
  });

  try {
    const result = await notificationsService.getUnreadCount(userId);

    console.log('📋 [NOTIFICATIONS] Get unread count result:', {
      success: result.success,
      count: result.data?.count || 0,
    });

    const statusCode = result.success ? 200 : 200; // Always return 200 for count
    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('💥 [NOTIFICATIONS] Get unread count error:', {
      userId,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count due to server error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default {
  getUserNotifications,
  markAsRead,
  getNotificationStats,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getUnreadCount,
};