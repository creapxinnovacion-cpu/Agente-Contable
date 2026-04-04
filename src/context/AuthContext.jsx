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

      // 🔥 AHORA tu API devuelve JWT, extraemos el payload para obtener el NIT y el Rol
      const token = data.access_token;
      let payload = {};
      
      try {
        // Obtenemos la segunda parte del token (el payload)
        const payloadBase64Url = token.split('.')[1];
        const payloadBase64 = payloadBase64Url.replace(/-/g, '+').replace(/_/, '/');
        // Usamos atob y charcodes para no tener problemas con tildes o caracteres especiales en UTF-8
        const jsonPayload = decodeURIComponent(atob(payloadBase64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        payload = JSON.parse(jsonPayload);
      } catch(e) {
        console.error("Error al decodificar JWT Payload en el front:", e);
      }

      const finalUser = {
        id: payload.sub || payload.usuario_id || 1,
        name: payload.nombre || username,
        username: username,
        token: token,
        rol: payload.rol || (payload.is_admin ? 'ADMIN' : 'CONTADOR'),
        empresaActiva: {
          id: payload.empresa_id || payload.empresaActiva || 1,
          nit: payload.nit || payload.nitEmpresa || "", // Elemento clave para detectar Ventas vs Compras
          nombre: payload.nombre_razon_social || ""
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
