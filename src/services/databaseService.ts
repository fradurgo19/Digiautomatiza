/**
 * Servicio de Base de Datos para Digiautomatiza
 * Funciones para interactuar con Neon PostgreSQL vía Prisma
 */

import type {
  Cliente,
  Sesion,
  ServicioTipo,
  EstadoCliente,
  EstadoSesion,
  Contacto,
  Oportunidad,
  EtapaOportunidad,
} from '../types';

// URL del backend que manejará las operaciones de base de datos
// En producción usa la URL de Vercel, en desarrollo usa localhost
const API_URL = import.meta.env.VITE_BACKEND_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://digiautomatiza.vercel.app' 
    : 'http://localhost:3000');

const mapCliente = (cliente: any): Cliente => ({
  ...cliente,
  fechaRegistro: cliente?.fechaRegistro ? new Date(cliente.fechaRegistro) : new Date(),
});

const mapSesion = (sesion: any): Sesion => ({
  ...sesion,
  fecha: sesion?.fecha ? new Date(sesion.fecha) : new Date(),
  cliente: sesion?.cliente ? mapCliente(sesion.cliente) : sesion.cliente,
});

const mapOportunidad = (opp: any): Oportunidad => ({
  ...opp,
  fechaCierreEstimada: opp?.fechaCierreEstimada ? new Date(opp.fechaCierreEstimada) : undefined,
  createdAt: opp?.createdAt ? new Date(opp.createdAt) : undefined,
  updatedAt: opp?.updatedAt ? new Date(opp.updatedAt) : undefined,
  cliente: opp?.cliente ? mapCliente(opp.cliente) : opp.cliente,
});

export interface DashboardStats {
  totalClientes: number;
  clientesInteresados: number;
  sesionesProgramadas: number;
  sesionesCompletadas: number;
  scope: 'global' | 'usuario';
}

// ============ CLIENTES ============

export async function obtenerClientes(): Promise<Cliente[]> {
  try {
    const usuario = localStorage.getItem('usuario');
    const headers: Record<string, string> = {};
    if (usuario) {
      try {
        const parsed = JSON.parse(usuario);
        if (parsed?.id) headers['x-usuario-id'] = String(parsed.id);
        if (parsed?.rol) headers['x-usuario-rol'] = String(parsed.rol);
      } catch (e) {
        console.warn('No se pudo parsear usuario desde localStorage', e);
      }
    }

    const response = await fetch(`${API_URL}/api/clientes`, { headers });
    if (!response.ok) throw new Error('Error al obtener clientes');
    const data = await response.json();
    return (data.clientes || []).map(mapCliente);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return [];
  }
}

export async function crearCliente(clienteData: Omit<Cliente, 'id' | 'fechaRegistro'>): Promise<Cliente> {
  try {
    const usuario = localStorage.getItem('usuario');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (usuario) {
      try {
        const parsed = JSON.parse(usuario);
        if (parsed?.id) headers['x-usuario-id'] = String(parsed.id);
        if (parsed?.rol) headers['x-usuario-rol'] = String(parsed.rol);
      } catch (e) {
        console.warn('No se pudo parsear usuario desde localStorage', e);
      }
    }

    const response = await fetch(`${API_URL}/api/clientes`, {
      method: 'POST',
      headers,
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
    const usuario = localStorage.getItem('usuario');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (usuario) {
      try {
        const parsed = JSON.parse(usuario);
        if (parsed?.id) headers['x-usuario-id'] = String(parsed.id);
        if (parsed?.rol) headers['x-usuario-rol'] = String(parsed.rol);
      } catch (e) {
        console.warn('No se pudo parsear usuario desde localStorage', e);
      }
    }

    const response = await fetch(`${API_URL}/api/clientes/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(clienteData),
    });
    
    if (!response.ok) throw new Error('Error al actualizar cliente');
    const data = await response.json();
    return mapCliente(data.cliente);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    throw error;
  }
}

export async function eliminarCliente(id: string): Promise<void> {
  try {
    const usuario = localStorage.getItem('usuario');
    const headers: Record<string, string> = {};
    if (usuario) {
      try {
        const parsed = JSON.parse(usuario);
        if (parsed?.id) headers['x-usuario-id'] = String(parsed.id);
        if (parsed?.rol) headers['x-usuario-rol'] = String(parsed.rol);
      } catch (e) {
        console.warn('No se pudo parsear usuario desde localStorage', e);
      }
    }

    const response = await fetch(`${API_URL}/api/clientes/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Error al eliminar cliente');
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    throw error;
  }
}

// ============ SESIONES ============

export async function obtenerSesiones(): Promise<Sesion[]> {
  try {
    const usuario = localStorage.getItem('usuario');
    const headers: Record<string, string> = {};
    if (usuario) {
      try {
        const parsed = JSON.parse(usuario);
        if (parsed?.id) headers['x-usuario-id'] = String(parsed.id);
        if (parsed?.rol) headers['x-usuario-rol'] = String(parsed.rol);
      } catch (e) {
        console.warn('No se pudo parsear usuario desde localStorage', e);
      }
    }

    const response = await fetch(`${API_URL}/api/sesiones`, { headers });
    if (!response.ok) throw new Error('Error al obtener sesiones');
    const data = await response.json();
    return (data.sesiones || []).map(mapSesion);
  } catch (error) {
    console.error('Error al obtener sesiones:', error);
    return [];
  }
}

export async function crearSesion(sesionData: Omit<Sesion, 'id' | 'cliente'>): Promise<Sesion> {
  try {
    const usuario = localStorage.getItem('usuario');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (usuario) {
      try {
        const parsed = JSON.parse(usuario);
        if (parsed?.id) headers['x-usuario-id'] = String(parsed.id);
        if (parsed?.rol) headers['x-usuario-rol'] = String(parsed.rol);
      } catch (e) {
        console.warn('No se pudo parsear usuario desde localStorage', e);
      }
    }

    const response = await fetch(`${API_URL}/api/sesiones`, {
      method: 'POST',
      headers,
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
    const usuario = localStorage.getItem('usuario');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (usuario) {
      try {
        const parsed = JSON.parse(usuario);
        if (parsed?.id) headers['x-usuario-id'] = String(parsed.id);
        if (parsed?.rol) headers['x-usuario-rol'] = String(parsed.rol);
      } catch (e) {
        console.warn('No se pudo parsear usuario desde localStorage', e);
      }
    }

    const response = await fetch(`${API_URL}/api/sesiones/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(sesionData),
    });
    
    if (!response.ok) throw new Error('Error al actualizar sesión');
    const data = await response.json();
    return mapSesion(data.sesion);
  } catch (error) {
    console.error('Error al actualizar sesión:', error);
    throw error;
  }
}

export async function eliminarSesion(id: string): Promise<void> {
  try {
    const usuario = localStorage.getItem('usuario');
    const headers: Record<string, string> = {};
    if (usuario) {
      try {
        const parsed = JSON.parse(usuario);
        if (parsed?.id) headers['x-usuario-id'] = String(parsed.id);
        if (parsed?.rol) headers['x-usuario-rol'] = String(parsed.rol);
      } catch (e) {
        console.warn('No se pudo parsear usuario desde localStorage', e);
      }
    }

    const response = await fetch(`${API_URL}/api/sesiones/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Error al eliminar sesión');
  } catch (error) {
    console.error('Error al eliminar sesión:', error);
    throw error;
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

export async function obtenerOportunidades(params?: {
  etapa?: EtapaOportunidad | 'todas';
  clienteId?: string;
}): Promise<Oportunidad[]> {
  try {
    const usuario = localStorage.getItem('usuario');
    const headers: Record<string, string> = {};
    if (usuario) {
      try {
        const parsed = JSON.parse(usuario);
        if (parsed?.id) headers['x-usuario-id'] = String(parsed.id);
        if (parsed?.rol) headers['x-usuario-rol'] = String(parsed.rol);
      } catch (e) {
        console.warn('No se pudo parsear usuario desde localStorage', e);
      }
    }

    const query = new URLSearchParams();
    if (params?.etapa && params.etapa !== 'todas') {
      query.set('etapa', params.etapa);
    }
    if (params?.clienteId) {
      query.set('clienteId', params.clienteId);
    }

    const url = `${API_URL}/api/oportunidades${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await fetch(url, { headers });
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
    const usuario = localStorage.getItem('usuario');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (usuario) {
      try {
        const parsed = JSON.parse(usuario);
        if (parsed?.id) headers['x-usuario-id'] = String(parsed.id);
        if (parsed?.rol) headers['x-usuario-rol'] = String(parsed.rol);
      } catch (e) {
        console.warn('No se pudo parsear usuario desde localStorage', e);
      }
    }

    const response = await fetch(`${API_URL}/api/oportunidades`, {
      method: 'POST',
      headers,
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
    const usuario = localStorage.getItem('usuario');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (usuario) {
      try {
        const parsed = JSON.parse(usuario);
        if (parsed?.id) headers['x-usuario-id'] = String(parsed.id);
        if (parsed?.rol) headers['x-usuario-rol'] = String(parsed.rol);
      } catch (e) {
        console.warn('No se pudo parsear usuario desde localStorage', e);
      }
    }

    const response = await fetch(`${API_URL}/api/oportunidades/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(oportunidadData),
    });

    if (!response.ok) throw new Error('Error al actualizar oportunidad');
    const data = await response.json();
    return mapOportunidad(data.oportunidad);
  } catch (error) {
    console.error('Error al actualizar oportunidad:', error);
    throw error;
  }
}

export async function eliminarOportunidad(id: string): Promise<void> {
  try {
    const usuario = localStorage.getItem('usuario');
    const headers: Record<string, string> = {};
    if (usuario) {
      try {
        const parsed = JSON.parse(usuario);
        if (parsed?.id) headers['x-usuario-id'] = String(parsed.id);
        if (parsed?.rol) headers['x-usuario-rol'] = String(parsed.rol);
      } catch (e) {
        console.warn('No se pudo parsear usuario desde localStorage', e);
      }
    }

    const response = await fetch(`${API_URL}/api/oportunidades/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) throw new Error('Error al eliminar oportunidad');
  } catch (error) {
    console.error('Error al eliminar oportunidad:', error);
    throw error;
  }
}

// ============ STATS ============

export async function obtenerStatsDashboard(): Promise<DashboardStats | null> {
  try {
    const usuario = localStorage.getItem('usuario');
    const headers: Record<string, string> = {};
    if (usuario) {
      try {
        const parsed = JSON.parse(usuario);
        if (parsed?.id) headers['x-usuario-id'] = String(parsed.id);
        if (parsed?.rol) headers['x-usuario-rol'] = String(parsed.rol);
      } catch (e) {
        console.warn('No se pudo parsear usuario desde localStorage', e);
      }
    }

    const response = await fetch(`${API_URL}/api/stats`, { headers });
    if (!response.ok) throw new Error('Error al obtener estadísticas');
    const data = await response.json();
    return data as DashboardStats;
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return null;
  }
}

