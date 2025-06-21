import { account, databases, appwriteConfig } from './appwrite';
import { ID } from 'appwrite';

export class AuthService {
  // Sign up
  async signUp(name, email, password) {
    try {
      console.log('Starting signup process...');
      
      // Create Appwrite account
      const newAccount = await account.create(
        ID.unique(),
        email,
        password,
        name
      );

      console.log('Account created:', newAccount.$id);

      if (!newAccount) throw new Error('Failed to create account');

      // Create user document in database
      const userDoc = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        ID.unique(),
        {
          userId: newAccount.$id,
          name: name,
          email: email,
          interests: [],
          isOnboarded: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );

      console.log('User document created:', userDoc.$id);

      // Sign in the user
      await this.signIn(email, password);

      return userDoc;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  // Sign in
  async signIn(email, password) {
    try {
      console.log('Starting signin process...');
      const session = await account.createEmailPasswordSession(email, password);
      console.log('Session created:', session.$id);
      return session;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const currentAccount = await account.get();
      if (!currentAccount) return null;

      console.log('Current account:', currentAccount.$id);

      // Get user document from database
      const userDoc = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        [Query.equal('userId', currentAccount.$id)]
      );

      if (userDoc.documents.length === 0) return null;

      return userDoc.documents[0];
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Sign out
  async signOut() {
    try {
      const session = await account.deleteSession('current');
      return session;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Update user interests (onboarding)
  async updateUserInterests(userId, interests) {
    try {
      const userDoc = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        [Query.equal('userId', userId)]
      );

      if (userDoc.documents.length === 0) {
        throw new Error('User not found');
      }

      const updatedUser = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        userDoc.documents[0].$id,
        {
          interests: interests,
          isOnboarded: true,
          updatedAt: new Date().toISOString(),
        }
      );

      return updatedUser;
    } catch (error) {
      console.error('Update user interests error:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      await account.get();
      return true;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();