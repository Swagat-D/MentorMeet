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

import nodemailer from 'nodemailer';

// Define NotificationData interface
export interface NotificationData {
  studentId: string;
  mentorId: string;
  sessionId: string;
  subject: string;
  scheduledTime: string | Date;
  duration: number;
  meetingLink: string;
  studentName: string;
  mentorName: string;
  studentEmail: string;
  mentorEmail: string;
}

class NotificationsService {
  // Get the notifications collection directly
  private getNotificationsCollection() {
    if (!mongoose.connection.db) {
      throw new Error('Database connection is not established.');
    }
    return mongoose.connection.db.collection('notifications');
  }

  // Simple sendEmail implementation using nodemailer (customize as needed)
  async sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
    // Configure your transporter (replace with your SMTP credentials)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'user@example.com',
        pass: process.env.SMTP_PASS || 'password',
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"MentorMeet" <no-reply@mentormeet.com>',
      to,
      subject,
      html,
    });
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
   * Send session acceptance notification (when mentor accepts and provides meeting link)
   */
  async sendSessionAcceptanceNotification(data: NotificationData): Promise<ServiceResult> {
    try {
      console.log('📧 [NOTIFICATIONS SERVICE] Sending session acceptance notifications:', {
        studentId: data.studentId,
        mentorId: data.mentorId,
        sessionId: data.sessionId,
        subject: data.subject,
        scheduledTime: data.scheduledTime,
      });

      const sessionDate = new Date(data.scheduledTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const sessionTime = new Date(data.scheduledTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      // Email to student - session confirmed with meeting link
       const studentEmail = {
        to: data.studentEmail,
        subject: `Session Confirmed! Meeting Link Ready: ${data.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🎉 Session Confirmed!</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Your mentor has accepted and provided the meeting link</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px 20px;">
              <p style="font-size: 16px; color: #2A2A2A; margin-bottom: 20px;">Hi ${data.studentName},</p>
              
              <p style="font-size: 16px; color: #2A2A2A; line-height: 1.6; margin-bottom: 25px;">
                Excellent news! ${data.mentorName} has accepted your session and provided the meeting details. 
                Your session is now fully confirmed and ready to go!
              </p>
              
              <!-- Session Details Card -->
              <div style="background: #F0FDF4; border: 2px solid #10B981; border-radius: 12px; padding: 25px; margin: 20px 0;">
                <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 18px;">📚 Confirmed Session Details</h3>
                
                <div style="margin-bottom: 12px;">
                  <strong style="color: #2A2A2A;">Mentor:</strong> 
                  <span style="color: #166534; font-weight: 600;">${data.mentorName}</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                  <strong style="color: #2A2A2A;">Subject:</strong> 
                  <span style="color: #2A2A2A;">${data.subject}</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                  <strong style="color: #2A2A2A;">Date:</strong> 
                  <span style="color: #2A2A2A;">${sessionDate}</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                  <strong style="color: #2A2A2A;">Time:</strong> 
                  <span style="color: #2A2A2A;">${sessionTime}</span>
                </div>
                
                <div style="margin-bottom: 20px;">
                  <strong style="color: #2A2A2A;">Duration:</strong> 
                  <span style="color: #2A2A2A;">${data.duration} minutes</span>
                </div>
                
                <div style="border-top: 1px solid #10B981; padding-top: 15px; margin-top: 15px;">
                  <strong style="color: #2A2A2A; display: block; margin-bottom: 10px;">🎥 Meeting Link:</strong>
                  <a href="${data.meetingLink}" 
                     style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); 
                            color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; 
                            font-weight: bold; font-size: 16px; text-align: center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                    🚀 Join Meeting Now
                  </a>
                  <p style="font-size: 12px; color: #8B7355; margin: 8px 0 0 0;">
                    Link: <span style="word-break: break-all;">${data.meetingLink}</span>
                  </p>
                </div>
              </div>
              
              <!-- Instructions -->
              <div style="background: #E8F5E8; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h4 style="color: #166534; margin: 0 0 12px 0; font-size: 16px;">📋 Ready for your session?</h4>
                <ul style="color: #166534; margin: 0; padding-left: 20px; line-height: 1.6;">
                  <li>Click the meeting link 2-3 minutes before your session</li>
                  <li>Test your camera and microphone beforehand</li>
                  <li>Prepare any questions or materials you want to discuss</li>
                  <li>Find a quiet space with good internet connection</li>
                  <li>Have a notepad ready to take notes during the session</li>
                </ul>
              </div>
              
              <p style="font-size: 16px; color: #2A2A2A; margin-top: 25px;">
                Looking forward to your learning session! 🚀
              </p>
              
              <p style="font-size: 16px; color: #2A2A2A;">
                Best regards,<br>
                <strong style="color: #8B4513;">The MentorMatch Team</strong>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #F8F3EE; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #E8DDD1;">
              <p style="color: #8B7355; font-size: 12px; margin: 0;">
                Session ID: ${data.sessionId}
              </p>
            </div>
          </div>
        `,
      };

      // Email to mentor - confirmation that student has been notified
      const mentorEmail = {
        to: data.mentorEmail,
        subject: `Session Confirmed: ${data.subject} - Student Notified`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">✅ Session Confirmed</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Student has been notified with meeting details</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px 20px;">
              <p style="font-size: 16px; color: #2A2A2A; margin-bottom: 20px;">Hi ${data.mentorName},</p>
              
              <p style="font-size: 16px; color: #2A2A2A; line-height: 1.6; margin-bottom: 25px;">
                Perfect! Your session with ${data.studentName} is now confirmed. The student has been notified 
                and provided with the meeting link. Everything is set up for your upcoming session.
              </p>
              
              <!-- Session Summary -->
              <div style="background: #F0FDF4; border: 2px solid #10B981; border-radius: 12px; padding: 25px; margin: 20px 0;">
                <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 18px;">📚 Session Summary</h3>
                
                <div style="margin-bottom: 12px;">
                  <strong style="color: #2A2A2A;">Student:</strong> 
                  <span style="color: #166534; font-weight: 600;">${data.studentName}</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                  <strong style="color: #2A2A2A;">Subject:</strong> 
                  <span style="color: #2A2A2A;">${data.subject}</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                  <strong style="color: #2A2A2A;">Date & Time:</strong> 
                  <span style="color: #2A2A2A;">${sessionDate} at ${sessionTime}</span>
                </div>
                
                <div style="margin-bottom: 15px;">
                  <strong style="color: #2A2A2A;">Duration:</strong> 
                  <span style="color: #2A2A2A;">${data.duration} minutes</span>
                </div>
                
                <div style="border-top: 1px solid #10B981; padding-top: 15px; margin-top: 15px;">
                  <strong style="color: #2A2A2A; display: block; margin-bottom: 8px;">🎥 Meeting Link:</strong>
                  <a href="${data.meetingLink}" style="color: #166534; word-break: break-all;">${data.meetingLink}</a>
                </div>
              </div>
              
              <!-- Mentor Reminders -->
              <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h4 style="color: #92400E; margin: 0 0 12px 0; font-size: 16px;">👨‍🏫 Session Preparation</h4>
                <ul style="color: #92400E; margin: 0; padding-left: 20px; line-height: 1.6;">
                  <li>Review the session subject and prepare relevant materials</li>
                  <li>Test your audio/video setup 10 minutes early</li>
                  <li>Join the meeting 2-3 minutes before the scheduled time</li>
                  <li>Prepare a welcoming introduction for the student</li>
                  <li>Have teaching materials and resources ready</li>
                </ul>
              </div>
              
              <p style="font-size: 16px; color: #2A2A2A; margin-top: 25px;">
                Thank you for sharing your expertise and helping students learn! 🌟
              </p>
              
              <p style="font-size: 16px; color: #2A2A2A;">
                Best regards,<br>
                <strong style="color: #8B4513;">The MentorMatch Team</strong>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #F8F3EE; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #E8DDD1;">
              <p style="color: #8B7355; font-size: 12px; margin: 0;">
                Session ID: ${data.sessionId}
              </p>
            </div>
          </div>
        `,
      };

      // Send emails
      await Promise.all([
        this.sendEmail(studentEmail),
        this.sendEmail(mentorEmail)
      ]);

      // Create notifications in DB for both users
      await Promise.all([
        this.createNotification({
          userId: data.studentId,
          type: 'session_acceptance',
          title: 'Session Confirmed!',
          message: `Your mentor ${data.mentorName} has accepted your session and provided the meeting link.`,
          data: {
            sessionId: data.sessionId,
            mentorName: data.mentorName,
            subject: data.subject,
            scheduledTime: data.scheduledTime,
            duration: data.duration,
            meetingLink: data.meetingLink
          }
        }),
        this.createNotification({
          userId: data.mentorId,
          type: 'session_acceptance',
          title: 'Session Confirmed',
          message: `You have accepted the session with ${data.studentName}. Student has been notified.`,
          data: {
            sessionId: data.sessionId,
            studentName: data.studentName,
            subject: data.subject,
            scheduledTime: data.scheduledTime,
            duration: data.duration,
            meetingLink: data.meetingLink
          }
        })
      ]);

      console.log('✅ [NOTIFICATIONS SERVICE] Session acceptance notifications sent and stored');
      return {
        success: true,
        message: 'Session acceptance notifications sent and stored successfully',
      };
    } catch (error: any) {
      console.error('❌ [NOTIFICATIONS SERVICE] Error sending session acceptance notifications:', {
        error: error.message,
        stack: error.stack,
      });
      return {
        success: false,
        message: 'Failed to send session acceptance notifications',
      };
    }
  }

  async sendCancellationNotification(details: {
    sessionId: string;
    mentorEmail: string;
    studentEmail: string;
    mentorName: string;
    studentName: string;
    subject: string;
    scheduledTime: string;
    cancelledBy: string;
    reason: string;
    refundAmount: number;
  }): Promise<void> {
    // Implement your notification logic here
    // For example, send emails to mentor and student
    console.log(`Sending cancellation notification for session ${details.sessionId}`);
    // You can use an email service here
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