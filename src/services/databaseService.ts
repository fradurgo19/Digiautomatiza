/**
 * Servicio de Base de Datos para Digiautomatiza
 * Funciones para interactuar con Neon PostgreSQL vía Prisma
 */

import type {
  Cliente,
  Sesion,
  Contacto,
  Oportunidad,
  EtapaOportunidad,
  Propuesta,
} from '../types';

// URL del backend que manejará las operaciones de base de datos
// En producción usa el dominio de producción, en desarrollo usa localhost
const API_URL = import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.MODE === 'production'
    ? 'https://www.digiautomatiza.co'
    : 'http://localhost:3000');

// ============ HELPERS COMPARTIDOS ============

interface UsuarioAuth {
  id?: string;
  rol?: string;
}

function coerceAuthValue(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return undefined;
}

/** Parsea el usuario desde localStorage con manejo defensivo. */
function obtenerUsuarioLocal(): UsuarioAuth | null {
  const raw = localStorage.getItem('usuario');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { id?: unknown; rol?: unknown } | null;
    const id = coerceAuthValue(parsed?.id);
    const rol = coerceAuthValue(parsed?.rol);
    const out: UsuarioAuth = {};
    if (id) out.id = id;
    if (rol) out.rol = rol;
    return out;
  } catch (e) {
    console.warn('No se pudo parsear usuario desde localStorage', e);
    return null;
  }
}

/** Construye los headers HTTP base con autenticación opcional. */
function buildAuthHeaders(opts?: { json?: boolean }): Record<string, string> {
  const headers: Record<string, string> = {};
  if (opts?.json) headers['Content-Type'] = 'application/json';
  const usuario = obtenerUsuarioLocal();
  if (usuario?.id) headers['x-usuario-id'] = usuario.id;
  if (usuario?.rol) headers['x-usuario-rol'] = usuario.rol;
  return headers;
}

/** Devuelve los campos de auth para inyectar en el body (evita preflight OPTIONS). */
function obtenerAuthBodyFields(): { usuarioId?: string; rol?: string } {
  const usuario = obtenerUsuarioLocal();
  const out: { usuarioId?: string; rol?: string } = {};
  if (usuario?.id) out.usuarioId = usuario.id;
  if (usuario?.rol) out.rol = usuario.rol;
  return out;
}

/** Construye una URL agregando query string solo si tiene parámetros (sin plantillas anidadas). */
function buildUrl(base: string, query: URLSearchParams): string {
  const qs = query.toString();
  return qs ? `${base}?${qs}` : base;
}

/** Limpia un payload Partial<T> a un objeto plano omitiendo claves no enviables y convirtiendo Dates a ISO. */
function buildCleanUpdateData<T>(data: Partial<T>, omitKeys: ReadonlyArray<string>): Record<string, unknown> {
  const cleanData: Record<string, unknown> = { action: 'update' };
  const omit = new Set<string>(['id', ...omitKeys]);
  for (const key of Object.keys(data)) {
    if (omit.has(key)) continue;
    const value = (data as Record<string, unknown>)[key];
    if (value === undefined) continue;
    cleanData[key] = value instanceof Date ? value.toISOString() : value;
  }
  return cleanData;
}

/** Extrae el mensaje de error de un Response no-ok. */
async function readResponseError(response: Response): Promise<string> {
  const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
  return errorData.error || `Error ${response.status}: ${response.statusText}`;
}

// Alias para datos crudos provenientes del backend (campos opcionales y dinámicos).
type RawRecord = Record<string, unknown>;

const mapCliente = (cliente: RawRecord): Cliente => ({
  ...(cliente as unknown as Cliente),
  fechaRegistro: cliente?.fechaRegistro ? new Date(cliente.fechaRegistro as string) : new Date(),
  totalEmailsEnviados: (cliente?.totalEmailsEnviados as number) ?? 0,
  ultimoEmailEnviado: cliente?.ultimoEmailEnviado ? new Date(cliente.ultimoEmailEnviado as string) : undefined,
});

const mapSesion = (sesion: RawRecord): Sesion => ({
  ...(sesion as unknown as Sesion),
  fecha: sesion?.fecha ? new Date(sesion.fecha as string) : new Date(),
  cliente: sesion?.cliente ? mapCliente(sesion.cliente as RawRecord) : (sesion.cliente as Sesion['cliente']),
});

const mapOportunidad = (opp: RawRecord): Oportunidad => ({
  ...(opp as unknown as Oportunidad),
  fechaCierreEstimada: opp?.fechaCierreEstimada ? new Date(opp.fechaCierreEstimada as string) : undefined,
  createdAt: opp?.createdAt ? new Date(opp.createdAt as string) : undefined,
  updatedAt: opp?.updatedAt ? new Date(opp.updatedAt as string) : undefined,
  cliente: opp?.cliente ? mapCliente(opp.cliente as RawRecord) : (opp.cliente as Oportunidad['cliente']),
});

export interface DashboardStats {
  totalClientes: number;
  clientesInteresados: number;
  sesionesProgramadas: number;
  sesionesCompletadas: number;
  scope: 'global' | 'usuario';
}

// ============ CLIENTES ============

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  filtroNombre?: string;
  filtroEmail?: string;
  filtroTelefono?: string;
  filtroEmpresa?: string;
  filtroEstado?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

function buildClientesQueryParams(params?: PaginationParams): URLSearchParams {
  const query = new URLSearchParams();
  if (!params) return query;
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.filtroNombre) query.set('filtroNombre', params.filtroNombre);
  if (params.filtroEmail) query.set('filtroEmail', params.filtroEmail);
  if (params.filtroTelefono) query.set('filtroTelefono', params.filtroTelefono);
  if (params.filtroEmpresa) query.set('filtroEmpresa', params.filtroEmpresa);
  if (params.filtroEstado) query.set('filtroEstado', params.filtroEstado);
  return query;
}

const PAGINACION_VACIA = {
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

export async function obtenerClientes(params?: PaginationParams): Promise<PaginatedResponse<Cliente>> {
  try {
    const url = buildUrl(`${API_URL}/api/clientes`, buildClientesQueryParams(params));
    const response = await fetch(url, { headers: buildAuthHeaders() });
    if (!response.ok) throw new Error('Error al obtener clientes');
    const data = await response.json();

    const clientes = (data.clientes || []).map(mapCliente);
    return {
      data: clientes,
      pagination: data.pagination || {
        ...PAGINACION_VACIA,
        page: 1,
        limit: 50,
        total: clientes.length,
        totalPages: 1,
      },
    };
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return { data: [], pagination: PAGINACION_VACIA };
  }
}

export async function crearCliente(clienteData: Omit<Cliente, 'id' | 'fechaRegistro'>): Promise<Cliente> {
  try {
    const response = await fetch(`${API_URL}/api/clientes`, {
      method: 'POST',
      headers: buildAuthHeaders({ json: true }),
      body: JSON.stringify(clienteData),
    });
    if (!response.ok) throw new Error('Error al crear cliente');
    const data = await response.json();
    return mapCliente(data.cliente);
  } catch (error) {
    console.error('Error al crear cliente:', error);
    throw error;
  }
}

export async function actualizarCliente(id: string, clienteData: Partial<Cliente>): Promise<Cliente> {
  try {
    const cleanData = {
      ...buildCleanUpdateData(clienteData, ['fechaRegistro', 'createdAt', 'updatedAt']),
      ...obtenerAuthBodyFields(),
    };
    const response = await fetch(`${API_URL}/api/clientes?id=${id}&action=update`, {
      method: 'POST',
      headers: buildAuthHeaders({ json: true }),
      body: JSON.stringify(cleanData),
    });
    if (!response.ok) {
      const errorMessage = await readResponseError(response);
      console.error('❌ Error en respuesta:', errorMessage);
      throw new Error(errorMessage);
    }
    const data = await response.json();
    return mapCliente(data.cliente);
  } catch (error) {
    console.error('❌ Error al actualizar cliente:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al actualizar cliente';
    throw new Error(errorMessage);
  }
}

export async function eliminarCliente(id: string): Promise<void> {
  try {
    const body = { action: 'delete', ...obtenerAuthBodyFields() };
    const response = await fetch(`${API_URL}/api/clientes?id=${id}&action=delete`, {
      method: 'POST',
      headers: buildAuthHeaders({ json: true }),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorMessage = await readResponseError(response);
      console.error('❌ Error en respuesta:', errorMessage);
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('❌ Error al eliminar cliente:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al eliminar cliente';
    throw new Error(errorMessage);
  }
}

// ============ SESIONES ============

export async function obtenerSesiones(): Promise<Sesion[]> {
  try {
    const response = await fetch(`${API_URL}/api/sesiones`, { headers: buildAuthHeaders() });
    if (!response.ok) throw new Error('Error al obtener sesiones');
    const data = await response.json();
    return (data.sesiones || []).map(mapSesion);
  } catch (error) {
    console.error('Error al obtener sesiones:', error);
    return [];
  }
}

export async function crearSesion(sesionData: Omit<Sesion, 'id' | 'cliente'> & { crearEnCalendario?: boolean }): Promise<Sesion> {
  try {
    const response = await fetch(`${API_URL}/api/sesiones`, {
      method: 'POST',
      headers: buildAuthHeaders({ json: true }),
      body: JSON.stringify(sesionData),
    });
    if (!response.ok) throw new Error('Error al crear sesión');
    const data = await response.json();
    return mapSesion(data.sesion);
  } catch (error) {
    console.error('Error al crear sesión:', error);
    throw error;
  }
}

export async function actualizarSesion(id: string, sesionData: Partial<Sesion>): Promise<Sesion> {
  try {
    const cleanData = {
      ...buildCleanUpdateData(sesionData, ['createdAt', 'updatedAt', 'cliente']),
      ...obtenerAuthBodyFields(),
    };
    const response = await fetch(`${API_URL}/api/sesiones?id=${id}&action=update`, {
      method: 'POST',
      headers: buildAuthHeaders({ json: true }),
      body: JSON.stringify(cleanData),
    });
    if (!response.ok) {
      const errorMessage = await readResponseError(response);
      console.error('❌ Error en respuesta:', errorMessage);
      throw new Error(errorMessage);
    }
    const data = await response.json();
    return mapSesion(data.sesion);
  } catch (error) {
    console.error('❌ Error al actualizar sesión:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al actualizar sesión';
    throw new Error(errorMessage);
  }
}

export async function eliminarSesion(id: string): Promise<void> {
  try {
    const body = { action: 'delete', ...obtenerAuthBodyFields() };
    const response = await fetch(`${API_URL}/api/sesiones?id=${id}&action=delete`, {
      method: 'POST',
      headers: buildAuthHeaders({ json: true }),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorMessage = await readResponseError(response);
      console.error('❌ Error en respuesta:', errorMessage);
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('❌ Error al eliminar sesión:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al eliminar sesión';
    throw new Error(errorMessage);
  }
}

// ============ CONTACTOS ============

export async function guardarContacto(contacto: Omit<Contacto, 'id' | 'fechaEnvio'>): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/contactos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contacto),
    });
    
    if (!response.ok) throw new Error('Error al guardar contacto');
  } catch (error) {
    console.error('Error al guardar contacto:', error);
    throw error;
  }
}

export async function obtenerContactos(): Promise<Contacto[]> {
  try {
    const response = await fetch(`${API_URL}/api/contactos`);
    if (!response.ok) throw new Error('Error al obtener contactos');
    const data = await response.json();
    return data.contactos;
  } catch (error) {
    console.error('Error al obtener contactos:', error);
    return [];
  }
}

// ============ OPORTUNIDADES ============

function buildOportunidadesQuery(params?: { etapa?: EtapaOportunidad | 'todas'; clienteId?: string }): URLSearchParams {
  const query = new URLSearchParams();
  if (!params) return query;
  if (params.etapa && params.etapa !== 'todas') query.set('etapa', params.etapa);
  if (params.clienteId) query.set('clienteId', params.clienteId);
  return query;
}

export async function obtenerOportunidades(params?: {
  etapa?: EtapaOportunidad | 'todas';
  clienteId?: string;
}): Promise<Oportunidad[]> {
  try {
    const url = buildUrl(`${API_URL}/api/oportunidades`, buildOportunidadesQuery(params));
    const response = await fetch(url, { headers: buildAuthHeaders() });
    if (!response.ok) throw new Error('Error al obtener oportunidades');
    const data = await response.json();
    return (data.oportunidades || []).map(mapOportunidad);
  } catch (error) {
    console.error('Error al obtener oportunidades:', error);
    return [];
  }
}

export async function crearOportunidad(
  oportunidadData: Omit<Oportunidad, 'id' | 'cliente' | 'createdAt' | 'updatedAt'>
): Promise<Oportunidad> {
  try {
    const response = await fetch(`${API_URL}/api/oportunidades`, {
      method: 'POST',
      headers: buildAuthHeaders({ json: true }),
      body: JSON.stringify(oportunidadData),
    });
    if (!response.ok) throw new Error('Error al crear oportunidad');
    const data = await response.json();
    return mapOportunidad(data.oportunidad);
  } catch (error) {
    console.error('Error al crear oportunidad:', error);
    throw error;
  }
}

export async function actualizarOportunidad(
  id: string,
  oportunidadData: Partial<Oportunidad>
): Promise<Oportunidad> {
  try {
    const cleanData = {
      ...buildCleanUpdateData(oportunidadData, ['createdAt', 'updatedAt', 'cliente']),
      ...obtenerAuthBodyFields(),
    };
    const response = await fetch(`${API_URL}/api/oportunidades?id=${id}&action=update`, {
      method: 'POST',
      headers: buildAuthHeaders({ json: true }),
      body: JSON.stringify(cleanData),
    });
    if (!response.ok) {
      const errorMessage = await readResponseError(response);
      console.error('❌ Error en respuesta:', errorMessage);
      throw new Error(errorMessage);
    }
    const data = await response.json();
    return mapOportunidad(data.oportunidad);
  } catch (error) {
    console.error('❌ Error al actualizar oportunidad:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al actualizar oportunidad';
    throw new Error(errorMessage);
  }
}

export async function eliminarOportunidad(id: string): Promise<void> {
  try {
    const body = { action: 'delete', ...obtenerAuthBodyFields() };
    const response = await fetch(`${API_URL}/api/oportunidades?id=${id}&action=delete`, {
      method: 'POST',
      headers: buildAuthHeaders({ json: true }),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorMessage = await readResponseError(response);
      console.error('❌ Error en respuesta:', errorMessage);
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('❌ Error al eliminar oportunidad:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al eliminar oportunidad';
    throw new Error(errorMessage);
  }
}

// ============ STATS ============

export async function obtenerStatsDashboard(): Promise<DashboardStats | null> {
  try {
    const response = await fetch(`${API_URL}/api/clientes?stats=true`, { headers: buildAuthHeaders() });
    if (!response.ok) {
      const errorMessage = await readResponseError(response);
      console.error('❌ Error al obtener estadísticas:', errorMessage);
      throw new Error(errorMessage);
    }
    const data = await response.json();
    return data as DashboardStats;
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    // Retornar null en lugar de lanzar error para que el componente pueda manejarlo
    return null;
  }
}

// ==================== PROPUESTAS ====================

export async function obtenerPropuestas(): Promise<Propuesta[]> {
  try {
    const response = await fetch(`${API_URL}/api/propuestas`, {
      method: 'GET',
      headers: buildAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error al obtener propuestas');
    const data = await response.json();
    return data.propuestas.map(mapPropuesta);
  } catch (error) {
    console.error('Error al obtener propuestas:', error);
    throw error;
  }
}

export async function crearPropuesta(propuestaData: Omit<Propuesta, 'id' | 'cliente' | 'createdAt' | 'updatedAt'>): Promise<Propuesta> {
  try {
    const response = await fetch(`${API_URL}/api/propuestas`, {
      method: 'POST',
      headers: buildAuthHeaders({ json: true }),
      body: JSON.stringify(propuestaData),
    });
    if (!response.ok) throw new Error('Error al crear propuesta');
    const data = await response.json();
    return mapPropuesta(data.propuesta);
  } catch (error) {
    console.error('Error al crear propuesta:', error);
    throw error;
  }
}

export async function actualizarPropuesta(id: string, propuestaData: Partial<Propuesta>): Promise<Propuesta> {
  try {
    const response = await fetch(`${API_URL}/api/propuestas?id=${id}&action=update`, {
      method: 'POST',
      headers: buildAuthHeaders({ json: true }),
      body: JSON.stringify(propuestaData),
    });
    if (!response.ok) throw new Error('Error al actualizar propuesta');
    const data = await response.json();
    return mapPropuesta(data.propuesta);
  } catch (error) {
    console.error('Error al actualizar propuesta:', error);
    throw error;
  }
}

export async function eliminarPropuesta(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/propuestas?id=${id}&action=delete`, {
      method: 'POST',
      headers: buildAuthHeaders({ json: true }),
    });
    if (!response.ok) throw new Error('Error al eliminar propuesta');
  } catch (error) {
    console.error('Error al eliminar propuesta:', error);
    throw error;
  }
}

function parseTareasProyecto(valor: unknown): unknown {
  if (!valor || valor === 'null') return undefined;
  if (typeof valor === 'string') {
    if (valor.trim() === '') return undefined;
    try {
      return JSON.parse(valor);
    } catch {
      return undefined;
    }
  }
  return valor;
}

function parseItemsPropuesta(valor: unknown): Propuesta['items'] {
  if (typeof valor === 'string') {
    try {
      const parsed = JSON.parse(valor);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(valor) ? (valor as Propuesta['items']) : [];
}

function parseAdjuntosPropuesta(valor: unknown): unknown {
  try {
    if (!valor || valor === 'null' || valor === '') return undefined;
    if (typeof valor === 'string') {
      try {
        const parsed = JSON.parse(valor);
        if (Array.isArray(parsed)) return parsed;
        return parsed ? [parsed] : undefined;
      } catch (parseError) {
        console.error('❌ mapPropuesta - Error al parsear JSON string de adjuntos:', parseError);
        return undefined;
      }
    }
    if (Array.isArray(valor)) return valor;
    if (typeof valor === 'object') return [valor];
    return undefined;
  } catch (error) {
    console.error('❌ mapPropuesta - Error al parsear adjuntos:', error);
    return undefined;
  }
}

function mapPropuesta(data: RawRecord): Propuesta {
  return {
    id: data.id as string,
    oportunidadId: (data.oportunidadId as string) || undefined,
    clienteId: data.clienteId as string,
    cliente: mapCliente(data.cliente as RawRecord),
    titulo: data.titulo as string,
    numeroPropuesta: data.numeroPropuesta as string,
    servicio: data.servicio as Propuesta['servicio'],
    estado: data.estado as Propuesta['estado'],
    estadoAprobacion: (data.estadoAprobacion as Propuesta['estadoAprobacion']) || 'Sin Aprobar',
    fechaInicio: data.fechaInicio ? new Date(data.fechaInicio as string) : undefined,
    fechaEntrega: data.fechaEntrega ? new Date(data.fechaEntrega as string) : undefined,
    tareasProyecto: parseTareasProyecto(data.tareasProyecto) as Propuesta['tareasProyecto'],
    valorTotal: Number.parseFloat(data.valorTotal as string) || 0,
    descuento: data.descuento ? Number.parseFloat(data.descuento as string) : undefined,
    valorFinal: Number.parseFloat(data.valorFinal as string) || 0,
    validez: (data.validez as number) || 30,
    fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento as string) : undefined,
    contenido: typeof data.contenido === 'string' ? data.contenido : JSON.stringify(data.contenido),
    items: parseItemsPropuesta(data.items),
    especificaciones: (data.especificaciones as string) || undefined,
    adjuntos: parseAdjuntosPropuesta(data.adjuntos) as Propuesta['adjuntos'],
    notas: (data.notas as string) || undefined,
    fechaEnvio: data.fechaEnvio ? new Date(data.fechaEnvio as string) : undefined,
    fechaAceptacion: data.fechaAceptacion ? new Date(data.fechaAceptacion as string) : undefined,
    fechaRechazo: data.fechaRechazo ? new Date(data.fechaRechazo as string) : undefined,
    motivoRechazo: (data.motivoRechazo as string) || undefined,
    createdAt: data.createdAt ? new Date(data.createdAt as string) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt as string) : new Date(),
  };
}

