import { mentors } from "./mentors";

export const sessions = [
  {
    id: "1",
    mentor: mentors[0],
    subject: "Mathematics - Calculus",
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    price: 45,
    status: "upcoming",
  },
  {
    id: "2",
    mentor: mentors[2],
    subject: "Biology - Genetics",
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    price: 30,
    status: "upcoming",
  },
  {
    id: "3",
    mentor: mentors[1],
    subject: "Computer Science - Data Structures",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    price: 40,
    status: "completed",
    userRating: 5,
  },
  {
    id: "4",
    mentor: mentors[4],
    subject: "English - IELTS Preparation",
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    price: 45,
    status: "completed",
    userRating: 4,
  },
];