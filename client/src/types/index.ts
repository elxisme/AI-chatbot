export interface User {
  id: string;
  email: string;
  fullName: string;
  tier: 'free' | 'pro' | 'premium';
  createdAt: string;
  updatedAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  sessionId: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
  createdAt: string;
}

export interface UploadedFile {
  id: string;
  userId: string;
  sessionId?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
  processed: boolean;
  metadata?: any;
  createdAt: string;
}

export interface UserUsage {
  id: string;
  userId: string;
  messagesUsed: number;
  documentsUploaded: number;
  resetDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: string;
  paystackCustomerCode?: string;
  paystackSubscriptionCode?: string;
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  updatedAt: string;
}

export interface TierLimits {
  messages: number;
  documents: number;
}

export interface TierConfig {
  amount: number;
  name: string;
  price: string;
}

export const TIER_LIMITS: Record<string, TierLimits> = {
  free: { messages: 20, documents: 3 },
  pro: { messages: 500, documents: 50 },
  premium: { messages: -1, documents: -1 }, // unlimited
};

export const TIER_PRICES: Record<string, TierConfig> = {
  pro: { amount: 500000, name: "Pro", price: "₦5,000/month" }, // in kobo
  premium: { amount: 5000000, name: "Premium", price: "₦50,000/month" }, // in kobo
};
