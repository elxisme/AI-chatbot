import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { openaiService } from "./services/openai";
import { supabaseStorage } from "./services/supabase";
import { initializeWebSocket } from "./services/websocket";
import { TIER_LIMITS, TIER_PRICES } from "@shared/schema";
import multer from "multer";
import { z } from "zod";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize OpenAI Assistant
  const assistantId = await openaiService.createAssistant();

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, fullName, password } = req.body;
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Create user
      const user = await storage.createUser({ email, fullName, tier: "free" });
      
      // Create initial usage record
      await storage.createUsage({ userId: user.id, messagesUsed: 0, documentsUploaded: 0 });

      res.json({ user });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user usage
      const usage = await storage.getUserUsage(user.id);
      
      res.json({ user, usage });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // User routes
  app.get("/api/user/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const usage = await storage.getUserUsage(user.id);
      const subscription = await storage.getUserSubscription(user.id);

      res.json({ user, usage, subscription });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Chat session routes
  app.get("/api/sessions/:userId", async (req, res) => {
    try {
      const sessions = await storage.getUserSessions(req.params.userId);
      res.json(sessions);
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({ error: "Failed to get sessions" });
    }
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const { userId, name } = req.body;
      const session = await storage.createSession({ userId, name });
      res.json(session);
    } catch (error) {
      console.error("Create session error:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.get("/api/sessions/:sessionId/messages", async (req, res) => {
    try {
      const messages = await storage.getSessionMessages(req.params.sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  // Chat routes
  app.post("/api/chat/message", async (req, res) => {
    try {
      const { sessionId, userId, content, threadId } = req.body;

      // Check usage limits
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const usage = await storage.getUserUsage(userId);
      const limits = TIER_LIMITS[user.tier as keyof typeof TIER_LIMITS];
      
      if (limits.messages !== -1 && usage && usage.messagesUsed >= limits.messages) {
        return res.status(403).json({ error: "Message limit exceeded" });
      }

      // Save user message
      await storage.createMessage({
        sessionId,
        type: "user",
        content,
        metadata: { threadId }
      });

      // Get session files for context
      const sessionFiles = await storage.getSessionFiles(sessionId);
      const fileIds = sessionFiles
        .filter(f => f.processed)
        .map(f => f.metadata?.openaiFileId)
        .filter(Boolean);

      // Send to OpenAI
      const aiResponse = await openaiService.sendMessage(
        assistantId,
        threadId,
        content,
        fileIds
      );

      // Save AI response
      await storage.createMessage({
        sessionId,
        type: "assistant",
        content: aiResponse.response,
        metadata: { threadId: aiResponse.threadId }
      });

      // Update usage
      await storage.incrementUsage(userId, 'messages');

      res.json({
        response: aiResponse.response,
        threadId: aiResponse.threadId
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  // File upload routes
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { userId, sessionId } = req.body;

      // Check usage limits
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const usage = await storage.getUserUsage(userId);
      const limits = TIER_LIMITS[user.tier as keyof typeof TIER_LIMITS];
      
      if (limits.documents !== -1 && usage && usage.documentsUploaded >= limits.documents) {
        return res.status(403).json({ error: "Document limit exceeded" });
      }

      const fileName = req.file.originalname;
      const fileBuffer = req.file.buffer;
      const contentType = req.file.mimetype;

      // Upload to Supabase Storage
      const storagePath = `${userId}/${sessionId}/${Date.now()}-${fileName}`;
      await supabaseStorage.uploadFile('legal-documents', storagePath, fileBuffer, contentType);

      // Upload to OpenAI for analysis
      const openaiFileId = await openaiService.uploadFile(fileBuffer, fileName);

      // Save file record
      const file = await storage.createFile({
        userId,
        sessionId,
        fileName,
        fileSize: fileBuffer.length,
        fileType: contentType,
        storagePath,
        processed: true,
        metadata: { openaiFileId }
      });

      // Update usage
      await storage.incrementUsage(userId, 'documents');

      // Create system message
      await storage.createMessage({
        sessionId,
        type: "system",
        content: `Document uploaded: ${fileName} (${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB). Ready for legal analysis.`
      });

      res.json({ file });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Payment routes
  app.post("/api/payment/initialize", async (req, res) => {
    try {
      const { userId, plan } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const planConfig = TIER_PRICES[plan as keyof typeof TIER_PRICES];
      if (!planConfig) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      // In production, create Paystack transaction
      const paystackData = {
        email: user.email,
        amount: planConfig.amount,
        currency: 'NGN',
        plan: plan,
        callback_url: `${process.env.BASE_URL}/api/payment/callback`,
        metadata: {
          userId: user.id,
          plan: plan
        }
      };

      res.json({
        authorization_url: `https://checkout.paystack.com/pay/${Math.random().toString(36)}`,
        access_code: Math.random().toString(36),
        reference: `ref_${Date.now()}`
      });
    } catch (error) {
      console.error("Payment initialization error:", error);
      res.status(500).json({ error: "Failed to initialize payment" });
    }
  });

  app.post("/api/payment/callback", async (req, res) => {
    try {
      const { reference, userId, plan } = req.body;

      // Verify payment with Paystack (in production)
      // For now, simulate successful payment

      // Update user tier
      await storage.updateUser(userId, { tier: plan });

      // Create subscription record
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await storage.createSubscription({
        userId,
        tier: plan,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
        paystackSubscriptionCode: reference
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Payment callback error:", error);
      res.status(500).json({ error: "Payment verification failed" });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket
  initializeWebSocket(httpServer);

  return httpServer;
}
