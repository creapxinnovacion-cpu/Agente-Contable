import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, UploadCloud, BookOpen, LogOut, LayoutDashboard, FileJson } from 'lucide-react';
import { Button } from './ui/Button';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "Inicio" },
    { to: "/conversor", icon: <FileJson size={20} />, label: "Conversor DTE" },
    { to: "/carga-datos", icon: <UploadCloud size={20} />, label: "Carga de Datos" },
    { to: "/libros-iva", icon: <BookOpen size={20} />, label: "Libros Contables" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-blue-500 font-sans text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      {/* Navbar Superior */}
      <header className="fixed top-0 w-full z-50 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
          <div className="flex justify-between items-center h-16 bg-black">

            {/* Logo y Marca */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 text-white p-2 rounded-xl shadow-lg shadow-blue-500/30">
                <Briefcase size={24} />
              </div>
              <span className="font-bold text-xl text-white">
                Agente Contable El Salvador
              </span>
            </div>

            {/* Navegación Principal */}
            <nav className="hidden md:flex gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `
                    flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300
                    ${isActive
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-inner"
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"}
                  `}
                >
                  {link.icon}
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Perfil y Salida */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-sm text-right">
                <p className="font-medium text-black">{user?.name}</p>
                <p className="text-neutral-500 dark:text-neutral-400 text-xs">Contador Activo</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="!p-2 text-rose-500 hover:text-rose-600">
                <LogOut size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Outlet />
      </main>
    </div>
  );
}
