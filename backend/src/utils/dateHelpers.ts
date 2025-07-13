export const getWeekStart = (): Date => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);
  return start;
};

export const calculateCurrentStreak = (completedSessions: any[]): { current: number; longest: number } => {
  if (completedSessions.length === 0) {
    return { current: 0, longest: 0 };
  }
  
  const sortedSessions = completedSessions
    .sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate: string | null = null;
  
  for (const session of sortedSessions) {
    const sessionDate = new Date(session.scheduledTime).toDateString();
    
    if (!lastDate) {
      tempStreak = 1;
      currentStreak = 1;
    } else {
      const daysDiff = (new Date(lastDate).getTime() - new Date(sessionDate).getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff === 1) {
        tempStreak++;
        if (currentStreak === tempStreak - 1) currentStreak = tempStreak;
      } else if (daysDiff > 1) {
        tempStreak = 1;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    lastDate = sessionDate;
  }
  
  return { current: currentStreak, longest: longestStreak };
};