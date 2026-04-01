import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Briefcase, Lock } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network delay for premium feel
    setTimeout(() => {
      const success = login(username, password);
      if (success) {
        navigate('/');
      } else {
        setError('Credenciales inválidas. Usa admin/admin');
      }
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-indigo-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-rose-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 text-white p-4 rounded-2xl shadow-xl shadow-blue-500/40 transform hover:scale-105 transition-transform duration-300">
            <Briefcase size={40} />
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Bienvenido
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
          Inicia sesión en el Agente Contable SV
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Card className="!p-8 sm:rounded-2xl border border-white/40 dark:border-neutral-800 backdrop-blur-xl bg-white/60 dark:bg-neutral-900/60">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Usuario"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej. admin"
              autoComplete="username"
            />
            
            <Input
              label="Contraseña"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full flex justify-center py-3"
              disabled={isLoading || !username || !password}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock size={18} />
                  Ingresar al Sistema
                </span>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-500">
            * Versión demo. Usa <b>admin</b> / <b>admin</b>
          </div>
        </Card>
      </div>
    </div>
  );
}
