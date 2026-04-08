import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { Shield, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ nombre: '', email: '', password: '', rol: 'CONTADOR' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Validate superadmin
  if (user?.username !== 'creapxinnovacion@gmail.com') {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center animate-in fade-in zoom-in duration-500">
        <Shield size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">Acceso Restringido</h2>
        <p className="text-neutral-500 mt-2">Esta sección es exclusiva para el administrador principal de la agencia.</p>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('https://api-agente-contable.onrender.com/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password,
          rol: formData.rol
        })
      });

      if (!res.ok) {
        throw new Error("Error de endpoint / Permisos insuficientes al crear usuario.");
      }

      setSuccess('Usuario creado exitosamente. Ahora este usuario dispone de acceso a la plataforma.');
      setFormData({ nombre: '', email: '', password: '', rol: 'CONTADOR' });
    } catch (err) {
      setError(err.message || 'Error de conexión a la API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-neutral-800 dark:text-neutral-100">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl text-blue-600">
            <Shield size={28} />
          </div>
          Dashboard Admin
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">
          Gestión exclusiva de usuarios y accesos al sistema SaaS de Contabilidad.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Panel Formulario */}
        <Card className="md:col-span-2 p-8 shadow-sm border border-neutral-200 dark:border-neutral-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <UserPlus size={150} />
          </div>

          <h3 className="text-lg font-bold mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-3 relative z-10">Crear Nuevo Usuario</h3>

          <form onSubmit={handleRegister} className="space-y-5 relative z-10">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-neutral-700 dark:text-neutral-300">Nombre Completo</label>
              <input
                type="text"
                name="nombre"
                required
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej. Juan Pérez"
                className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-neutral-700 dark:text-neutral-300">Correo Electrónico (Login)</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ejemplo@correo.com"
                  className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-neutral-700 dark:text-neutral-300">Contraseña Inicial</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="********"
                  className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-neutral-700 dark:text-neutral-300">Rol Operativo</label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              >
                <option value="CONTADOR">CONTADOR (Rol de Agencia Estándar)</option>
                <option value="ADMIN">ADMINISTRADOR (Avanzado)</option>
              </select>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                {success}
              </div>
            )}

            <div className="pt-6 text-right">
              <Button type="submit" variant="primary" disabled={loading} className="w-full md:w-auto flex justify-center items-center gap-2 py-3 px-6 shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5">
                <UserPlus size={18} />
                {loading ? 'Interconectando...' : 'Registrar Cuenta'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Panel lateral descriptivo */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200 dark:border-blue-800/50">
            <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-3 text-lg">Acerca de este módulo</h4>
            <div className="space-y-4">
              <p className="text-sm text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                Este panel es invisible y bloqueado para contadores regulares. Solo <strong>creapxinnovacion@gmail.com</strong> puede acceder.
              </p>
              <p className="text-sm text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                Los usuarios registrados se sincronizan inmediatamente contra tu servicio de autenticación JWT. El acceso depende de que asocies manualmente a esos usuarios con las empresas en el respectivo Backend FastAPI.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
