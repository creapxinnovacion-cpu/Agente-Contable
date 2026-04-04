# Agente Contable - Ministerio de Hacienda SV

Arquitectura y Front-End diseñado para gestionar documentos tributarios electrónicos (DTE) y generar los libros de IVA acorde a las normas del Ministerio de Hacienda de El Salvador. 

Esta aplicación no usa base de datos backend, sino que hace uso de `localStorage` para almacenamiento en caché local, siendo 100% Client-Side.

## Arquitectura del Proyecto

El proyecto está creado utilizando React (Vite) y una arquitectura modular, permitiendo un gran escalamiento en el futuro:

- `src/components/ui`: Componentes modulares de interfaz (Botones, Tarjetas, Inputs). Todos con soporte para Light/Dark Mode y estilizados con TailwindCSS.
- `src/pages/`: Las diferentes vistas del enrutamiento de la aplicación (`Home`, `Login`, `CargaDatos`, `LibrosIVA`, `Json` que sirve como conversor DTE).
- `src/data/`: Scripts utilitarios e interfaces de datos (e.g. `utilsJson.js`).
- `src/context/`: Contextos de la aplicación (e.g. `AuthContext` para el estado de autenticación).

## Ramas del Repositorio

A continuación se detalla el propósito de cada rama activa en este repositorio:

- **`master`**: Rama principal estable. Contiene la versión base del proyecto operando de manera local sin backend mediante `localStorage`.
- **`actualizacion-validaciones`**: Rama enfocada en aplicar el motor de reglas y validaciones estrictas (alertas, errores críticos, cálculos matemáticos) al procesar los DTE. Indispensable para asegurar integridad al exportar los reportes F-07.
- **`feature/saas-frontend-prep`**: Rama activa de transición hacia el nuevo sistema SaaS multi-tenant. Aquí se acondiciona el Frontend para el consumo de la API local en Python (FastAPI), implementación de autenticación por tokens JWT y el soporte para multi-empresa.

## Flujo de Trabajo (Funciones)

1. **Login Sencillo (`/login`)**
   La aplicación utiliza credenciales mockeadas (`admin` / `admin`) como MVP, integrando un AuthContext robusto para futuras ampliaciones o token JWT.

2. **Conversor de DTE (`/Json.jsx`)**
   El componente Conversor está expuesto para cargar los archivos JSON individuales que provee Facturación Electrónica MH. Identifica si son Facturas, Créditos Fiscales o Compras, evalúa sus montos netos gravados o exentos y extrae la data necesaria, unificando todo en **un solo archivo JSON** compatible con la lectura del sistema contable.

3. **Carga de Datos Principal (`/carga-datos`)**
   Aquí el usuario sube el archivo JSON **unificado** y procesado en formato estándar de App (con llaves `"ventasConsumidorFinal"`, `"ventasContribuyentes"`, `"compras"`). Se almacena directamente bajo el token local de `localStorage ('contapp_data')`.

4. **Visor de Libros de IVA (`/libros-iva`)**
   Recibe el JSON desde LocalStorage y renderiza 3 libros: Libro de Consumidor Final, Libro de Contribuyentes, y Libro de Compras. Automáticamente realiza los cálculos pertinentes visualmente, por ejemplo, aplicar el `13%` a los netos gravados y sumarlo para presentar el Total final.

5. **Tablero y Gráficos (`/`)**
   Pantalla de resumen (Dashboard Home) con insights estadísticos del negocio, que en futuras versiones podrá atarse directo a la metadata en la memoria.

## Nuevas Funciones y Roadmap

Actualmente se están desarrollando o ya se encuentran integradas las siguientes funciones:

1. **Validaciones Avanzadas de DTEs:** Motor de escaneo y validación estricto (críticos, alertas, cuadres) para prevenir bloqueos de exportación en los reportes F-07.
2. 📊 **Dashboard contable:** Interfaz ampliada para controlar las operaciones y visualización de impuestos en tiempo real.
3. 🤖 **Asientos automáticos:** Generación de partidas contables automatizadas a partir de cada DTE almacenado.
4. 🔗 **Conexión directa con MH API / Agente de IA:** Integración futura para reportar directamente al Ministerio de Hacienda de manera automatizada y asistencia mediante IA.

## Instrucciones para Desarrolladores
- **Instalación:** `npm install`
- **Servidor Local:** `npm run dev`
- Todas las lógicas de recálculo de IVA sobre los Netos pre-DTE se encuentran dentro de `LibrosIVA.jsx`.
- Para refinar la detección de qué documento es una "Compra" o una "Venta CCF", ver el script de `detectarTipoDTE()` en `/src/data/utilsJson.js`.

---

## ✅ Integración del Backend SaaS (Completada)

Para habilitar la multi-tenencia (múltiples empresas por contador) y la autenticación real, se construyó exitosamente el Backend en **FastAPI (Python)** y una base de datos en SQLAlchemy. El backend y su propio registro se administran en el repositorio adjunto `API-Agente-Contable`. La validación ahora maneja conexiones **CORS** seguras y tokens JWT reales consumidos por este Frontend.

### Esquema SQL Recomendado
```sql
CREATE TABLE empresas (
  id BIGSERIAL PRIMARY KEY,
  nombre_razon_social VARCHAR(255) NOT NULL,
  nit VARCHAR(20) UNIQUE NOT NULL,
  correo VARCHAR(150),
  estado VARCHAR(20) DEFAULT 'ACTIVA',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);CREATE TABLE usuarios (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  estado VARCHAR(20) DEFAULT 'ACTIVO',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE usuario_empresas (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL,
  empresa_id BIGINT NOT NULL,

  rol VARCHAR(20) DEFAULT 'CONTADOR',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,

  UNIQUE(usuario_id, empresa_id)
);
```

### Flujo de Autenticación JWT
1. El Cliente envía `email` y `password` al back.
2. El Backend cruza las credenciales, busca la tabla intermendia y devuelve un JWT.
3. El payload del token incluirá: `sub: usuario_id`, `empresaActiva: ID`, `nitEmpresa: '...'`.
4. El Frontend guarda este token y utiliza el `nitEmpresa` para la autodetección de Archivos JSON en la sección `/Json.jsx`.
