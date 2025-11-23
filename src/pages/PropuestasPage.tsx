import { useState, useEffect } from 'react';
import Navbar from '../organisms/Navbar';
import Card from '../atoms/Card';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Select from '../atoms/Select';
import TextArea from '../atoms/TextArea';
import Modal from '../molecules/Modal';
import Badge from '../atoms/Badge';
import Loading from '../atoms/Loading';
import { Propuesta, Cliente, Oportunidad, ServicioTipo, ItemPropuesta, EstadoPropuesta } from '../types';
import {
  obtenerPropuestas,
  crearPropuesta,
  actualizarPropuesta,
  eliminarPropuesta,
  obtenerClientes,
  obtenerOportunidades,
} from '../services/databaseService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const estadosPropuesta: { value: EstadoPropuesta; label: string; color: 'info' | 'primary' | 'success' | 'warning' | 'danger' }[] = [
  { value: 'borrador', label: 'Borrador', color: 'info' },
  { value: 'enviada', label: 'Enviada', color: 'primary' },
  { value: 'revisada', label: 'Revisada', color: 'warning' },
  { value: 'aceptada', label: 'Aceptada', color: 'success' },
  { value: 'rechazada', label: 'Rechazada', color: 'danger' },
  { value: 'vencida', label: 'Vencida', color: 'danger' },
];

const serviciosOptions: { value: ServicioTipo; label: string; icon: string; descripcion: string }[] = [
  { 
    value: 'paginas-web', 
    label: 'Páginas Web', 
    icon: '🌐',
    descripcion: 'Diseño y desarrollo de sitios web modernos, responsivos y optimizados para SEO con las últimas tecnologías.'
  },
  { 
    value: 'aplicaciones-web', 
    label: 'Aplicaciones Web', 
    icon: '💻',
    descripcion: 'Desarrollo de aplicaciones web personalizadas con Power Apps, React, Node.js, TypeScript y Java.'
  },
  { 
    value: 'chatbot-ia', 
    label: 'Chatbot con IA', 
    icon: '🤖',
    descripcion: 'Construcción de chatbots inteligentes con agentes de IA para mejorar la atención al cliente 24/7.'
  },
  { 
    value: 'automatizacion', 
    label: 'Automatización', 
    icon: '⚙️',
    descripcion: 'Automatización de procesos empresariales con N8N y Power Automate para optimizar tu operación.'
  },
  { 
    value: 'analisis-datos', 
    label: 'Análisis de Datos', 
    icon: '📊',
    descripcion: 'Análisis y visualización de datos empresariales con Power BI para toma de decisiones estratégicas.'
  },
  { 
    value: 'sap-hana', 
    label: 'Soporte SAP ERP & HANA', 
    icon: '🏭',
    descripcion: 'Automatizamos procesos críticos conectando Excel, SAP ERP y SAP HANA para eliminar tareas manuales.'
  },
];

export default function PropuestasPage() {
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [propuestaPreview, setPropuestaPreview] = useState<Propuesta | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<EstadoPropuesta | 'todos'>('todos');

  const [nuevaPropuesta, setNuevaPropuesta] = useState({
    oportunidadId: '',
    clienteId: '',
    titulo: '',
    servicio: '' as ServicioTipo,
    valorTotal: '',
    descuento: '',
    validez: '30',
    notas: '',
  });

  const [items, setItems] = useState<ItemPropuesta[]>([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setIsLoading(true);
    try {
      const [propuestasData, clientesData, oportunidadesData] = await Promise.all([
        obtenerPropuestas(),
        obtenerClientes(),
        obtenerOportunidades(),
      ]);
      setPropuestas(propuestasData);
      setClientes(clientesData);
      setOportunidades(oportunidadesData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar los datos. Por favor, recarga la página.');
    } finally {
      setIsLoading(false);
    }
  };

  const calcularTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const descuento = parseFloat(nuevaPropuesta.descuento) || 0;
    return {
      subtotal,
      descuento,
      total: subtotal - descuento,
    };
  };

  const agregarItem = () => {
    const nuevoItem: ItemPropuesta = {
      id: Date.now().toString(),
      descripcion: '',
      cantidad: 1,
      precioUnitario: 0,
      subtotal: 0,
    };
    setItems([...items, nuevoItem]);
  };

  const actualizarItem = (id: string, campo: keyof ItemPropuesta, valor: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const actualizado = { ...item, [campo]: valor };
        if (campo === 'cantidad' || campo === 'precioUnitario') {
          actualizado.subtotal = actualizado.cantidad * actualizado.precioUnitario;
        }
        return actualizado;
      }
      return item;
    }));
  };

  const eliminarItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleGuardarPropuesta = async () => {
    if (!nuevaPropuesta.clienteId || !nuevaPropuesta.titulo || !nuevaPropuesta.servicio) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    if (items.length === 0) {
      alert('Por favor agrega al menos un item a la propuesta.');
      return;
    }

    const { total } = calcularTotal();
    if (total <= 0) {
      alert('El valor total debe ser mayor a cero.');
      return;
    }

    setIsSaving(true);
    try {
      const servicioInfo = serviciosOptions.find(s => s.value === nuevaPropuesta.servicio);
      
      const contenido = {
        introduccion: `Estimado/a ${clientes.find(c => c.id === nuevaPropuesta.clienteId)?.nombre || 'Cliente'},`,
        servicio: servicioInfo?.label || nuevaPropuesta.servicio,
        descripcionServicio: servicioInfo?.descripcion || '',
        beneficios: [
          'Solución personalizada según sus necesidades',
          'Soporte técnico especializado',
          'Implementación rápida y eficiente',
          'Resultados medibles y garantizados',
        ],
        conclusion: 'Estamos comprometidos con su éxito y esperamos poder trabajar juntos en este proyecto.',
      };

      const propuestaData = {
        oportunidadId: nuevaPropuesta.oportunidadId || undefined,
        clienteId: nuevaPropuesta.clienteId,
        titulo: nuevaPropuesta.titulo,
        servicio: nuevaPropuesta.servicio,
        valorTotal: calcularTotal().subtotal,
        descuento: calcularTotal().descuento,
        valorFinal: total,
        validez: parseInt(nuevaPropuesta.validez) || 30,
        contenido: JSON.stringify(contenido),
        items: items,
        notas: nuevaPropuesta.notas || undefined,
      };

      const nueva = await crearPropuesta(propuestaData);
      setPropuestas([nueva, ...propuestas]);
      setIsModalOpen(false);
      resetFormulario();
      
      // Si hay oportunidad asociada, actualizar su etapa
      if (nuevaPropuesta.oportunidadId) {
        // Esto se puede hacer automáticamente en el backend
      }
      
      alert('✅ Propuesta creada exitosamente');
    } catch (error) {
      console.error('Error al crear propuesta:', error);
      alert('Error al crear la propuesta. Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetFormulario = () => {
    setNuevaPropuesta({
      oportunidadId: '',
      clienteId: '',
      titulo: '',
      servicio: '' as ServicioTipo,
      valorTotal: '',
      descuento: '',
      validez: '30',
      notas: '',
    });
    setItems([]);
  };

  const handleVerPropuesta = (propuesta: Propuesta) => {
    setPropuestaPreview(propuesta);
    setIsPreviewModalOpen(true);
  };

  const handleExportarPDF = async (propuesta: Propuesta) => {
    try {
      const elemento = document.getElementById('propuesta-preview');
      if (!elemento) {
        alert('Error al generar PDF. Por favor, intenta nuevamente.');
        return;
      }

      const canvas = await html2canvas(elemento, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Propuesta-${propuesta.numeroPropuesta}.pdf`);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Error al exportar PDF. Por favor, intenta nuevamente.');
    }
  };

  const formatearMoneda = (valor: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(valor);
  };

  const formatearFecha = (fecha?: Date): string => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const propuestasFiltradas = filtroEstado === 'todos'
    ? propuestas
    : propuestas.filter(p => p.estado === filtroEstado);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-green-100 to-emerald-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-emerald-100 via-green-100 to-emerald-50 text-gray-900 overflow-hidden">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <Card className="bg-white/85 border border-emerald-100 shadow-lg shadow-emerald-100/50 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">📄 Propuestas y Cotizaciones</h1>
              <p className="text-gray-600">
                Genera propuestas profesionales y gestiona tus cotizaciones
              </p>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Select
                options={[
                  { value: 'todos', label: 'Todos los estados' },
                  ...estadosPropuesta.map(e => ({ value: e.value, label: e.label }))
                ]}
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as EstadoPropuesta | 'todos')}
                className="bg-white/90 border-emerald-300"
              />
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                + Nueva Propuesta
              </Button>
            </div>
          </div>
        </Card>

        {/* Lista de Propuestas */}
        {propuestasFiltradas.length === 0 ? (
          <Card className="bg-white/85 border border-emerald-100">
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📄</span>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No hay propuestas
              </h3>
              <p className="text-gray-600 mb-4">
                Crea tu primera propuesta profesional para comenzar
              </p>
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                + Crear Propuesta
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {propuestasFiltradas.map((propuesta) => {
              const estadoInfo = estadosPropuesta.find(e => e.value === propuesta.estado);
              const servicioInfo = serviciosOptions.find(s => s.value === propuesta.servicio);
              
              return (
                <Card key={propuesta.id} className="bg-white/85 border border-emerald-100 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">
                          {propuesta.titulo}
                        </h3>
                        <Badge variant={estadoInfo?.color || 'info'}>
                          {estadoInfo?.label || propuesta.estado}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700 mb-3">
                        <div>
                          <p><strong>Cliente:</strong> {propuesta.cliente.nombre}</p>
                          <p><strong>Empresa:</strong> {propuesta.cliente.empresa || 'N/A'}</p>
                        </div>
                        <div>
                          <p><strong>Servicio:</strong> {servicioInfo?.icon} {servicioInfo?.label}</p>
                          <p><strong>Número:</strong> {propuesta.numeroPropuesta}</p>
                        </div>
                        <div>
                          <p><strong>Valor:</strong> {formatearMoneda(propuesta.valorFinal)}</p>
                          <p><strong>Vence:</strong> {formatearFecha(propuesta.fechaVencimiento)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleVerPropuesta(propuesta)}
                      >
                        👁️ Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportarPDF(propuesta)}
                      >
                        📥 PDF
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal Crear Propuesta */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            resetFormulario();
          }}
          title="Nueva Propuesta"
          size="xl"
        >
          <div className="space-y-4 max-h-[80vh] overflow-y-auto">
            <Select
              label="Oportunidad (Opcional)"
              options={[
                { value: '', label: 'Sin oportunidad asociada' },
                ...oportunidades.map(o => ({ 
                  value: o.id, 
                  label: `${o.titulo} - ${o.cliente.nombre} (${formatearMoneda(o.valorEstimado || 0)})` 
                }))
              ]}
              value={nuevaPropuesta.oportunidadId}
              onChange={(e) => {
                setNuevaPropuesta({ ...nuevaPropuesta, oportunidadId: e.target.value });
                if (e.target.value) {
                  const oportunidad = oportunidades.find(o => o.id === e.target.value);
                  if (oportunidad) {
                    setNuevaPropuesta(prev => ({
                      ...prev,
                      clienteId: oportunidad.clienteId,
                      servicio: oportunidad.servicioPrincipal,
                      titulo: oportunidad.titulo,
                    }));
                  }
                }
              }}
              fullWidth
              className="bg-white/90 border-emerald-300"
            />

            <Select
              label="Cliente *"
              options={clientes.map(c => ({ value: c.id, label: `${c.nombre} - ${c.empresa || c.email}` }))}
              value={nuevaPropuesta.clienteId}
              onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, clienteId: e.target.value })}
              fullWidth
              className="bg-white/90 border-emerald-300"
            />

            <Input
              label="Título de la Propuesta *"
              value={nuevaPropuesta.titulo}
              onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, titulo: e.target.value })}
              fullWidth
              placeholder="Ej: Desarrollo de Página Web Corporativa"
              className="bg-white/90 border-emerald-300"
            />

            <Select
              label="Servicio *"
              options={serviciosOptions.map(s => ({ value: s.value, label: `${s.icon} ${s.label}` }))}
              value={nuevaPropuesta.servicio}
              onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, servicio: e.target.value as ServicioTipo })}
              fullWidth
              className="bg-white/90 border-emerald-300"
            />

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-emerald-800">Items de la Propuesta</h3>
                <Button variant="outline" size="sm" onClick={agregarItem}>
                  + Agregar Item
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-3 bg-emerald-50 rounded-lg">
                    <div className="col-span-5">
                      <Input
                        value={item.descripcion}
                        onChange={(e) => actualizarItem(item.id, 'descripcion', e.target.value)}
                        placeholder="Descripción del item"
                        className="bg-white border-emerald-300"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.cantidad}
                        onChange={(e) => actualizarItem(item.id, 'cantidad', parseInt(e.target.value) || 0)}
                        placeholder="Cant."
                        className="bg-white border-emerald-300"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.precioUnitario}
                        onChange={(e) => actualizarItem(item.id, 'precioUnitario', parseFloat(e.target.value) || 0)}
                        placeholder="Precio Unit."
                        className="bg-white border-emerald-300"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        value={formatearMoneda(item.subtotal)}
                        disabled
                        className="bg-gray-100 border-emerald-300"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => eliminarItem(item.id)}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {items.length > 0 && (
                <div className="mt-4 p-4 bg-emerald-100 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Subtotal:</span>
                    <span>{formatearMoneda(calcularTotal().subtotal)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Descuento:</span>
                      <Input
                        type="number"
                        value={nuevaPropuesta.descuento}
                        onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, descuento: e.target.value })}
                        className="w-24 bg-white border-emerald-300"
                        placeholder="0"
                      />
                    </div>
                    <span>{formatearMoneda(calcularTotal().descuento)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-emerald-800 border-t pt-2">
                    <span>Total:</span>
                    <span>{formatearMoneda(calcularTotal().total)}</span>
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Validez (días)"
              type="number"
              value={nuevaPropuesta.validez}
              onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, validez: e.target.value })}
              fullWidth
              className="bg-white/90 border-emerald-300"
            />

            <TextArea
              label="Notas Internas (Opcional)"
              value={nuevaPropuesta.notas}
              onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, notas: e.target.value })}
              fullWidth
              rows={3}
              placeholder="Notas adicionales sobre esta propuesta..."
              className="bg-white/90 border-emerald-300"
            />

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setIsModalOpen(false);
                  resetFormulario();
                }}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleGuardarPropuesta}
                disabled={isSaving || !nuevaPropuesta.clienteId || !nuevaPropuesta.titulo || !nuevaPropuesta.servicio || items.length === 0}
              >
                {isSaving ? 'Guardando...' : 'Guardar Propuesta'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal Preview Propuesta */}
        <Modal
          isOpen={isPreviewModalOpen}
          onClose={() => {
            setIsPreviewModalOpen(false);
            setPropuestaPreview(null);
          }}
          title="Vista Previa de Propuesta"
          size="xl"
        >
          {propuestaPreview && (
            <div className="space-y-4">
              <div id="propuesta-preview" className="bg-white p-8 rounded-lg shadow-lg">
                {/* Header */}
                <div className="border-b-4 border-emerald-600 pb-4 mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <img 
                        src="https://res.cloudinary.com/dbufrzoda/image/upload/v1760908611/Captura_de_pantalla_2025-10-19_122805_v4gvpt.png" 
                        alt="Digiautomatiza Logo" 
                        className="h-16 mb-2"
                      />
                      <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-lime-500 bg-clip-text text-transparent">
                        Digiautomatiza
                      </h1>
                      <p className="text-gray-600 text-sm">Innovación Digital</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Propuesta N°</p>
                      <p className="text-xl font-bold text-emerald-600">{propuestaPreview.numeroPropuesta}</p>
                      <p className="text-sm text-gray-600 mt-2">
                        Fecha: {new Date().toLocaleDateString('es-ES')}
                      </p>
                      {propuestaPreview.fechaVencimiento && (
                        <p className="text-sm text-red-600">
                          Válida hasta: {formatearFecha(propuestaPreview.fechaVencimiento)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cliente */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-emerald-800 mb-2">Para:</h2>
                  <p className="text-gray-800 font-medium">{propuestaPreview.cliente.nombre}</p>
                  {propuestaPreview.cliente.empresa && (
                    <p className="text-gray-600">{propuestaPreview.cliente.empresa}</p>
                  )}
                  <p className="text-gray-600">{propuestaPreview.cliente.email}</p>
                  <p className="text-gray-600">{propuestaPreview.cliente.telefono}</p>
                </div>

                {/* Contenido */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-3">{propuestaPreview.titulo}</h2>
                  {(() => {
                    try {
                      const contenido = typeof propuestaPreview.contenido === 'string' 
                        ? JSON.parse(propuestaPreview.contenido) 
                        : propuestaPreview.contenido;
                      
                      return (
                        <div className="space-y-4">
                          <p className="text-gray-700">{contenido.introduccion}</p>
                          
                          <div className="bg-emerald-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-emerald-800 mb-2">
                              {serviciosOptions.find(s => s.value === propuestaPreview.servicio)?.icon} 
                              {' '}
                              {serviciosOptions.find(s => s.value === propuestaPreview.servicio)?.label}
                            </h3>
                            <p className="text-gray-700">{contenido.descripcionServicio}</p>
                          </div>

                          {contenido.beneficios && (
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-2">Beneficios:</h4>
                              <ul className="list-disc list-inside space-y-1 text-gray-700">
                                {contenido.beneficios.map((beneficio: string, index: number) => (
                                  <li key={index}>{beneficio}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    } catch {
                      return <p className="text-gray-700">{propuestaPreview.contenido}</p>;
                    }
                  })()}
                </div>

                {/* Items */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Detalle de Servicios:</h3>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-emerald-600 text-white">
                        <th className="border border-emerald-700 p-2 text-left">Descripción</th>
                        <th className="border border-emerald-700 p-2 text-center">Cantidad</th>
                        <th className="border border-emerald-700 p-2 text-right">Precio Unit.</th>
                        <th className="border border-emerald-700 p-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {propuestaPreview.items.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border border-gray-300 p-2">{item.descripcion}</td>
                          <td className="border border-gray-300 p-2 text-center">{item.cantidad}</td>
                          <td className="border border-gray-300 p-2 text-right">{formatearMoneda(item.precioUnitario)}</td>
                          <td className="border border-gray-300 p-2 text-right font-semibold">{formatearMoneda(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totales */}
                <div className="mb-6 flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Subtotal:</span>
                      <span className="font-semibold">{formatearMoneda(propuestaPreview.valorTotal)}</span>
                    </div>
                    {propuestaPreview.descuento && propuestaPreview.descuento > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Descuento:</span>
                        <span>-{formatearMoneda(propuestaPreview.descuento)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-emerald-600 border-t-2 border-emerald-600 pt-2">
                      <span>Total:</span>
                      <span>{formatearMoneda(propuestaPreview.valorFinal)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t pt-4 text-center text-sm text-gray-600">
                  <p className="font-semibold text-emerald-800 mb-2">Gracias por considerar nuestros servicios</p>
                  <p>Digiautomatiza - Innovación Digital</p>
                  <p>Email: digiautomatiza@outlook.com</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setIsPreviewModalOpen(false)}
                >
                  Cerrar
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => handleExportarPDF(propuestaPreview)}
                >
                  📥 Exportar a PDF
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}

