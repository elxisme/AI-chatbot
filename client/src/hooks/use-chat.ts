import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatSession, Message, UploadedFile } from '@/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export const useChat = (userId: string | undefined) => {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch user sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/sessions', userId],
    enabled: !!userId,
  });

  // Fetch current session messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/sessions', currentSessionId, 'messages'],
    enabled: !!currentSessionId,
  });

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const response = await apiRequest('POST', '/api/sessions', { userId, name });
      return response.json();
    },
    onSuccess: (newSession: ChatSession) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', userId] });
      setCurrentSessionId(newSession.id);
      toast({
        title: "New Session Created",
        description: "Started a new legal consultation session",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create session",
        variant: "destructive",
      });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, threadId }: { content: string; threadId?: string }) => {
      if (!currentSessionId) throw new Error('No active session');
      
      const response = await apiRequest('POST', '/api/chat/message', {
        sessionId: currentSessionId,
        userId,
        content,
        threadId
      });
      return response.json();
    },
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', currentSessionId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user', userId] }); // Refresh usage
      setIsTyping(false);
    },
    onError: (error: any) => {
      setIsTyping(false);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!currentSessionId) throw new Error('No active session');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId!);
      formData.append('sessionId', currentSessionId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', currentSessionId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user', userId] }); // Refresh usage
      toast({
        title: "File Uploaded",
        description: "Document uploaded and ready for analysis",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    }
  });

  const createSession = (name: string) => {
    createSessionMutation.mutate({ name });
  };

  const sendMessage = (content: string, threadId?: string) => {
    sendMessageMutation.mutate({ content, threadId });
  };

  const uploadFile = (file: File) => {
    uploadFileMutation.mutate(file);
  };

  const switchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  // Initialize with welcome session if no sessions exist
  useEffect(() => {
    const sessionList = Array.isArray(sessions) ? sessions : [];
    if (sessionList.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessionList[0].id);
    } else if (sessionList.length === 0 && userId && !createSessionMutation.isPending) {
      createSession('Welcome to Nigerian Legal AI');
    }
  }, [sessions, currentSessionId, userId]);

  return {
    sessions: Array.isArray(sessions) ? sessions : [],
    messages: Array.isArray(messages) ? messages : [],
    currentSessionId,
    isTyping: isTyping || sendMessageMutation.isPending,
    sessionsLoading,
    messagesLoading,
    createSession,
    sendMessage,
    uploadFile,
    switchSession,
    isCreatingSession: createSessionMutation.isPending,
    isSendingMessage: sendMessageMutation.isPending,
    isUploadingFile: uploadFileMutation.isPending
  };
};
