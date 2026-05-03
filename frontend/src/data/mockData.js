/**
 * mockData.js
 * ─────────────────────────────────────────────────────
 * ÚNICA fuente de datos mock de toda la aplicación.
 *
 * Reemplaza classes.js (formato inglés, página pública) y
 * mockClases.js (formato español, admin), que tenían
 * campos incompatibles entre sí.
 *
 * ✅ FORMATO OFICIAL DE CAMPOS:
 *    Este es el formato que usará el backend real.
 *    Cuando classService.js conecte la API, estos datos
 *    serán reemplazados por respuestas del servidor
 *    sin necesidad de cambiar ningún componente.
 *
 * ⚠️  NO renombrar los campos — son el contrato con el backend.
 *
 * ✅ Migrado desde classes.js y mockClases.js — 2026-04-27
 *    Ambos archivos eliminados. Este es el único archivo de datos de clases.
 * ─────────────────────────────────────────────────────
 */

// ── Clases ─────────────────────────────────────────────────────────────────
/**
 * @typedef {Object} Clase
 * @property {number}  id           - Identificador único
 * @property {string}  nombre       - Nombre de la clase
 * @property {string}  tipo         - 'Stryde X' | 'Slow'
 * @property {string}  dia          - 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo'
 * @property {string}  hora         - Formato "HH:MM" — ej: "07:00"
 * @property {number}  duracion     - Duración en minutos
 * @property {number}  coachId      - ID del coach asignado (ref a COACHES_MOCK)
 * @property {string}  coachNombre  - Nombre del coach (desnormalizado para UI)
 * @property {string}  ubicacion    - Sala o espacio físico
 * @property {number}  cupoMax      - Capacidad máxima de la clase
 * @property {number}  cupoActual   - Lugares ocupados actualmente
 * @property {string}  descripcion  - Descripción breve de la clase
 */
export const CLASES_MOCK = [
  {
    id: 1, nombre: 'Stride Power', tipo: 'Stryde X', dia: 'Lunes', hora: '07:00',
    duracion: 50, coachId: 2, coachNombre: 'Carlos Méndez', ubicacion: 'Studio A',
    cupoMax: 20, cupoActual: 18,
    descripcion: 'Sesión de potencia que combina fuerza funcional y cardio explosivo.',
  },
  {
    id: 2, nombre: 'Slow Pilates', tipo: 'Slow', dia: 'Lunes', hora: '09:00',
    duracion: 60, coachId: 5, coachNombre: 'Sofía Reyes', ubicacion: 'Studio B',
    cupoMax: 15, cupoActual: 12,
    descripcion: 'Pilates de base consciente para fortalecer el core y mejorar la postura.',
  },
  {
    id: 3, nombre: 'Stride Cardio', tipo: 'Stryde X', dia: 'Lunes', hora: '18:00',
    duracion: 45, coachId: 6, coachNombre: 'Ana Torres', ubicacion: 'Studio A',
    cupoMax: 20, cupoActual: 3,
    descripcion: 'Cardio de alta intensidad con intervalos diseñados para quemar calorías.',
  },
  {
    id: 4, nombre: 'Slow Meditación', tipo: 'Slow', dia: 'Martes', hora: '08:00',
    duracion: 60, coachId: 5, coachNombre: 'Sofía Reyes', ubicacion: 'Studio B',
    cupoMax: 15, cupoActual: 10,
    descripcion: 'Meditación guiada con movimiento suave para comenzar el día con claridad.',
  },
  {
    id: 5, nombre: 'Stride HIIT', tipo: 'Stryde X', dia: 'Martes', hora: '19:00',
    duracion: 50, coachId: 2, coachNombre: 'Carlos Méndez', ubicacion: 'Studio A',
    cupoMax: 20, cupoActual: 15,
    descripcion: 'Entrenamiento por intervalos de alta intensidad para elevar tu rendimiento.',
  },
  {
    id: 6, nombre: 'Slow Stretch', tipo: 'Slow', dia: 'Miércoles', hora: '07:30',
    duracion: 55, coachId: 5, coachNombre: 'Sofía Reyes', ubicacion: 'Studio B',
    cupoMax: 15, cupoActual: 7,
    descripcion: 'Stretching profundo con respiración consciente para liberar tensiones.',
  },
  {
    id: 7, nombre: 'Stride Power', tipo: 'Stryde X', dia: 'Miércoles', hora: '17:00',
    duracion: 50, coachId: 6, coachNombre: 'Ana Torres', ubicacion: 'Studio A',
    cupoMax: 20, cupoActual: 2,
    descripcion: 'Sesión de potencia que combina fuerza funcional y cardio explosivo.',
  },
  {
    id: 8, nombre: 'Stride Fuerza', tipo: 'Stryde X', dia: 'Jueves', hora: '07:00',
    duracion: 50, coachId: 2, coachNombre: 'Carlos Méndez', ubicacion: 'Studio A',
    cupoMax: 20, cupoActual: 12,
    descripcion: 'Entrenamiento de fuerza funcional con énfasis en técnica y progresión.',
  },
  {
    id: 9, nombre: 'Slow Mindfulness', tipo: 'Slow', dia: 'Jueves', hora: '10:00',
    duracion: 60, coachId: 5, coachNombre: 'Sofía Reyes', ubicacion: 'Studio B',
    cupoMax: 15, cupoActual: 5,
    descripcion: 'Práctica de mindfulness en movimiento para conectar cuerpo y mente.',
  },
  {
    id: 10, nombre: 'Stride Cardio', tipo: 'Stryde X', dia: 'Viernes', hora: '08:00',
    duracion: 45, coachId: 6, coachNombre: 'Ana Torres', ubicacion: 'Studio A',
    cupoMax: 20, cupoActual: 14,
    descripcion: 'Cardio de alta intensidad con intervalos diseñados para quemar calorías.',
  },
  {
    id: 11, nombre: 'Slow Pilates', tipo: 'Slow', dia: 'Viernes', hora: '18:00',
    duracion: 60, coachId: 5, coachNombre: 'Sofía Reyes', ubicacion: 'Studio B',
    cupoMax: 15, cupoActual: 9,
    descripcion: 'Pilates de base consciente para fortalecer el core y mejorar la postura.',
  },
  {
    id: 12, nombre: 'Stride Weekend', tipo: 'Stryde X', dia: 'Sábado', hora: '09:00',
    duracion: 60, coachId: 2, coachNombre: 'Carlos Méndez', ubicacion: 'Studio A',
    cupoMax: 20, cupoActual: 6,
    descripcion: 'Sesión especial de fin de semana: alta energía para cerrar la semana fuerte.',
  },
  {
    id: 13, nombre: 'Slow Weekend', tipo: 'Slow', dia: 'Sábado', hora: '11:00',
    duracion: 60, coachId: 5, coachNombre: 'Sofía Reyes', ubicacion: 'Studio B',
    cupoMax: 15, cupoActual: 4,
    descripcion: 'Sesión especial de fin de semana: flujo restaurativo para recargar energías.',
  },
]

// ── Coaches ─────────────────────────────────────────────────────────────────
/**
 * @typedef {Object} Coach
 * @property {number}  id           - Identificador único (coincide con el id en mockUsers.js)
 * @property {string}  nombre       - Nombre completo
 * @property {string}  especialidad - Disciplinas que imparte
 * @property {string}  bio          - Descripción breve
 * @property {string|null} foto     - URL de foto (null si no tiene)
 * @property {boolean} activo       - Si aparece en la app
 */
export const COACHES_MOCK = [
  {
    id: 2, nombre: 'Carlos Méndez', especialidad: 'Stryde X',
    bio: 'Especialista en entrenamiento funcional y cardio de alta intensidad. Más de 8 años de experiencia.',
    foto: null, activo: true,
  },
  {
    id: 5, nombre: 'Sofía Reyes', especialidad: 'Slow',
    bio: 'Instructora certificada en pilates, meditación y movimiento consciente. Enfoque en bienestar integral.',
    foto: null, activo: true,
  },
  {
    id: 6, nombre: 'Ana Torres', especialidad: 'Stryde X',
    bio: 'Entrenadora personal con especialización en cardio y acondicionamiento físico de alto rendimiento.',
    foto: null, activo: true,
  },
]

// ── Paquetes ─────────────────────────────────────────────────────────────────
/**
 * @typedef {Object} Paquete
 * @property {number}   id        - Identificador único
 * @property {string}   nombre    - Nombre del paquete
 * @property {number}   precio    - Precio en MXN
 * @property {number}   clases    - Clases incluidas (0 = ilimitadas)
 * @property {string}   vigencia  - Texto de vigencia
 * @property {string}   categoria - 'mensual' | 'pack'
 * @property {string[]} beneficios - Lista de beneficios
 * @property {boolean}  destacado - Si se muestra como recomendado
 */
// Los datos de paquetes viven en paquetesStore.js hasta que se migre
// en una parte futura. PAQUETES_MOCK es la referencia del formato esperado.
export const PAQUETES_MOCK = []

// ── Usuarios de prueba ────────────────────────────────────────────────────────
// Los usuarios siguen en mockUsers.js (usado por AuthContext).
// Se migrarán aquí cuando se refactorice la capa de autenticación.
// No mover todavía — AuthContext depende de mockUsers directamente.

// ── Reservas ─────────────────────────────────────────────────────────────────
/**
 * Estados posibles de una reserva.
 */
export const ESTADOS_RESERVA = {
  CONFIRMADA:  'confirmada',
  CANCELADA:   'cancelada',
  COMPLETADA:  'completada',
  NO_ASISTIO:  'no_asistio',
}

/**
 * @typedef {Object} Reserva
 * @property {number}      id          - Identificador único
 * @property {number}      userId      - ID del cliente (ref a mockUsers)
 * @property {number}      claseId     - ID de la clase (ref a CLASES_MOCK)
 * @property {string}      claseNombre - Nombre de la clase (desnormalizado)
 * @property {string}      claseHora   - Hora "HH:MM"
 * @property {string}      claseDia    - Día de la semana
 * @property {string}      coachNombre - Nombre del coach (desnormalizado)
 * @property {string}      tipo        - 'Stryde X' | 'Slow'
 * @property {string|null} asiento     - Etiqueta del asiento elegido o null
 * @property {string}      estado      - Valor de ESTADOS_RESERVA
 * @property {string}      fecha       - ISO date "YYYY-MM-DD"
 */
export const RESERVAS_MOCK = [
  {
    id: 1, userId: 1, claseId: 2,
    claseNombre: 'Slow Pilates', claseHora: '09:00', claseDia: 'Lunes',
    coachNombre: 'Sofía Reyes', tipo: 'Slow',
    asiento: 'Fila 1, Asiento 2', estado: 'completada', fecha: '2026-04-14',
  },
  {
    id: 2, userId: 1, claseId: 5,
    claseNombre: 'Stride HIIT', claseHora: '19:00', claseDia: 'Martes',
    coachNombre: 'Carlos Méndez', tipo: 'Stryde X',
    asiento: 'Fila 2, Asiento 4', estado: 'completada', fecha: '2026-04-15',
  },
  {
    id: 3, userId: 1, claseId: 6,
    claseNombre: 'Slow Stretch', claseHora: '07:30', claseDia: 'Miércoles',
    coachNombre: 'Sofía Reyes', tipo: 'Slow',
    asiento: null, estado: 'cancelada', fecha: '2026-04-16',
  },
  {
    id: 4, userId: 1, claseId: 8,
    claseNombre: 'Stride Fuerza', claseHora: '07:00', claseDia: 'Jueves',
    coachNombre: 'Carlos Méndez', tipo: 'Stryde X',
    asiento: 'Fila 3, Asiento 1', estado: 'confirmada', fecha: '2026-04-24',
  },
  {
    id: 5, userId: 4, claseId: 1,
    claseNombre: 'Stride Power', claseHora: '07:00', claseDia: 'Lunes',
    coachNombre: 'Carlos Méndez', tipo: 'Stryde X',
    asiento: 'Fila 1, Asiento 3', estado: 'completada', fecha: '2026-04-21',
  },
]

// ── Productos ────────────────────────────────────────────────────────────────
/**
 * @typedef {Object} Producto
 * @property {number}      id        - Identificador único
 * @property {string}      nombre    - Nombre del producto
 * @property {string}      categoria - 'Accesorios' | 'Nutrición' | 'Equipo' | 'Ropa'
 * @property {number}      precio    - Precio en MXN
 * @property {number}      stock     - Unidades disponibles
 * @property {string|null} imagen    - URL de imagen o null
 * @property {boolean}     activo    - Si está disponible para venta
 */
export const PRODUCTOS_MOCK = [
  { id: 1, nombre: 'Botella Casa Scarlatta',      categoria: 'Accesorios', precio: 350,  stock: 24, imagen: null, activo: true },
  { id: 2, nombre: 'Toalla de microfibra',         categoria: 'Accesorios', precio: 180,  stock: 40, imagen: null, activo: true },
  { id: 3, nombre: 'Calcetines antideslizantes',   categoria: 'Accesorios', precio: 120,  stock: 60, imagen: null, activo: true },
  { id: 4, nombre: 'Proteína Whey Vainilla 1kg',   categoria: 'Nutrición',  precio: 750,  stock: 15, imagen: null, activo: true },
  { id: 5, nombre: 'Barra proteica chocolate',     categoria: 'Nutrición',  precio: 85,   stock: 80, imagen: null, activo: true },
  { id: 6, nombre: 'Mat de yoga premium',          categoria: 'Equipo',     precio: 950,  stock: 8,  imagen: null, activo: true },
  { id: 7, nombre: 'Ligas de resistencia (set)',   categoria: 'Equipo',     precio: 280,  stock: 20, imagen: null, activo: true },
  { id: 8, nombre: 'Camiseta Casa Scarlatta',      categoria: 'Ropa',       precio: 420,  stock: 30, imagen: null, activo: true },
  { id: 9, nombre: 'Sudadera Casa Scarlatta',      categoria: 'Ropa',       precio: 680,  stock: 18, imagen: null, activo: true },
]

// ── Transacciones ─────────────────────────────────────────────────────────────
/**
 * Tipos de movimiento financiero.
 */
export const TIPOS_TRANSACCION = {
  PAQUETE:   'paquete',
  PRODUCTO:  'producto',
  REEMBOLSO: 'reembolso',
  AJUSTE:    'ajuste',
}

/**
 * @typedef {Object} Transaccion
 * @property {string}      id          - Identificador único "tx-N"
 * @property {number}      userId      - ID del cliente (ref a mockUsers)
 * @property {string}      tipo        - Valor de TIPOS_TRANSACCION
 * @property {string}      concepto    - Descripción legible del movimiento
 * @property {number}      monto       - Monto en MXN (negativo = reembolso/cargo)
 * @property {string}      fecha       - ISO date "YYYY-MM-DD"
 * @property {string|null} metodoPago  - 'efectivo' | 'tarjeta' | null
 * @property {string|null} referencia  - Últimos 4 dígitos de tarjeta o null
 */
export const TRANSACCIONES_MOCK = [
  { id: 'tx-1', userId: 1, tipo: 'paquete',   concepto: 'Paquete Básico — 8 clases',           monto: 999,   fecha: '2025-11-10', metodoPago: 'efectivo', referencia: null },
  { id: 'tx-2', userId: 4, tipo: 'paquete',   concepto: 'Paquete Esencial — 16 clases',        monto: 1499,  fecha: '2025-12-05', metodoPago: 'tarjeta',  referencia: '3721' },
  { id: 'tx-3', userId: 7, tipo: 'paquete',   concepto: 'Paquete Premium — Ilimitadas',        monto: 1999,  fecha: '2026-01-15', metodoPago: 'tarjeta',  referencia: '8904' },
  { id: 'tx-4', userId: 1, tipo: 'producto',  concepto: 'Botella Casa Scarlatta',              monto: 350,   fecha: '2026-02-03', metodoPago: 'efectivo', referencia: null },
  { id: 'tx-5', userId: 4, tipo: 'producto',  concepto: 'Toalla de microfibra × 2',            monto: 360,   fecha: '2026-03-12', metodoPago: 'tarjeta',  referencia: '3721' },
  { id: 'tx-6', userId: 1, tipo: 'reembolso', concepto: 'Reembolso Slow Stretch cancelada',    monto: -120,  fecha: '2026-04-17', metodoPago: null,       referencia: null },
]

// ── Cortes de caja ────────────────────────────────────────────────────────────
/**
 * @typedef {Object} Corte
 * @property {string} id                  - Identificador único "corte-N"
 * @property {string} fecha               - ISO date "YYYY-MM-DD"
 * @property {string} periodo             - Etiqueta legible "Mes YYYY"
 * @property {number} ingresosPaquetes    - Total ingresos por paquetes en MXN
 * @property {number} ingresosProductos   - Total ingresos por productos en MXN
 * @property {number} totalIngresos       - Suma total en MXN
 * @property {number} totalReservas       - Número de reservas en el periodo
 * @property {number} totalCancelaciones  - Número de cancelaciones en el periodo
 * @property {number} ejecutadoPor        - userId del admin que cerró el corte
 * @property {string} estado              - 'cerrado' | 'abierto'
 */
export const CORTES_MOCK = [
  {
    id: 'corte-1',
    fecha: '2026-03-31',
    periodo: 'Marzo 2026',
    ingresosPaquetes: 15480,
    ingresosProductos: 2340,
    totalIngresos: 17820,
    totalReservas: 67,
    totalCancelaciones: 8,
    ejecutadoPor: 3,
    estado: 'cerrado',
  },
]

// ── Notificaciones ────────────────────────────────────────────────────────────
/**
 * Tipos de notificación para clasificar y filtrar en la UI.
 */
export const TIPOS_NOTIFICACION = {
  RESERVA:     'reserva',
  CANCELACION: 'cancelacion',
  PAQUETE:     'paquete',
  SISTEMA:     'sistema',
}

/**
 * @typedef {Object} Notificacion
 * @property {string}  id      - Identificador único "n-N"
 * @property {number}  userId  - ID del destinatario (ref a mockUsers)
 * @property {string}  tipo    - Valor de TIPOS_NOTIFICACION
 * @property {string}  titulo  - Título corto mostrado en la UI
 * @property {string}  mensaje - Cuerpo completo de la notificación
 * @property {boolean} leida   - Si el usuario ya la leyó
 * @property {string}  fecha   - ISO date "YYYY-MM-DD"
 */
export const NOTIFICACIONES_MOCK = [
  {
    id: 'n-1', userId: 1, tipo: 'reserva',
    titulo: 'Reserva confirmada',
    mensaje: 'Tu lugar en Stride Fuerza del Jueves 24 abr está confirmado.',
    leida: false, fecha: '2026-04-24',
  },
  {
    id: 'n-2', userId: 1, tipo: 'cancelacion',
    titulo: 'Clase cancelada',
    mensaje: 'Cancelaste tu lugar en Slow Stretch del Miércoles 16 abr.',
    leida: true, fecha: '2026-04-16',
  },
  {
    id: 'n-3', userId: 1, tipo: 'paquete',
    titulo: 'Quedan 2 clases',
    mensaje: 'Tu paquete Básico tiene 2 clases restantes. Renueva pronto.',
    leida: false, fecha: '2026-04-20',
  },
  {
    id: 'n-4', userId: 4, tipo: 'sistema',
    titulo: 'Bienvenida a Casa Scarlatta',
    mensaje: 'Tu cuenta está lista. ¡Reserva tu primera clase y empieza hoy!',
    leida: true, fecha: '2025-12-05',
  },
]
