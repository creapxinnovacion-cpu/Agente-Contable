// ===============================
// utilsJson.js
// Mapper DTE El Salvador a Formato de React Contable App
// ===============================

/* ===============================
   Helpers
================================ */
export function toNumber(val) {
  const num = parseFloat(
    String(val ?? "")
      .replace(/\$/g, "")
      .replace(/,/g, "")
      .trim()
  );
  return isNaN(num) ? 0 : num;
}

export function isMoneyField(key) {
  return [
    "exento",
    "gravado",
    "netoGravado"
  ].includes(key);
}

export function formatCurrency(value) {
  const num = toNumber(value);
  return "$ " + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/* ===============================
   Detector de Tipo DTE
================================ */
export function detectarTipoDTE(json, miNit, miNombre = "") {
  const identificacion = json.identificacion || {};
  const tipo = identificacion.tipoDte || "";
  
  const nitEmisor = String(json.emisor?.nit || "").replace(/-/g, "");
  const nombreEmisor = String(json.emisor?.nombre || "").trim().toUpperCase();

  const nitReceptor = String(json.receptor?.nit || "").replace(/-/g, "");
  const docReceptor = String(json.receptor?.numDocumento || "").replace(/-/g, "");
  const nombreReceptor = String(json.receptor?.nombre || "").trim().toUpperCase();

  // SANITIZE miNit to avoid formatting mismatch
  const miNitLimpio = String(miNit || "").replace(/-/g, "");
  const miNombreLimpio = String(miNombre || "").trim().toUpperCase();

  // Función que detecta si nuestro NIT o Nombre de Empresa figura en las propiedades pasadas
  const coincidenciaMuestra = (nitDoc, docDoc, nombreDoc) => {
    if (miNitLimpio && (nitDoc === miNitLimpio || docDoc === miNitLimpio)) return true;
    if (miNombreLimpio && miNombreLimpio.length > 3 && nombreDoc.includes(miNombreLimpio)) return true;
    return false;
  };

  // Verificamos de qué lado de la balanza estamos
  const somosEmisor = coincidenciaMuestra(nitEmisor, "", nombreEmisor);
  const somosReceptor = coincidenciaMuestra(nitReceptor, docReceptor, nombreReceptor);

  // 01 = Factura (Consumidor Final)
  // 03 = Comprobante de Crédito Fiscal (Contribuyentes)
  
  let resultadoFinal = "desconocido";

  if (tipo === "01") {
    if (somosReceptor) {
       resultadoFinal = "compra";
    } else {
       // Si no somos explicitamente el receptor, y/o somos el emisor, es venta.
       // Al generar DTEs de prueba, puede que el NIT Emisor sea otro, así que damos 
       // peso a que NO somos el receptor para dictaminar que son nuestras ventas.
       resultadoFinal = "consumidor_final";
    }
  } else if (tipo === "03") {
    if (somosReceptor) {
       resultadoFinal = "compra";
    } else {
       resultadoFinal = "contribuyente";
    }
  }

  return resultadoFinal;
}

/* =======================================================
   Mappers orientados a los Libros de IVA de React
======================================================== */

export function mapToContribuyentes(json) {
  const identificacion = json.identificacion || {};
  const receptor = json.receptor || {};
  const resumen = json.resumen || {};
  const sello = json.selloRecibido || {};

  // Extraer el sello (puede venir como string o como objeto dependiendo del parser)
  let selloRecepcion = "";
  if (typeof sello === 'string') {
    selloRecepcion = sello;
  } else if (sello.selloRecepcion) {
    selloRecepcion = sello.selloRecepcion;
  }

  const netoGravado = parseFloat(resumen.totalGravada) || parseFloat(resumen.subTotal) || 0;
  
  let iva = 0;
  if (resumen.tributos && Array.isArray(resumen.tributos)) {
    const tribIva = resumen.tributos.find(t => t.codigo === "20");
    if (tribIva) iva = parseFloat(tribIva.valor) || 0;
  }
  if (!iva && resumen.totalIva) {
    iva = parseFloat(resumen.totalIva) || 0;
  }
  // Auto-corrección en conversión
  if (iva === 0 && netoGravado > 0) {
    iva = +(netoGravado * 0.13).toFixed(2);
  }

  return {
    "numeroComprobante": identificacion.numeroControl || identificacion.codigoGeneracion || "",
    "fecha": identificacion.fecEmi || "",
    "cliente": receptor.nombre || "CLIENTE NO REGISTRADO",
    "nitNrcCliente": receptor.nit || receptor.nrc || "",
    "duiCliente": receptor.dui || receptor.documento || "",
    "selloRecepcion": selloRecepcion,
    "codigoGeneracion": identificacion.codigoGeneracion || "",
    "numeroControl": identificacion.numeroControl || "",
    "tipoDocumento": identificacion.tipoDte || "03",
    "exento": parseFloat(resumen.totalExenta) || 0,
    "noSujeto": parseFloat(resumen.totalNoSujeta) || parseFloat(resumen.totalNoSuj) || 0,
    "netoGravado": netoGravado,
    "iva": iva
  };
}

export function mapToConsumidorFinal(json) {
  const identificacion = json.identificacion || {};
  const resumen = json.resumen || {};
  const receptor = json.receptor || {};
  const nombreCliente = receptor.nombre || "CONSUMIDOR FINAL";

  return {
    "numeroDocumento": identificacion.numeroControl || identificacion.codigoGeneracion || "",
    "fecha": identificacion.fecEmi || "",
    "cliente": nombreCliente,
    "exento": parseFloat(resumen.totalExenta) || parseFloat(resumen.totalNoSuj) || 0,
    "gravado": parseFloat(resumen.totalGravada) || parseFloat(resumen.totalPagar) || 0,
    "codigoGeneracion": identificacion.codigoGeneracion || "",
    "numeroControl": identificacion.numeroControl || "",
    "tipoDocumento": identificacion.tipoDte || "01"
  };
}

export function mapToCompras(json) {
  const identificacion = json.identificacion || {};
  const emisor = json.emisor || {};
  const resumen = json.resumen || {};

  const netoGravado = parseFloat(resumen.totalGravada) || parseFloat(resumen.subTotal) || 0;
  
  let iva = 0;
  if (resumen.tributos && Array.isArray(resumen.tributos)) {
    const tribIva = resumen.tributos.find(t => t.codigo === "20");
    if (tribIva) iva = parseFloat(tribIva.valor) || 0;
  }
  if (!iva && resumen.totalIva) {
    iva = parseFloat(resumen.totalIva) || 0;
  }
  // Auto-corrección en conversión
  if (iva === 0 && netoGravado > 0) {
    iva = +(netoGravado * 0.13).toFixed(2);
  }

  return {
    "numeroDocumento": identificacion.numeroControl || identificacion.codigoGeneracion || "",
    "fecha": identificacion.fechaEmision || identificacion.fecEmi || "",
    "proveedor": emisor.nombre || "PROVEEDOR NO REGISTRADO",
    "nrc": emisor.nrc || "",
    "nit": emisor.nit || "",
    "dui": emisor.dui || emisor.documento || "",
    "exento": parseFloat(resumen.totalExenta) || 0,
    "netoGravado": netoGravado,
    "iva": iva,
    // [Agregados MH F-07 Anexo 3]
    "codigoGeneracion": identificacion.codigoGeneracion || "",
    "numeroControl": identificacion.numeroControl || "",
    "tipoDocumento": identificacion.tipoDte || "03" // Factura de Compra normal "03" CCF
  };
}
