import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, UploadCloud, BookOpen, LogOut, LayoutDashboard, FileJson, Shield, Building2, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';

export default function Layout() {
  const { user, logout, switchEmpresa } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "Inicio" },
    { to: "/empresas", icon: <Building2 size={20} />, label: "Mis Empresas" },
    { 
      label: "Gestión JSON", 
      icon: <FileJson size={20} />, 
      isDropdown: true,
      subLinks: [
        { to: "/conversor", icon: <FileJson size={18} />, label: "Conversor DTE" },
        { to: "/carga-datos", icon: <UploadCloud size={18} />, label: "Carga de Datos" }
      ]
    },
    { to: "/libros-iva", icon: <BookOpen size={20} />, label: "Libros Contables" },
  ];

  if (user?.username === 'creapxinnovacion@gmail.com') {
    navLinks.push({
      to: "/admin",
      icon: <Shield size={20} />,
      label: "Admin Dashboard"
    });
  }

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
                Agente Contable
              </span>
            </div>

            {/* Navegación Principal */}
            <nav className="hidden md:flex gap-1 items-center">
              {navLinks.map((link, idx) => {
                if (link.isDropdown) {
                  return (
                    <div key={idx} className="relative group">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer">
                        {link.icon}
                        {link.label}
                        <ChevronDown size={16} className="group-hover:-rotate-180 transition-transform duration-300" />
                      </div>
                      
                      {/* Menú Desplegable */}
                      <div className="absolute left-0 mt-2 w-52 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl shadow-black/60 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
                        <div className="py-2 flex flex-col gap-1">
                          {link.subLinks.map((sub) => (
                            <NavLink
                              key={sub.to}
                              to={sub.to}
                              className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors mx-1 rounded-lg
                                ${isActive
                                  ? "bg-blue-600/30 text-blue-400"
                                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"}
                              `}
                            >
                              {sub.icon}
                              {sub.label}
                            </NavLink>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={link.to || idx}
                    to={link.to}
                    className={({ isActive }) => `
                      flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300
                      ${isActive
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-inner"
                        : "hover:bg-neutral-800 text-neutral-400 hover:text-white"}
                    `}
                  >
                    {link.icon}
                    {link.label}
                  </NavLink>
                );
              })}
            </nav>

            {/* Perfil y Salida */}
            <div className="flex items-center gap-4">

              {/* Selector dinámico de Empresas en sesión */}
              <div className="hidden sm:flex flex-col text-sm bg-neutral-800/80 rounded-lg p-1.5 px-3 border border-neutral-700 shadow-inner min-w-[170px]">
                <p className="font-medium text-neutral-400 text-[10px] uppercase tracking-wider mb-0.5" title="Listado de empresas asignadas bajo JWT">Empresa Activa</p>
                <div className="flex items-center gap-1.5 text-blue-400">
                  <Building2 size={14} className="shrink-0" />
                  <select
                    className="bg-transparent border-none text-white font-bold text-sm outline-none cursor-pointer w-full text-ellipsis overflow-hidden"
                    value={user?.empresaActiva?.nit || ''}
                    title={user?.empresaActiva?.nombre || 'General'}
                    onChange={(e) => {
                      // Simulación de switch, manteniendo id y alterando NIT para filtros
                      const newNit = e.target.value;
                      const selectedOptionText = e.target.options[e.target.selectedIndex].text;
                      switchEmpresa({
                        ...user.empresaActiva,
                        nit: newNit,
                        nombre: selectedOptionText
                      });
                    }}
                  >
                    <option className="text-black" value={user?.empresaActiva?.nit || ''}>
                      {user?.empresaActiva?.nombre || 'Seleccione Empresa...'}
                    </option>
                  </select>
                </div>
              </div>

              <div className="hidden lg:block text-sm text-right pl-3 border-l border-neutral-700">
                <p className="font-medium text-white">{user?.name}</p>
                <p className="text-blue-400 text-xs font-bold tracking-wide">{(user?.rol || 'CONTADOR').toUpperCase()}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="!p-2 text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 ml-2">
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
