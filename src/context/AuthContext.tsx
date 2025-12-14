import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'magasin_users';
const SESSION_STORAGE_KEY = 'magasin_session';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const session = localStorage.getItem(SESSION_STORAGE_KEY);
    if (session) {
      try {
        const userData = JSON.parse(session);
        setUser(userData);
      } catch {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const getUsers = (): Record<string, { password: string; name: string }> => {
    const users = localStorage.getItem(USERS_STORAGE_KEY);
    return users ? JSON.parse(users) : {};
  };

  const saveUsers = (users: Record<string, { password: string; name: string }>) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  };

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const users = getUsers();
    const normalizedEmail = email.toLowerCase().trim();
    
    if (!users[normalizedEmail]) {
      return { error: 'No account found with this email' };
    }
    
    if (users[normalizedEmail].password !== password) {
      return { error: 'Incorrect password' };
    }

    const userData: User = {
      id: normalizedEmail,
      email: normalizedEmail,
      name: users[normalizedEmail].name,
    };

    setUser(userData);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userData));
    return { error: null };
  };

  const signup = async (email: string, password: string, name: string): Promise<{ error: string | null }> => {
    const users = getUsers();
    const normalizedEmail = email.toLowerCase().trim();
    
    if (users[normalizedEmail]) {
      return { error: 'An account with this email already exists' };
    }

    if (password.length < 6) {
      return { error: 'Password must be at least 6 characters' };
    }

    users[normalizedEmail] = { password, name: name.trim() };
    saveUsers(users);

    const userData: User = {
      id: normalizedEmail,
      email: normalizedEmail,
      name: name.trim(),
    };

    setUser(userData);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userData));
    return { error: null };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
