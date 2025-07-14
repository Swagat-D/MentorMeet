// frontend/data/riasecQuestions.ts - RIASEC Questions Data
export interface Question {
  id: number;
  statement: string;
  tag: 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
}

export const questions: Question[] = [
  { id: 1, statement: 'I like to take up task that test my knowledge and skills.', tag: 'I' },
  { id: 2, statement: 'I prefer work that I have clear deliverables.', tag: 'C' },
  { id: 3, statement: 'I like taking good photos', tag: 'A' },
  { id: 4, statement: 'I love to sing', tag: 'A' },
  { id: 5, statement: 'I like things in proper order', tag: 'C' },
  { id: 6, statement: 'In the future I would like to set up my own company.', tag: 'E' },
  { id: 7, statement: 'I love to dance', tag: 'A' },
  { id: 8, statement: 'I like roles which give me authority.', tag: 'E' },
  { id: 9, statement: 'Poetry, stories and plays interest me', tag: 'A' },
  { id: 10, statement: 'I can persuade others easily.', tag: 'E' },
  { id: 11, statement: 'I prefer working outdoor', tag: 'R' },
  { id: 12, statement: 'I like to put things in order.', tag: 'E' },
  { id: 13, statement: 'I like to explore for new information.', tag: 'I' },
  { id: 14, statement: 'I like team work.', tag: 'S' },
  { id: 15, statement: 'I am a person who likes to use tools and mechanical equipment.', tag: 'R' },
  { id: 16, statement: 'I can manage records without errors.', tag: 'C' },
  { id: 17, statement: 'I am fast at doing paper work.', tag: 'C' },
  { id: 18, statement: 'I like repairing electric fittings.', tag: 'R' },
  { id: 19, statement: 'I like book keeping (hisaab-kitaab)', tag: 'C' },
  { id: 20, statement: 'I prefer to work on my own.', tag: 'I' },
  { id: 21, statement: 'I like solving numerical problems.', tag: 'I' },
  { id: 22, statement: 'I often make choices that influence others.', tag: 'E' },
  { id: 23, statement: 'I help others in resolving their conflicts.', tag: 'S' },
  { id: 24, statement: 'I can make sense of scientific theories with ease.', tag: 'I' },
  { id: 25, statement: 'I can work easily with others.', tag: 'S' },
  { id: 26, statement: 'I enjoy opening things to understand how they work.', tag: 'R' },
  { id: 27, statement: 'I like to work towards betterment of others.', tag: 'S' },
  { id: 28, statement: 'I like to help someone who is in trouble.', tag: 'S' },
  { id: 29, statement: 'I like adventure, trekking, playing sports, etc.', tag: 'R' },
  { id: 30, statement: 'I enjoy things such as painting, craft, etc.', tag: 'A' },
  { id: 31, statement: 'I do not give up easily', tag: 'R' },
  { id: 32, statement: 'My friends and parents think I am disciplined', tag: 'C' },
  { id: 33, statement: 'I am self sufficient', tag: 'E' },
  { id: 34, statement: 'My friends think that I am very understanding', tag: 'S' },
  { id: 35, statement: 'I am curious about things', tag: 'I' },
  { id: 36, statement: 'I get bored with repetition and time table', tag: 'A' },
  
  // Activity-based questions (Section continues with "Which of the following activities interest you?")
  { id: 37, statement: 'Playing Monopoly/Business or Ludo', tag: 'C' },
  { id: 38, statement: 'Caring for old people', tag: 'S' },
  { id: 39, statement: 'Writing or appreciating poetry', tag: 'A' },
  { id: 40, statement: 'Being a Team Leader or Class Monitor and taking decisions', tag: 'E' },
  { id: 41, statement: 'Social Service', tag: 'S' },
  { id: 42, statement: 'Visiting monuments', tag: 'I' },
  { id: 43, statement: 'Gardening', tag: 'R' },
  { id: 44, statement: 'Collecting souvenirs/fridge magnets/stamps/coins/songs', tag: 'C' },
  { id: 45, statement: 'Travelling', tag: 'R' },
  { id: 46, statement: 'Standing for a cause', tag: 'E' },
  { id: 47, statement: 'Going out with friends', tag: 'S' },
  { id: 48, statement: 'Investing money in share market or taking higher risk for higher return', tag: 'E' },
  { id: 49, statement: 'Listening to music', tag: 'A' },
  { id: 50, statement: 'Writing Diary', tag: 'C' },
  { id: 51, statement: 'Research work which involves observing and taking notes', tag: 'I' },
  { id: 52, statement: 'Solving Sudoku/Puzzles', tag: 'I' },
  { id: 53, statement: 'Artwork', tag: 'A' },
  { id: 54, statement: 'Fixing/Repairing Things like vehicle, machines, grinder, etc.', tag: 'R' },
];

export const riasecInfo = [
  { letter: 'R', name: 'Realistic', desc: 'Doers who like hands-on work', color: '#059669' },
  { letter: 'I', name: 'Investigative', desc: 'Thinkers who enjoy research', color: '#7C3AED' },
  { letter: 'A', name: 'Artistic', desc: 'Creators who value self-expression', color: '#DC2626' },
  { letter: 'S', name: 'Social', desc: 'Helpers who enjoy working with people', color: '#F59E0B' },
  { letter: 'E', name: 'Enterprising', desc: 'Persuaders who like leadership', color: '#0EA5E9' },
  { letter: 'C', name: 'Conventional', desc: 'Organizers who prefer structure', color: '#8B4513' },
];