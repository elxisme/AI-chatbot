import { 
  User, InsertUser, ChatSession, InsertChatSession, Message, InsertMessage,
  UploadedFile, InsertUploadedFile, UserUsage, InsertUserUsage,
  Subscription, InsertSubscription
} from "@shared/schema";

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

// In-memory storage implementation for development
class MemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, ChatSession> = new Map();
  private messagesBySession: Map<string, Message[]> = new Map();
  private files: Map<string, UploadedFile> = new Map();
  private usage: Map<string, UserUsage> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.generateId();
    const now = new Date();
    const user: User = {
      id,
      ...userData,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Chat Sessions
  async getUserSessions(userId: string): Promise<ChatSession[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getSession(id: string): Promise<ChatSession | undefined> {
    return this.sessions.get(id);
  }

  async createSession(sessionData: InsertChatSession): Promise<ChatSession> {
    const id = this.generateId();
    const now = new Date();
    const session: ChatSession = {
      id,
      ...sessionData,
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession> {
    const session = this.sessions.get(id);
    if (!session) throw new Error('Session not found');
    
    const updatedSession = { ...session, ...updates, updatedAt: new Date() };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  // Messages
  async getSessionMessages(sessionId: string): Promise<Message[]> {
    return this.messagesBySession.get(sessionId) || [];
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.generateId();
    const message: Message = {
      id,
      ...messageData,
      createdAt: new Date(),
    };
    
    const sessionMessages = this.messagesBySession.get(messageData.sessionId) || [];
    sessionMessages.push(message);
    this.messagesBySession.set(messageData.sessionId, sessionMessages);
    
    return message;
  }

  // Files
  async getUserFiles(userId: string): Promise<UploadedFile[]> {
    return Array.from(this.files.values())
      .filter(file => file.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getSessionFiles(sessionId: string): Promise<UploadedFile[]> {
    return Array.from(this.files.values())
      .filter(file => file.sessionId === sessionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createFile(fileData: InsertUploadedFile): Promise<UploadedFile> {
    const id = this.generateId();
    const file: UploadedFile = {
      id,
      ...fileData,
      createdAt: new Date(),
    };
    this.files.set(id, file);
    return file;
  }

  async updateFile(id: string, updates: Partial<UploadedFile>): Promise<UploadedFile> {
    const file = this.files.get(id);
    if (!file) throw new Error('File not found');
    
    const updatedFile = { ...file, ...updates };
    this.files.set(id, updatedFile);
    return updatedFile;
  }

  // Usage
  async getUserUsage(userId: string): Promise<UserUsage | undefined> {
    return this.usage.get(userId);
  }

  async createUsage(usageData: InsertUserUsage): Promise<UserUsage> {
    const id = this.generateId();
    const now = new Date();
    const usage: UserUsage = {
      id,
      ...usageData,
      resetDate: now,
      createdAt: now,
      updatedAt: now,
    };
    this.usage.set(usageData.userId, usage);
    return usage;
  }

  async updateUsage(userId: string, updates: Partial<UserUsage>): Promise<UserUsage> {
    const usage = this.usage.get(userId);
    if (!usage) throw new Error('Usage not found');
    
    const updatedUsage = { ...usage, ...updates, updatedAt: new Date() };
    this.usage.set(userId, updatedUsage);
    return updatedUsage;
  }

  async incrementUsage(userId: string, type: 'messages' | 'documents'): Promise<UserUsage> {
    let usage = await this.getUserUsage(userId);
    
    if (!usage) {
      usage = await this.createUsage({ userId, messagesUsed: 0, documentsUploaded: 0 });
    }

    const updates = type === 'messages' 
      ? { messagesUsed: usage.messagesUsed + 1 }
      : { documentsUploaded: usage.documentsUploaded + 1 };

    return this.updateUsage(userId, updates);
  }

  // Subscriptions
  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.userId === userId && 
          subscription.status === 'active' && 
          subscription.currentPeriodEnd > new Date()) {
        return subscription;
      }
    }
    return undefined;
  }

  async createSubscription(subscriptionData: InsertSubscription): Promise<Subscription> {
    const id = this.generateId();
    const now = new Date();
    const subscription: Subscription = {
      id,
      ...subscriptionData,
      createdAt: now,
      updatedAt: now,
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) throw new Error('Subscription not found');
    
    const updatedSubscription = { ...subscription, ...updates, updatedAt: new Date() };
    this.subscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }
}

export const storage = new MemoryStorage();
