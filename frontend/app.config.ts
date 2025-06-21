// app.config.js
import 'dotenv/config'; // loads your .env values

export default {
  expo: {
    name: "MentorMeet: India-wide Student-Mentor App",
    slug: "mentormeet-india-wide-student-mentor-app",
    version: "1.0.0",
    sdkVersion: "53.0.0",
    plugins: [
    "expo-router",
    "expo-web-browser"
  ],
    extra: {
      appwriteEndpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
      projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
      databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
      userCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USER_COLLECTION_ID,
      mentorCollectionId: process.env.EXPO_PUBLIC_APPWRITE_MENTOR_COLLECTION_ID,
      sessionCollectionId: process.env.EXPO_PUBLIC_APPWRITE_SESSION_COLLECTION_ID,
      storageId: process.env.EXPO_PUBLIC_APPWRITE_STORAGE_ID,
    },
  },
};
