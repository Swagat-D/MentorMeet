// constants/subjects.ts - Subject categories and data
export const subjects = [
  'Computer Science',
  'Mathematics',
  'Data Science',
  'Physics',
  'Chemistry',
  'Biology',
  'English Literature',
  'History',
  'Economics',
  'Psychology',
  'Business Studies',
  'Engineering',
  'Machine Learning',
  'Statistics',
  'Calculus',
  'Linear Algebra',
  'Software Engineering',
  'Web Development',
  'Mobile Development',
  'UI/UX Design',
  'Digital Marketing',
  'Entrepreneurship',
  'Project Management',
  'Leadership',
  'Public Speaking',
  'Creative Writing',
  'Photography',
  'Music',
  'Art & Design',
  'Foreign Languages',
];

export const subjectCategories = {
  'STEM': [
    'Computer Science',
    'Mathematics',
    'Data Science',
    'Physics',
    'Chemistry',
    'Biology',
    'Engineering',
    'Machine Learning',
    'Statistics',
    'Calculus',
    'Linear Algebra',
    'Software Engineering',
  ],
  'Technology': [
    'Computer Science',
    'Web Development',
    'Mobile Development',
    'UI/UX Design',
    'Software Engineering',
    'Data Science',
    'Machine Learning',
  ],
  'Business': [
    'Business Studies',
    'Economics',
    'Digital Marketing',
    'Entrepreneurship',
    'Project Management',
    'Leadership',
  ],
  'Liberal Arts': [
    'English Literature',
    'History',
    'Psychology',
    'Creative Writing',
    'Foreign Languages',
  ],
  'Creative': [
    'Art & Design',
    'Photography',
    'Music',
    'Creative Writing',
    'UI/UX Design',
  ],
  'Professional Skills': [
    'Leadership',
    'Public Speaking',
    'Project Management',
    'Digital Marketing',
  ],
};

export const popularSubjects = [
  'Computer Science',
  'Mathematics',
  'Data Science',
  'Web Development',
  'English Literature',
  'Business Studies',
  'Physics',
  'Psychology',
];

export const trendingSubjects = [
  'Machine Learning',
  'Data Science',
  'UI/UX Design',
  'Digital Marketing',
  'Entrepreneurship',
];

export const getSubjectsByCategory = (category: keyof typeof subjectCategories): string[] => {
  return subjectCategories[category] || [];
};

export const getSubjectCategory = (subject: string): string | null => {
  for (const [category, subjects] of Object.entries(subjectCategories)) {
    if (subjects.includes(subject)) {
      return category;
    }
  }
  return null;
};

export const searchSubjects = (query: string): string[] => {
  const lowercaseQuery = query.toLowerCase();
  return subjects.filter(subject => 
    subject.toLowerCase().includes(lowercaseQuery)
  );
};