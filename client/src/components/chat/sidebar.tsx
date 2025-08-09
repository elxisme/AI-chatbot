import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Scale, 
  Plus, 
  User, 
  LogOut, 
  Crown,
  FileCheck,
  BookOpen,
  FileText,
  Shield,
  Settings
} from 'lucide-react';
import { ChatSession, User as UserType, UserUsage, TIER_LIMITS } from '@/types';
import { UpgradeModal } from '../upgrade/upgrade-modal';

interface SidebarProps {
  user: UserType;
  usage: UserUsage | null;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onCreateSession: () => void;
  onSwitchSession: (sessionId: string) => void;
  onLogout: () => void;
  onQuickAction: (prompt: string) => void;
}

export const Sidebar = ({
  user,
  usage,
  sessions,
  currentSessionId,
  onCreateSession,
  onSwitchSession,
  onLogout,
  onQuickAction
}: SidebarProps) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const tierLimits = TIER_LIMITS[user.tier];
  const tierConfig = {
    free: { name: 'FREE', color: 'bg-gray-200 text-gray-700' },
    pro: { name: 'PRO', color: 'bg-blue-200 text-blue-700' },
    premium: { name: 'PREMIUM', color: 'bg-gold text-black' }
  };

  const quickActions = [
    {
      title: "Contract Review",
      prompt: "Please help me review this contract for compliance with Nigerian contract law and identify any potential issues or clauses that need attention.",
      icon: FileCheck
    },
    {
      title: "Legal Research", 
      prompt: "I need help researching Nigerian case law and statutes related to my legal matter. Can you guide me through the relevant legal precedents?",
      icon: BookOpen
    },
    {
      title: "Document Drafting",
      prompt: "I need assistance drafting a legal document that complies with Nigerian legal requirements. Can you help me with the structure and key clauses?",
      icon: FileText
    },
    {
      title: "Compliance Check",
      prompt: "Please help me ensure my business practices comply with current Nigerian regulations and legal requirements.",
      icon: Shield
    }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  return (
    <>
      <div className="w-80 bg-legal-dark text-white flex flex-col h-screen" data-testid="sidebar">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-nigerian-green rounded-full flex items-center justify-center">
              <Scale className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg">Nigerian Legal AI</h1>
              <p className="text-xs text-gray-400">Legal Assistant</p>
            </div>
            <Button
              onClick={onCreateSession}
              size="sm"
              className="ml-auto bg-nigerian-green hover:bg-green-700 text-white"
              title="New Consultation"
              data-testid="button-new-session"
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>

        {/* User Info & Usage */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate" data-testid="text-user-name">
                {user.fullName}
              </p>
              <p className="text-xs text-gray-400 truncate" data-testid="text-user-email">
                {user.email}
              </p>
            </div>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${tierConfig[user.tier].color}`}>
              <Crown size={12} />
              <span className="text-xs font-medium" data-testid="text-user-tier">
                {tierConfig[user.tier].name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-gray-400 hover:text-red-400 p-1"
              title="Logout"
              data-testid="button-logout"
            >
              <LogOut size={16} />
            </Button>
          </div>

          {/* Usage Stats */}
          {usage && (
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">Messages Used</span>
                <span className="text-xs font-medium" data-testid="text-messages-usage">
                  {tierLimits.messages === -1 ? 
                    `${usage.messagesUsed} messages` :
                    `${usage.messagesUsed}/${tierLimits.messages}`
                  }
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-nigerian-green h-1.5 rounded-full" 
                  style={{ width: `${getUsagePercentage(usage.messagesUsed, tierLimits.messages)}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center mt-2 mb-2">
                <span className="text-xs text-gray-400">Documents Analyzed</span>
                <span className="text-xs font-medium" data-testid="text-documents-usage">
                  {tierLimits.documents === -1 ? 
                    `${usage.documentsUploaded} documents` :
                    `${usage.documentsUploaded}/${tierLimits.documents}`
                  }
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-gold h-1.5 rounded-full" 
                  style={{ width: `${getUsagePercentage(usage.documentsUploaded, tierLimits.documents)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold mb-3 text-gray-300">Quick Actions</h3>
          <div className="space-y-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                onClick={() => onQuickAction(action.prompt)}
                className="w-full justify-start text-left p-2 rounded-lg hover:bg-gray-700 transition-colors text-white"
                data-testid={`button-quick-action-${index}`}
              >
                <action.icon className="text-nigerian-green mr-2" size={16} />
                <span className="text-sm">{action.title}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Sessions */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300">Chat Sessions</h3>
          </div>

          <div className="space-y-2">
            {sessions.map((session) => (
              <Button
                key={session.id}
                variant="ghost"
                onClick={() => onSwitchSession(session.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  session.id === currentSessionId
                    ? 'bg-gray-700 border-l-2 border-nigerian-green text-white'
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
                data-testid={`button-session-${session.id}`}
              >
                <div className="w-full">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium truncate pr-2">{session.name}</h4>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatDate(session.updatedAt)}
                    </span>
                  </div>
                </div>
              </Button>
            ))}

            {sessions.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">No chat sessions yet</p>
                <p className="text-xs">Click + to start a new consultation</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-700">
          <div className="space-y-2">
            <Button
              variant="ghost"
              onClick={() => setShowUpgradeModal(true)}
              className="w-full justify-start text-left p-2 rounded-lg hover:bg-gray-700 transition-colors text-white"
              data-testid="button-upgrade"
            >
              <Crown className="text-gold mr-2" size={16} />
              <span className="text-sm">Upgrade Plan</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-left p-2 rounded-lg hover:bg-gray-700 transition-colors text-white"
              data-testid="button-settings"
            >
              <Settings className="text-gray-400 mr-2" size={16} />
              <span className="text-sm">Settings</span>
            </Button>
          </div>
        </div>
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        userId={user.id}
        currentTier={user.tier}
      />
    </>
  );
};
