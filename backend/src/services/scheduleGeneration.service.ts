// backend/src/services/scheduleGeneration.service.ts - Generate Available Slots from Mentor Schedule
import { Session } from '../models/Session.model';
import MentorProfileService from './mentorProfile.service';

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  date: string;
  isAvailable: boolean;
  price: number;
  duration: number;
  sessionType: 'video';
  slotId: string; // Reference to mentor's schedule slot
}

class ScheduleGenerationService {
  private static instance: ScheduleGenerationService;

  public static getInstance(): ScheduleGenerationService {
    if (!ScheduleGenerationService.instance) {
      ScheduleGenerationService.instance = new ScheduleGenerationService();
    }
    return ScheduleGenerationService.instance;
  }

  /**
   * Generate available time slots for a mentor on a specific date
   */
  async generateAvailableSlots(mentorId: string, date: string): Promise<TimeSlot[]> {
    try {
      console.log('📅 Generating slots for mentor:', { mentorId, date });

      // Get mentor profile with schedule
      const mentorProfile = await MentorProfileService.findMentorProfile(mentorId);
      if (!mentorProfile) {
        throw new Error('Mentor profile not found');
      }

      // Validate date
      const requestedDate = new Date(date);
      if (isNaN(requestedDate.getTime())) {
        throw new Error('Invalid date format. Use YYYY-MM-DD');
      }

      // Check if date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      requestedDate.setHours(0, 0, 0, 0);
      
      if (requestedDate < today) {
        return [];
      }

      // Get day name (lowercase)
      const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      // Get mentor's schedule for this day
      const weeklySchedule = mentorProfile.weeklySchedule;
      if (!weeklySchedule || !weeklySchedule[dayName] || !weeklySchedule[dayName].isAvailable) {
        console.log('❌ No schedule available for', dayName);
        return [];
      }

      const daySchedule = weeklySchedule[dayName];
      const timeSlots = daySchedule.timeSlots || [];

      if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
        console.log('❌ No time slots configured for', dayName);
        return [];
      }

      // Generate slots from mentor's time slots
      const availableSlots: TimeSlot[] = [];
      const now = new Date();
      const hourlyRate = mentorProfile.hourlyRateINR || 2000;

      for (const timeSlot of timeSlots) {
        try {
          // Parse start and end times
          const [startHour, startMinute] = timeSlot.startTime.split(':').map(Number);
          const [endHour, endMinute] = timeSlot.endTime.split(':').map(Number);

          if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
            console.warn('⚠️ Invalid time format in slot:', timeSlot);
            continue;
          }

          const slotStart = new Date(requestedDate);
          slotStart.setHours(startHour, startMinute, 0, 0);
          
          const slotEnd = new Date(requestedDate);
          slotEnd.setHours(endHour, endMinute, 0, 0);

          // Validate slot times
          if (slotStart >= slotEnd) {
            console.warn('⚠️ Invalid slot: start time is after end time:', timeSlot);
            continue;
          }

          // Skip past slots (with 2-hour buffer for booking)
          const bufferTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
          if (slotStart <= bufferTime) {
            console.log('⏭️ Skipping past slot:', slotStart.toISOString());
            continue;
          }

          // Get session durations from mentor profile (default to 60 minutes)
          const sessionDurations = mentorProfile.sessionDurations || [60];
          
          // Generate slots for each duration
          for (const duration of sessionDurations) {
            // Calculate how many slots of this duration fit in the time window
            const slotDurationMs = duration * 60 * 1000;
            const availableMs = slotEnd.getTime() - slotStart.getTime();
            const maxSlots = Math.floor(availableMs / slotDurationMs);

            for (let i = 0; i < maxSlots; i++) {
              const sessionStart = new Date(slotStart.getTime() + (i * slotDurationMs));
              const sessionEnd = new Date(sessionStart.getTime() + slotDurationMs);

              // Ensure session doesn't exceed the mentor's available time
              if (sessionEnd > slotEnd) {
                break;
              }

              // Calculate price based on duration and hourly rate
              const price = Math.round((hourlyRate / 60) * duration);

              const slot: TimeSlot = {
                id: `${mentorId}-${sessionStart.getTime()}-${duration}`,
                startTime: sessionStart.toISOString(),
                endTime: sessionEnd.toISOString(),
                date,
                isAvailable: true,
                price,
                duration,
                sessionType: 'video',
                slotId: timeSlot.id // Reference to the mentor's schedule slot
              };

              availableSlots.push(slot);
            }
          }

        } catch (slotError: any) {
          console.error('❌ Error processing time slot:', timeSlot, slotError.message);
          continue;
        }
      }

      console.log(`✅ Generated ${availableSlots.length} raw slots for ${dayName}`);

      // Filter out conflicts with existing bookings
      const finalSlots = await this.filterConflictingSlots(availableSlots, mentorId, date);
      
      console.log(`✅ Final available slots: ${finalSlots.length} (after filtering conflicts)`);
      return finalSlots;

    } catch (error: any) {
      console.error('❌ Error generating available slots:', error);
      throw error;
    }
  }

  /**
   * Filter out slots that conflict with existing bookings
   */
  private async filterConflictingSlots(
    slots: TimeSlot[], 
    mentorId: string, 
    date: string
  ): Promise<TimeSlot[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Get existing bookings for the mentor on this date
      const existingBookings = await Session.find({
        mentorId,
        scheduledTime: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        status: { $nin: ['cancelled'] },
      });
      
      console.log(`📋 Found ${existingBookings.length} existing bookings for ${date}`);
      
      return slots.map(slot => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        
        const hasConflict = existingBookings.some(booking => {
          const bookingStart = new Date(booking.scheduledTime);
          const bookingEnd = new Date(booking.scheduledTime.getTime() + (booking.duration * 60 * 1000));
          
          const overlap = (
            (slotStart >= bookingStart && slotStart < bookingEnd) ||
            (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
            (slotStart <= bookingStart && slotEnd >= bookingEnd)
          );
          
          if (overlap) {
            console.log(`❌ Slot conflict found: ${slot.startTime} overlaps with booking at ${booking.scheduledTime}`);
          }
          
          return overlap;
        });
        
        return {
          ...slot,
          isAvailable: !hasConflict,
        };
      }).filter(slot => slot.isAvailable); // Only return available slots
      
    } catch (error: any) {
      console.error('❌ Error filtering conflicting slots:', error);
      return slots; // Return original slots if filtering fails
    }
  }

  /**
   * Validate if a specific slot is still available
   */
  async isSlotAvailable(
    mentorId: string, 
    startTime: string, 
    duration: number
  ): Promise<boolean> {
    try {
      const sessionStart = new Date(startTime);
      const sessionEnd = new Date(sessionStart.getTime() + (duration * 60 * 1000));
      
      // Check for conflicts with existing bookings
      const conflicts = await Session.findConflicting(
        mentorId as any,
        sessionStart,
        duration
      );
      
      if (conflicts.length > 0) {
        console.log('❌ Slot has conflicts:', conflicts.length);
        return false;
      }
      
      // Check if the slot is still within mentor's available hours
      const date = sessionStart.toISOString().split('T')[0];
      const availableSlots = await this.generateAvailableSlots(mentorId, date);
      
      const slotExists = availableSlots.some(slot => 
        slot.startTime === startTime && 
        slot.duration === duration && 
        slot.isAvailable
      );
      
      return slotExists;
      
    } catch (error: any) {
      console.error('❌ Error checking slot availability:', error);
      return false;
    }
  }

  /**
   * Get mentor's available days in a month
   */
  async getMentorAvailableDays(mentorId: string, year: number, month: number): Promise<string[]> {
    try {
      const mentorProfile = await MentorProfileService.findMentorProfile(mentorId);
      if (!mentorProfile || !mentorProfile.weeklySchedule) {
        return [];
      }

      const availableDays: string[] = [];
      const weeklySchedule = mentorProfile.weeklySchedule;
      
      // Get all days in the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        if (weeklySchedule[dayName] && weeklySchedule[dayName].isAvailable) {
          const dateString = date.toISOString().split('T')[0];
          availableDays.push(dateString);
        }
      }
      
      return availableDays;
      
    } catch (error: any) {
      console.error('❌ Error getting mentor available days:', error);
      return [];
    }
  }

  /**
   * Get next available slot for a mentor
   */
  async getNextAvailableSlot(mentorId: string): Promise<TimeSlot | null> {
    try {
      const today = new Date();
      const maxDaysToCheck = 30; // Check next 30 days
      
      for (let i = 0; i < maxDaysToCheck; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        const dateString = checkDate.toISOString().split('T')[0];
        
        const slots = await this.generateAvailableSlots(mentorId, dateString);
        if (slots.length > 0) {
          // Return the first available slot
          return slots[0];
        }
      }
      
      return null;
      
    } catch (error: any) {
      console.error('❌ Error getting next available slot:', error);
      return null;
    }
  }
}

export default ScheduleGenerationService.getInstance();