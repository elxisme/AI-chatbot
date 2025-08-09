import { useState, useEffect } from 'react';
import { User, UserUsage } from '@/types';
import { apiRequest } from '@/lib/queryClient';

interface AuthState {
  user: User | null;
  usage: UserUsage | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    usage: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    // Check for stored auth state
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setState(prev => ({ ...prev, user, loading: false }));
        // Fetch latest usage data
        fetchUserData(user.id);
      } catch (error) {
        localStorage.removeItem('user');
        setState(prev => ({ ...prev, loading: false }));
      }
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const response = await apiRequest('GET', `/api/user/${userId}`);
      const data = await response.json();
      setState(prev => ({ 
        ...prev, 
        user: data.user, 
        usage: data.usage,
        error: null 
      }));
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      const data = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        user: data.user, 
        usage: data.usage,
        loading: false 
      }));
      
      localStorage.setItem('user', JSON.stringify(data.user));
      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Login failed',
        loading: false 
      }));
      return false;
    }
  };

  const register = async (email: string, fullName: string, password: string): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiRequest('POST', '/api/auth/register', { 
        email, 
        fullName, 
        password 
      });
      const data = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        user: data.user,
        loading: false 
      }));
      
      localStorage.setItem('user', JSON.stringify(data.user));
      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Registration failed',
        loading: false 
      }));
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setState({
      user: null,
      usage: null,
      loading: false,
      error: null
    });
  };

  const refreshUserData = () => {
    if (state.user) {
      fetchUserData(state.user.id);
    }
  };

  return {
    ...state,
    login,
    register,
    logout,
    refreshUserData
  };
};
