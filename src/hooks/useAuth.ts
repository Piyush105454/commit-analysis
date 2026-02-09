import { useState, useEffect } from 'react';
import { authAPI } from '@/services/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  name: string;
  createdAt: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await authAPI.getCurrentUser();
        if (response.success) {
          setUser(response.user);
        } else {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      } catch (err: unknown) {
        console.error('Auth check error:', err);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/auth/login';
  };

  return { user, loading, error, logout };
};