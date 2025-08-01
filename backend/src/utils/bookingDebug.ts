// backend/src/utils/bookingDebug.ts - Debug Utility for Booking Issues
import mongoose from 'mongoose';
import User from '../models/User.model';
import MentorProfileService from '../services/mentorProfile.service';

export async function debugMentorBooking(mentorId: string, date?: string) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    mentorId,
    date: date || new Date().toISOString().split('T')[0],
    checks: {},
    issues: [],
    suggestions: []
  };

  try {
    console.log('🔍 Starting booking debug for mentor:', mentorId);

    // Check 1: Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(mentorId)) {
      debugInfo.issues.push('Invalid mentor ID format');
      debugInfo.suggestions.push('Ensure mentor ID is a valid MongoDB ObjectId');
      return debugInfo;
    }
    debugInfo.checks.validObjectId = true;

    // Check 2: Find user in users collection
    const user = await User.findById(mentorId);
    debugInfo.checks.userExists = !!user;
    if (user) {
      debugInfo.user = {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        email: user.email
      };
    } else {
      debugInfo.issues.push('User not found in users collection');
      debugInfo.suggestions.push('Check if the mentor ID exists in the users collection');
    }

    // Check 3: Find mentor profile by userId
    const mentorProfile = await MentorProfileService.findMentorProfile(mentorId);

    debugInfo.checks.mentorProfileExists = !!mentorProfile;

    if (mentorProfile) {
      debugInfo.mentorProfile = {
        id: mentorProfile._id,
        userId: mentorProfile.userId,
        displayName: mentorProfile.displayName,
        bio: mentorProfile.bio?.substring(0, 100) + '...',
        hasWeeklySchedule: !!mentorProfile.weeklySchedule,
        hasPricing: !!mentorProfile.pricing,
        isProfileComplete: mentorProfile.isProfileComplete,
        applicationSubmitted: mentorProfile.applicationSubmitted
      };

      // Check 4: Weekly schedule analysis
      const weeklySchedule = mentorProfile.weeklySchedule;
      if (weeklySchedule) {
        debugInfo.checks.hasWeeklySchedule = true;
        
        const scheduleAnalysis: any = {};
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        daysOfWeek.forEach(day => {
          const daySchedule = weeklySchedule[day];
          scheduleAnalysis[day] = {
            configured: Array.isArray(daySchedule) && daySchedule.length > 0,
            slotsCount: Array.isArray(daySchedule) ? daySchedule.length : 0,
            availableSlots: Array.isArray(daySchedule) 
              ? daySchedule.filter((slot: any) => slot.isAvailable === true).length 
              : 0,
            slots: Array.isArray(daySchedule) ? daySchedule : []
          };
        });
        
        debugInfo.weeklyScheduleAnalysis = scheduleAnalysis;
        
        // Check the specific date if provided
        if (date) {
          const requestedDate = new Date(date);
          const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          const daySchedule = weeklySchedule[dayName];
          
          debugInfo.requestedDateAnalysis = {
            date,
            dayName,
            daySchedule,
            hasScheduleForDay: Array.isArray(daySchedule) && daySchedule.length > 0,
            availableSlotsForDay: Array.isArray(daySchedule) 
              ? daySchedule.filter((slot: any) => slot.isAvailable === true).length 
              : 0
          };

          if (!Array.isArray(daySchedule) || daySchedule.length === 0) {
            debugInfo.issues.push(`No schedule configured for ${dayName}`);
            debugInfo.suggestions.push(`Ask the mentor to configure their availability for ${dayName}s`);
          } else if (daySchedule.filter((slot: any) => slot.isAvailable === true).length === 0) {
            debugInfo.issues.push(`All slots are marked as unavailable for ${dayName}`);
            debugInfo.suggestions.push(`Check if the mentor has marked slots as available for ${dayName}s`);
          }
        }

        // Check for common schedule issues
        const totalAvailableSlots = Object.values(scheduleAnalysis).reduce(
          (sum: number, day: any) => sum + day.availableSlots, 0
        );
        
        if (totalAvailableSlots === 0) {
          debugInfo.issues.push('No available slots found in the entire weekly schedule');
          debugInfo.suggestions.push('Mentor needs to mark some time slots as available');
        }

      } else {
        debugInfo.checks.hasWeeklySchedule = false;
        debugInfo.issues.push('No weekly schedule configured');
        debugInfo.suggestions.push('Mentor needs to set up their weekly availability');
      }

      // Check 5: Pricing configuration
      const pricing = mentorProfile.pricing;
      if (pricing) {
        debugInfo.checks.hasPricing = true;
        debugInfo.pricing = {
          hourlyRate: pricing.hourlyRate,
          currency: pricing.currency
        };
        
        if (!pricing.hourlyRate || pricing.hourlyRate <= 0) {
          debugInfo.issues.push('Invalid hourly rate configured');
          debugInfo.suggestions.push('Mentor needs to set a valid hourly rate');
        }
      } else {
        debugInfo.checks.hasPricing = false;
        debugInfo.issues.push('No pricing configuration found');
        debugInfo.suggestions.push('Mentor needs to configure their pricing');
      }

    } else {
      debugInfo.issues.push('Mentor profile not found in mentorProfiles collection');
      debugInfo.suggestions.push('Check if the mentor has completed their profile setup');
    }

    // Check 6: Cal.com configuration
    debugInfo.calcomConfig = {
      apiKeyConfigured: !!process.env.CALCOM_API_KEY,
      apiUrl: process.env.CALCOM_API_URL || 'https://api.cal.com/v1',
      apiKeyLength: process.env.CALCOM_API_KEY?.length || 0
    };

    if (!process.env.CALCOM_API_KEY) {
      debugInfo.issues.push('Cal.com API key not configured');
      debugInfo.suggestions.push('Set CALCOM_API_KEY environment variable');
    }

    // Summary
    debugInfo.summary = {
      canGenerateSlots: debugInfo.checks.userExists && 
                       debugInfo.checks.mentorProfileExists && 
                       debugInfo.checks.hasWeeklySchedule &&
                       debugInfo.checks.hasPricing,
      totalIssues: debugInfo.issues.length,
      readyForBooking: debugInfo.issues.length === 0
    };

    console.log('✅ Booking debug completed');
    return debugInfo;

  } catch (error: any) {
    debugInfo.error = {
      message: error.message,
      stack: error.stack
    };
    debugInfo.issues.push(`Debug process failed: ${error.message}`);
    console.error('❌ Booking debug failed:', error);
    return debugInfo;
  }
}

// Export a simple function to run debug from routes
export async function runBookingDebug(mentorId: string, date?: string) {
  return await debugMentorBooking(mentorId, date);
}