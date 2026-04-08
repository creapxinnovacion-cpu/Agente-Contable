import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { Building, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Empresas() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nombre_razon_social: '',
    nit: '',
    correo: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [empresas, setEmpresas] = useState([]);

  // Fetch empresas - Inicializado temporalmente con la empresa activa
  useEffect(() => {
    if (user?.empresaActiva) {
      setEmpresas([user.empresaActiva]);
    }
    if (user?.empresas && user.empresas.length > 0) {
      setEmpresas(user.empresas);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // POST al endpoint de backend local para Empresas (Ajustar IP/dominio si hace falta)
      const res = await fetch('https://api-agente-contable.onrender.com/empresas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          nombre_razon_social: formData.nombre_razon_social,
          nit: formData.nit,
          correo: formData.correo,
          // La clave para mantener la integridad (Ref al ID de nuestro contador)
          usuario_id: user.id
        })
      });

      if (!res.ok) {
        throw new Error('Error al registrar la empresa. Verifica permisos, CORS o si el NIT ya está siendo utilizado.');
      }

      const data = await res.json();

      setSuccess('Compañía creada e integridad vinculada a tu cuenta con éxito.');
      setFormData({ nombre_razon_social: '', nit: '', correo: '' });

      if (data) {
        setEmpresas(prev => [...prev, data]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-neutral-800 dark:text-neutral-100">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-xl text-indigo-600">
            <Building size={28} />
          </div>
          Registro de Corporaciones
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">
          Agrega nuevos contribuyentes/empresas a tu catálogo. Las llaves foráneas formarán la interrelación directamente a tu identificador de cuenta (ID: {user?.id}).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-8">
        <Card className="lg:col-span-3 p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <Building size={160} />
          </div>

          <h3 className="text-lg font-bold mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-3 relative z-10">
            Nueva Empresa
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div>
              <label className="block text-sm font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                Nombre de Razón Social
              </label>
              <input
                type="text"
                name="nombre_razon_social"
                required
                value={formData.nombre_razon_social}
                onChange={handleChange}
                placeholder="Ej. Comercializadora SV S.A."
                className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                  NIT (Sin guiones)
                </label>
                <input
                  type="text"
                  name="nit"
                  required
                  value={formData.nit}
                  onChange={handleChange}
                  placeholder="06141234561234..."
                  className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                  Dirección de Email
                </label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  placeholder="gerencia@empresa.com"
                  className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 border border-red-200 dark:border-red-800 text-sm rounded-xl flex items-start gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={20} className="shrink-0" /> {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl flex items-start gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 size={20} className="shrink-0" /> {success}
              </div>
            )}

            <div className="pt-4 overflow-hidden">
              <Button type="submit" variant="primary" disabled={loading} className="w-full sm:w-auto px-6 py-3 font-semibold justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 border-none shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-transform">
                <PlusCircle size={20} />
                {loading ? 'Generando Vínculo...' : 'Insertar Empresa'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="lg:col-span-2 p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm bg-indigo-50/50 dark:bg-indigo-900/10">
          <h3 className="text-lg font-bold mb-4 border-b border-indigo-200 dark:border-indigo-800 pb-2">
            Control de Acceso Físico
          </h3>

          <div className="space-y-4">
            {empresas.map((emp, idx) => (
              <div key={idx} className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex items-center justify-between group hover:border-indigo-400 focus:border-indigo-400 transition-colors">
                <div className="overflow-hidden">
                  <h4 className="font-bold text-neutral-800 dark:text-neutral-200 truncate">{emp.nombre || emp.nombre_razon_social || 'Compañía Desconocida'}</h4>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">NIT: {emp.nit}</p>
                </div>
                <div className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-extrabold px-2 py-1 rounded-md shrink-0">
                  BINDED
                </div>
              </div>
            ))}
            {empresas.length === 0 && (
              <div className="text-sm text-neutral-500 text-center py-6 bg-white/50 dark:bg-neutral-900/50 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700">
                Aun no estás interconectado a ninguna base de empresa.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
