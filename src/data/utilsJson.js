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
export function detectarTipoDTE(json, miNit) {
  const identificacion = json.identificacion || {};
  const tipo = identificacion.tipoDte || "";
  const nitEmisor = String(json.emisor?.nit || "").replace(/-/g, "");

  // 01 = Factura (Consumidor Final)
  // 03 = Comprobante de Crédito Fiscal (Contribuyentes)
  // 11 = Factura de Exportación
  // 14 = Factura de Sujeto Excluido
  
  // SANITIZE miNit to avoid formatting mismatch
  const miNitLimpio = String(miNit || "").replace(/-/g, "");

  if (tipo === "01") {
    // Si somos los emisores, es una Venta a Consumidor Final legítima
    if (!miNitLimpio || nitEmisor === miNitLimpio) {
       return "consumidor_final";
    } else {
       // Somos los receptores (Compra como Consumidor Final de empresa)
       return "compra";
    }
  } else if (tipo === "03") {
    if (!miNitLimpio || nitEmisor === miNitLimpio) {
       // Nosotros emitimos (Venta a contribuyente)
       return "contribuyente";
    } else {
       // Nos emitieron a nosotros (Compra CCF)
       return "compra";
    }
  } 
  
  // Por defecto, lo marcamos para revisión
  return "desconocido";
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
    "netoGravado": parseFloat(resumen.totalGravada) || parseFloat(resumen.subTotal) || 0,
    "iva": parseFloat(resumen.totalIva) || 0
    // El IVA (13%) se calcula automáticamente en LibrosIVA.jsx para la visualización,
    // pero lo guardamos crudo para el CSV por si ya viene.
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

  return {
    "numeroDocumento": identificacion.numeroControl || identificacion.codigoGeneracion || "",
    "fecha": identificacion.fechaEmision || identificacion.fecEmi || "",
    "proveedor": emisor.nombre || "PROVEEDOR NO REGISTRADO",
    "nrc": emisor.nrc || "",
    "nit": emisor.nit || "",
    "dui": emisor.dui || emisor.documento || "",
    "exento": parseFloat(resumen.totalExenta) || 0,
    "netoGravado": parseFloat(resumen.totalGravada) || parseFloat(resumen.subTotal) || 0,
    // [Agregados MH F-07 Anexo 3]
    "codigoGeneracion": identificacion.codigoGeneracion || "",
    "numeroControl": identificacion.numeroControl || "",
    "tipoDocumento": identificacion.tipoDte || "03" // Factura de Compra normal "03" CCF
  };
}
