import { Mentor } from "@/types/mentor";

export const mentors: Mentor[] = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    title: "Mathematics Professor",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200",
    rating: 4.9,
    location: "New Delhi, India",
    bio: "I'm a Mathematics professor with over 15 years of teaching experience. I specialize in Calculus, Linear Algebra, and Statistics. My teaching approach focuses on building strong fundamentals and problem-solving skills.",
    subjects: ["Mathematics", "Statistics", "Physics"],
    education: [
      {
        degree: "Ph.D. in Mathematics",
        institution: "Indian Institute of Technology, Delhi",
        year: "2008"
      },
      {
        degree: "M.Sc. in Mathematics",
        institution: "Delhi University",
        year: "2004"
      }
    ],
    sessionTypes: [
      {
        title: "Concept Clarification",
        description: "One-on-one session to clarify specific mathematical concepts and solve your doubts.",
        duration: 30,
        price: 25
      },
      {
        title: "Problem Solving Session",
        description: "Work through challenging problems together and learn advanced problem-solving techniques.",
        duration: 60,
        price: 45
      },
      {
        title: "Exam Preparation",
        description: "Comprehensive preparation for upcoming exams, including practice tests and personalized feedback.",
        duration: 90,
        price: 60
      }
    ],
    reviews: [
      {
        name: "Rahul Sharma",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100",
        rating: 5,
        date: "Oct 15, 2023",
        comment: "Dr. Johnson is an exceptional teacher! She explained complex calculus concepts in a way that finally made sense to me. Highly recommend her sessions."
      },
      {
        name: "Priya Patel",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=100",
        rating: 5,
        date: "Sep 28, 2023",
        comment: "I was struggling with statistics for months, but after just three sessions with Dr. Johnson, I'm confident enough to tackle any problem. She's patient and very knowledgeable."
      },
      {
        name: "Amit Kumar",
        avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100",
        rating: 4,
        date: "Aug 12, 2023",
        comment: "Great mentor for advanced mathematics. Her problem-solving sessions are particularly helpful for competitive exams."
      }
    ]
  },
  {
    id: "2",
    name: "Prof. Rajesh Gupta",
    title: "Computer Science Expert",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200",
    rating: 4.8,
    location: "Bangalore, India",
    bio: "I'm a software engineer and CS professor with expertise in programming, data structures, algorithms, and web development. I believe in practical, hands-on learning and helping students build real-world projects.",
    subjects: ["Computer Science", "Programming", "Web Development"],
    education: [
      {
        degree: "M.Tech in Computer Science",
        institution: "Indian Institute of Science, Bangalore",
        year: "2010"
      },
      {
        degree: "B.Tech in Computer Engineering",
        institution: "NIT Surathkal",
        year: "2008"
      }
    ],
    sessionTypes: [
      {
        title: "Programming Basics",
        description: "Learn fundamentals of programming with Python or Java. Perfect for beginners.",
        duration: 45,
        price: 30
      },
      {
        title: "Data Structures & Algorithms",
        description: "Master essential DS&A concepts for interviews and competitive programming.",
        duration: 60,
        price: 40
      },
      {
        title: "Project Mentorship",
        description: "Get guidance on your coding projects with code reviews and architecture advice.",
        duration: 90,
        price: 55
      }
    ],
    reviews: [
      {
        name: "Neha Singh",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100",
        rating: 5,
        date: "Nov 2, 2023",
        comment: "Prof. Gupta helped me prepare for my technical interviews. His algorithm sessions were incredibly helpful, and I landed a job at a top tech company!"
      },
      {
        name: "Vikram Reddy",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100",
        rating: 5,
        date: "Oct 18, 2023",
        comment: "I was struggling with my final year project, but Prof. Gupta's guidance completely transformed it. He's knowledgeable and explains complex concepts clearly."
      },
      {
        name: "Ananya Desai",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100",
        rating: 4,
        date: "Sep 5, 2023",
        comment: "Great mentor for learning web development. He helped me build my first full-stack application from scratch."
      }
    ]
  },
  {
    id: "3",
    name: "Dr. Meera Agarwal",
    title: "Biology & Life Sciences Educator",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200",
    rating: 4.7,
    location: "Mumbai, India",
    bio: "I'm a biologist and educator with a passion for making complex biological concepts accessible to students. I specialize in molecular biology, genetics, and human physiology, with a focus on medical entrance exam preparation.",
    subjects: ["Biology", "Genetics", "Chemistry"],
    education: [
      {
        degree: "Ph.D. in Molecular Biology",
        institution: "Tata Institute of Fundamental Research",
        year: "2012"
      },
      {
        degree: "M.Sc. in Biotechnology",
        institution: "Mumbai University",
        year: "2008"
      }
    ],
    sessionTypes: [
      {
        title: "Biology Fundamentals",
        description: "Clear understanding of core biological concepts with visual aids and examples.",
        duration: 45,
        price: 30
      },
      {
        title: "NEET/Medical Exam Prep",
        description: "Targeted preparation for medical entrance exams with practice questions and strategies.",
        duration: 60,
        price: 45
      },
      {
        title: "Advanced Topics in Biology",
        description: "Deep dive into specialized areas like genetics, molecular biology, or physiology.",
        duration: 75,
        price: 50
      }
    ],
    reviews: [
      {
        name: "Karthik Nair",
        avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100",
        rating: 5,
        date: "Nov 10, 2023",
        comment: "Dr. Agarwal's NEET preparation sessions were instrumental in my success. Her approach to teaching biology made even the most complex topics seem simple."
      },
      {
        name: "Shreya Malhotra",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100",
        rating: 4,
        date: "Oct 22, 2023",
        comment: "Excellent mentor for biology. Her visual teaching methods and diagrams helped me understand concepts I had struggled with for years."
      },
      {
        name: "Rohan Joshi",
        avatar: "https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=100",
        rating: 5,
        date: "Sep 30, 2023",
        comment: "Dr. Agarwal's genetics sessions are outstanding. She explains complex molecular mechanisms in a way that's easy to understand and remember."
      }
    ]
  },
  {
    id: "4",
    name: "Prof. Arjun Mehta",
    title: "Physics & Engineering Expert",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200",
    rating: 4.9,
    location: "Chennai, India",
    bio: "I'm a physics professor and former aerospace engineer with a passion for making physics intuitive and applicable. I specialize in mechanics, electromagnetism, and engineering physics, with a focus on problem-solving and real-world applications.",
    subjects: ["Physics", "Engineering", "Mathematics"],
    education: [
      {
        degree: "Ph.D. in Theoretical Physics",
        institution: "Indian Institute of Technology, Madras",
        year: "2009"
      },
      {
        degree: "B.Tech in Aerospace Engineering",
        institution: "Indian Institute of Technology, Bombay",
        year: "2005"
      }
    ],
    sessionTypes: [
      {
        title: "Physics Fundamentals",
        description: "Build strong foundations in core physics concepts with intuitive explanations and demonstrations.",
        duration: 45,
        price: 35
      },
      {
        title: "Problem Solving Masterclass",
        description: "Learn advanced problem-solving techniques for physics competitions and engineering entrance exams.",
        duration: 60,
        price: 45
      },
      {
        title: "Engineering Physics Applications",
        description: "Connect theoretical physics to real-world engineering applications and projects.",
        duration: 90,
        price: 60
      }
    ],
    reviews: [
      {
        name: "Aditya Sharma",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100",
        rating: 5,
        date: "Nov 15, 2023",
        comment: "Prof. Mehta's approach to teaching physics is revolutionary. He uses real-world examples that make complex concepts intuitive. My JEE Advanced score improved dramatically after his sessions."
      },
      {
        name: "Kavita Rao",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100",
        rating: 5,
        date: "Oct 28, 2023",
        comment: "The best physics teacher I've ever had. Prof. Mehta's problem-solving techniques are game-changers for competitive exams."
      },
      {
        name: "Siddharth Patel",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100",
        rating: 4,
        date: "Sep 20, 2023",
        comment: "His engineering physics sessions helped me bridge the gap between theoretical knowledge and practical applications. Highly recommended for engineering students."
      }
    ]
  },
  {
    id: "5",
    name: "Ms. Anjali Sharma",
    title: "English Literature & Language Coach",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200",
    rating: 4.8,
    location: "Kolkata, India",
    bio: "I'm an English literature professor and language coach with expertise in creative writing, grammar, and literary analysis. I help students improve their English communication skills, prepare for language proficiency tests, and develop a deeper appreciation for literature.",
    subjects: ["English", "Literature", "Creative Writing"],
    education: [
      {
        degree: "M.A. in English Literature",
        institution: "Jadavpur University",
        year: "2011"
      },
      {
        degree: "B.A. in English",
        institution: "St. Xavier's College, Kolkata",
        year: "2009"
      }
    ],
    sessionTypes: [
      {
        title: "English Grammar & Usage",
        description: "Master English grammar rules and improve your written and spoken communication.",
        duration: 45,
        price: 25
      },
      {
        title: "Literary Analysis",
        description: "Learn to analyze and appreciate literary works with critical thinking and contextual understanding.",
        duration: 60,
        price: 35
      },
      {
        title: "IELTS/TOEFL Preparation",
        description: "Comprehensive preparation for English proficiency tests with practice exercises and feedback.",
        duration: 75,
        price: 45
      }
    ],
    reviews: [
      {
        name: "Ravi Kumar",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100",
        rating: 5,
        date: "Nov 5, 2023",
        comment: "Ms. Sharma helped me improve my IELTS score from 6.5 to 8.0 in just two months. Her techniques for the writing and speaking sections were particularly effective."
      },
      {
        name: "Divya Mathur",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100",
        rating: 4,
        date: "Oct 12, 2023",
        comment: "I've always struggled with grammar, but Ms. Sharma's systematic approach made it much easier to understand and apply the rules correctly."
      },
      {
        name: "Nikhil Menon",
        avatar: "https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=100",
        rating: 5,
        date: "Sep 25, 2023",
        comment: "Her literary analysis sessions opened my eyes to new ways of interpreting texts. She has an incredible depth of knowledge and a gift for teaching."
      }
    ]
  },
  {
    id: "6",
    name: "Dr. Vikram Singh",
    title: "History & Social Sciences Expert",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200",
    rating: 4.7,
    location: "Jaipur, India",
    bio: "I'm a historian and social sciences educator with a passion for making history engaging and relevant. I specialize in Indian history, world civilizations, and political science, focusing on connecting historical events to contemporary issues.",
    subjects: ["History", "Political Science", "Geography"],
    education: [
      {
        degree: "Ph.D. in History",
        institution: "Jawaharlal Nehru University",
        year: "2010"
      },
      {
        degree: "M.A. in History",
        institution: "Delhi University",
        year: "2006"
      }
    ],
    sessionTypes: [
      {
        title: "Indian History Overview",
        description: "Comprehensive coverage of Indian history from ancient civilizations to modern India.",
        duration: 60,
        price: 30
      },
      {
        title: "World History Highlights",
        description: "Explore major world civilizations and transformative historical events.",
        duration: 60,
        price: 30
      },
      {
        title: "UPSC History Preparation",
        description: "Targeted preparation for history and social sciences sections of civil services exams.",
        duration: 90,
        price: 50
      }
    ],
    reviews: [
      {
        name: "Anand Verma",
        avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100",
        rating: 5,
        date: "Nov 8, 2023",
        comment: "Dr. Singh's approach to teaching history is refreshing. Instead of just dates and events, he focuses on patterns, causes, and impacts, which makes the subject fascinating."
      },
      {
        name: "Leela Krishnan",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100",
        rating: 4,
        date: "Oct 20, 2023",
        comment: "His UPSC preparation sessions are excellent. The way he connects historical events to current affairs is particularly helpful for the civil services exam."
      },
      {
        name: "Farhan Ahmed",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100",
        rating: 5,
        date: "Sep 15, 2023",
        comment: "Dr. Singh's knowledge of world history is impressive. His comparative analysis of different civilizations gave me new perspectives I hadn't considered before."
      }
    ]
  }
];