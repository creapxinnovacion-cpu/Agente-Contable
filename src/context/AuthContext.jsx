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

  const login = async (username, password) => {
    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: username, password: password }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      
      // Decodificar JWT levemente si es necesario, o basarnos en un return propio
      // FastAPI está retornando solo access_token, podemos parsearlo.
      const token = data.access_token;
      
      // Para simular el estado actual basándonos en payload del token sin librería jsonwebtoken:
      const payloadBase64Url = token.split('.')[1];
      const payloadBase64 = payloadBase64Url.replace(/-/g, '+').replace(/_/, '/');
      const payload = JSON.parse(window.atob(payloadBase64));

      const finalUser = { 
        id: payload.sub, 
        name: payload.email, 
        username: payload.email,
        token: token,
        empresaActiva: {
          id: payload.empresaActiva,
          nit: payload.nitEmpresa // Ya validado desde backend
        }
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
