// backend/src/services/notifications.service.ts - Complete Notifications Service
import mongoose from 'mongoose';

export interface NotificationFilters {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
}

export interface ServiceResult {
  success: boolean;
  message: string;
  data?: any;
}

class NotificationsService {
  // Get the notifications collection directly
  private getNotificationsCollection() {
    if (!mongoose.connection.db) {
      throw new Error('Database connection is not established.');
    }
    return mongoose.connection.db.collection('notifications');
  }

  /**
   * Get user notifications with pagination and filtering
   */
  async getUserNotifications(
  userId: string,
  filters: NotificationFilters = {}
): Promise<ServiceResult> {
  try {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type
    } = filters;

    console.log('📬 [NOTIFICATIONS SERVICE] Starting getUserNotifications:', {
      userId,
      userIdType: typeof userId,
      page,
      limit,
      unreadOnly,
      type,
    });

    // Check if mongoose connection is available
    if (!mongoose.connection.db) {
      console.error('❌ [NOTIFICATIONS SERVICE] Database connection not available');
      return {
        success: false,
        message: 'Database connection not available',
      };
    }

    const collection = this.getNotificationsCollection();
    console.log('✅ [NOTIFICATIONS SERVICE] Got collection');

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('❌ [NOTIFICATIONS SERVICE] Invalid userId format:', userId);
      return {
        success: false,
        message: 'Invalid user ID format',
      };
    }

    // Build query
    const query: any = { 
      userId: new mongoose.Types.ObjectId(userId) 
    };
    
    if (unreadOnly) {
      query.read = false;
    }
    
    if (type) {
      query.type = type;
    }

    console.log('🔍 [NOTIFICATIONS SERVICE] Query:', JSON.stringify(query, null, 2));

    // Calculate pagination
    const skip = (page - 1) * limit;

    console.log('📊 [NOTIFICATIONS SERVICE] Pagination:', { skip, limit });

    // Test if collection exists and has documents
    const collectionExists = await collection.countDocuments({});
    console.log('📋 [NOTIFICATIONS SERVICE] Total documents in collection:', collectionExists);

    // Test if any documents match userId
    const userDocsCount = await collection.countDocuments({ 
      userId: new mongoose.Types.ObjectId(userId) 
    });
    console.log('📋 [NOTIFICATIONS SERVICE] Documents for user:', userDocsCount);

    // Get notifications with pagination
    console.log('🔍 [NOTIFICATIONS SERVICE] Executing find query...');
    
    const notifications = await collection.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    console.log('📊 [NOTIFICATIONS SERVICE] Found notifications:', notifications.length);

    const totalCount = await collection.countDocuments(query);
    console.log('📊 [NOTIFICATIONS SERVICE] Total count:', totalCount);

    // Transform notifications
    const transformedNotifications = notifications.map(notification => {
      console.log('🔄 [NOTIFICATIONS SERVICE] Transforming notification:', {
        id: notification._id,
        hasCreatedAt: !!notification.createdAt,
        hasUpdatedAt: !!notification.updatedAt
      });

      return {
        ...notification,
        id: notification._id.toString(),
        userId: notification.userId.toString(),
        createdAt: notification.createdAt ? notification.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: notification.updatedAt ? notification.updatedAt.toISOString() : new Date().toISOString(),
        readAt: notification.readAt ? notification.readAt.toISOString() : undefined
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    console.log('✅ [NOTIFICATIONS SERVICE] Transformation complete:', {
      totalCount,
      currentPage: page,
      totalPages,
      notificationsReturned: transformedNotifications.length,
    });

    return {
      success: true,
      message: 'Notifications retrieved successfully',
      data: {
        notifications: transformedNotifications,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    };
  } catch (error: any) {
    console.error('💥 [NOTIFICATIONS SERVICE] Critical error:', {
      userId,
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return {
      success: false,
      message: 'Failed to retrieve notifications',
    };
  }
}

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<ServiceResult> {
  try {
    console.log('👁️ [NOTIFICATIONS SERVICE] Simple mark as read:', {
      userId,
      notificationId,
    });

    const collection = this.getNotificationsCollection();

    // Simple update - just update if the notification exists for this user
    const result = await collection.updateOne(
      { 
        _id: new mongoose.Types.ObjectId(notificationId), 
        userId: new mongoose.Types.ObjectId(userId)
      },
      { 
        $set: {
          read: true,
          readAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    console.log('📋 [NOTIFICATIONS SERVICE] Update result:', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });

    if (result.matchedCount === 0) {
      return {
        success: false,
        message: 'Notification not found',
      };
    }

    return {
      success: true,
      message: 'Notification marked as read',
      data: { 
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      },
    };
  } catch (error: any) {
    console.error('💥 [NOTIFICATIONS SERVICE] Mark as read error:', error);
    return {
      success: false,
      message: 'Failed to mark notification as read',
    };
  }
}
  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<ServiceResult> {
    try {
      console.log('👁️ [NOTIFICATIONS SERVICE] Marking all as read:', { userId });

      const collection = this.getNotificationsCollection();

      const result = await collection.updateMany(
        { 
          userId: new mongoose.Types.ObjectId(userId),
          read: false
        },
        { 
          $set: {
            read: true,
            readAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      console.log('✅ [NOTIFICATIONS SERVICE] All notifications marked as read:', {
        updatedCount: result.modifiedCount,
      });

      return {
        success: true,
        message: `${result.modifiedCount} notifications marked as read`,
        data: { updatedCount: result.modifiedCount },
      };
    } catch (error: any) {
      console.error('💥 [NOTIFICATIONS SERVICE] Mark all as read error:', {
        userId,
        error: error.message,
      });
      
      return {
        success: false,
        message: 'Failed to mark all notifications as read',
      };
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(userId: string, notificationId: string): Promise<ServiceResult> {
  try {
    console.log('🗑️ [NOTIFICATIONS SERVICE] Deleting notification:', {
      userId,
      notificationId,
      userIdType: typeof userId,
      notificationIdType: typeof notificationId,
    });

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('❌ [NOTIFICATIONS SERVICE] Invalid userId format:', userId);
      return {
        success: false,
        message: 'Invalid user ID format',
      };
    }

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      console.error('❌ [NOTIFICATIONS SERVICE] Invalid notificationId format:', notificationId);
      return {
        success: false,
        message: 'Invalid notification ID format',
      };
    }

    const collection = this.getNotificationsCollection();

    // First check if notification exists
    const existingNotification = await collection.findOne({
      _id: new mongoose.Types.ObjectId(notificationId),
      userId: new mongoose.Types.ObjectId(userId)
    });

    console.log('🔍 [NOTIFICATIONS SERVICE] Existing notification check:', {
      found: !!existingNotification,
      notificationDetails: existingNotification ? {
        id: existingNotification._id,
        userId: existingNotification.userId,
        type: existingNotification.type,
        title: existingNotification.title
      } : null
    });

    if (!existingNotification) {
      console.log('❌ [NOTIFICATIONS SERVICE] Notification not found for user');
      return {
        success: false,
        message: 'Notification not found',
      };
    }

    // Delete the notification
    const result = await collection.deleteOne({
      _id: new mongoose.Types.ObjectId(notificationId),
      userId: new mongoose.Types.ObjectId(userId)
    });

    console.log('📋 [NOTIFICATIONS SERVICE] Delete result:', {
      deletedCount: result.deletedCount
    });

    if (result.deletedCount === 0) {
      console.log('❌ [NOTIFICATIONS SERVICE] No document was deleted');
      return {
        success: false,
        message: 'Failed to delete notification',
      };
    }

    console.log('✅ [NOTIFICATIONS SERVICE] Notification deleted successfully');

    return {
      success: true,
      message: 'Notification deleted successfully',
      data: {
        deletedCount: result.deletedCount,
        deletedNotification: {
          id: notificationId,
          userId: userId
        }
      }
    };
  } catch (error: any) {
    console.error('💥 [NOTIFICATIONS SERVICE] Delete notification error:', {
      userId,
      notificationId,
      error: error.message,
      stack: error.stack,
    });
    
    return {
      success: false,
      message: 'Failed to delete notification',
    };
  }
}

  /**
   * Clear all notifications
   */
  async clearAllNotifications(userId: string): Promise<ServiceResult> {
  try {
    console.log('🧹 [NOTIFICATIONS SERVICE] Clearing all notifications:', { 
      userId,
      userIdType: typeof userId 
    });

    // Validate userId only (no notificationId needed)
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('❌ [NOTIFICATIONS SERVICE] Invalid userId format:', userId);
      return {
        success: false,
        message: 'Invalid user ID format',
      };
    }

    const collection = this.getNotificationsCollection();

    // First, check how many notifications the user has
    const countBefore = await collection.countDocuments({ 
      userId: new mongoose.Types.ObjectId(userId) 
    });

    console.log('📊 [NOTIFICATIONS SERVICE] Notifications to clear:', countBefore);

    if (countBefore === 0) {
      console.log('ℹ️ [NOTIFICATIONS SERVICE] No notifications to clear');
      return {
        success: true,
        message: 'No notifications to clear',
        data: { deletedCount: 0 },
      };
    }

    // Delete all notifications for this user
    const result = await collection.deleteMany({ 
      userId: new mongoose.Types.ObjectId(userId) 
    });

    console.log('✅ [NOTIFICATIONS SERVICE] All notifications cleared:', {
      deletedCount: result.deletedCount,
      expectedCount: countBefore
    });

    return {
      success: true,
      message: `${result.deletedCount} notifications cleared`,
      data: { deletedCount: result.deletedCount },
    };
  } catch (error: any) {
    console.error('💥 [NOTIFICATIONS SERVICE] Clear all notifications error:', {
      userId,
      error: error.message,
      stack: error.stack,
    });
    
    return {
      success: false,
      message: 'Failed to clear all notifications',
    };
  }
}

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId: string): Promise<ServiceResult> {
    try {
      console.log('🔢 [NOTIFICATIONS SERVICE] Getting unread count:', { userId });

      const collection = this.getNotificationsCollection();

      const count = await collection.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        read: false
      });

      console.log('📊 [NOTIFICATIONS SERVICE] Unread count:', { count });

      return {
        success: true,
        message: 'Unread count retrieved successfully',
        data: { count },
      };
    } catch (error: any) {
      console.error('💥 [NOTIFICATIONS SERVICE] Get unread count error:', {
        userId,
        error: error.message,
      });
      
      return {
        success: false,
        message: 'Failed to get unread count',
        data: { count: 0 },
      };
    }
  }

  /**
   * Create notification (helper method for other services)
   * This method can be used by other services in the student platform to create notifications
   */
  async createNotification(notificationData: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
  }): Promise<ServiceResult> {
    try {
      console.log('📝 [NOTIFICATIONS SERVICE] Creating notification:', {
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
      });

      const collection = this.getNotificationsCollection();

      const notification = {
        userId: new mongoose.Types.ObjectId(notificationData.userId),
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        readAt: null
      };
      
      const result = await collection.insertOne(notification);

      console.log('✅ [NOTIFICATIONS SERVICE] Notification created:', {
        notificationId: result.insertedId,
      });

      return {
        success: true,
        message: 'Notification created successfully',
        data: { 
          notification: {
            ...notification,
            id: result.insertedId.toString()
          }
        },
      };
    } catch (error: any) {
      console.error('💥 [NOTIFICATIONS SERVICE] Create notification error:', {
        userId: notificationData.userId,
        error: error.message,
      });
      
      return {
        success: false,
        message: 'Failed to create notification',
      };
    }
  }

  /**
   * Get notifications by type for a user
   */
  async getNotificationsByType(userId: string, type: string): Promise<ServiceResult> {
    try {
      console.log('📬 [NOTIFICATIONS SERVICE] Getting notifications by type:', {
        userId,
        type,
      });

      const collection = this.getNotificationsCollection();

      const notifications = await collection.find({
        userId: new mongoose.Types.ObjectId(userId),
        type: type
      })
      .sort({ createdAt: -1 })
      .toArray();

      // Transform for frontend compatibility
      const transformedNotifications = notifications.map(notification => ({
        ...notification,
        id: notification._id.toString(),
        userId: notification.userId.toString(),
        createdAt: notification.createdAt.toISOString(),
        updatedAt: notification.updatedAt.toISOString(),
        readAt: notification.readAt ? notification.readAt.toISOString() : undefined
      }));

      console.log('📋 [NOTIFICATIONS SERVICE] Notifications by type retrieved:', {
        type,
        count: transformedNotifications.length,
      });

      return {
        success: true,
        message: `Notifications of type '${type}' retrieved successfully`,
        data: {
          notifications: transformedNotifications,
          type,
          count: transformedNotifications.length
        },
      };
    } catch (error: any) {
      console.error('💥 [NOTIFICATIONS SERVICE] Get notifications by type error:', {
        userId,
        type,
        error: error.message,
      });
      
      return {
        success: false,
        message: 'Failed to retrieve notifications by type',
      };
    }
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(userId: string, notificationIds: string[]): Promise<ServiceResult> {
    try {
      console.log('👁️ [NOTIFICATIONS SERVICE] Marking multiple as read:', {
        userId,
        notificationIds,
        count: notificationIds.length,
      });

      const collection = this.getNotificationsCollection();

      const objectIds = notificationIds.map(id => new mongoose.Types.ObjectId(id));

      const result = await collection.updateMany(
        { 
          _id: { $in: objectIds },
          userId: new mongoose.Types.ObjectId(userId),
          read: false
        },
        { 
          $set: {
            read: true,
            readAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      console.log('✅ [NOTIFICATIONS SERVICE] Multiple notifications marked as read:', {
        updatedCount: result.modifiedCount,
      });

      return {
        success: true,
        message: `${result.modifiedCount} notifications marked as read`,
        data: { updatedCount: result.modifiedCount },
      };
    } catch (error: any) {
      console.error('💥 [NOTIFICATIONS SERVICE] Mark multiple as read error:', {
        userId,
        notificationIds,
        error: error.message,
      });
      
      return {
        success: false,
        message: 'Failed to mark multiple notifications as read',
      };
    }
  }

  /**
   * Delete multiple notifications
   */
  async deleteMultiple(userId: string, notificationIds: string[]): Promise<ServiceResult> {
    try {
      console.log('🗑️ [NOTIFICATIONS SERVICE] Deleting multiple notifications:', {
        userId,
        notificationIds,
        count: notificationIds.length,
      });

      const collection = this.getNotificationsCollection();

      const objectIds = notificationIds.map(id => new mongoose.Types.ObjectId(id));

      const result = await collection.deleteMany({
        _id: { $in: objectIds },
        userId: new mongoose.Types.ObjectId(userId)
      });

      console.log('✅ [NOTIFICATIONS SERVICE] Multiple notifications deleted:', {
        deletedCount: result.deletedCount,
      });

      return {
        success: true,
        message: `${result.deletedCount} notifications deleted successfully`,
        data: { deletedCount: result.deletedCount },
      };
    } catch (error: any) {
      console.error('💥 [NOTIFICATIONS SERVICE] Delete multiple notifications error:', {
        userId,
        notificationIds,
        error: error.message,
      });
      
      return {
        success: false,
        message: 'Failed to delete multiple notifications',
      };
    }
  }

  /**
   * Get notification statistics for a user
   */
  async getNotificationStats(userId: string): Promise<ServiceResult> {
    try {
      console.log('📊 [NOTIFICATIONS SERVICE] Getting notification statistics:', {
        userId,
      });

      const collection = this.getNotificationsCollection();

      const stats = await collection.aggregate([
        {
          $match: { userId: new mongoose.Types.ObjectId(userId) }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: { $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] } },
            read: { $sum: { $cond: [{ $eq: ['$read', true] }, 1, 0] } },
            typeBreakdown: {
              $push: {
                type: '$type',
                read: '$read'
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            total: 1,
            unread: 1,
            read: 1,
            typeBreakdown: 1
          }
        }
      ]).toArray();

      const result = stats[0] || {
        total: 0,
        unread: 0,
        read: 0,
        typeBreakdown: []
      };

      // Process type breakdown
      const typeStats: Record<string, { total: number; unread: number; read: number }> = {};
      result.typeBreakdown.forEach((item: any) => {
        if (!typeStats[item.type]) {
          typeStats[item.type] = { total: 0, unread: 0, read: 0 };
        }
        typeStats[item.type].total++;
        if (item.read) {
          typeStats[item.type].read++;
        } else {
          typeStats[item.type].unread++;
        }
      });

      console.log('📊 [NOTIFICATIONS SERVICE] Statistics retrieved:', {
        total: result.total,
        unread: result.unread,
        typesCount: Object.keys(typeStats).length,
      });

      return {
        success: true,
        message: 'Notification statistics retrieved successfully',
        data: {
          summary: {
            total: result.total,
            unread: result.unread,
            read: result.read,
            readPercentage: result.total > 0 ? Math.round((result.read / result.total) * 100) : 0
          },
          byType: typeStats
        },
      };
    } catch (error: any) {
      console.error('💥 [NOTIFICATIONS SERVICE] Get notification statistics error:', {
        userId,
        error: error.message,
      });
      
      return {
        success: false,
        message: 'Failed to retrieve notification statistics',
        data: {
          summary: { total: 0, unread: 0, read: 0, readPercentage: 0 },
          byType: {}
        }
      };
    }
  }

  /**
   * Clean up old notifications (older than specified days)
   */
  async cleanupOldNotifications(userId: string, daysOld: number = 30): Promise<ServiceResult> {
    try {
      console.log('🧹 [NOTIFICATIONS SERVICE] Cleaning up old notifications:', {
        userId,
        daysOld,
      });

      const collection = this.getNotificationsCollection();

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await collection.deleteMany({
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $lt: cutoffDate },
        read: true // Only delete read notifications
      });

      console.log('✅ [NOTIFICATIONS SERVICE] Old notifications cleaned up:', {
        deletedCount: result.deletedCount,
        cutoffDate: cutoffDate.toISOString(),
      });

      return {
        success: true,
        message: `${result.deletedCount} old notifications cleaned up`,
        data: { 
          deletedCount: result.deletedCount,
          cutoffDate: cutoffDate.toISOString()
        },
      };
    } catch (error: any) {
      console.error('💥 [NOTIFICATIONS SERVICE] Cleanup old notifications error:', {
        userId,
        daysOld,
        error: error.message,
      });
      
      return {
        success: false,
        message: 'Failed to cleanup old notifications',
      };
    }
  }
}

// Create and export singleton instance
const notificationsService = new NotificationsService();
export default notificationsService;