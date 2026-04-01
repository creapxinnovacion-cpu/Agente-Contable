/**
 * Motor de Validaciones DTE - Ministerio de Hacienda El Salvador
 * 
 * Niveles:
 *   CRITICAL  → Bloquean la exportación F-07
 *   WARNING   → Alertas importantes, no bloquean
 *   PRO       → Cuadres globales, cruce entre tabs
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const VALID_TIPO_DOCUMENTO = ['01', '03', '11', '14'];

const isValidUUID = (str) => UUID_REGEX.test(str ?? '');
const isValidDate = (str) => {
  if (!DATE_REGEX.test(str ?? '')) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
};
const isFutureDate = (str) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(str) > today;
};
const numVal = (v) => (v === null || v === undefined || v === '' || isNaN(Number(v))) ? null : Number(v);
const isNum = (v) => numVal(v) !== null;
const safeNum = (v) => numVal(v) ?? 0;
const hasSpecialChars = (str) => /[;&<>]/.test(str ?? '');
const exceedLength = (str, max = 255) => (str ?? '').length > max;

function makeError(level, code, message, field = null) {
  return { level, code, message, field };
}

// ─── Validación individual de un DTE ─────────────────────────────────────────

/**
 * Valida un solo DTE según su tipo de libro.
 * @param {object} dte - El documento a validar
 * @param {'contribuyentes'|'consumidor'|'compras'} tipo - Tipo de libro
 * @returns {{ errors: Array, warnings: Array }}
 */
export function validateDTE(dte, tipo) {
  const errors = [];   // Críticos
  const warnings = []; // Alertas

  // ── 1. Identificación ────────────────────────────────────────────────────
  if (!dte.codigoGeneracion || String(dte.codigoGeneracion).trim() === '') {
    errors.push(makeError('CRITICAL', 'ID-001', 'codigoGeneracion está vacío', 'codigoGeneracion'));
  } else if (!isValidUUID(dte.codigoGeneracion)) {
    errors.push(makeError('CRITICAL', 'ID-002', `codigoGeneracion no es un UUID válido: "${dte.codigoGeneracion}"`, 'codigoGeneracion'));
  }

  if (!dte.numeroControl || String(dte.numeroControl).trim() === '') {
    errors.push(makeError('CRITICAL', 'ID-003', 'numeroControl está vacío', 'numeroControl'));
  }

  const tipoDoc = String(dte.tipoDocumento ?? '').padStart(2, '0');
  if (!VALID_TIPO_DOCUMENTO.includes(tipoDoc)) {
    errors.push(makeError('CRITICAL', 'ID-004', `tipoDocumento inválido: "${dte.tipoDocumento}". Válidos: ${VALID_TIPO_DOCUMENTO.join(', ')}`, 'tipoDocumento'));
  }

  // ── 2. Fecha ─────────────────────────────────────────────────────────────
  if (!dte.fecha || String(dte.fecha).trim() === '') {
    errors.push(makeError('CRITICAL', 'FEC-001', 'El campo fecha está vacío', 'fecha'));
  } else if (!isValidDate(dte.fecha)) {
    errors.push(makeError('CRITICAL', 'FEC-002', `Formato de fecha inválido: "${dte.fecha}". Debe ser YYYY-MM-DD`, 'fecha'));
  } else if (isFutureDate(dte.fecha)) {
    errors.push(makeError('CRITICAL', 'FEC-003', `La fecha "${dte.fecha}" es una fecha futura`, 'fecha'));
  }

  // ── 3. Montos obligatorios ───────────────────────────────────────────────
  const camposMontos = tipo === 'compras'
    ? ['exento', 'netoGravado']
    : tipo === 'contribuyentes'
    ? ['exento', 'netoGravado']
    : ['exento', 'gravado'];

  for (const campo of camposMontos) {
    const v = numVal(dte[campo]);
    if (v === null) {
      errors.push(makeError('CRITICAL', 'MON-001', `Campo "${campo}" es nulo, vacío o no numérico`, campo));
    } else if (v < 0) {
      errors.push(makeError('CRITICAL', 'MON-002', `Campo "${campo}" no puede ser negativo (valor: ${v})`, campo));
    }
  }

  // iva >= 0
  if (dte.iva !== undefined && dte.iva !== null) {
    const ivaV = numVal(dte.iva);
    if (ivaV === null || ivaV < 0) {
      errors.push(makeError('CRITICAL', 'MON-003', `Campo "iva" inválido o negativo (valor: ${dte.iva})`, 'iva'));
    }
  }

  // total >= 0
  if (dte.total !== undefined && dte.total !== null) {
    const totalV = numVal(dte.total);
    if (totalV === null || totalV < 0) {
      errors.push(makeError('CRITICAL', 'MON-004', `Campo "total" inválido o negativo (valor: ${dte.total})`, 'total'));
    }
  }

  // ── 4. Consistencia matemática ───────────────────────────────────────────
  if (tipo === 'contribuyentes' || tipo === 'compras') {
    const neto = safeNum(dte.netoGravado);
    const ivaEsperado = +(neto * 0.13).toFixed(2);

    // Si el JSON trae iva propio, verificamos consistencia; si no, se calculará después
    if (dte.iva !== undefined && dte.iva !== null && isNum(dte.iva)) {
      const ivaReal = +safeNum(dte.iva).toFixed(2);
      if (Math.abs(ivaReal - ivaEsperado) > 0.02) {
        errors.push(makeError('CRITICAL', 'MAT-001',
          `IVA inconsistente: registrado=$${ivaReal}, esperado=$${ivaEsperado} (netoGravado=${neto} × 0.13)`,
          'iva'));
      }
    }

    // Verificar total si viene explícito
    if (dte.total !== undefined && dte.total !== null && isNum(dte.total)) {
      const exento = safeNum(dte.exento);
      const noSujeto = safeNum(dte.noSujeto);
      const ivaUsar = isNum(dte.iva) ? safeNum(dte.iva) : ivaEsperado;
      const totalEsperado = +(exento + neto + ivaUsar + noSujeto).toFixed(2);
      const totalReal = +safeNum(dte.total).toFixed(2);

      if (Math.abs(totalReal - totalEsperado) > 0.02) {
        errors.push(makeError('CRITICAL', 'MAT-002',
          `Total inconsistente: registrado=$${totalReal}, esperado=$${totalEsperado}`,
          'total'));
      }
    }
  }

  // ── 5. NIT / DUI (mutualmente excluyentes) ───────────────────────────────
  if (tipo === 'contribuyentes') {
    const nit = String(dte.nitNrcCliente ?? '').trim();
    const dui = String(dte.duiCliente ?? '').trim();
    if (nit && dui) {
      errors.push(makeError('CRITICAL', 'NIT-001', 'No pueden coexistir nitNrcCliente y duiCliente al mismo tiempo', null));
    }
    if (!nit && !dui) {
      errors.push(makeError('CRITICAL', 'NIT-002', 'Se requiere nitNrcCliente o duiCliente (CCF requiere al menos uno)', null));
    }
  }

  if (tipo === 'compras') {
    const nit = String(dte.nit ?? dte.nrc ?? '').trim();
    const dui = String(dte.dui ?? '').trim();
    if (nit && dui) {
      errors.push(makeError('CRITICAL', 'NIT-003', 'No pueden coexistir nit/nrc y dui en la misma compra', null));
    }
    if (!nit && !dui) {
      errors.push(makeError('CRITICAL', 'NIT-004', 'Se requiere nit, nrc o dui del proveedor', null));
    }
  }

  // ── 6. Campos obligatorios por tipo ─────────────────────────────────────
  if (tipo === 'contribuyentes') {
    if (!dte.cliente || String(dte.cliente).trim() === '') {
      errors.push(makeError('CRITICAL', 'CAM-001', 'Campo "cliente" es requerido para Contribuyentes (CCF)', 'cliente'));
    }
    if (numVal(dte.netoGravado) === null) {
      errors.push(makeError('CRITICAL', 'CAM-002', 'Campo "netoGravado" es requerido para Contribuyentes', 'netoGravado'));
    }
  }

  if (tipo === 'consumidor') {
    if (!dte.numeroDocumento || String(dte.numeroDocumento).trim() === '') {
      errors.push(makeError('CRITICAL', 'CAM-003', 'Campo "numeroDocumento" es requerido para Consumidor Final', 'numeroDocumento'));
    }
    const tieneMonto = (isNum(dte.gravado) && safeNum(dte.gravado) >= 0) || (isNum(dte.exento) && safeNum(dte.exento) >= 0);
    if (!tieneMonto) {
      errors.push(makeError('CRITICAL', 'CAM-004', 'Se requiere "gravado" o "exento" para Consumidor Final', null));
    }
  }

  if (tipo === 'compras') {
    if (!dte.proveedor || String(dte.proveedor).trim() === '') {
      errors.push(makeError('CRITICAL', 'CAM-005', 'Campo "proveedor" es requerido en Compras', 'proveedor'));
    }
  }

  // ── 7. Sello de recepción (advertencia) ─────────────────────────────────
  if (!dte.selloRecepcion || String(dte.selloRecepcion).trim() === '') {
    warnings.push(makeError('WARNING', 'SEL-001', 'selloRecepcion ausente (DTE podría no estar recibido por MH)', 'selloRecepcion'));
  }

  // ── 8. Texto limpio ──────────────────────────────────────────────────────
  const textFields = ['cliente', 'proveedor', 'nombreCliente'];
  for (const f of textFields) {
    if (dte[f]) {
      if (String(dte[f]).includes(';')) {
        warnings.push(makeError('WARNING', 'TXT-001', `Campo "${f}" contiene punto y coma (;) que puede corromper el CSV`, f));
      }
      if (hasSpecialChars(dte[f])) {
        warnings.push(makeError('WARNING', 'TXT-002', `Campo "${f}" contiene caracteres especiales`, f));
      }
      if (exceedLength(dte[f])) {
        warnings.push(makeError('WARNING', 'TXT-003', `Campo "${f}" excede 255 caracteres`, f));
      }
      if (String(dte[f]).trim() === '') {
        warnings.push(makeError('WARNING', 'TXT-004', `Campo "${f}" está vacío`, f));
      }
    }
  }

  // ── 9. Formato numérico ──────────────────────────────────────────────────
  const numFields = ['exento', 'netoGravado', 'gravado', 'iva', 'total', 'noSujeto'];
  for (const f of numFields) {
    if (dte[f] !== undefined && dte[f] !== null) {
      const v = numVal(dte[f]);
      if (v === null || isNaN(v)) {
        warnings.push(makeError('WARNING', 'NUM-001', `Campo "${f}" contiene NaN o valor no numérico`, f));
      }
    }
  }

  return { errors, warnings };
}

// ─── Validación de lote completo ─────────────────────────────────────────────

/**
 * Valida el lote completo de datos (todos los libros).
 * Incluye validaciones cruzadas entre tabs y cuadres globales.
 * 
 * @param {{ ventasContribuyentes: Array, ventasConsumidorFinal: Array, compras: Array }} data
 * @returns {{
 *   contribuyentes: { results: Array },
 *   consumidor:     { results: Array },
 *   compras:        { results: Array },
 *   global:         { errors: Array, warnings: Array },
 *   summary: { totalCritical: number, totalWarnings: number, canExport: boolean }
 * }}
 */
export function validateBatch(data) {
  const contribuyentesResults = [];
  const consumidorResults = [];
  const comprasResults = [];
  const globalErrors = [];
  const globalWarnings = [];

  // ── Validación individual por documento ──────────────────────────────────
  (data.ventasContribuyentes ?? []).forEach((dte, idx) => {
    const { errors, warnings } = validateDTE(dte, 'contribuyentes');
    contribuyentesResults.push({ idx, dte, errors, warnings });
  });

  (data.ventasConsumidorFinal ?? []).forEach((dte, idx) => {
    const { errors, warnings } = validateDTE(dte, 'consumidor');
    consumidorResults.push({ idx, dte, errors, warnings });
  });

  (data.compras ?? []).forEach((dte, idx) => {
    const { errors, warnings } = validateDTE(dte, 'compras');
    comprasResults.push({ idx, dte, errors, warnings });
  });

  // ── Duplicados por codigoGeneracion dentro de cada libro ─────────────────
  function checkDuplicatesByField(arr, field, label, errorCode) {
    const seen = {};
    arr.forEach((item, idx) => {
      const val = item[field];
      if (!val) return;
      if (seen[val] !== undefined) {
        globalErrors.push(makeError('CRITICAL', errorCode,
          `DTE duplicado por ${field} "${val}" en ${label} (índices ${seen[val]} y ${idx})`, field));
      } else {
        seen[val] = idx;
      }
    });
  }

  checkDuplicatesByField(data.ventasContribuyentes ?? [], 'codigoGeneracion', 'Contribuyentes', 'DUP-001');
  checkDuplicatesByField(data.ventasContribuyentes ?? [], 'numeroControl', 'Contribuyentes', 'DUP-002');
  checkDuplicatesByField(data.ventasConsumidorFinal ?? [], 'codigoGeneracion', 'Consumidor Final', 'DUP-003');
  checkDuplicatesByField(data.ventasConsumidorFinal ?? [], 'numeroControl', 'Consumidor Final', 'DUP-004');
  checkDuplicatesByField(data.compras ?? [], 'codigoGeneracion', 'Compras', 'DUP-005');
  checkDuplicatesByField(data.compras ?? [], 'numeroControl', 'Compras', 'DUP-006');

  // ── Validación cruzada: misma codigoGeneracion en ventas Y compras ────────
  const ventasGenCodes = new Set([
    ...(data.ventasContribuyentes ?? []).map(d => d.codigoGeneracion).filter(Boolean),
    ...(data.ventasConsumidorFinal ?? []).map(d => d.codigoGeneracion).filter(Boolean),
  ]);
  (data.compras ?? []).forEach((d, idx) => {
    if (d.codigoGeneracion && ventasGenCodes.has(d.codigoGeneracion)) {
      globalErrors.push(makeError('CRITICAL', 'CRZ-001',
        `codigoGeneracion "${d.codigoGeneracion}" aparece en Ventas Y Compras (Compra idx ${idx})`,
        'codigoGeneracion'));
    }
  });

  // ── Orden lógico por fecha (advertencia) ─────────────────────────────────
  function checkDateOrder(arr, label) {
    for (let i = 1; i < arr.length; i++) {
      const prev = arr[i - 1].fecha;
      const curr = arr[i].fecha;
      if (prev && curr && curr < prev) {
        globalWarnings.push(makeError('WARNING', 'ORD-001',
          `${label}: el documento en índice ${i} (${curr}) está antes que el anterior (${prev}). Revisa el orden cronológico.`,
          'fecha'));
        break; // Solo reportamos la primera inconsistencia para no hacer ruido
      }
    }
  }

  checkDateOrder(data.ventasContribuyentes ?? [], 'Contribuyentes');
  checkDateOrder(data.ventasConsumidorFinal ?? [], 'Consumidor Final');
  checkDateOrder(data.compras ?? [], 'Compras');

  // ── Cuadre fiscal global (PRO) ───────────────────────────────────────────
  const totalVentasContrib = (data.ventasContribuyentes ?? []).reduce((acc, d) => {
    const neto = safeNum(d.netoGravado);
    const iva = isNum(d.iva) ? safeNum(d.iva) : +(neto * 0.13).toFixed(2);
    return acc + neto + iva + safeNum(d.exento) + safeNum(d.noSujeto);
  }, 0);

  const totalVentasConsumidor = (data.ventasConsumidorFinal ?? []).reduce((acc, d) => {
    return acc + safeNum(d.gravado) + safeNum(d.exento);
  }, 0);

  const totalCompras = (data.compras ?? []).reduce((acc, d) => {
    const neto = safeNum(d.netoGravado);
    const iva = isNum(d.iva) ? safeNum(d.iva) : +(neto * 0.13).toFixed(2);
    return acc + neto + iva + safeNum(d.exento);
  }, 0);

  const ivaDebito = (data.ventasContribuyentes ?? []).reduce((acc, d) => {
    const neto = safeNum(d.netoGravado);
    return acc + (isNum(d.iva) ? safeNum(d.iva) : +(neto * 0.13).toFixed(2));
  }, 0);

  const ivaCredito = (data.compras ?? []).reduce((acc, d) => {
    const neto = safeNum(d.netoGravado);
    return acc + (isNum(d.iva) ? safeNum(d.iva) : +(neto * 0.13).toFixed(2));
  }, 0);

  const globalSummary = {
    totalVentasContrib: +totalVentasContrib.toFixed(2),
    totalVentasConsumidor: +totalVentasConsumidor.toFixed(2),
    totalCompras: +totalCompras.toFixed(2),
    ivaDebito: +ivaDebito.toFixed(2),
    ivaCredito: +ivaCredito.toFixed(2),
    ivaNeto: +(ivaDebito - ivaCredito).toFixed(2),
  };

  // ── Resumen ──────────────────────────────────────────────────────────────
  const allDocErrors = [
    ...contribuyentesResults.flatMap(r => r.errors),
    ...consumidorResults.flatMap(r => r.errors),
    ...comprasResults.flatMap(r => r.errors),
  ];
  const allDocWarnings = [
    ...contribuyentesResults.flatMap(r => r.warnings),
    ...consumidorResults.flatMap(r => r.warnings),
    ...comprasResults.flatMap(r => r.warnings),
  ];

  const totalCritical = allDocErrors.length + globalErrors.length;
  const totalWarnings = allDocWarnings.length + globalWarnings.length;

  return {
    contribuyentes: { results: contribuyentesResults },
    consumidor:     { results: consumidorResults },
    compras:        { results: comprasResults },
    global: {
      errors: globalErrors,
      warnings: globalWarnings,
      summary: globalSummary,
    },
    summary: {
      totalCritical,
      totalWarnings,
      canExport: totalCritical === 0,
    },
  };
}
