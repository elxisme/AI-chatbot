import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Zap, Check, X, Loader2 } from 'lucide-react';
import { TIER_PRICES } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentTier: string;
}

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export const UpgradeModal = ({ open, onOpenChange, userId, currentTier }: UpgradeModalProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleUpgrade = async (plan: string) => {
    setLoading(plan);
    
    try {
      const response = await apiRequest('POST', '/api/payment/initialize', {
        userId,
        plan
      });
      const data = await response.json();

      // Initialize Paystack payment
      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: 'user@example.com', // Will be replaced with actual user email
        amount: TIER_PRICES[plan].amount,
        currency: 'NGN',
        ref: data.reference,
        callback: function(response: any) {
          toast({
            title: "Payment Successful",
            description: `Successfully upgraded to ${plan.toUpperCase()} plan!`,
          });
          onOpenChange(false);
          // Trigger page refresh to update user data
          window.location.reload();
        },
        onClose: function() {
          setLoading(null);
        }
      });

      handler.openIframe();
    } catch (error: any) {
      setLoading(null);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '₦0',
      period: 'per month',
      features: [
        '20 AI messages per month',
        '3 document uploads',
        'Basic legal research',
        'Nigerian law database access'
      ],
      disabled: true,
      current: currentTier === 'free'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '₦5,000',
      period: 'per month',
      popular: true,
      features: [
        '500 AI messages per month',
        '50 document uploads',
        'Advanced legal research',
        'Contract analysis & drafting',
        'Priority support',
        'Export capabilities'
      ],
      current: currentTier === 'pro'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '₦50,000',
      period: 'per month',
      features: [
        'Unlimited AI messages',
        'Unlimited document uploads',
        'Advanced AI legal research',
        'Custom legal templates',
        '24/7 priority support',
        'API access',
        'White-label options'
      ],
      current: currentTier === 'premium'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="upgrade-modal">
        <DialogHeader>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="text-white text-2xl" />
            </div>
            <DialogTitle className="text-3xl font-bold text-legal-dark mb-2">
              Upgrade Your Plan
            </DialogTitle>
            <p className="text-gray-600">Choose the perfect plan for your legal practice</p>
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative border rounded-xl p-6 ${
                plan.popular
                  ? 'border-2 border-nigerian-green bg-green-50'
                  : plan.id === 'premium'
                  ? 'border-gold bg-yellow-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
              data-testid={`plan-${plan.id}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-nigerian-green text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-2">
                  {plan.id === 'pro' && <Zap className="text-nigerian-green" size={32} />}
                  {plan.id === 'premium' && <Crown className="text-gold" size={32} />}
                </div>
                <h3 className="text-xl font-bold text-legal-dark mb-2">{plan.name}</h3>
                <div className={`text-3xl font-bold ${
                  plan.popular ? 'text-nigerian-green' : 
                  plan.id === 'premium' ? 'text-gold' : 'text-legal-dark'
                }`}>
                  {plan.price}
                </div>
                <p className="text-gray-600 text-sm">{plan.period}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <Check className={`mr-3 flex-shrink-0 ${
                      plan.popular ? 'text-nigerian-green' :
                      plan.id === 'premium' ? 'text-gold' : 'text-green-500'
                    }`} size={16} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleUpgrade(plan.id)}
                disabled={plan.disabled || plan.current || loading === plan.id}
                className={`w-full ${
                  plan.current
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : plan.popular
                    ? 'bg-nigerian-green hover:bg-green-700 text-white'
                    : plan.id === 'premium'
                    ? 'bg-gold hover:bg-yellow-600 text-white'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
                data-testid={`button-upgrade-${plan.id}`}
              >
                {loading === plan.id ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : null}
                {plan.current ? 'Current Plan' : 
                 plan.disabled ? 'Current Plan' :
                 `Upgrade to ${plan.name}`}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-gray-500 mb-6">
          <p>All plans include access to Nigerian legal database and compliance checking</p>
          <p>Secure payments powered by <strong>Paystack</strong> • Cancel anytime</p>
        </div>

        <Button
          variant="ghost"
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 p-2"
          data-testid="button-close-upgrade"
        >
          <X size={20} />
        </Button>
      </DialogContent>
    </Dialog>
  );
};
