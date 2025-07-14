export const getWeekStart = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Adjust to get Monday as start of week
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

export const calculateCurrentStreak = (sessions: any[]): { current: number; longest: number } => {
  if (!sessions || sessions.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Sort sessions by date (most recent first)
  const sortedSessions = sessions
    .filter(session => session.status === 'completed')
    .sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());

  if (sortedSessions.length === 0) {
    return { current: 0, longest: 0 };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  for (const session of sortedSessions) {
    const sessionDate = new Date(session.scheduledTime);
    sessionDate.setHours(0, 0, 0, 0);

    if (!lastDate) {
      // First session
      tempStreak = 1;
      currentStreak = 1;
      lastDate = sessionDate;
      continue;
    }

    const daysDiff = Math.floor((lastDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      // Consecutive day
      tempStreak++;
      if (currentStreak === tempStreak - 1) {
        currentStreak = tempStreak;
      }
    } else if (daysDiff === 0) {
      // Same day, don't break streak but don't increment
      continue;
    } else {
      // Streak broken
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
      
      // Only reset current streak if we're at the beginning
      if (lastDate === new Date(sortedSessions[0].scheduledTime)) {
        currentStreak = 0;
      }
    }

    lastDate = sessionDate;
  }

  longestStreak = Math.max(longestStreak, tempStreak);
  
  // Check if current streak is still active (within last 2 days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastSessionDate = new Date(sortedSessions[0].scheduledTime);
  lastSessionDate.setHours(0, 0, 0, 0);
  
  const daysSinceLastSession = Math.floor((today.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceLastSession > 1) {
    currentStreak = 0;
  }

  return { current: currentStreak, longest: longestStreak };
};