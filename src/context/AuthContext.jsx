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
  //validacion de credenciales de los usuarios para el ingreso a la platarform
  const login = async (username, password) => {
    try {
      const response = await fetch('https://api-agente-contable.onrender.com/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: username,
          password: password
        })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();

      // 🔥 AHORA tu API devuelve JWT, no "datos"
      const finalUser = {
        username: username,
        token: data.access_token,
      };

      setUser(finalUser);
      localStorage.setItem('contapp_user', JSON.stringify(finalUser));

      return true;

    } catch (error) {
      console.error("Error al comunicarse con la API de Login:", error);
      return false;
    }
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
