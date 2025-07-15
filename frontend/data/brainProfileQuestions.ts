// frontend/data/brainProfileQuestions.ts - Brain Profile Test Data
export interface BrainProfileQuestion {
  id: number;
  setNumber: number;
  statements: {
    L1: string;
    L2: string;
    R1: string;
    R2: string;
  };
}

export const brainProfileQuestions: BrainProfileQuestion[] = [
  {
    id: 1,
    setNumber: 1,
    statements: {
      L1: "I am a practical person",
      L2: "I am a disciplined person", 
      R1: "I am a creative person",
      R2: "I am a friendly person"
    }
  },
  {
    id: 2,
    setNumber: 2,
    statements: {
      L1: "I am motivated by achievements",
      L2: "I am motivated by presenting my work as the best",
      R1: "I am motivated by the fun involved in the process",
      R2: "I am motivated by the new people I meet"
    }
  },
  {
    id: 3,
    setNumber: 3,
    statements: {
      L1: "When talking, my arms are usually folded",
      L2: "When talking, I usually point out my fingers on people or objects",
      R1: "When talking, I move my arms a lot to emphasize my points",
      R2: "When talking, I often touch other people"
    }
  },
  {
    id: 4,
    setNumber: 4,
    statements: {
      L1: "I notice mistakes easily",
      L2: "I notice details and remember facts",
      R1: "I notice anything new or different",
      R2: "I notice changes in behaviour"
    }
  },
  {
    id: 5,
    setNumber: 5,
    statements: {
      L1: "I value logic and common sense",
      L2: "I value realism fairness and structure",
      R1: "I value new efforts and ideas",
      R2: "I value harmony, forgiveness and caring"
    }
  },
  {
    id: 6,
    setNumber: 6,
    statements: {
      L1: "I prefer magazines that have factual, figures and point to point information",
      L2: "I prefer magazines that have detailed information, that can make me knowledgeable",
      R1: "I prefer magazines that have interesting facts and with some cartoons or images",
      R2: "I prefer magazines that have interesting stories about people and are colourful"
    }
  },
  {
    id: 7,
    setNumber: 7,
    statements: {
      L1: "In a conflict situation I prefer to have all the facts and I stick to them",
      L2: "In a conflict situation I ask questions and I want clear answers",
      R1: "In a conflict situation I follow my gut feeling and solve it as quickly as possible",
      R2: "In a conflict situation I listen to others to find a solution. I hate conflict"
    }
  },
  {
    id: 8,
    setNumber: 8,
    statements: {
      L1: "I prefer not to be surprised or waste time",
      L2: "Time management is important and every minute counts",
      R1: "I love surprises and time management is not one of my strength",
      R2: "I love to spend time with people and do not feel controlled by time"
    }
  },
  {
    id: 9,
    setNumber: 9,
    statements: {
      L1: "My way or high way",
      L2: "Practice makes a man perfect",
      R1: "What is the purpose of life without fun",
      R2: "If you don't have good friends, you have no existence"
    }
  },
  {
    id: 10,
    setNumber: 10,
    statements: {
      L1: "I am a Perfectionist, neat and goal Oriented",
      L2: "I am Organized Systematic and Precise",
      R1: "I am innovative, creative and enthusiastic",
      R2: "I am nurturing, supportive and empathetic"
    }
  }
];

export const brainProfileInfo = [
  {
    quadrant: 'L1',
    name: 'Analyst and Realist',
    description: 'Logical, practical, and fact-based thinking',
    color: '#0EA5E9',
    traits: ['Analytical', 'Logical', 'Practical', 'Fact-based', 'Systematic'],
    careers: ['Engineer', 'Data Analyst', 'Financial Analyst', 'Scientist', 'Researcher']
  },
  {
    quadrant: 'L2', 
    name: 'Conservative/Organizer',
    description: 'Structured, detailed, and systematic approach',
    color: '#059669',
    traits: ['Organized', 'Detailed', 'Systematic', 'Disciplined', 'Structured'],
    careers: ['Project Manager', 'Administrator', 'Accountant', 'Operations Manager', 'Quality Analyst']
  },
  {
    quadrant: 'R1',
    name: 'Strategist and Imaginative', 
    description: 'Creative, innovative, and big-picture focused',
    color: '#7C3AED',
    traits: ['Creative', 'Innovative', 'Strategic', 'Visionary', 'Imaginative'],
    careers: ['Designer', 'Architect', 'Artist', 'Marketing Manager', 'Entrepreneur']
  },
  {
    quadrant: 'R2',
    name: 'Socializer and Empathic',
    description: 'People-oriented, emotional, and collaborative',
    color: '#DC2626', 
    traits: ['Empathetic', 'Collaborative', 'Supportive', 'People-focused', 'Communicative'],
    careers: ['Teacher', 'Counselor', 'HR Manager', 'Social Worker', 'Team Leader']
  }
];

export interface BrainProfileResponse {
  questionId: number;
  rankings: number[]; // Array of 4 scores: [L1_score, L2_score, R1_score, R2_score]
}

export const calculateBrainProfileScores = (responses: { [questionId: string]: number[] }) => {
  const scores = { L1: 0, L2: 0, R1: 0, R2: 0 };
  
  Object.values(responses).forEach(rankings => {
    scores.L1 += rankings[0] || 0;
    scores.L2 += rankings[1] || 0; 
    scores.R1 += rankings[2] || 0;
    scores.R2 += rankings[3] || 0;
  });
  
  return scores;
};