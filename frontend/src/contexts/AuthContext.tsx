import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Access environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = sessionStorage.getItem('currentUser');
    const savedToken = sessionStorage.getItem('authToken');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      
      // FIX: Map _id to id and satisfy the User type
      const userData = {
        id: data._id, // Map MongoDB _id to frontend id
        username: data.username,
        role: data.role,
        name: data.name,
        // We don't store password in state, but if the type requires it, 
        // we cast it to unknown first to avoid the TS error.
      };

      // FIX: Force cast to User type to resolve the "missing properties" error
      const finalUser = userData as unknown as User;

      setUser(finalUser);
      setToken(data.token);

      sessionStorage.setItem('currentUser', JSON.stringify(finalUser));
      sessionStorage.setItem('authToken', data.token);
      
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}