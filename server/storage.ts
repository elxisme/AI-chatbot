import { eq, desc, and } from 'drizzle-orm';
import { db } from './db';
import { 
  users, chatSessions, messages, uploadedFiles, userUsage, subscriptions,
  User, InsertUser, ChatSession, InsertChatSession, Message, InsertMessage,
  UploadedFile, InsertUploadedFile, UserUsage, InsertUserUsage,
  Subscription, InsertSubscription
} from './db';

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  // Chat Sessions
  getUserSessions(userId: string): Promise<ChatSession[]>;
  getSession(id: string): Promise<ChatSession | undefined>;
  createSession(session: InsertChatSession): Promise<ChatSession>;
  updateSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession>;

  // Messages
  getSessionMessages(sessionId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Files
  getUserFiles(userId: string): Promise<UploadedFile[]>;
  getSessionFiles(sessionId: string): Promise<UploadedFile[]>;
  createFile(file: InsertUploadedFile): Promise<UploadedFile>;
  updateFile(id: string, updates: Partial<UploadedFile>): Promise<UploadedFile>;

  // Usage
  getUserUsage(userId: string): Promise<UserUsage | undefined>;
  createUsage(usage: InsertUserUsage): Promise<UserUsage>;
  updateUsage(userId: string, updates: Partial<UserUsage>): Promise<UserUsage>;
  incrementUsage(userId: string, type: 'messages' | 'documents'): Promise<UserUsage>;

  // Subscriptions
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription>;
}

class DrizzleStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('Failed to get user');
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw new Error('Failed to get user by email');
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    try {
      const result = await db.insert(users).values(userData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const result = await db
        .update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error('User not found');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  // Chat Sessions
  async getUserSessions(userId: string): Promise<ChatSession[]> {
    try {
      const result = await db
        .select()
        .from(chatSessions)
        .where(eq(chatSessions.userId, userId))
        .orderBy(desc(chatSessions.updatedAt));
      
      return result;
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw new Error('Failed to get user sessions');
    }
  }

  async getSession(id: string): Promise<ChatSession | undefined> {
    try {
      const result = await db.select().from(chatSessions).where(eq(chatSessions.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting session:', error);
      throw new Error('Failed to get session');
    }
  }

  async createSession(sessionData: InsertChatSession): Promise<ChatSession> {
    try {
      const result = await db.insert(chatSessions).values(sessionData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  async updateSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession> {
    try {
      const result = await db
        .update(chatSessions)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(chatSessions.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error('Session not found');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error updating session:', error);
      throw new Error('Failed to update session');
    }
  }

  // Messages
  async getSessionMessages(sessionId: string): Promise<Message[]> {
    try {
      const result = await db
        .select()
        .from(messages)
        .where(eq(messages.sessionId, sessionId))
        .orderBy(messages.createdAt);
      
      return result;
    } catch (error) {
      console.error('Error getting session messages:', error);
      throw new Error('Failed to get session messages');
    }
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    try {
      const result = await db.insert(messages).values(messageData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating message:', error);
      throw new Error('Failed to create message');
    }
  }

  // Files
  async getUserFiles(userId: string): Promise<UploadedFile[]> {
    try {
      const result = await db
        .select()
        .from(uploadedFiles)
        .where(eq(uploadedFiles.userId, userId))
        .orderBy(desc(uploadedFiles.createdAt));
      
      return result;
    } catch (error) {
      console.error('Error getting user files:', error);
      throw new Error('Failed to get user files');
    }
  }

  async getSessionFiles(sessionId: string): Promise<UploadedFile[]> {
    try {
      const result = await db
        .select()
        .from(uploadedFiles)
        .where(eq(uploadedFiles.sessionId, sessionId))
        .orderBy(desc(uploadedFiles.createdAt));
      
      return result;
    } catch (error) {
      console.error('Error getting session files:', error);
      throw new Error('Failed to get session files');
    }
  }

  async createFile(fileData: InsertUploadedFile): Promise<UploadedFile> {
    try {
      const result = await db.insert(uploadedFiles).values(fileData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating file:', error);
      throw new Error('Failed to create file');
    }
  }

  async updateFile(id: string, updates: Partial<UploadedFile>): Promise<UploadedFile> {
    try {
      const result = await db
        .update(uploadedFiles)
        .set(updates)
        .where(eq(uploadedFiles.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error('File not found');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error updating file:', error);
      throw new Error('Failed to update file');
    }
  }

  // Usage
  async getUserUsage(userId: string): Promise<UserUsage | undefined> {
    try {
      const result = await db.select().from(userUsage).where(eq(userUsage.userId, userId)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting user usage:', error);
      throw new Error('Failed to get user usage');
    }
  }

  async createUsage(usageData: InsertUserUsage): Promise<UserUsage> {
    try {
      const result = await db.insert(userUsage).values(usageData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating usage:', error);
      throw new Error('Failed to create usage');
    }
  }

  async updateUsage(userId: string, updates: Partial<UserUsage>): Promise<UserUsage> {
    try {
      const result = await db
        .update(userUsage)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(userUsage.userId, userId))
        .returning();
      
      if (result.length === 0) {
        throw new Error('Usage record not found');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error updating usage:', error);
      throw new Error('Failed to update usage');
    }
  }

  async incrementUsage(userId: string, type: 'messages' | 'documents'): Promise<UserUsage> {
    try {
      let usage = await this.getUserUsage(userId);
      
      if (!usage) {
        usage = await this.createUsage({ userId, messagesUsed: 0, documentsUploaded: 0 });
      }

      const updates = type === 'messages' 
        ? { messagesUsed: usage.messagesUsed + 1 }
        : { documentsUploaded: usage.documentsUploaded + 1 };

      return this.updateUsage(userId, updates);
    } catch (error) {
      console.error('Error incrementing usage:', error);
      throw new Error('Failed to increment usage');
    }
  }

  // Subscriptions
  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    try {
      const result = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, userId),
            eq(subscriptions.status, 'active')
          )
        )
        .orderBy(desc(subscriptions.currentPeriodEnd))
        .limit(1);
      
      // Check if subscription is still valid
      const subscription = result[0];
      if (subscription && subscription.currentPeriodEnd > new Date()) {
        return subscription;
      }
      
      return undefined;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      throw new Error('Failed to get user subscription');
    }
  }

  async createSubscription(subscriptionData: InsertSubscription): Promise<Subscription> {
    try {
      const result = await db.insert(subscriptions).values(subscriptionData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    try {
      const result = await db
        .update(subscriptions)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(subscriptions.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error('Subscription not found');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }
}

export const storage = new DrizzleStorage();