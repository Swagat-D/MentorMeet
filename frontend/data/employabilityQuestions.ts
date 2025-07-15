// frontend/data/employabilityQuestions.ts - Employability Test Data (STEPS Framework)
export interface EmployabilityQuestion {
  id: number;
  category: 'S' | 'T' | 'E' | 'P' | 'Speaking';
  question: string;
  hint: string;
}

export const employabilityQuestions: EmployabilityQuestion[] = [
  // Self Management (S) - Questions 1-5
  {
    id: 1,
    category: 'S',
    question: "How good are you in managing your time?",
    hint: "Think what others say about your Punctuality, Multi-tasking skills and ability to prioritize tasks when you have multiple things to do"
  },
  {
    id: 2,
    category: 'S', 
    question: "How well groomed are you?",
    hint: "Think what your friends or colleagues say about your dressing and what your parents say about your hygiene and grooming (including hair style, nails, dress, body odour, etc.)"
  },
  {
    id: 3,
    category: 'S',
    question: "How good are you in Managing Emotions?",
    hint: "Think about times when you feel Anger, Frustration or Jealousy or when you experience stress, Bullying, Workplace Harassment or Personal insecurity; how do you cope with it? Do you become dysfunctional? How quickly do you become normal? What are your ways of expressing emotions, especially negative emotions."
  },
  {
    id: 4,
    category: 'S',
    question: "How would you rate your confidence level?",
    hint: "Think of situations when you faced challenging situations or had to do things you had never done before. Do you get easily discouraged? Do you always doubt your capability? How is your self-esteem and self-image?"
  },
  {
    id: 5,
    category: 'S',
    question: "How would you rate your ability to manage finance and/or any other resources?",
    hint: "Think if you often borrow from friends or family. Do you always feel that you do not have enough money or the right resources like laptop, phone, etc.? Do you know how to prioritize your expenses? Have you delivered a project or an activity within budget? Are you able to make regular savings?"
  },

  // Team Work (T) - Questions 6-10
  {
    id: 6,
    category: 'T',
    question: "How would you rate your adaptability?",
    hint: "Given an ambiguous situation or an unfamiliar space, how easily do you adjust to the new environment or people. How flexible are you with your personal habits, likes and dislikes? How much can you compromise on your comfort."
  },
  {
    id: 7,
    category: 'T',
    question: "How would you rate your Decision Making skills?",
    hint: "Given a dilemma or a choice, how easily do you make a decision? While making a decision how much do you think about all the choices you have and the pros and cons of each choice made. Do you regret your decisions often?"
  },
  {
    id: 8,
    category: 'T',
    question: "How would you rate your ability to Empathize with others?",
    hint: "How far do you go to understand how others feel and why they act the way they do? Do you often feel that others are just like you?"
  },
  {
    id: 9,
    category: 'T',
    question: "How effectively are you able to Promote Others?",
    hint: "Do you like to give others credit for your success or your team's success? How far do you go in recommending others for promotion, reward and recognition? Does it give you pleasure and happiness to see others win / do well?"
  },
  {
    id: 10,
    category: 'T',
    question: "How effectively do you Manage Interpersonal Conflict?",
    hint: "In a situation of conflict, how efficiently and effectively do you manage the situation? Are you able to achieve your objective despite conflicts? Can you work with people you do not agree with? How do you express your disagreements?"
  },

  // Enterprising (E) - Questions 11-15
  {
    id: 11,
    category: 'E',
    question: "How would you rate your ability to Build a Network?",
    hint: "How comfortable are you in talking to new people. Do you make friends easily? Do you like to keep in touch with people."
  },
  {
    id: 12,
    category: 'E',
    question: "How good are you at Leading Others?",
    hint: "Do others look up to you for directions? Do they like following your advice / suggestions / orders? Do others trust you that you will do the best for them?"
  },
  {
    id: 13,
    category: 'E',
    question: "How would you rate your ability to Manage Risks?",
    hint: "How comfortable are you with uncertainty? Do you carefully analyze potential risks before making decisions? Can you handle unexpected challenges well?"
  },
  {
    id: 14,
    category: 'E',
    question: "How would you rate your ability to Stay motivated?",
    hint: "How well do you maintain your enthusiasm during difficult times? Do you bounce back quickly from setbacks? Can you motivate yourself without external encouragement?"
  },
  {
    id: 15,
    category: 'E',
    question: "How good are you in Taking Initiative?",
    hint: "Do you proactively identify and address problems? Are you comfortable starting new projects or suggesting improvements? Do you take action without being asked?"
  },

  // Problem Solving (P) - Questions 16-20
  {
    id: 16,
    category: 'P',
    question: "Rate your ability to Spot Problems & Think critically",
    hint: "How quickly can you identify issues or potential problems? Do you question assumptions and look at situations from multiple angles? Can you analyze information objectively?"
  },
  {
    id: 17,
    category: 'P',
    question: "Rate your ability to ask the right questions to gather the required information",
    hint: "Do you know what questions to ask to get the information you need? Can you probe deeper when initial answers are insufficient? Are you good at clarifying unclear situations?"
  },
  {
    id: 18,
    category: 'P',
    question: "How easily do you admit your mistakes and learn from them?",
    hint: "Are you comfortable acknowledging when you're wrong? Do you take responsibility for your errors? Can you turn mistakes into learning opportunities?"
  },
  {
    id: 19,
    category: 'P',
    question: "How would you rate your Creativity?",
    hint: "Can you come up with innovative solutions to problems? Do you think outside the box? Are you good at generating new ideas and approaches?"
  },
  {
    id: 20,
    category: 'P',
    question: "How would you rate your Resilience?",
    hint: "How well do you handle stress and pressure? Can you maintain your performance during difficult times? Do you recover quickly from disappointments or failures?"
  },

  // Speaking & Listening - Questions 21-25
  {
    id: 21,
    category: 'Speaking',
    question: "How effective are you in Expressing Yourself / Sharing your story?",
    hint: "Can you clearly communicate your thoughts and ideas? Are you comfortable speaking in front of others? Do people understand you easily when you speak?"
  },
  {
    id: 22,
    category: 'Speaking',
    question: "Rate your Listening ability",
    hint: "Do you pay full attention when others are speaking? Can you understand both the explicit and implicit messages? Do you ask clarifying questions when needed?"
  },
  {
    id: 23,
    category: 'Speaking',
    question: "Rate your Body Language",
    hint: "Are you aware of your non-verbal communication? Do you maintain appropriate eye contact? Is your posture confident and open? Do your gestures support your words?"
  },
  {
    id: 24,
    category: 'Speaking',
    question: "Rate your articulation skills / verbal skills",
    hint: "How clearly do you speak? Do you use appropriate vocabulary for your audience? Can you organize your thoughts logically when speaking? Do you speak at an appropriate pace?"
  },
  {
    id: 25,
    category: 'Speaking',
    question: "Rate your Digital Communication Skills",
    hint: "How effectively do you communicate through emails, messages, and video calls? Are you comfortable with online collaboration tools? Can you convey your message clearly in written digital formats?"
  }
];

export const stepsInfo = [
  {
    category: 'S',
    name: 'Self Management',
    description: 'Personal effectiveness and self-awareness skills',
    color: '#0EA5E9',
    skills: ['Time Management', 'Personal Grooming', 'Emotional Control', 'Confidence', 'Resource Management'],
    importance: 'Foundation skills that affect all other areas of professional life'
  },
  {
    category: 'T',
    name: 'Team Work',
    description: 'Collaboration and interpersonal skills',
    color: '#059669',
    skills: ['Adaptability', 'Decision Making', 'Empathy', 'Promoting Others', 'Conflict Management'],
    importance: 'Essential for working effectively with others in any workplace'
  },
  {
    category: 'E',
    name: 'Enterprising',
    description: 'Leadership and business-oriented skills',
    color: '#F59E0B',
    skills: ['Networking', 'Leadership', 'Risk Management', 'Motivation', 'Initiative'],
    importance: 'Critical for career advancement and entrepreneurial success'
  },
  {
    category: 'P',
    name: 'Problem Solving',
    description: 'Analytical and creative thinking skills',
    color: '#7C3AED',
    skills: ['Critical Thinking', 'Information Gathering', 'Learning from Mistakes', 'Creativity', 'Resilience'],
    importance: 'Fundamental for addressing challenges and driving innovation'
  },
  {
    category: 'Speaking',
    name: 'Speaking & Listening',
    description: 'Communication and presentation skills',
    color: '#DC2626',
    skills: ['Self Expression', 'Active Listening', 'Body Language', 'Verbal Skills', 'Digital Communication'],
    importance: 'Core skills for effective interaction in professional environments'
  }
];

export interface EmployabilityResponse {
  questionId: number;
  score: number; // 1-5 scale
}

export const calculateEmployabilityScores = (responses: { [questionId: string]: number }) => {
  const scores = { S: 0, T: 0, E: 0, P: 0, Speaking: 0 };
  const counts = { S: 0, T: 0, E: 0, P: 0, Speaking: 0 };
  
  employabilityQuestions.forEach(question => {
    const response = responses[question.id.toString()];
    if (response && response >= 1 && response <= 5) {
      scores[question.category] += response;
      counts[question.category]++;
    }
  });
  
  // Calculate averages
  Object.keys(scores).forEach(key => {
    const category = key as keyof typeof scores;
    if (counts[category] > 0) {
      scores[category] = scores[category] / counts[category];
    }
  });
  
  return scores;
};

export const getEmployabilityQuotient = (scores: { S: number, T: number, E: number, P: number, Speaking: number }) => {
  const avgScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / 5;
  return Math.round((avgScore / 5) * 10 * 10) / 10; // Convert to 0-10 scale with 1 decimal
};