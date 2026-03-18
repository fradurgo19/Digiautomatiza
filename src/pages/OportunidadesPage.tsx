import { useEffect, useState, type ReactNode } from 'react';
import Navbar from '../organisms/Navbar';
import Card from '../atoms/Card';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import Input from '../atoms/Input';
import TextArea from '../atoms/TextArea';
import Select from '../atoms/Select';
import Modal from '../molecules/Modal';
import type { Cliente, Oportunidad, EtapaOportunidad, ServicioTipo } from '../types';
import {
  obtenerClientes,
  obtenerOportunidades,
  crearOportunidad,
  actualizarOportunidad,
  eliminarOportunidad,
} from '../services/databaseService';
import Loading from '../atoms/Loading';

const etapas: { id: EtapaOportunidad; label: string; color: 'info' | 'primary' | 'success' | 'warning' | 'danger' }[] = [
  { id: 'nuevo', label: 'Nuevo', color: 'info' },
  { id: 'calificado', label: 'Calificado', color: 'primary' },
  { id: 'propuesta', label: 'Propuesta', color: 'warning' },
  { id: 'negociacion', label: 'Negociación', color: 'warning' },
  { id: 'ganado', label: 'Ganado', color: 'success' },
  { id: 'perdido', label: 'Perdido', color: 'danger' },
];

const origenOptions = [
  { value: 'lead-web', label: 'Lead Web' },
  { value: 'referenciado', label: 'Referenciado' },
  { value: 'frio', label: 'Contacto en frío' },
  { value: 'upsell', label: 'Upsell / Cross-sell' },
  { value: 'otro', label: 'Otro' },
];

const servicioOptions: { value: ServicioTipo; label: string }[] = [
  { value: 'paginas-web', label: 'Páginas Web' },
  { value: 'aplicaciones-web', label: 'Aplicaciones Web' },
  { value: 'chatbot-ia', label: 'Chatbot con IA' },
  { value: 'automatizacion', label: 'Automatización de Procesos' },
  { value: 'analisis-datos', label: 'Análisis de Datos / Power BI' },
  { value: 'sap-hana', label: 'Soporte SAP / HANA + Excel → SAP HANA' },
];

type OportunidadForm = {
  clienteId: string;
  titulo: string;
  descripcion: string;
  servicioPrincipal: ServicioTipo;
  etapa: EtapaOportunidad;
  origen: string;
  valorEstimado?: string;
  probabilidad?: string;
  fechaCierreEstimada?: string;
};

const initialForm: OportunidadForm = {
  clienteId: '',
  titulo: '',
  descripcion: '',
  servicioPrincipal: 'paginas-web',
  etapa: 'nuevo',
  origen: 'lead-web',
  valorEstimado: '',
  probabilidad: '',
  fechaCierreEstimada: '',
};

type ColumnaEtapa = { id: string; label: string; color: 'info' | 'primary' | 'success' | 'warning' | 'danger'; items: Oportunidad[] };

function OportunidadKanbanCard({
  opp,
  columna,
  etapas,
  servicioOptions,
  onMoverEtapa,
  onEditar,
  onEliminar,
}: Readonly<{
  opp: Oportunidad;
  columna: ColumnaEtapa;
  etapas: { id: EtapaOportunidad; label: string; color: 'info' | 'primary' | 'success' | 'warning' | 'danger' }[];
  servicioOptions: { value: ServicioTipo; label: string }[];
  onMoverEtapa: (opp: Oportunidad, etapaId: EtapaOportunidad) => void;
  onEditar: (opp: Oportunidad) => void;
  onEliminar: (id: string) => void;
}>) {
  const otrasEtapas = etapas.filter((e) => e.id !== opp.etapa).slice(0, 2);
  return (
    <Card
      className="bg-white border border-emerald-100 shadow-sm shadow-emerald-100/40"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-emerald-900">{opp.titulo}</p>
            <p className="text-xs text-gray-500">
              {opp.cliente.nombre} · {opp.cliente.empresa || opp.cliente.email}
            </p>
          </div>
          <Badge variant={columna.color}>{columna.label}</Badge>
        </div>
        <p className="text-xs text-gray-600 line-clamp-3">
          {opp.descripcion || 'Sin descripción aún.'}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600 mt-1">
          {opp.servicioPrincipal && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800 border border-emerald-100">
              💼 {servicioOptions.find((s) => s.value === opp.servicioPrincipal)?.label || opp.servicioPrincipal}
            </span>
          )}
          {opp.valorEstimado != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-lime-50 px-2 py-0.5 text-lime-800 border border-lime-100">
              💰 {opp.valorEstimado.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
            </span>
          )}
          {opp.probabilidad != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 border border-emerald-100">
              🎯 {opp.probabilidad}%
            </span>
          )}
          {opp.fechaCierreEstimada && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-gray-700 border border-gray-200">
              📅 {new Date(opp.fechaCierreEstimada).toLocaleDateString('es-ES')}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex flex-wrap gap-1">
            {otrasEtapas.map((e) => (
              <button
                key={e.id}
                onClick={() => onMoverEtapa(opp, e.id)}
                className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-100 text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                {e.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => onEditar(opp)}>
              Editar
            </Button>
            <Button size="sm" variant="danger" onClick={() => onEliminar(opp.id)}>
              ✕
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function OportunidadesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<OportunidadForm>(initialForm);
  const [oportunidadEditando, setOportunidadEditando] = useState<Oportunidad | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const [clientesRes, oportunidadesData] = await Promise.all([
          obtenerClientes(),
          obtenerOportunidades(),
        ]);
        setClientes(clientesRes.data);
        setOportunidades(oportunidadesData);
      } catch (error) {
        console.error('Error al cargar oportunidades:', error);
        setFetchError('No se pudieron cargar las oportunidades. Verifica la conexión con el backend.');
      } finally {
        setIsLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const oportunidadesPorEtapa = etapas.map((etapa) => ({
    ...etapa,
    items: oportunidades.filter((opp) => opp.etapa === etapa.id),
  }));

  const abrirModalNueva = () => {
    setOportunidadEditando(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const abrirModalEditar = (opp: Oportunidad) => {
    setOportunidadEditando(opp);
    setForm({
      clienteId: opp.clienteId,
      titulo: opp.titulo,
      descripcion: opp.descripcion || '',
      servicioPrincipal: opp.servicioPrincipal,
      etapa: opp.etapa,
      origen: opp.origen || 'lead-web',
      valorEstimado: opp.valorEstimado == null ? '' : String(opp.valorEstimado),
      probabilidad: opp.probabilidad == null ? '' : String(opp.probabilidad),
      fechaCierreEstimada: opp.fechaCierreEstimada
        ? new Date(opp.fechaCierreEstimada).toISOString().slice(0, 10)
        : '',
    });
    setIsModalOpen(true);
  };

  const handleGuardar = async () => {
    if (!form.clienteId || !form.titulo) {
      alert('Cliente y título son obligatorios');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<Oportunidad> = {
        clienteId: form.clienteId,
        titulo: form.titulo,
        descripcion: form.descripcion || undefined,
        servicioPrincipal: form.servicioPrincipal,
        etapa: form.etapa,
        origen: form.origen || undefined,
        valorEstimado: form.valorEstimado ? Number(form.valorEstimado) : undefined,
        probabilidad: form.probabilidad ? Number(form.probabilidad) : undefined,
        fechaCierreEstimada: form.fechaCierreEstimada ? new Date(form.fechaCierreEstimada) : undefined,
      };

      let opp: Oportunidad;
      if (oportunidadEditando) {
        opp = await actualizarOportunidad(oportunidadEditando.id, payload);
        setOportunidades((prev) => prev.map((o) => (o.id === opp.id ? opp : o)));
      } else {
        const createData: Omit<Oportunidad, 'id' | 'cliente' | 'createdAt' | 'updatedAt'> = {
          clienteId: form.clienteId,
          titulo: form.titulo,
          descripcion: form.descripcion || undefined,
          servicioPrincipal: form.servicioPrincipal,
          etapa: form.etapa,
          origen: form.origen || undefined,
          valorEstimado: form.valorEstimado ? Number(form.valorEstimado) : undefined,
          probabilidad: form.probabilidad ? Number(form.probabilidad) : undefined,
          fechaCierreEstimada: form.fechaCierreEstimada ? new Date(form.fechaCierreEstimada) : undefined,
        };
        opp = await crearOportunidad(createData);
        setOportunidades((prev) => [opp, ...prev]);
      }

      setIsModalOpen(false);
      setOportunidadEditando(null);
      setForm(initialForm);
    } catch (error) {
      console.error('Error al guardar oportunidad:', error);
      alert('No se pudo guardar la oportunidad. Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Seguro deseas eliminar esta oportunidad?')) return;
    try {
      await eliminarOportunidad(id);
      setOportunidades((prev) => prev.filter((o) => o.id !== id));
    } catch (error) {
      console.error('Error al eliminar oportunidad:', error);
      alert('No se pudo eliminar la oportunidad.');
    }
  };

  const handleMoverEtapa = async (opp: Oportunidad, nuevaEtapa: EtapaOportunidad) => {
    try {
      const actualizada = await actualizarOportunidad(opp.id, { etapa: nuevaEtapa });
      setOportunidades((prev) => prev.map((o) => (o.id === opp.id ? actualizada : o)));
    } catch (error) {
      console.error('Error al mover oportunidad:', error);
      alert('No se pudo actualizar la etapa de la oportunidad.');
    }
  };

  let mainContent: ReactNode;
  if (isLoading) {
    mainContent = (
      <div className="py-24 flex justify-center">
        <Loading text="Cargando oportunidades..." />
      </div>
    );
  } else if (fetchError) {
    mainContent = (
      <Card className="bg-white/80 border border-emerald-100 shadow-md shadow-emerald-100/40">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-red-700">No se pudieron cargar las oportunidades</h3>
            <p className="text-sm text-red-600">{fetchError}</p>
          </div>
        </div>
      </Card>
    );
  } else {
    mainContent = (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {oportunidadesPorEtapa.map((columna) => (
          <div
            key={columna.id}
            className="flex flex-col rounded-3xl bg-white/80 border border-emerald-100 shadow-md shadow-emerald-100/60 max-h-[70vh]"
          >
            <div className="px-4 py-3 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/80 rounded-t-3xl">
              <div>
                <p className="text-xs uppercase tracking-widest text-emerald-700 font-semibold">
                  {columna.label}
                </p>
                <p className="text-xs text-gray-500">{columna.items.length} oportunidades</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {columna.items.length === 0 && (
                <p className="text-xs text-gray-400 text-center mt-4">Sin oportunidades</p>
              )}
              {columna.items.length > 0 && columna.items.map((opp) => (
                <OportunidadKanbanCard
                  key={opp.id}
                  opp={opp}
                  columna={columna}
                  etapas={etapas}
                  servicioOptions={servicioOptions}
                  onMoverEtapa={handleMoverEtapa}
                  onEditar={abrirModalEditar}
                  onEliminar={handleEliminar}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-emerald-100 via-green-100 to-emerald-50 text-gray-900 overflow-hidden">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(16,94,67,0.08) 1px, transparent 0)',
          backgroundSize: '70px 70px',
        }}
      />
      <div className="absolute -top-32 -right-16 w-96 h-96 bg-emerald-400/30 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-16 w-80 h-80 bg-lime-300/30 blur-3xl rounded-full pointer-events-none" />

      <Navbar />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">
              <span className="bg-gradient-to-r from-emerald-700 via-lime-600 to-emerald-500 bg-clip-text text-transparent">
                Pipeline Comercial
              </span>
            </h1>
            <p className="text-gray-700 mt-2">
              Visualiza y gestiona las oportunidades de venta de Digiautomatiza por etapa.
            </p>
          </div>
          <Button variant="primary" onClick={abrirModalNueva}>
            + Nueva Oportunidad
          </Button>
        </div>

        {mainContent}

        {/* Modal Crear / Editar Oportunidad */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setOportunidadEditando(null);
            setForm(initialForm);
          }}
          title={oportunidadEditando ? 'Editar Oportunidad' : 'Nueva Oportunidad'}
          size="xl"
        >
          <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-emerald-100 to-white border border-emerald-200 p-6 shadow-lg shadow-emerald-100/60 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Cliente *"
                options={clientes.map((c) => ({
                  value: c.id,
                  label: c.empresa ? `${c.nombre} - ${c.empresa}` : c.nombre,
                }))}
                value={form.clienteId}
                onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
                fullWidth
                placeholder="Selecciona un cliente"
                className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                textClassName="!text-gray-900"
                labelClassName="text-emerald-800"
              />
              <Select
                label="Servicio principal"
                options={servicioOptions}
                value={form.servicioPrincipal}
                onChange={(e) =>
                  setForm({ ...form, servicioPrincipal: e.target.value as ServicioTipo })
                }
                fullWidth
                className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                textClassName="!text-gray-900"
                labelClassName="text-emerald-800"
              />
            </div>

            <Input
              label="Título de la oportunidad *"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              fullWidth
              placeholder="Ej: Automatización de flujo de facturación con SAP + Power BI"
              className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
              textClassName="text-gray-900 placeholder:text-emerald-500"
              labelClassName="text-emerald-800"
            />

            <TextArea
              label="Descripción"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              fullWidth
              rows={4}
              placeholder="Contexto del cliente, dolor actual, alcance de la solución propuesta..."
              className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
              textClassName="text-gray-900 placeholder:text-emerald-500"
              labelClassName="text-emerald-800"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Etapa"
                options={etapas.map((e) => ({ value: e.id, label: e.label }))}
                value={form.etapa}
                onChange={(e) => setForm({ ...form, etapa: e.target.value as EtapaOportunidad })}
                fullWidth
                className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                textClassName="!text-gray-900"
                labelClassName="text-emerald-800"
              />
              <Select
                label="Origen"
                options={origenOptions}
                value={form.origen}
                onChange={(e) => setForm({ ...form, origen: e.target.value })}
                fullWidth
                className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                textClassName="!text-gray-900"
                labelClassName="text-emerald-800"
              />
              <Input
                label="Valor estimado (COP)"
                type="number"
                value={form.valorEstimado}
                onChange={(e) => setForm({ ...form, valorEstimado: e.target.value })}
                fullWidth
                className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                textClassName="text-gray-900 placeholder:text-emerald-500"
                labelClassName="text-emerald-800"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Probabilidad (%)"
                type="number"
                value={form.probabilidad}
                onChange={(e) => setForm({ ...form, probabilidad: e.target.value })}
                fullWidth
                className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                textClassName="text-gray-900 placeholder:text-emerald-500"
                labelClassName="text-emerald-800"
              />
              <Input
                label="Fecha cierre estimada"
                type="date"
                value={form.fechaCierreEstimada}
                onChange={(e) => setForm({ ...form, fechaCierreEstimada: e.target.value })}
                fullWidth
                className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                textClassName="text-gray-900 placeholder:text-emerald-500"
                labelClassName="text-emerald-800"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setOportunidadEditando(null);
                  setForm(initialForm);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleGuardar}
                disabled={isSaving || !form.clienteId || !form.titulo}
              >
                {(() => {
                  if (isSaving) return 'Guardando...';
                  if (oportunidadEditando) return 'Actualizar Oportunidad';
                  return 'Crear Oportunidad';
                })()}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}


