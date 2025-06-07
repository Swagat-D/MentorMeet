import { Client, Account, Databases, Storage, Functions } from 'appwrite';

// Your Appwrite configuration
export const appwriteConfig = {
  endpoint: 'https://cloud.appwrite.io/v1', // Replace with your endpoint
  platform: 'com.swagat.mentormeet', // Replace with your package name
  projectId: 'mentormatch', // Replace with your project ID
  databaseId: '68447f8b000491be8fa4',
  userCollectionId: 'users',
  mentorCollectionId: 'mentors',
  sessionCollectionId: 'sessions',
  storageId: 'mentormatch',
};

// Initialize Appwrite client
const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setPlatform(appwriteConfig.platform);

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

export { client };