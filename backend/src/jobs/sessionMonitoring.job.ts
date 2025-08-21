// backend/src/jobs/sessionMonitoring.job.ts - Auto-cancellation Job
import { Session } from '../models/Session.model';
import { notificationService, paymentService } from '../services/notification.service';
import User from '../models/User.model';

class SessionMonitoringJob {
  private static instance: SessionMonitoringJob;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

  public static getInstance(): SessionMonitoringJob {
    if (!SessionMonitoringJob.instance) {
      SessionMonitoringJob.instance = new SessionMonitoringJob();
    }
    return SessionMonitoringJob.instance;
  }

  /**
   * Start the session monitoring job
   */
  public start(): void {
    if (this.isRunning) {
      console.log('⚠️ Session monitoring job is already running');
      return;
    }

    console.log('🚀 Starting session monitoring job...');
    this.isRunning = true;

    // Run immediately
    this.runCheck();

    // Set up interval
    this.intervalId = setInterval(() => {
      this.runCheck();
    }, this.CHECK_INTERVAL);

    console.log(`✅ Session monitoring job started (checking every ${this.CHECK_INTERVAL / 1000}s)`);
  }

  /**
   * Stop the session monitoring job
   */
  public stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Session monitoring job is not running');
      return;
    }

    console.log('🛑 Stopping session monitoring job...');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('✅ Session monitoring job stopped');
  }

  /**
   * Run the monitoring check
   */
  private async runCheck(): Promise<void> {
    try {
      console.log('🔍 Running session monitoring check...');

      const now = new Date();
      
      // Find sessions that should be auto-declined
      const sessionsToAutoDecline = await Session.find({
        status: 'pending_mentor_acceptance',
        autoDeclineAt: { $lte: now }
      }).populate('studentId', 'firstName lastName email')
        .populate('mentorId', 'firstName lastName email');

      console.log(`📋 Found ${sessionsToAutoDecline.length} sessions to auto-decline`);

      // Process each session
      for (const session of sessionsToAutoDecline) {
        await this.autoDeclineSession(session);
      }

      // Find sessions that are starting soon without meeting links (additional safety check)
      const sessionsStartingSoon = await Session.find({
        status: 'confirmed',
        scheduledTime: {
          $gte: now,
          $lte: new Date(now.getTime() + 30 * 60 * 1000) // Next 30 minutes
        },
        $or: [
          { meetingUrl: { $exists: false } },
          { meetingUrl: '' },
          { meetingUrl: null }
        ]
      }).populate('studentId', 'firstName lastName email')
        .populate('mentorId', 'firstName lastName email');

      if (sessionsStartingSoon.length > 0) {
        console.log(`⚠️ Found ${sessionsStartingSoon.length} confirmed sessions starting soon without meeting links`);
        
        for (const session of sessionsStartingSoon) {
          await this.handleSessionWithoutMeetingLink(session);
        }
      }

      console.log('✅ Session monitoring check completed');

    } catch (error) {
      console.error('❌ Error in session monitoring check:', error);
    }
  }

  /**
   * Auto-decline a session that hasn't been accepted in time
   */
  private async autoDeclineSession(session: any): Promise<void> {
    try {
      console.log(`❌ Auto-declining session ${session._id} - mentor didn't respond in time`);

      // Update session status
      session.status = 'cancelled';
      session.cancellationReason = 'Auto-cancelled: Mentor did not accept within required timeframe';
      session.cancelledBy = 'system';
      session.cancelledAt = new Date();

      // Process refund
      let refundProcessed = false;
      if (session.price > 0 && session.paymentId) {
        try {
          const refundResult = await paymentService.refundPayment(session.paymentId, session.price);
          if (refundResult.success) {
            session.refundId = refundResult.paymentId;
            session.refundStatus = 'processed';
            session.paymentStatus = 'refunded';
            refundProcessed = true;
            console.log(`💰 Refund processed for session ${session._id}: ${refundResult.paymentId}`);
          } else {
            console.error(`❌ Refund failed for session ${session._id}:`, refundResult.error);
            session.refundStatus = 'failed';
          }
        } catch (refundError) {
          console.error(`❌ Refund error for session ${session._id}:`, refundError);
          session.refundStatus = 'failed';
        }
      }

      await session.save();

      // Send notifications
      try {
        await notificationService.sendAutoCancellationNotification({
          sessionId: session._id.toString(),
          mentorEmail: session.mentorId.email,
          studentEmail: session.studentId.email,
          mentorName: `${session.mentorId.firstName} ${session.mentorId.lastName}`,
          studentName: `${session.studentId.firstName} ${session.studentId.lastName}`,
          subject: session.subject,
          scheduledTime: session.scheduledTime.toISOString(),
          refundAmount: session.price,
        });
        console.log(`📧 Auto-cancellation notifications sent for session ${session._id}`);
      } catch (emailError) {
        console.error(`❌ Failed to send auto-cancellation emails for session ${session._id}:`, emailError);
      }

      console.log(`✅ Successfully auto-declined session ${session._id}`);

    } catch (error) {
      console.error(`❌ Error auto-declining session ${session._id}:`, error);
    }
  }

  /**
   * Handle confirmed sessions without meeting links
   */
  private async handleSessionWithoutMeetingLink(session: any): Promise<void> {
    try {
      console.log(`⚠️ Session ${session._id} is confirmed but has no meeting link`);

      // This could be a data integrity issue - log it for investigation
      console.warn(`🐛 Data integrity issue: Session ${session._id} status is 'confirmed' but no meeting link provided`);

      // Optionally, you could:
      // 1. Send a warning email to the mentor
      // 2. Auto-cancel the session if it's very close to start time
      // 3. Send an urgent notification to support team

      // For now, just log it for manual intervention
      console.log(`📋 Session ${session._id} needs manual intervention - confirmed without meeting link`);

    } catch (error) {
      console.error(`❌ Error handling session without meeting link ${session._id}:`, error);
    }
  }

  /**
   * Get monitoring statistics
   */
  public async getMonitoringStats(): Promise<{
    isRunning: boolean;
    checkInterval: number;
    pendingSessions: number;
    sessionsNearAutoDecline: number;
    confirmedSessionsWithoutLinks: number;
  }> {
    try {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      const [
        pendingSessions,
        sessionsNearAutoDecline,
        confirmedSessionsWithoutLinks
      ] = await Promise.all([
        // Count pending sessions
        Session.countDocuments({
          status: 'pending_mentor_acceptance'
        }),

        // Count sessions near auto-decline (within 1 hour)
        Session.countDocuments({
          status: 'pending_mentor_acceptance',
          autoDeclineAt: {
            $gte: now,
            $lte: oneHourFromNow
          }
        }),

        // Count confirmed sessions without meeting links
        Session.countDocuments({
          status: 'confirmed',
          $or: [
            { meetingUrl: { $exists: false } },
            { meetingUrl: '' },
            { meetingUrl: null }
          ]
        })
      ]);

      return {
        isRunning: this.isRunning,
        checkInterval: this.CHECK_INTERVAL,
        pendingSessions,
        sessionsNearAutoDecline,
        confirmedSessionsWithoutLinks,
      };

    } catch (error) {
      console.error('❌ Error getting monitoring stats:', error);
      return {
        isRunning: this.isRunning,
        checkInterval: this.CHECK_INTERVAL,
        pendingSessions: 0,
        sessionsNearAutoDecline: 0,
        confirmedSessionsWithoutLinks: 0,
      };
    }
  }

  /**
   * Force check sessions manually (for testing/debugging)
   */
  public async forceCheck(): Promise<void> {
    console.log('🔧 Force running session monitoring check...');
    await this.runCheck();
  }

  /**
   * Get sessions that will be auto-declined soon
   */
  public async getSessionsNearAutoDecline(minutesAhead = 60): Promise<any[]> {
    try {
      const now = new Date();
      const futureTime = new Date(now.getTime() + minutesAhead * 60 * 1000);

      const sessions = await Session.find({
        status: 'pending_mentor_acceptance',
        autoDeclineAt: {
          $gte: now,
          $lte: futureTime
        }
      }).populate('studentId', 'firstName lastName email')
        .populate('mentorId', 'firstName lastName email')
        .sort({ autoDeclineAt: 1 });

      return sessions;

    } catch (error) {
      console.error('❌ Error getting sessions near auto-decline:', error);
      return [];
    }
  }

  /**
   * Manually decline a specific session (for admin use)
   */
  public async manuallyDeclineSession(sessionId: string, reason: string): Promise<void> {
    try {
      const session = await Session.findById(sessionId)
        .populate('studentId', 'firstName lastName email')
        .populate('mentorId', 'firstName lastName email');

      if (!session) {
        throw new Error('Session not found');
      }

      if (session.status !== 'pending_mentor_acceptance') {
        throw new Error('Session is not in pending status');
      }

      console.log(`🔧 Manually declining session ${sessionId}: ${reason}`);

      // Update session
      session.cancellationReason = `Manually cancelled: ${reason}`;
      session.cancelledBy = 'system';
      
      await this.autoDeclineSession(session);

    } catch (error) {
      console.error(`❌ Error manually declining session ${sessionId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export default SessionMonitoringJob.getInstance();

// Auto-start the job when the module is imported (in production)
if (process.env.NODE_ENV === 'production') {
  // Start with a small delay to ensure database is connected
  setTimeout(() => {
    SessionMonitoringJob.getInstance().start();
  }, 5000);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, stopping session monitoring job...');
  SessionMonitoringJob.getInstance().stop();
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, stopping session monitoring job...');
  SessionMonitoringJob.getInstance().stop();
});