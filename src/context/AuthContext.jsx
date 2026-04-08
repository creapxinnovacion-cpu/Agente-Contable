import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth status on load (mock)
  useEffect(() => {
    const checkAuth = async () => {
      const savedUser = localStorage.getItem('contapp_user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        // Intentar recargar las empresas en background
        await fetchUserEmpresas(parsedUser);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const fetchUserEmpresas = async (currentUser) => {
    try {
      // Usar el nuevo endpoint provisto: /usuario-empresas/list
      const res = await fetch(`https://api-agente-contable.onrender.com/usuario-empresas/list`, {
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        console.log("Datos del endpoint List:", data);
        
        // El listado puede contener todo, filtramos únicamente para el usuario actual
        // usando String() para prevenir que "1" !== 1 
        const misEmpresasArr = data
          .filter(item => String(item.usuario_id) === String(currentUser.id))
          .map(item => ({
            id: item.empresa_id,
            nombre_razon_social: item.nombre_razon_social,
            nombre: item.nombre_razon_social, // Duplicar en 'nombre' para compatibilidad
            nit: item.nit
        }));
        
        console.log("Empresas filtradas para el dashboard:", misEmpresasArr);

        if (misEmpresasArr.length > 0) {
          const updatedUser = { 
            ...currentUser, 
            empresas: misEmpresasArr,
            empresaActiva: currentUser.empresaActiva?.nombre ? currentUser.empresaActiva : misEmpresasArr[0] 
          };
          setUser(updatedUser);
          localStorage.setItem('contapp_user', JSON.stringify(updatedUser));
        }
      }
    } catch (e) {
      console.log('Error recargando empresas:', e);
    }
  };
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
          nombre: payload.nombre_razon_social || payload.nombre || ""
        },
        empresas: [] // Se poblará con fetchUserEmpresas
      };

      setUser(finalUser);
      localStorage.setItem('contapp_user', JSON.stringify(finalUser));
      
      // Llamamos asíncronamente para cargar el dropdown de las empresas vinculadas
      fetchUserEmpresas(finalUser);

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

  const switchEmpresa = (nuevaEmpresaActiva) => {
    if (user) {
      const updatedUser = {
        ...user,
        empresaActiva: nuevaEmpresaActiva
      };
      setUser(updatedUser);
      localStorage.setItem('contapp_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, switchEmpresa }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
