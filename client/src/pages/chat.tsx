import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/chat/sidebar';
import { ChatArea } from '@/components/chat/chat-area';
import { useAuth } from '@/hooks/use-auth';
import { useChat } from '@/hooks/use-chat';
import { useWebSocket } from '@/hooks/use-websocket';
import { TIER_LIMITS } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function Chat() {
  const { user, usage, refreshUserData } = useAuth();
  const { 
    sessions, 
    messages, 
    currentSessionId, 
    isTyping,
    createSession, 
    sendMessage, 
    uploadFile, 
    switchSession 
  } = useChat(user?.id);

  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const { toast } = useToast();

  // WebSocket for real-time features
  const { connected, sendTyping } = useWebSocket({
    userId: user?.id,
    sessionId: currentSessionId || undefined,
    onTyping: (isTyping, userId) => {
      if (userId !== user?.id) {
        setOtherUserTyping(isTyping);
      }
    }
  });

  const handleSendMessage = (content: string) => {
    if (!canSendMessage()) {
      toast({
        title: "Message Limit Reached",
        description: "Please upgrade your plan to continue messaging",
        variant: "destructive"
      });
      return;
    }

    // Get the last assistant message's threadId for continuity
    const messageList = Array.isArray(messages) ? messages : [];
    const lastAssistantMessage = messageList
      .filter((m: any) => m.type === 'assistant')
      .pop();
    
    const threadId = lastAssistantMessage?.metadata?.threadId;
    
    sendMessage(content, threadId);
    refreshUserData(); // Update usage after sending
  };

  const handleUploadFile = (file: File) => {
    if (!canUploadDocument()) {
      toast({
        title: "Document Limit Reached", 
        description: "Please upgrade your plan to upload more documents",
        variant: "destructive"
      });
      return;
    }

    uploadFile(file);
    refreshUserData(); // Update usage after upload
  };

  const handleQuickAction = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleLogout = () => {
    // Clear any local state and redirect to auth
    window.location.reload();
  };

  const handleCreateSession = () => {
    const sessionName = `Legal Consultation ${new Date().toLocaleDateString()}`;
    createSession(sessionName);
  };

  // Check if user can send messages based on tier limits
  const canSendMessage = (): boolean => {
    if (!user || !usage) return false;
    const limits = TIER_LIMITS[user.tier];
    return limits.messages === -1 || usage.messagesUsed < limits.messages;
  };

  // Check if user can upload documents based on tier limits
  const canUploadDocument = (): boolean => {
    if (!user || !usage) return false;
    const limits = TIER_LIMITS[user.tier];
    return limits.documents === -1 || usage.documentsUploaded < limits.documents;
  };

  const sessionList = Array.isArray(sessions) ? sessions : [];
  const currentSession = sessionList.find((s: any) => s.id === currentSessionId);

  if (!user) {
    return null; // Auth component will handle this
  }

  return (
    <div className="flex h-screen bg-white" data-testid="chat-page">
      <Sidebar
        user={user}
        usage={usage}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onCreateSession={handleCreateSession}
        onSwitchSession={switchSession}
        onLogout={handleLogout}
        onQuickAction={handleQuickAction}
      />

      <ChatArea
        messages={messages}
        isTyping={isTyping || otherUserTyping}
        onSendMessage={handleSendMessage}
        onUploadFile={handleUploadFile}
        currentSessionName={currentSession?.name}
        canSendMessage={canSendMessage()}
        canUploadDocument={canUploadDocument()}
      />

      {/* Connection status indicator */}
      {!connected && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-3 py-2 rounded-lg text-sm">
          Reconnecting...
        </div>
      )}
    </div>
  );
}
