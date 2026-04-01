import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth status on load (mock)
  useEffect(() => {
    const savedUser = localStorage.getItem('contapp_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    // Mock validation
    // Requirements: Just a login without DB
    if (username === 'admin' && password === 'admin') {
      const mockUser = { id: 1, name: 'Administrador', username: 'admin' };
      setUser(mockUser);
      localStorage.setItem('contapp_user', JSON.stringify(mockUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('contapp_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
        {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
