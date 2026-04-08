import { useState } from "react";
import { 
  mapToConsumidorFinal, 
  mapToContribuyentes, 
  mapToCompras,
  detectarTipoDTE
} from "../data/utilsJson";
import { useAuth } from "../context/AuthContext";

export default function Json() {
  const { user } = useAuth();
  const miNit = user?.empresaActiva?.nit || "";
  const miNombre = user?.empresaActiva?.nombre || "";

  const [data, setData] = useState({
    ventasConsumidorFinal: [],
    ventasContribuyentes: [],
    compras: []
  });
  
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    setLogs(prev => [...prev, msg]);
  };

  /* =========================
     Lectura de archivos
  ========================= */

  const handleFiles = (files) => {
    let pending = files.length;
    
    // Contenedores temporales para este lote
    const batch = {
      ventasConsumidorFinal: [],
      ventasContribuyentes: [],
      compras: []
    };

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          
          // Detectar automáticamente el tipo de documento para clasificarlo
          const tipo = detectarTipoDTE(json, miNit, miNombre);
          
          if (tipo === 'consumidor_final') {
            batch.ventasConsumidorFinal.push(mapToConsumidorFinal(json));
          } else if (tipo === 'contribuyente') {
            batch.ventasContribuyentes.push(mapToContribuyentes(json));
          } else if (tipo === 'compra') {
            batch.compras.push(mapToCompras(json));
          } else {
            addLog(`❌ Archivo ignorado (no reconocido): ${file.name}`);
          }
          
        } catch (err) {
          addLog(`❌ Error leyendo archivo JSON: ${file.name}`);
        } finally {
          pending--;
          if (pending === 0) {
            // Unir lote con el estado actual
            setData(prev => ({
              ventasConsumidorFinal: [...prev.ventasConsumidorFinal, ...batch.ventasConsumidorFinal],
              ventasContribuyentes: [...prev.ventasContribuyentes, ...batch.ventasContribuyentes],
              compras: [...prev.compras, ...batch.compras]
            }));
            addLog(`✅ Lote procesado con éxito. Se añadieron ${files.length} archivos.`);
          }
        }
      };
      reader.readAsText(file);
    });
  };

  /* =========================
     Exportar el JSON Final
  ========================= */

  const exportarJSONFinal = () => {
    if (!data.ventasConsumidorFinal.length && !data.ventasContribuyentes.length && !data.compras.length) {
      return alert("No hay datos cargados para exportar.");
    }

    const dataString = JSON.stringify(data, null, 2);
    const blob = new Blob([dataString], { type: "application/json" });
    
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `libros_iva_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    
    addLog("📥 Archivo JSON final descargado. ¡Listo para ir a la pestaña 'Carga De Datos'!");
  };

  /* =========================
     Render
  ========================= */

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <main className="flex-1 max-w-5xl mx-auto p-6 w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-neutral-800 dark:text-neutral-100">
            Conversor de DTEs a Formato Sistema IVA
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Sube los DTEs (en formato JSON estructurado original) y este conversor generará un único archivo consolidado para la sección "Carga de Datos".
          </p>
        </div>

        {/* Drop zone */}
        <div
          className="border-2 border-dashed border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 rounded-xl p-10 text-center cursor-pointer hover:border-blue-500 transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles([...e.dataTransfer.files]);
          }}
        >
          <input
            type="file"
            accept=".json"
            multiple
            className="hidden"
            id="file"
            onChange={(e) => handleFiles([...e.target.files])}
          />
          <label htmlFor="file" className="cursor-pointer text-neutral-700 dark:text-neutral-300 block">
            <span className="text-4xl block mb-4">📂</span>
            Arrastra tus archivos DTE (JSON) aquí o{" "}
            <span className="text-blue-600 dark:text-blue-400 font-bold underline">Haz clic para examinar</span>
            <p className="text-xs text-neutral-500 mt-2">Puedes seleccionar múltiples archivos a la vez.</p>
          </label>
        </div>

        {/* Resumen de Datos Extraídos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-neutral-900 shadow-sm border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl text-center">
            <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Facturas (Cons. Final)</h3>
            <p className="text-3xl font-bold text-blue-600">{data.ventasConsumidorFinal.length}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 shadow-sm border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl text-center">
            <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">CCF (Contribuyentes)</h3>
            <p className="text-3xl font-bold text-rose-600">{data.ventasContribuyentes.length}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 shadow-sm border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl text-center">
            <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Compras Recibidas</h3>
            <p className="text-3xl font-bold text-emerald-600">{data.compras.length}</p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-wrap gap-4 mt-6">
          <button
            onClick={exportarJSONFinal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-colors flex items-center gap-2"
          >
            ⏬ Descargar JSON Final para el App
          </button>

          <button
            onClick={() => {
              if(confirm("¿Estás seguro de limpiar todos los datos?")) {
                setData({ ventasConsumidorFinal: [], ventasContribuyentes: [], compras: [] });
                setLogs([]);
              }
            }}
            className="bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Limpiar Memoria
          </button>
        </div>

        {/* Consola de logs */}
        {logs.length > 0 && (
           <div className="bg-neutral-900 p-4 rounded-xl mt-8 h-48 overflow-y-auto font-mono text-sm text-green-400 border border-neutral-800 shadow-inner">
             <h4 className="text-neutral-400 mb-2 border-b border-neutral-700 pb-1 uppercase text-xs tracking-wider">Registro de Operaciones</h4>
             {logs.map((log, i) => (
                <div key={i} className="py-0.5">{log}</div>
             ))}
           </div>
        )}
      </main>
    </div>
  );
}
