import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Upload, 
  Download, 
  Trash2, 
  Send, 
  Paperclip, 
  Mic,
  X,
  FileText,
  Scale,
  AlertTriangle
} from 'lucide-react';
import { Message } from './message';
import { Message as MessageType, UploadedFile } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ChatAreaProps {
  messages: MessageType[];
  isTyping: boolean;
  onSendMessage: (content: string) => void;
  onUploadFile: (file: File) => void;
  currentSessionName?: string;
  uploadedFiles?: UploadedFile[];
  canSendMessage?: boolean;
  canUploadDocument?: boolean;
}

export const ChatArea = ({
  messages,
  isTyping,
  onSendMessage,
  onUploadFile,
  currentSessionName,
  uploadedFiles = [],
  canSendMessage = true,
  canUploadDocument = true
}: ChatAreaProps) => {
  const [inputMessage, setInputMessage] = useState('');
  const [showUploadedFiles, setShowUploadedFiles] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (uploadedFiles.length > 0) {
      setShowUploadedFiles(true);
    }
  }, [uploadedFiles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !canSendMessage) {
      if (!canSendMessage) {
        toast({
          title: "Message Limit Reached",
          description: "Please upgrade your plan to continue messaging",
          variant: "destructive"
        });
      }
      return;
    }

    onSendMessage(inputMessage.trim());
    setInputMessage('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !canUploadDocument) {
      if (!canUploadDocument) {
        toast({
          title: "Document Limit Reached",
          description: "Please upgrade your plan to upload more documents",
          variant: "destructive"
        });
      }
      return;
    }

    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: `${file.name} is too large. Maximum size is 10MB.`,
          variant: "destructive"
        });
        return;
      }

      onUploadFile(file);
    });

    // Reset file input
    e.target.value = '';
  };

  const autoResizeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    setInputMessage(textarea.value);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white" data-testid="chat-header">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-nigerian-green rounded-full flex items-center justify-center">
            <Settings className="text-white" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-legal-dark" data-testid="text-session-name">
              {currentSessionName || 'Nigerian Legal AI Assistant'}
            </h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-500">Online • OpenAI GPT-4 Powered</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canUploadDocument}
            title="Upload Documents"
            data-testid="button-upload"
          >
            <Upload size={16} />
          </Button>
          <Button variant="ghost" size="sm" title="Export Chat" data-testid="button-export">
            <Download size={16} />
          </Button>
          <Button variant="ghost" size="sm" title="Clear Chat" data-testid="button-clear">
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* Uploaded Files Banner */}
      {showUploadedFiles && uploadedFiles.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 p-4" data-testid="uploaded-files-banner">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Uploaded Files</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUploadedFiles(false)}
              className="text-blue-600 hover:text-blue-800"
              data-testid="button-hide-files"
            >
              <X size={16} />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="bg-white border border-blue-200 rounded-lg px-3 py-2 flex items-center space-x-2"
                data-testid={`file-${file.id}`}
              >
                <FileText className="text-blue-600" size={16} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900 truncate">{file.fileName}</p>
                  <p className="text-xs text-blue-600">
                    {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                    {file.processed && ' • Analyzed'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 custom-scrollbar" data-testid="messages-area">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Scale className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-lg font-medium">Welcome to Nigerian Legal AI</p>
              <p className="text-sm">Start a conversation about Nigerian legal matters</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}

        {isTyping && <Message message={{} as MessageType} isTyping />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white" data-testid="input-area">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canUploadDocument}
            className="text-gray-500 hover:text-nigerian-green"
            title="Upload Document"
            data-testid="button-upload-input"
          >
            <Paperclip size={20} />
          </Button>

          <div className="flex-1">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={autoResizeTextarea}
                onKeyDown={handleKeyDown}
                placeholder="Ask about Nigerian legal matters, upload documents for analysis..."
                className="resize-none min-h-[3rem] max-h-[150px] pr-12 border-gray-300 focus:ring-nigerian-green focus:border-nigerian-green"
                disabled={!canSendMessage}
                data-testid="textarea-message"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-3 bottom-3 p-1 text-gray-400 hover:text-nigerian-green"
                title="Voice Input"
                data-testid="button-voice"
              >
                <Mic size={16} />
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={!inputMessage.trim() || isTyping || !canSendMessage}
            className="bg-nigerian-green hover:bg-green-700 text-white p-3 rounded-2xl"
            data-testid="button-send"
          >
            <Send size={20} />
          </Button>
        </form>

        {!canSendMessage && (
          <div className="mt-2 text-center">
            <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
              <AlertTriangle className="inline mr-1" size={12} />
              Message limit reached. Upgrade to continue.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
