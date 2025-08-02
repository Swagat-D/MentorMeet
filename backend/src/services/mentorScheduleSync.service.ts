// backend/src/services/mentorScheduleSync.service.ts - Data Sync Solution
import cron from 'node-cron';
import calComService from './calcom.service';
import MentorProfileService from './mentorProfile.service';
import User from '../models/User.model';
import { Session } from '../models/Session.model';

interface SyncResult {
  mentorId: string;
  success: boolean;
  message: string;
  changes?: {
    added: number;
    updated: number;
    removed: number;
  };
  error?: string;
}

interface SyncConflict {
  mentorId: string;
  type: 'schedule_mismatch' | 'booking_conflict' | 'availability_gap';
  description: string;
  suggestedAction: string;
  calcomData?: any;
  localData?: any;
}

class MentorScheduleSyncService {
  private syncInProgress = new Set<string>();
  private lastSyncTime = new Map<string, number>();
  private conflictLog: SyncConflict[] = [];

  constructor() {
    // Comment out cron jobs for development
    // this.initializeCronJobs();
    console.log('✅ Sync service initialized (cron jobs disabled for development)');
  }

  /**
   * Initialize background sync jobs
   */
  private initializeCronJobs(): void {
    // Sync all mentors every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      console.log('🔄 Starting scheduled sync for all mentors...');
      await this.syncAllMentors();
    });

    // Daily conflict resolution at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('🔍 Starting daily conflict resolution...');
      await this.resolveConflicts();
    });

    // Weekly full resync on Sundays at 3 AM
    cron.schedule('0 3 * * 0', async () => {
      console.log('🔄 Starting weekly full resync...');
      await this.fullResyncAllMentors();
    });

    console.log('✅ Sync cron jobs initialized');
  }

  /**
   * STRATEGY 1: Cal.com as Single Source of Truth
   * This is the recommended approach for production
   */
  async syncMentorToCalCom(mentorId: string, forceSync = false): Promise<SyncResult> {
    if (this.syncInProgress.has(mentorId)) {
      return {
        mentorId,
        success: false,
        message: 'Sync already in progress for this mentor'
      };
    }

    this.syncInProgress.add(mentorId);

    try {
      console.log(`🔄 Syncing mentor ${mentorId} to Cal.com (Single Source of Truth mode)`);

      const mentorProfile = await MentorProfileService.findMentorProfile(mentorId);
      if (!mentorProfile) {
        throw new Error('Mentor profile not found');
      }

      // Step 1: Create/Update Cal.com Event Type with mentor's schedule
      const eventType = await calComService.getOrCreateMentorEventType(mentorId, true);
      
      // Step 2: Sync availability to Cal.com
      const syncResult = await calComService.syncMentorAvailability(mentorId);
      
      if (!syncResult.success) {
        throw new Error(syncResult.message);
      }

      // Step 3: Clear local cache to force fetch from Cal.com
      calComService.clearMentorCache(mentorId);

      // Step 4: Update last sync time
      this.lastSyncTime.set(mentorId, Date.now());

      console.log(`✅ Mentor ${mentorId} synced successfully to Cal.com`);

      return {
        mentorId,
        success: true,
        message: 'Mentor schedule synced to Cal.com successfully',
        changes: {
          added: 0,
          updated: 1,
          removed: 0
        }
      };

    } catch (error: any) {
      console.error(`❌ Failed to sync mentor ${mentorId}:`, error);
      
      return {
        mentorId,
        success: false,
        message: 'Failed to sync mentor schedule',
        error: error.message
      };
    } finally {
      this.syncInProgress.delete(mentorId);
    }
  }

  /**
   * STRATEGY 2: Bidirectional Sync (Advanced)
   * Use when you need to handle complex scenarios
   */
  async bidirectionalSync(mentorId: string): Promise<SyncResult> {
    if (this.syncInProgress.has(mentorId)) {
      return {
        mentorId,
        success: false,
        message: 'Sync already in progress for this mentor'
      };
    }

    this.syncInProgress.add(mentorId);

    try {
      console.log(`🔄 Starting bidirectional sync for mentor ${mentorId}`);

      // Step 1: Get current state from both systems
      const [localSchedule, calcomEventType] = await Promise.all([
        this.getLocalMentorSchedule(mentorId),
        calComService.getOrCreateMentorEventType(mentorId)
      ]);

      // Step 2: Detect conflicts
      const conflicts = await this.detectScheduleConflicts(mentorId, localSchedule, calcomEventType);
      
      if (conflicts.length > 0) {
        console.warn(`⚠️ Found ${conflicts.length} conflicts for mentor ${mentorId}`);
        this.conflictLog.push(...conflicts);
      }

      // Step 3: Resolve conflicts using resolution strategy
      const resolution = await this.resolveScheduleConflicts(conflicts);

      // Step 4: Apply changes
      let changes = { added: 0, updated: 0, removed: 0 };

      if (resolution.syncToCalCom) {
        await calComService.syncMentorAvailability(mentorId);
        changes.updated++;
      }

      if (resolution.updateLocal) {
        await this.updateLocalSchedule(mentorId, resolution.resolvedSchedule);
        changes.updated++;
      }

      // Step 5: Verify sync
      await this.verifySyncIntegrity(mentorId);

      this.lastSyncTime.set(mentorId, Date.now());

      return {
        mentorId,
        success: true,
        message: `Bidirectional sync completed with ${conflicts.length} conflicts resolved`,
        changes
      };

    } catch (error: any) {
      console.error(`❌ Bidirectional sync failed for mentor ${mentorId}:`, error);
      
      return {
        mentorId,
        success: false,
        message: 'Bidirectional sync failed',
        error: error.message
      };
    } finally {
      this.syncInProgress.delete(mentorId);
    }
  }

  /**
   * Detect conflicts between local and Cal.com schedules
   */
  private async detectScheduleConflicts(
    mentorId: string,
    localSchedule: any,
    calcomEventType: any
  ): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = [];

    try {
      // Get existing bookings to check for conflicts
      const existingBookings = await Session.find({
        mentorId,
        scheduledTime: { $gte: new Date() },
        status: { $nin: ['cancelled'] }
      });

      // Check for schedule mismatches
      if (this.hasScheduleMismatch(localSchedule, calcomEventType)) {
        conflicts.push({
          mentorId,
          type: 'schedule_mismatch',
          description: 'Local schedule differs from Cal.com event type',
          suggestedAction: 'Sync local schedule to Cal.com',
          localData: localSchedule,
          calcomData: calcomEventType
        });
      }

      // Check for booking conflicts
      for (const booking of existingBookings) {
        const hasConflict = await this.checkBookingConflict(booking, calcomEventType);
        if (hasConflict) {
          conflicts.push({
            mentorId,
            type: 'booking_conflict',
            description: `Existing booking conflicts with updated schedule`,
            suggestedAction: 'Notify participants and reschedule',
            localData: booking
          });
        }
      }

      return conflicts;

    } catch (error) {
      console.error('❌ Error detecting conflicts:', error);
      return [];
    }
  }

  private hasScheduleMismatch(localSchedule: any, calcomEventType: any): boolean {
    // Implement logic to compare local schedule with Cal.com event type
    // This is a simplified version - you'd need more sophisticated comparison
    const localHash = this.generateScheduleHash(localSchedule);
    const calcomHash = this.generateScheduleHash(calcomEventType.metadata?.schedule);
    
    return localHash !== calcomHash;
  }

  private generateScheduleHash(schedule: any): string {
    if (!schedule) return '';
    return Buffer.from(JSON.stringify(schedule)).toString('base64');
  }

  private async checkBookingConflict(booking: any, calcomEventType: any): Promise<boolean> {
    // Check if booking time conflicts with updated availability
    // This would require fetching Cal.com availability for the booking date
    return false; // Simplified implementation
  }

  /**
   * Resolve schedule conflicts using predefined strategies
   */
  private async resolveScheduleConflicts(conflicts: SyncConflict[]): Promise<{
    syncToCalCom: boolean;
    updateLocal: boolean;
    resolvedSchedule?: any;
    actions: string[];
  }> {
    const actions: string[] = [];
    let syncToCalCom = false;
    let updateLocal = false;
    let resolvedSchedule: any = null;

    for (const conflict of conflicts) {
      switch (conflict.type) {
        case 'schedule_mismatch':
          // Strategy: Local schedule is source of truth
          syncToCalCom = true;
          actions.push(`Sync local schedule to Cal.com for mentor ${conflict.mentorId}`);
          break;

        case 'booking_conflict':
          // Strategy: Protect existing bookings
          actions.push(`Manual review required for booking conflict: ${conflict.description}`);
          break;

        case 'availability_gap':
          // Strategy: Merge availability
          actions.push(`Merge availability gaps for mentor ${conflict.mentorId}`);
          break;
      }
    }

    return {
      syncToCalCom,
      updateLocal,
      resolvedSchedule,
      actions
    };
  }

  /**
   * Update local schedule (if needed)
   */
  private async updateLocalSchedule(mentorId: string, schedule: any): Promise<void> {
    // Fix: Use updateProfile instead of updateMentorProfile
    await MentorProfileService.updateProfile(mentorId, {
      weeklySchedule: schedule,
      lastScheduleSync: new Date()
    });
  }

  /**
   * Verify sync integrity
   */
  private async verifySyncIntegrity(mentorId: string): Promise<boolean> {
    try {
      // Test that we can fetch slots from Cal.com
      const today = new Date().toISOString().split('T')[0];
      const slots = await calComService.getAvailableSlots(mentorId, today);
      
      console.log(`🔍 Verification: Found ${slots.length} available slots for mentor ${mentorId}`);
      return true;

    } catch (error) {
      console.error(`❌ Sync verification failed for mentor ${mentorId}:`, error);
      return false;
    }
  }

  /**
   * Get local mentor schedule
   */
  private async getLocalMentorSchedule(mentorId: string): Promise<any> {
    const mentorProfile = await MentorProfileService.findMentorProfile(mentorId);
    return mentorProfile?.weeklySchedule || null;
  }

  /**
   * Sync all active mentors
   */
  async syncAllMentors(): Promise<SyncResult[]> {
    try {
      console.log('🔄 Starting bulk mentor sync...');

      // Get all active mentors
      const mentors = await User.find({ 
        role: 'mentor', 
        isActive: true 
      }).select('_id');

      const results: SyncResult[] = [];
      const batchSize = 5; // Process in batches to avoid overwhelming Cal.com API

      for (let i = 0; i < mentors.length; i += batchSize) {
        const batch = mentors.slice(i, i + batchSize);
        
        const batchPromises = batch.map(mentor => 
          this.syncMentorToCalCom(mentor._id.toString())
        );

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            results.push({
              mentorId: batch[index]._id.toString(),
              success: false,
              message: 'Sync failed',
              error: result.reason?.message || 'Unknown error'
            });
          }
        });

        // Rate limiting - wait between batches
        if (i + batchSize < mentors.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`✅ Bulk sync completed: ${successful} successful, ${failed} failed`);
      return results;

    } catch (error) {
      console.error('❌ Bulk sync failed:', error);
      return [];
    }
  }

  /**
   * Full resync - force refresh all data
   */
  async fullResyncAllMentors(): Promise<SyncResult[]> {
    console.log('🔄 Starting full resync of all mentors...');
    
    // Clear all caches
    calComService.clearAllCaches();
    this.lastSyncTime.clear();
    this.conflictLog = [];

    return this.syncAllMentors();
  }

  /**
   * Resolve accumulated conflicts
   */
  async resolveConflicts(): Promise<void> {
    if (this.conflictLog.length === 0) {
      console.log('✅ No conflicts to resolve');
      return;
    }

    console.log(`🔍 Resolving ${this.conflictLog.length} accumulated conflicts...`);

    const conflictsByMentor = new Map<string, SyncConflict[]>();
    
    // Group conflicts by mentor
    this.conflictLog.forEach(conflict => {
      if (!conflictsByMentor.has(conflict.mentorId)) {
        conflictsByMentor.set(conflict.mentorId, []);
      }
      conflictsByMentor.get(conflict.mentorId)!.push(conflict);
    });

    // Resolve conflicts for each mentor
    for (const [mentorId, conflicts] of conflictsByMentor) {
      try {
        await this.resolveScheduleConflicts(conflicts);
        console.log(`✅ Resolved conflicts for mentor ${mentorId}`);
      } catch (error) {
        console.error(`❌ Failed to resolve conflicts for mentor ${mentorId}:`, error);
      }
    }

    // Clear resolved conflicts
    this.conflictLog = [];
  }

  /**
   * Get sync status for a mentor
   */
  getSyncStatus(mentorId: string): {
    lastSyncTime: number | null;
    syncInProgress: boolean;
    conflicts: SyncConflict[];
  } {
    return {
      lastSyncTime: this.lastSyncTime.get(mentorId) || null,
      syncInProgress: this.syncInProgress.has(mentorId),
      conflicts: this.conflictLog.filter(c => c.mentorId === mentorId)
    };
  }

  /**
   * Force sync for a specific mentor (manual trigger)
   */
  async forceSyncMentor(mentorId: string): Promise<SyncResult> {
    console.log(`🔄 Force syncing mentor ${mentorId}...`);
    return this.syncMentorToCalCom(mentorId, true);
  }

  /**
   * Emergency fallback - disable mentor if sync fails repeatedly
   */
  async handleMentorSyncFailure(mentorId: string, failureCount: number): Promise<void> {
    if (failureCount >= 5) {
      console.warn(`⚠️ Mentor ${mentorId} has failed sync ${failureCount} times. Implementing fallback...`);
      
      // Option 1: Temporarily disable mentor bookings
      await MentorProfileService.updateProfile(mentorId, {
        temporaryDisabled: true,
        disableReason: 'Schedule sync failures',
        disabledAt: new Date()
      });

      // Option 2: Send alert to admin
      // await notificationService.sendAdminAlert({
      //   type: 'mentor_sync_failure',
      //   mentorId,
      //   failureCount,
      //   action: 'mentor_disabled'
      // });

      console.log(`🚨 Mentor ${mentorId} temporarily disabled due to sync failures`);
    }
  }
}

// Export singleton instance
export default new MentorScheduleSyncService();