import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function LibrosIVA() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('consumidor');
  
  // F-07 Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    claseDocumento: "4",
    // Ventas
    tipoOperacion: "1",
    tipoIngreso: "03",
    // Compras
    tipoOperacionCompras: "1",
    clasificacion: "2",
    sector: "4",
    tipoCostoGasto: "2"
  });

  useEffect(() => {
    const savedData = localStorage.getItem('contapp_data');
    if (savedData) {
      try {
        setData(JSON.parse(savedData));
      } catch (e) {
        console.error("Error al parsear data", e);
      }
    }
  }, []);

  if (!data) {
    return (
      <div className="text-center py-20 flex flex-col items-center">
        <div className="bg-neutral-100 dark:bg-neutral-800 w-24 h-24 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">📄</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">No hay datos disponibles</h2>
        <p className="text-neutral-500 mb-6">Debes cargar un archivo JSON primero para generar los libros.</p>
        <Button variant="primary" onClick={() => window.location.href='/carga-datos'}>
          Ir a Cargar Datos
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'consumidor', name: 'Libro de Ventas a Consumidor Final' },
    { id: 'contribuyentes', name: 'Libro de Ventas (Contribuyentes)' },
    { id: 'compras', name: 'Libro de Compras' }
  ];

  // Utility to format money
  const fmt = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const exportarCSVContribuyentes = () => {
    if (!data || !data.ventasContribuyentes || data.ventasContribuyentes.length === 0) {
      alert("No hay datos de contribuyentes para exportar.");
      return;
    }

    const headers = [
      "FECHA DE EMISIÓN DEL DOCUMENTO",
      "CLASE DE DOCUMENTO",
      "TIPO DE DOCUMENTO",
      "NUMERO DE RESOLUCIÓN",
      "SERIE DEL DOCUMENTO",
      "NÚMERO DE DOCUMENTO",
      "NÚMERO DE CONTROL INTERNO",
      "NIT O NRC DEL CLIENTE",
      "NOMBRE RAZÓN SOCIAL O DENOMINACIÓN",
      "VENTAS EXENTAS",
      "VENTAS NO SUJETAS",
      "Ventas Gravadas Locales",
      "DEBITO FISCAL",
      "VENTAS A CUENTA DE TERCEROS NO DOMICILIADOS",
      "DEBITO FISCAL POR VENTAS A CUENTA DE TERCEROS",
      "TOTAL DE VENTAS",
      "NUMERO DE DUI DEL CLIENTE",
      "TIPO DE OPERACIÓN (Renta)",
      "TIPO DE INGRESO (Renta)",
      "NÚMERO DEL ANEXO"
    ];

    const rows = [];
    // La plataforma del MH (F-07) no requiere ni acepta fila de encabezados, así que la omitimos.

    data.ventasContribuyentes.forEach((item) => {
      const exento = item.exento || 0;
      const noSujeto = item.noSujeto || 0;
      const gravado = item.netoGravado || 0;
      const iva = +(gravado * 0.13).toFixed(2);
      const total = (gravado + iva + exento + noSujeto);
      
      // Formatear fecha de YYYY-MM-DD a DD/MM/YYYY
      let fechaFormato = item.fecha;
      if (fechaFormato && fechaFormato.includes('-')) {
        const partes = fechaFormato.split('-');
        if (partes.length === 3) {
          fechaFormato = `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
      }

      // El tipo de documento debe ser de 2 caracteres (ej. "03")
      let tipoDoc = String(item.tipoDocumento || "03");
      if (tipoDoc.length === 1) tipoDoc = "0" + tipoDoc;
      
      // Siempre con dos decimales como exige el MH (ej. 0.00)
      const formatNum = (num) => Number(num || 0).toFixed(2);

      // MH exige que NIT/NRC y DUI sean mutuamente excluyentes (Enero 2022+)
      let nitNrc = (item.nitNrcCliente || "").replace(/-/g, '');
      let dui = (item.duiCliente || "").replace(/-/g, '');
      if (nitNrc) {
        dui = ""; // Si hay NIT/NRC, el DUI debe ir vacío
      } else if (dui) {
        nitNrc = ""; // Si no hay NIT, enviamos DUI
      }

      const rowData = [
        fechaFormato,
        exportConfig.claseDocumento,
        tipoDoc, 
        (item.numeroControl || "").replace(/-/g, ''), 
        (item.selloRecepcion || "").replace(/-/g, ''), 
        (item.codigoGeneracion || "").replace(/-/g, ''), 
        "", // NÚMERO DE CONTROL INTERNO
        nitNrc,
        (item.cliente || "").replace(/;/g, ''), // Quitamos punto y coma por ser delimitador
        formatNum(exento),
        formatNum(noSujeto),
        formatNum(gravado),
        formatNum(iva),
        "0.00", // VENTAS A CUENTA DE TERCEROS NO DOMICILIADOS
        "0.00", // DÉBITO FISCAL POR VENTA A TERCEROS
        formatNum(total),
        dui,
        exportConfig.tipoOperacion, // R
        exportConfig.tipoIngreso, // S
        "1" // T - NÚMERO DEL ANEXO
      ];

      // El separador exigido por MH para SV y Excel en Latam es punto y coma (;)
      rows.push(rowData.join(";"));
    });

    const csvContent = rows.join("\r\n");
    // Removido BOM temporalmente por si genera conflictos con la codificación estricta del MH 
    // Usamos text/csv plano
    const blob = new Blob([csvContent], { type: "text/csv" });
    const fechaDL = new Date().toISOString().split("T")[0];
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `libro_ventas_contribuyentes_${fechaDL}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  const exportarCSVConsumidor = () => {
    if (!data || !data.ventasConsumidorFinal || data.ventasConsumidorFinal.length === 0) {
      alert("No hay datos de consumidor final para exportar.");
      return;
    }

    // Agrupamos por Fecha y Tipo de Documento
    const grouped = {};
    data.ventasConsumidorFinal.forEach(item => {
      let f = item.fecha || "";
      let tDoc = String(item.tipoDocumento || "01");
      if (tDoc.length === 1) tDoc = "0" + tDoc;

      const key = `${f}|${tDoc}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    const rows = [];
    const formatNum = (num) => Number(num || 0).toFixed(2);

    Object.keys(grouped).sort().forEach(key => {
      const [fechaStr, tipoDoc] = key.split('|');
      const dailyDocs = grouped[key];

      let exentoTotal = 0;
      let gravadoTotal = 0;

      dailyDocs.forEach(s => {
        exentoTotal += (s.exento || 0);
        gravadoTotal += (s.gravado || 0);
      });

      const primerDTE = (dailyDocs[0].codigoGeneracion || "").replace(/-/g, '');
      const ultimoDTE = (dailyDocs[dailyDocs.length - 1].codigoGeneracion || "").replace(/-/g, '');

      // Formatear fecha
      let fechaFormato = fechaStr;
      if (fechaFormato && fechaFormato.includes('-')) {
        const partes = fechaFormato.split('-');
        if (partes.length === 3) {
          fechaFormato = `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
      }

      const rowData = [
        fechaFormato, // A
        exportConfig.claseDocumento, // B
        tipoDoc, // C
        "N/A", // D. Resolucion (N/A)
        "N/A", // E. Serie (N/A)
        "N/A", // F. Control Interno Del (N/A)
        "N/A", // G. Control Interno Al (N/A)
        primerDTE, // H. Documento Del (Primer Código Gen)
        ultimoDTE, // I. Documento Al (Último Código Gen)
        "", // J. Máquina Registradora 
        formatNum(exentoTotal), // K. Ventas Exentas
        "0.00", // L. Ventas Internas Exentas a Proporcionalidad
        "0.00", // M. Ventas No Sujetas
        formatNum(gravadoTotal), // N. Ventas Gravadas Locales (IVA incluido)
        "0.00", // O. Exportaciones en CA
        "0.00", // P. Exportaciones fuera CA
        "0.00", // Q. Exportaciones a Servicios
        "0.00", // R. Zonas Francas DPA
        "0.00", // S. Terceros No Domiciliados
        formatNum(exentoTotal + gravadoTotal), // T. Total Ventas
        exportConfig.tipoOperacion, // U
        exportConfig.tipoIngreso, // V
        "2" // W. NÚMERO DEL ANEXO
      ];

      rows.push(rowData.join(";"));
    });

    const csvContent = rows.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const fechaDL = new Date().toISOString().split("T")[0];
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `libro_ventas_consumidor_${fechaDL}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  const exportarCSVCompras = () => {
    if (!data || !data.compras || data.compras.length === 0) {
      alert("No hay datos de compras para exportar.");
      return;
    }

    const rows = [];
    const formatNum = (num) => Number(num || 0).toFixed(2);

    data.compras.forEach((item) => {
      let f = item.fecha || "";
      if (f.includes('-')) {
        const p = f.split('-');
        if (p.length === 3) f = `${p[2]}/${p[1]}/${p[0]}`;
      }

      let tipoDoc = String(item.tipoDocumento || "03");
      if (tipoDoc.length === 1) tipoDoc = "0" + tipoDoc;

      // MH exige excusión mutua NIT/NRC y DUI
      let nit = (item.nit || item.nrc || "").replace(/-/g, '');
      let dui = (item.dui || "").replace(/-/g, '');
      
      if (nit) {
        dui = "";
      } else if (dui) {
        nit = "";
      }

      let exento = parseFloat(item.exento || 0);
      let gravado = parseFloat(item.netoGravado || 0);
      let iva = +(gravado * 0.13).toFixed(2);
      let total = exento + gravado + iva;

      const rowData = [
        f, // A. FECHA
        exportConfig.claseDocumento, // B. CLASE
        tipoDoc, // C. TIPO DOC
        (item.numeroDocumento || "").replace(/-/g, ''), // D. NUMERO DOC
        nit, // E. NIT O NRC
        (item.proveedor || "").replace(/;/g, ''), // F. NOMBRE PROVEEDOR
        formatNum(exento), // G. COMPRAS INTERNAS EXENTAS
        "0.00", // H. INTERNACIONES EXENTAS
        "0.00", // I. IMPORTACIONES EXENTAS
        formatNum(gravado), // J. COMPRAS INTERNAS GRAVADAS
        "0.00", // K. INTERNACIONES GRAVADAS
        "0.00", // L. IMPORTACIONES GRAVADAS
        "0.00", // M. IMPORTACIONES G. SERVICIOS
        formatNum(iva), // N. CREDITO FISCAL
        formatNum(total), // O. TOTAL COMPRAS 
        dui, // P. DUI
        exportConfig.tipoOperacionCompras, // Q. TIPO DE OP
        exportConfig.clasificacion, // R. CLASIFICACIÓN
        exportConfig.sector, // S. SECTOR
        exportConfig.tipoCostoGasto, // T. TIPO COSTO/GASTO
        "3" // U. NÚMERO ANEXO
      ];
      rows.push(rowData.join(";"));
    });

    const csvContent = rows.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const fechaDL = new Date().toISOString().split("T")[0];
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `libro_compras_${fechaDL}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="!mb-2 text-3xl font-bold tracking-tight">Libros de IVA</h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Registros según normativa del Ministerio de Hacienda de El Salvador. Modificado automáticamente al 13%.
        </p>
      </div>

      <div className="flex bg-neutral-100/50 dark:bg-neutral-800/50 p-1.5 rounded-xl gap-2 w-full overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 whitespace-nowrap px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300
              ${activeTab === tab.id 
                ? 'bg-white dark:bg-neutral-700 shadow-sm text-blue-600 dark:text-blue-400' 
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-neutral-800'}
            `}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <Card className="!p-0 overflow-hidden border border-neutral-200 dark:border-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
            
            {activeTab === 'consumidor' && (
              <>
                <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-800 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold">N° Doc</th>
                    <th className="px-6 py-4 font-semibold">Fecha</th>
                    <th className="px-6 py-4 font-semibold">Cliente</th>
                    <th className="px-6 py-4 font-semibold text-right">Monto Exento</th>
                    <th className="px-6 py-4 font-semibold text-right">Monto Gravado (Inc. IVA)</th>
                    <th className="px-6 py-4 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                  {data.ventasConsumidorFinal.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">{item.numeroDocumento}</td>
                      <td className="px-6 py-4">{item.fecha}</td>
                      <td className="px-6 py-4">{item.cliente}</td>
                      <td className="px-6 py-4 text-right">{fmt(item.exento || 0)}</td>
                      <td className="px-6 py-4 text-right font-medium">{fmt(item.gravado)}</td>
                      <td className="px-6 py-4 text-right text-blue-600 dark:text-blue-400 font-bold">
                        {fmt((item.exento || 0) + item.gravado)}
                      </td>
                    </tr>
                  ))}
                  {data.ventasConsumidorFinal.length === 0 && (
                     <tr><td colSpan="6" className="px-6 py-8 text-center text-neutral-400">No hay registros de Consumidor Final</td></tr>
                  )}
                </tbody>
              </>
            )}

            {activeTab === 'contribuyentes' && (
              <>
                <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-800 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold">N° CCF</th>
                    <th className="px-6 py-4 font-semibold">Fecha</th>
                    <th className="px-6 py-4 font-semibold">Cliente / Razón Social</th>
                    <th className="px-6 py-4 font-semibold text-right">Ventas Exentas</th>
                    <th className="px-6 py-4 font-semibold text-right">Neto Gravado</th>
                    <th className="px-6 py-4 font-semibold text-right text-rose-500">IVA (13%)</th>
                    <th className="px-6 py-4 font-semibold text-right">Venta Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                  {data.ventasContribuyentes.map((item, idx) => {
                    // Logic typically required by El Salvador: neto * 13% = iva
                    const iva = +(item.netoGravado * 0.13).toFixed(2);
                    const total = (item.netoGravado + iva + (item.exento || 0));
                    
                    return (
                      <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs">{item.numeroComprobante}</td>
                        <td className="px-6 py-4">{item.fecha}</td>
                        <td className="px-6 py-4 font-medium">{item.cliente}</td>
                        <td className="px-6 py-4 text-right text-neutral-500">{fmt(item.exento || 0)}</td>
                        <td className="px-6 py-4 text-right">{fmt(item.netoGravado)}</td>
                        <td className="px-6 py-4 text-right font-bold text-rose-500">{fmt(iva)}</td>
                        <td className="px-6 py-4 text-right text-blue-600 dark:text-blue-400 font-bold">
                          {fmt(total)}
                        </td>
                      </tr>
                    )
                  })}
                  {data.ventasContribuyentes.length === 0 && (
                     <tr><td colSpan="7" className="px-6 py-8 text-center text-neutral-400">No hay registros de Contribuyentes</td></tr>
                  )}
                </tbody>
              </>
            )}

            {activeTab === 'compras' && (
              <>
                <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-800 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold">N° Doc</th>
                    <th className="px-6 py-4 font-semibold">Fecha</th>
                    <th className="px-6 py-4 font-semibold">Proveedor</th>
                    <th className="px-6 py-4 font-semibold">NRC</th>
                    <th className="px-6 py-4 font-semibold text-right">Compras Exentas</th>
                    <th className="px-6 py-4 font-semibold text-right">Neto Gravado</th>
                    <th className="px-6 py-4 font-semibold text-right text-emerald-500">IVA (13%)</th>
                    <th className="px-6 py-4 font-semibold text-right">Total Compra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                  {data.compras.map((item, idx) => {
                    const iva = +(item.netoGravado * 0.13).toFixed(2);
                    const total = (item.netoGravado + iva + (item.exento || 0));
                    
                    return (
                      <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs">{item.numeroDocumento}</td>
                        <td className="px-6 py-4">{item.fecha}</td>
                        <td className="px-6 py-4">{item.proveedor}</td>
                        <td className="px-6 py-4">{item.nrc}</td>
                        <td className="px-6 py-4 text-right text-neutral-500">{fmt(item.exento || 0)}</td>
                        <td className="px-6 py-4 text-right">{fmt(item.netoGravado)}</td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-500">{fmt(iva)}</td>
                        <td className="px-6 py-4 text-right text-blue-600 dark:text-blue-400 font-bold">
                          {fmt(total)}
                        </td>
                      </tr>
                    )
                  })}
                  {data.compras.length === 0 && (
                     <tr><td colSpan="8" className="px-6 py-8 text-center text-neutral-400">No hay registros de Compras</td></tr>
                  )}
                </tbody>
              </>
            )}

          </table>
        </div>
      </Card>
      
      {data && (
        <div className="flex justify-end gap-4 mt-6">
          <Button variant="secondary" onClick={() => window.print()}>
            Exportar PDF / Imprimir
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              // Now enabled for all active tabs
              setShowExportModal(true);
            }}
          >
            Generar F-07 (CSV)
          </Button>
        </div>
      )}

      {/* Modal de Configuración F-07 */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-3">
              Configuración de Exportación DTE (F-07)
            </h3>
            
            <div className="space-y-4 my-6">
              <div>
                <label className="block text-sm font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Clase de Documento</label>
                <select 
                  className="w-full p-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={exportConfig.claseDocumento}
                  onChange={(e) => setExportConfig({...exportConfig, claseDocumento: e.target.value})}
                >
                  <option value="1">1 - Impreso por imprenta o tiquetes</option>
                  <option value="2">2 - Formulario único</option>
                  <option value="3">3 - Otros (Declaración de Mercancías/Mandamientos)</option>
                  <option value="4">4 - Documento Tributario Electrónico (DTE)</option>
                </select>
              </div>

              {/* Renta de Ventas */}
              {activeTab !== 'compras' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Tipo de Operación (Renta VENTA)</label>
                    <select 
                      className="w-full p-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={exportConfig.tipoOperacion}
                      onChange={(e) => setExportConfig({...exportConfig, tipoOperacion: e.target.value})}
                    >
                      <option value="1">1 - Gravada</option>
                      <option value="2">2 - No gravada o exenta</option>
                      <option value="3">3 - Excluido o no constituye Renta</option>
                      <option value="4">4 - Mixta (Incentivos fiscales)</option>
                      <option value="8">8 - Operaciones en más de 1 anexo</option>
                      <option value="9">9 - Excepciones (No deducibles, etc)</option>
                    </select>
                  </div>
    
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Tipo de Ingreso (Renta VENTA)</label>
                    <select 
                      className="w-full p-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={exportConfig.tipoIngreso}
                      onChange={(e) => setExportConfig({...exportConfig, tipoIngreso: e.target.value})}
                    >
                      <option value="01">01 - Profesiones, Artes y Oficios</option>
                      <option value="02">02 - Actividades de Servicios</option>
                      <option value="03">03 - Actividades Comerciales</option>
                      <option value="04">04 - Actividades Industriales</option>
                      <option value="05">05 - Actividades Agropecuarias</option>
                      <option value="06">06 - Utilidades y Dividendos</option>
                      <option value="07">07 - Exportaciones de bienes</option>
                      <option value="08">08 - Servicios Exteriores utilizados en SV</option>
                      <option value="09">09 - Exportaciones de servicios</option>
                      <option value="10">10 - Otras rentas gravables</option>
                      <option value="12">12 - Ingresos sujetos a retención F910</option>
                      <option value="13">13 - Sujetos pasivos excluidos</option>
                    </select>
                  </div>
                </>
              )}

              {/* Renta de Compras */}
              {activeTab === 'compras' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Tipo de Operación (Renta COMPRA)</label>
                    <select 
                      className="w-full p-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={exportConfig.tipoOperacionCompras}
                      onChange={(e) => setExportConfig({...exportConfig, tipoOperacionCompras: e.target.value})}
                    >
                      <option value="1">1 - Gravada</option>
                      <option value="2">2 - No Gravada</option>
                      <option value="3">3 - Excluido o no Constituye Renta</option>
                      <option value="4">4 - Mixta (Rentas gravables, no gravables...)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Clasificación</label>
                    <select 
                      className="w-full p-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={exportConfig.clasificacion}
                      onChange={(e) => setExportConfig({...exportConfig, clasificacion: e.target.value})}
                    >
                      <option value="1">1 - Costo</option>
                      <option value="2">2 - Gasto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Sector</label>
                    <select 
                      className="w-full p-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={exportConfig.sector}
                      onChange={(e) => setExportConfig({...exportConfig, sector: e.target.value})}
                    >
                      <option value="1">1 - Industria</option>
                      <option value="2">2 - Comercio</option>
                      <option value="3">3 - Agropecuaria</option>
                      <option value="4">4 - Servicios, Profesiones, Artes y Oficios</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Tipo de Costo / Gasto</label>
                    <select 
                      className="w-full p-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={exportConfig.tipoCostoGasto}
                      onChange={(e) => setExportConfig({...exportConfig, tipoCostoGasto: e.target.value})}
                    >
                      <option value="1">1 - Gastos de Venta sin Donación</option>
                      <option value="2">2 - Gastos de Administración sin Donación</option>
                      <option value="3">3 - Gastos Financieros sin Donación</option>
                      <option value="4">4 - Costo Producidos/Comprados Impo/Internaciones</option>
                      <option value="5">5 - Costo Producidos/Comprados Interno</option>
                      <option value="6">6 - Costos Indirectos de Fabricación</option>
                      <option value="7">7 - Mano de obra</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button variant="ghost" onClick={() => setShowExportModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={() => {
                if(activeTab === 'contribuyentes') exportarCSVContribuyentes();
                if(activeTab === 'consumidor') exportarCSVConsumidor();
                if(activeTab === 'compras') exportarCSVCompras();
              }}>
                Descargar CSV
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
