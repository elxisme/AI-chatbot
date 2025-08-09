import { Message as MessageType } from '@/types';
import { Scale, User, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface MessageProps {
  message: MessageType;
  isTyping?: boolean;
}

export const Message = ({ message, isTyping }: MessageProps) => {
  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), 'p');
  };

  if (isTyping) {
    return (
      <div className="flex items-start space-x-3" data-testid="message-typing">
        <div className="w-8 h-8 bg-nigerian-green rounded-full flex items-center justify-center flex-shrink-0">
          <Scale className="text-white" size={16} />
        </div>
        <div className="flex-1">
          <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-4 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
              </div>
              <span className="text-sm text-gray-500">Nigerian Legal AI is analyzing...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';

  return (
    <div
      className={`flex items-start space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}
      data-testid={`message-${message.type}`}
    >
      {!isUser && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isSystem ? 'bg-blue-500' : 'bg-nigerian-green'
        }`}>
          {isSystem ? (
            <AlertTriangle className="text-white" size={16} />
          ) : (
            <Scale className="text-white" size={16} />
          )}
        </div>
      )}

      <div className={`flex-1 ${isUser ? 'max-w-2xl' : ''}`}>
        <div
          className={`rounded-2xl p-4 ${
            isUser
              ? 'bg-nigerian-green text-white rounded-tr-sm ml-12'
              : isSystem
              ? 'bg-blue-50 border border-blue-200 text-blue-900 rounded-tl-sm'
              : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm shadow-sm'
          }`}
        >
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
          
          {!isUser && !isSystem && message.content.includes('Disclaimer') === false && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <AlertTriangle className="inline mr-1" size={14} />
              <strong>Disclaimer:</strong> This AI provides general legal information. Always consult with qualified Nigerian legal counsel for specific legal matters.
            </div>
          )}
        </div>

        <div className={`flex items-center justify-between mt-2 text-xs text-gray-500 ${
          isUser ? 'flex-row-reverse' : ''
        }`}>
          <span>{isUser ? 'You' : isSystem ? 'System' : 'Nigerian Legal AI'}</span>
          <span>{formatTime(message.createdAt)}</span>
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="text-white" size={16} />
        </div>
      )}
    </div>
  );
};
