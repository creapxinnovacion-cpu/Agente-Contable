import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  Activity
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  const stats = [
    { name: 'Ventas a Consumidor Final', value: '$84,500.00', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/1' },
    { name: 'Ventas con Crédito Fiscal', value: '$120,000.00', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { name: 'Total Compras', value: '$45,200.00', icon: ShoppingCart, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { name: 'IVA por Pagar (Estimado)', value: '$20,709.00', icon: DollarSign, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="!margin-0 !mt-0 !mb-2 text-3xl font-bold tracking-tight">Panel de Control</h1>
          <p className="text-black ">
            ¡Hola, {user?.name}! Resumen mensual según normativa de El Salvador.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ">
        {stats.map((stat, idx) => (
          <Card key={idx} className="flex items-center gap-4 hover:shadow-2xl border-2  hover:-tranneutral-y-1 transition-all duration-300 cursor-default">
            <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 truncate">
                {stat.name}
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                {stat.value}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={120} className="text-blue-500" />
          </div>
          <h3 className="text-lg font-bold mb-4">Actividad Reciente</h3>
          <div className="space-y-4 relative z-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="text-sm font-medium">Libro de Ventas actualizado</p>
                    <p className="text-xs text-neutral-500">Importación JSON completada - Hoy 10:45 AM</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 rounded-full">
                  Exitoso
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white border-0">
          <h3 className="text-lg font-bold mb-2">Recordatorio Físico</h3>
          <p className="text-indigo-200 text-sm mb-6">
            La declaración del Formulario F-07 (IVA) debe presentarse en los primeros 10 días hábiles de cada mes.
          </p>
          <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20">
            <p className="text-xs font-medium text-indigo-300 uppercase tracking-wider mb-1">Días Restantes</p>
            <p className="text-4xl font-extrabold">5 días</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
