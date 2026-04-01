import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Upload, FileJson, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CargaDatos() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const processFile = (selectedFile) => {
    setError('');
    setSuccess(false);
    
    if (selectedFile?.type !== 'application/json' && !selectedFile?.name.endsWith('.json')) {
      setError('Por favor, selecciona un archivo JSON válido.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        
        // Basic validation for the required structure
        if (!json.ventasConsumidorFinal || !json.ventasContribuyentes || !json.compras) {
          setError('El archivo JSON no tiene el formato requerido por la normativa de MH.');
          return;
        }

        // Save to localStorage to persist across views
        localStorage.setItem('contapp_data', JSON.stringify(json));
        setSuccess(true);
        
        setTimeout(() => {
          navigate('/libros-iva');
        }, 1500);
      } catch (err) {
        setError('El archivo está corrupto o no es un JSON válido.');
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="!mb-2 text-3xl font-bold tracking-tight">Carga de Datos</h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Sube el archivo JSON exportado con las transacciones del mes.
        </p>
      </div>

      <Card className="p-8">
        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300
            ${file && !error ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-neutral-300 dark:border-neutral-700 hover:border-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}
          `}
        >
          <input 
            type="file" 
            accept=".json,application/json" 
            className="hidden" 
            id="file-upload"
            onChange={handleFileChange}
          />
          
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-4">
            <div className={`p-4 rounded-full ${success ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
              {success ? <CheckCircle2 size={40} /> : <Upload size={40} />}
            </div>
            
            {file ? (
              <div className="space-y-1">
                <p className="font-semibold flex items-center gap-2 justify-center text-neutral-800 dark:text-neutral-200">
                  <FileJson size={18} /> {file.name}
                </p>
                <p className="text-sm text-neutral-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300">
                  Arrastra y suelta tu archivo aquí
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  o haz clic para explorar tus archivos (.json)
                </p>
              </div>
            )}
          </label>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start gap-3 text-green-700 dark:text-green-400">
            <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">¡Datos cargados con éxito!</p>
              <p className="text-xs mt-1">Redirigiendo a Libros de IVA...</p>
            </div>
          </div>
        )}
      </Card>
      
      <div className="text-sm text-neutral-500 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
        <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2">Formato JSON Requerido:</h4>
        <pre className="text-xs bg-white/50 dark:bg-neutral-900/50 p-3 rounded-lg overflow-x-auto text-neutral-700 dark:text-neutral-300">
{`{
  "ventasConsumidorFinal": [...],
  "ventasContribuyentes": [...],
  "compras": [...]
}`}
        </pre>
      </div>
    </div>
  );
}
