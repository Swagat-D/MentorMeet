export type SessionType = {
  title: string;
  description: string;
  duration: number;
  price: number;
};

export type Education = {
  degree: string;
  institution: string;
  year: string;
};

export type Review = {
  name: string;
  avatar: string;
  rating: number;
  date: string;
  comment: string;
};

export type Mentor = {
  id: string;
  name: string;
  title: string;
  avatar: string;
  rating: number;
  location: string;
  bio: string;
  subjects: string[];
  education: Education[];
  sessionTypes: SessionType[];
  reviews: Review[];
};