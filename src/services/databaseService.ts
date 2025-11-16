/**
 * Servicio de Base de Datos para Digiautomatiza
 * Funciones para interactuar con Neon PostgreSQL vía Prisma
 */

import type { Cliente, Sesion, ServicioTipo, EstadoCliente, EstadoSesion, Contacto } from '../types';

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

// ============ CLIENTES ============

export async function obtenerClientes(): Promise<Cliente[]> {
  try {
    const response = await fetch(`${API_URL}/api/clientes`);
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
    const response = await fetch(`${API_URL}/api/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch(`${API_URL}/api/clientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch(`${API_URL}/api/clientes/${id}`, {
      method: 'DELETE',
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
    const response = await fetch(`${API_URL}/api/sesiones`);
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
    const response = await fetch(`${API_URL}/api/sesiones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch(`${API_URL}/api/sesiones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch(`${API_URL}/api/sesiones/${id}`, {
      method: 'DELETE',
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

