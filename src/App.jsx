import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import CargaDatos from './pages/CargaDatos';
import LibrosIVA from './pages/LibrosIVA';
import Json from './pages/Json';
import Empresas from './pages/Empresas';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './components/Layout';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Rutas protegidas dentro de un Layout común */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Home />} />
        <Route path="empresas" element={<Empresas />} />
        <Route path="carga-datos" element={<CargaDatos />} />
        <Route path="conversor" element={<Json />} />
        <Route path="libros-iva" element={<LibrosIVA />} />
        <Route path="admin" element={<AdminDashboard />} />
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
