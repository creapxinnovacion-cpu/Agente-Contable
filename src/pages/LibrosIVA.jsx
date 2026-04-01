import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { validateBatch } from '../utils/validations';

// ─── Íconos inline para no tener que añadir dependencias ────────────────────
const IconAlert = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconInfo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);
const IconChevron = ({ open }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// ─── Componente: Panel de Validaciones ──────────────────────────────────────
function ValidationPanel({ validation }) {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('criticos');

  if (!validation) return null;

  const { summary, global } = validation;
  const hasErrors = summary.totalCritical > 0;
  const hasWarnings = summary.totalWarnings > 0;

  // Recopilar DTEs con error por libro
  const dtesConError = {
    contribuyentes: validation.contribuyentes.results.filter(r => r.errors.length > 0 || r.warnings.length > 0),
    consumidor:     validation.consumidor.results.filter(r => r.errors.length > 0 || r.warnings.length > 0),
    compras:        validation.compras.results.filter(r => r.errors.length > 0 || r.warnings.length > 0),
  };

  const bannerColor = hasErrors
    ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800'
    : hasWarnings
    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';

  const bannerTextColor = hasErrors
    ? 'text-red-700 dark:text-red-300'
    : hasWarnings
    ? 'text-amber-700 dark:text-amber-300'
    : 'text-emerald-700 dark:text-emerald-300';

  return (
    <div className={`rounded-xl border ${bannerColor} overflow-hidden`}>
      {/* Header siempre visible */}
      <button
        className={`w-full flex items-center justify-between px-5 py-4 ${bannerTextColor} hover:opacity-80 transition-opacity`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="flex items-center gap-3 font-semibold text-sm">
          {hasErrors ? <IconAlert /> : <IconCheck />}
          {hasErrors
            ? `🚨 ${summary.totalCritical} error${summary.totalCritical !== 1 ? 'es' : ''} crítico${summary.totalCritical !== 1 ? 's' : ''} detectado${summary.totalCritical !== 1 ? 's' : ''} — Exportación bloqueada`
            : hasWarnings
            ? `⚠️ Datos válidos con ${summary.totalWarnings} advertencia${summary.totalWarnings !== 1 ? 's' : ''}`
            : '✅ Todos los datos son válidos — Exportación habilitada'}
        </span>
        <span className="flex items-center gap-2 text-xs opacity-70">
          Ver detalles <IconChevron open={open} />
        </span>
      </button>

      {open && (
        <div className="border-t border-current/10 px-5 pb-5 pt-3 space-y-4">
          {/* Tabs internas */}
          <div className="flex gap-2 text-xs font-medium flex-wrap">
            {['criticos', 'advertencias', 'cuadre'].map(sec => (
              <button
                key={sec}
                onClick={() => setActiveSection(sec)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeSection === sec
                    ? 'bg-white dark:bg-neutral-800 shadow text-neutral-900 dark:text-white'
                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                {sec === 'criticos'     && `🔴 Críticos (${summary.totalCritical})`}
                {sec === 'advertencias' && `🟡 Advertencias (${summary.totalWarnings})`}
                {sec === 'cuadre'       && '📊 Cuadre Fiscal'}
              </button>
            ))}
          </div>

          {/* Errores críticos */}
          {activeSection === 'criticos' && (
            <div className="space-y-3">
              {/* Errores globales (duplicados, cruces) */}
              {global.errors.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1.5 flex items-center gap-1">
                    <IconInfo /> Errores Globales / Cruzados
                  </p>
                  <ul className="space-y-1">
                    {global.errors.map((e, i) => (
                      <li key={i} className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 px-3 py-2 rounded-lg flex gap-2">
                        <span className="font-mono text-red-400 shrink-0">[{e.code}]</span> {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* DTEs con errores por libro */}
              {[
                { key: 'contribuyentes', label: 'Contribuyentes (CCF)' },
                { key: 'consumidor',     label: 'Consumidor Final' },
                { key: 'compras',        label: 'Compras' },
              ].map(({ key, label }) => {
                const conError = dtesConError[key].filter(r => r.errors.length > 0);
                if (conError.length === 0) return null;
                return (
                  <div key={key}>
                    <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1.5">{label}</p>
                    <div className="space-y-2">
                      {conError.map((r) => (
                        <div key={r.idx} className="bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-800 rounded-lg p-3">
                          <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                            DTE #{r.idx + 1} — {r.dte.codigoGeneracion ?? r.dte.numeroDocumento ?? '(sin ID)'}
                          </p>
                          <ul className="space-y-1">
                            {r.errors.map((e, ei) => (
                              <li key={ei} className="text-xs text-red-700 dark:text-red-300 flex gap-2">
                                <span className="font-mono text-red-400 shrink-0">[{e.code}]</span> {e.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {summary.totalCritical === 0 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">✅ Sin errores críticos.</p>
              )}
            </div>
          )}

          {/* Advertencias */}
          {activeSection === 'advertencias' && (
            <div className="space-y-3">
              {global.warnings.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1.5">Advertencias Globales</p>
                  <ul className="space-y-1">
                    {global.warnings.map((w, i) => (
                      <li key={i} className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-3 py-2 rounded-lg flex gap-2">
                        <span className="font-mono text-amber-400 shrink-0">[{w.code}]</span> {w.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {[
                { key: 'contribuyentes', label: 'Contribuyentes (CCF)' },
                { key: 'consumidor',     label: 'Consumidor Final' },
                { key: 'compras',        label: 'Compras' },
              ].map(({ key, label }) => {
                const conWarn = dtesConError[key].filter(r => r.warnings.length > 0);
                if (conWarn.length === 0) return null;
                return (
                  <div key={key}>
                    <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1.5">{label}</p>
                    <div className="space-y-2">
                      {conWarn.map((r) => (
                        <div key={r.idx} className="bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                          <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                            DTE #{r.idx + 1} — {r.dte.codigoGeneracion ?? r.dte.numeroDocumento ?? '(sin ID)'}
                          </p>
                          <ul className="space-y-1">
                            {r.warnings.map((w, wi) => (
                              <li key={wi} className="text-xs text-amber-700 dark:text-amber-300 flex gap-2">
                                <span className="font-mono text-amber-400 shrink-0">[{w.code}]</span> {w.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {summary.totalWarnings === 0 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">✅ Sin advertencias.</p>
              )}
            </div>
          )}

          {/* Cuadre fiscal global */}
          {activeSection === 'cuadre' && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Total Ventas Contribuyentes', val: global.summary.totalVentasContrib, color: 'text-blue-600 dark:text-blue-400' },
                { label: 'Total Ventas Consumidor Final', val: global.summary.totalVentasConsumidor, color: 'text-blue-600 dark:text-blue-400' },
                { label: 'Total Compras', val: global.summary.totalCompras, color: 'text-neutral-700 dark:text-neutral-300' },
                { label: 'IVA Débito (Ventas)', val: global.summary.ivaDebito, color: 'text-rose-600 dark:text-rose-400' },
                { label: 'IVA Crédito (Compras)', val: global.summary.ivaCredito, color: 'text-emerald-600 dark:text-emerald-400' },
                {
                  label: 'IVA Neto (Débito − Crédito)',
                  val: global.summary.ivaNeto,
                  color: global.summary.ivaNeto >= 0 ? 'text-rose-700 dark:text-rose-300 font-bold' : 'text-emerald-700 dark:text-emerald-300 font-bold'
                },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2.5">
                  <p className="text-neutral-500 mb-0.5">{label}</p>
                  <p className={`text-sm font-semibold ${color}`}>${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Componente Principal ───────────────────────────────────────────────────
export default function LibrosIVA() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('consumidor');
  const [validation, setValidation] = useState(null);

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
        const parsed = JSON.parse(savedData);
        setData(parsed);
        // Ejecutar validaciones automáticamente al cargar
        setValidation(validateBatch(parsed));
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

  // ─── Helper: ¿tiene errores críticos este tab? ─────────────────────────
  const tabHasCritical = (tabId) => {
    if (!validation) return false;
    if (tabId === 'contribuyentes') return validation.contribuyentes.results.some(r => r.errors.length > 0);
    if (tabId === 'consumidor')     return validation.consumidor.results.some(r => r.errors.length > 0);
    if (tabId === 'compras')        return validation.compras.results.some(r => r.errors.length > 0);
    return false;
  };

  // ─── Indicador de error por fila ─────────────────────────────────────────
  const rowHasErrors = (tabId, idx) => {
    if (!validation) return { hasError: false, hasWarn: false };
    const results = validation[tabId === 'contribuyentes' ? 'contribuyentes'
                            : tabId === 'consumidor'      ? 'consumidor'
                            : 'compras'].results;
    const r = results[idx];
    if (!r) return { hasError: false, hasWarn: false };
    return { hasError: r.errors.length > 0, hasWarn: r.warnings.length > 0 };
  };

  // ─── Exportaciones (lógica intacta) ──────────────────────────────────────

  const exportarCSVContribuyentes = () => {
    if (!data || !data.ventasContribuyentes || data.ventasContribuyentes.length === 0) {
      alert("No hay datos de contribuyentes para exportar.");
      return;
    }

    const rows = [];

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

  // Determinar si el tab activo tiene errores críticos (bloquear exportación)
  const canExportCurrentTab = validation ? !tabHasCritical(activeTab) && validation.global.errors.length === 0 : true;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="!mb-2 text-3xl font-bold tracking-tight">Libros de IVA</h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Registros según normativa del Ministerio de Hacienda de El Salvador. Modificado automáticamente al 13%.
        </p>
      </div>

      {/* ── Panel de Validaciones ── */}
      <ValidationPanel validation={validation} />

      <div className="flex bg-neutral-100/50 dark:bg-neutral-800/50 p-1.5 rounded-xl gap-2 w-full overflow-x-auto">
        {tabs.map(tab => {
          const hasCrit = tabHasCritical(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 whitespace-nowrap px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-1.5
                ${activeTab === tab.id 
                  ? 'bg-white dark:bg-neutral-700 shadow-sm text-blue-600 dark:text-blue-400' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-neutral-800'}
              `}
            >
              {hasCrit && <span className="text-red-500 text-xs">🔴</span>}
              {tab.name}
            </button>
          );
        })}
      </div>

      <Card className="!p-0 overflow-hidden border border-neutral-200 dark:border-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
            
            {activeTab === 'consumidor' && (
              <>
                <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-800 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="px-4 py-4 font-semibold w-8"></th>
                    <th className="px-6 py-4 font-semibold">N° Doc</th>
                    <th className="px-6 py-4 font-semibold">Fecha</th>
                    <th className="px-6 py-4 font-semibold">Cliente</th>
                    <th className="px-6 py-4 font-semibold text-right">Monto Exento</th>
                    <th className="px-6 py-4 font-semibold text-right">Monto Gravado (Inc. IVA)</th>
                    <th className="px-6 py-4 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                  {data.ventasConsumidorFinal.map((item, idx) => {
                    const { hasError, hasWarn } = rowHasErrors('consumidor', idx);
                    return (
                      <tr key={idx} className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors ${hasError ? 'bg-red-50/50 dark:bg-red-950/20' : hasWarn ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}`}>
                        <td className="px-4 py-4 text-center">
                          {hasError && <span title="Errores críticos">🔴</span>}
                          {!hasError && hasWarn && <span title="Advertencias">🟡</span>}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">{item.numeroDocumento}</td>
                        <td className="px-6 py-4">{item.fecha}</td>
                        <td className="px-6 py-4">{item.cliente}</td>
                        <td className="px-6 py-4 text-right">{fmt(item.exento || 0)}</td>
                        <td className="px-6 py-4 text-right font-medium">{fmt(item.gravado)}</td>
                        <td className="px-6 py-4 text-right text-blue-600 dark:text-blue-400 font-bold">
                          {fmt((item.exento || 0) + item.gravado)}
                        </td>
                      </tr>
                    );
                  })}
                  {data.ventasConsumidorFinal.length === 0 && (
                     <tr><td colSpan="7" className="px-6 py-8 text-center text-neutral-400">No hay registros de Consumidor Final</td></tr>
                  )}
                </tbody>
              </>
            )}

            {activeTab === 'contribuyentes' && (
              <>
                <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-800 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="px-4 py-4 font-semibold w-8"></th>
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
                    const iva = +(item.netoGravado * 0.13).toFixed(2);
                    const total = (item.netoGravado + iva + (item.exento || 0));
                    const { hasError, hasWarn } = rowHasErrors('contribuyentes', idx);
                    return (
                      <tr key={idx} className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors ${hasError ? 'bg-red-50/50 dark:bg-red-950/20' : hasWarn ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}`}>
                        <td className="px-4 py-4 text-center">
                          {hasError && <span title="Errores críticos">🔴</span>}
                          {!hasError && hasWarn && <span title="Advertencias">🟡</span>}
                        </td>
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
                    );
                  })}
                  {data.ventasContribuyentes.length === 0 && (
                     <tr><td colSpan="8" className="px-6 py-8 text-center text-neutral-400">No hay registros de Contribuyentes</td></tr>
                  )}
                </tbody>
              </>
            )}

            {activeTab === 'compras' && (
              <>
                <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-800 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="px-4 py-4 font-semibold w-8"></th>
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
                    const { hasError, hasWarn } = rowHasErrors('compras', idx);
                    return (
                      <tr key={idx} className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors ${hasError ? 'bg-red-50/50 dark:bg-red-950/20' : hasWarn ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}`}>
                        <td className="px-4 py-4 text-center">
                          {hasError && <span title="Errores críticos">🔴</span>}
                          {!hasError && hasWarn && <span title="Advertencias">🟡</span>}
                        </td>
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
                    );
                  })}
                  {data.compras.length === 0 && (
                     <tr><td colSpan="9" className="px-6 py-8 text-center text-neutral-400">No hay registros de Compras</td></tr>
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
          <div className="relative group">
            <Button 
              variant="primary" 
              onClick={() => {
                if (!canExportCurrentTab) return;
                setShowExportModal(true);
              }}
              style={!canExportCurrentTab ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              Generar F-07 (CSV)
              {!canExportCurrentTab && ' 🔒'}
            </Button>
            {!canExportCurrentTab && (
              <div className="absolute bottom-full right-0 mb-2 px-3 py-2 text-xs bg-red-700 text-white rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Corrija los errores críticos para habilitar la exportación
              </div>
            )}
          </div>
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
