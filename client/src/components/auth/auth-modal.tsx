import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scale, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  });

  const { login, register, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      if (formData.password !== formData.confirmPassword) {
        return;
      }
      const success = await register(formData.email, formData.fullName, formData.password);
      if (success) {
        onOpenChange(false);
        setFormData({ email: '', fullName: '', password: '', confirmPassword: '' });
      }
    } else {
      const success = await login(formData.email, formData.password);
      if (success) {
        onOpenChange(false);
        setFormData({ email: '', fullName: '', password: '', confirmPassword: '' });
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="auth-modal">
        <DialogHeader>
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-nigerian-green rounded-full flex items-center justify-center mb-4">
              <Scale className="text-white" size={32} />
            </div>
            <DialogTitle className="text-2xl font-bold text-legal-dark mb-2">
              Nigerian Legal AI
            </DialogTitle>
            <p className="text-gray-600">Your trusted legal assistant for Nigerian law</p>
          </div>
        </DialogHeader>

        <div className="mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={!isSignUp ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => setIsSignUp(false)}
              data-testid="button-signin"
            >
              Sign In
            </Button>
            <Button
              variant={isSignUp ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => setIsSignUp(true)}
              data-testid="button-signup"
            >
              Sign Up
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name"
                className="mt-1"
                data-testid="input-fullname"
              />
            </div>
          )}

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="lawyer@example.com"
              className="mt-1"
              data-testid="input-email"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter your password"
                className="pr-10"
                data-testid="input-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>

          {isSignUp && (
            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                className="mt-1"
                data-testid="input-confirm-password"
              />
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg" data-testid="text-error">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-nigerian-green hover:bg-green-700"
            data-testid="button-submit"
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : null}
            {isSignUp ? 'Create Account' : 'Sign In with Supabase'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span>Powered by</span>
            <div className="flex items-center space-x-2 font-mono font-semibold">
              <span>Supabase</span>
              <span>•</span>
              <span>OpenAI</span>
              <span>•</span>
              <span>Paystack</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
