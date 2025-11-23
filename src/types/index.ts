// Tipos para Cliente
export interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  empresa?: string;
  serviciosInteres: ServicioTipo[];
  estado: EstadoCliente;
  fechaRegistro: Date;
  notas?: string;
}

// Tipos de servicios ofrecidos
export type ServicioTipo = 
  | 'paginas-web'
  | 'aplicaciones-web'
  | 'chatbot-ia'
  | 'automatizacion'
  | 'analisis-datos'
  | 'sap-hana';

// Estados del cliente
export type EstadoCliente = 
  | 'nuevo'
  | 'contactado'
  | 'interesado'
  | 'en-negociacion'
  | 'convertido'
  | 'inactivo';

// Tipo para Sesión programada
export interface Sesion {
  id: string;
  clienteId: string;
  cliente: Cliente;
  fecha: Date;
  hora: string;
  servicio: ServicioTipo;
  estado: EstadoSesion;
  notas?: string;
  urlReunion?: string;
}

export type EstadoSesion = 
  | 'programada'
  | 'confirmada'
  | 'completada'
  | 'cancelada'
  | 'reprogramada';

// Etapas de una oportunidad comercial (pipeline)
export type EtapaOportunidad =
  | 'nuevo'
  | 'calificado'
  | 'propuesta'
  | 'negociacion'
  | 'ganado'
  | 'perdido';

// Tipo de Oportunidad Comercial
export interface Oportunidad {
  id: string;
  clienteId: string;
  cliente: Cliente;
  titulo: string;
  descripcion?: string;
  servicioPrincipal: ServicioTipo;
  etapa: EtapaOportunidad;
  origen?: string;
  valorEstimado?: number;
  probabilidad?: number; // 0-100
  fechaCierreEstimada?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Tipo para Contacto (formulario principal)
export interface Contacto {
  id?: string;
  nombre: string;
  email: string;
  telefono: string;
  empresa?: string;
  servicio: ServicioTipo;
  mensaje: string;
  fechaEnvio?: Date;
}

// Tipo para envío masivo de correos
export interface EnvioMasivoCorreo {
  destinatarios: string[];
  asunto: string;
  mensaje: string;
  archivosAdjuntos?: File[];
}

// Tipo para envío masivo de WhatsApp
export interface EnvioMasivoWhatsApp {
  numeros: string[];
  mensaje: string;
  archivos?: File[];
  // Opciones para plantillas de WhatsApp
  usarPlantilla?: boolean; // Si true, usa plantilla en lugar de texto libre
  nombrePlantilla?: string; // Nombre de la plantilla aprobada en YCloud
  idiomaPlantilla?: string; // Código de idioma de la plantilla (ej: "es", "es_CO", "en")
  parametrosPlantilla?: string[]; // Parámetros para rellenar la plantilla (ej: ["Juan", "Empresa XYZ"])
}

// Tipo para Usuario (personal comercial)
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'comercial';
  activo: boolean;
}

// Tipo para autenticación
export interface AuthState {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Tipo para Item de Propuesta
export interface ItemPropuesta {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

// Estados de Propuesta
export type EstadoPropuesta = 
  | 'borrador'
  | 'enviada'
  | 'revisada'
  | 'aceptada'
  | 'rechazada'
  | 'vencida';

// Tipo para archivo adjunto de propuesta
export interface AdjuntoPropuesta {
  url: string;
  nombre: string;
  tipo: 'imagen' | 'documento';
  tamaño?: number; // en bytes
}

// Tipo de Propuesta Comercial
export interface Propuesta {
  id: string;
  oportunidadId?: string;
  clienteId: string;
  cliente: Cliente;
  titulo: string;
  numeroPropuesta: string;
  servicio: ServicioTipo;
  estado: EstadoPropuesta;
  valorTotal: number;
  descuento?: number;
  valorFinal: number;
  validez: number; // días
  fechaVencimiento?: Date;
  contenido: string; // JSON stringificado
  items: ItemPropuesta[];
  especificaciones?: string; // Especificaciones del servicio
  adjuntos?: AdjuntoPropuesta[]; // Array de archivos adjuntos
  notas?: string;
  fechaEnvio?: Date;
  fechaAceptacion?: Date;
  fechaRechazo?: Date;
  motivoRechazo?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

