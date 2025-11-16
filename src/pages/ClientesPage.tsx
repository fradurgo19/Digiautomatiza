import { useState, useRef, useEffect, useCallback } from 'react';
import Navbar from '../organisms/Navbar';
import Card from '../atoms/Card';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Modal from '../molecules/Modal';
import ClientCard from '../molecules/ClientCard';
import { Cliente, ServicioTipo, EstadoCliente } from '../types';
import Select from '../atoms/Select';
import TextArea from '../atoms/TextArea';
import { descargarPlantillaExcel, importarClientesExcel, exportarClientesExcel } from '../services/excelService';
import Loading from '../atoms/Loading';
import {
  obtenerClientes,
  crearCliente as crearClienteApi,
  actualizarCliente as actualizarClienteApi,
  eliminarCliente as eliminarClienteApi,
} from '../services/databaseService';

type ClienteForm = {
  nombre: string;
  email: string;
  telefono: string;
  empresa: string;
  serviciosInteres: ServicioTipo[];
  estado: EstadoCliente;
  notas: string;
};

const ensureServicios = (servicios: ServicioTipo[]) =>
  servicios.length > 0 ? servicios : (['paginas-web'] as ServicioTipo[]);

const buildClientePayload = (form: ClienteForm) => ({
  nombre: form.nombre.trim(),
  email: form.email.trim(),
  telefono: form.telefono.trim(),
  empresa: form.empresa.trim() ? form.empresa.trim() : undefined,
  serviciosInteres: ensureServicios(form.serviciosInteres),
  estado: form.estado,
  notas: form.notas.trim() ? form.notas.trim() : undefined,
});

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoadingClientes, setIsLoadingClientes] = useState(true);
  const [clientesError, setClientesError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEnvioCorreoModalOpen, setIsEnvioCorreoModalOpen] = useState(false);
  const [isEnvioWhatsAppModalOpen, setIsEnvioWhatsAppModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientes, setSelectedClientes] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ exitosos: Cliente[]; errores: Array<{ fila: number; error: string; datos: Record<string, unknown> }> } | null>(null);
  const [isSavingCliente, setIsSavingCliente] = useState(false);
  const [isUpdatingCliente, setIsUpdatingCliente] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formulario para nuevo cliente
  const [clienteEnEdicion, setClienteEnEdicion] = useState<Cliente | null>(null);

  const initialFormState: ClienteForm = {
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    serviciosInteres: [] as ServicioTipo[],
    estado: 'nuevo' as EstadoCliente,
    notas: '',
  };

  const [nuevoCliente, setNuevoCliente] = useState<ClienteForm>(initialFormState);
  const [clienteEditado, setClienteEditado] = useState<ClienteForm>(initialFormState);

  // Formulario envío masivo correo
  const [envioCorreo, setEnvioCorreo] = useState({
    asunto: '',
    mensaje: '',
    archivos: [] as File[],
  });

  // Formulario envío masivo WhatsApp
  const [envioWhatsApp, setEnvioWhatsApp] = useState({
    mensaje: '',
    archivos: [] as File[],
  });

  const estadoOptions = [
    { value: 'nuevo', label: 'Nuevo' },
    { value: 'contactado', label: 'Contactado' },
    { value: 'interesado', label: 'Interesado' },
    { value: 'en-negociacion', label: 'En Negociación' },
    { value: 'convertido', label: 'Convertido' },
    { value: 'inactivo', label: 'Inactivo' },
  ];

  const fetchClientes = useCallback(async () => {
    setIsLoadingClientes(true);
    setClientesError(null);
    try {
      const data = await obtenerClientes();
      setClientes(data);
      setSelectedClientes([]);
    } catch (error) {
      console.error('No se pudieron cargar los clientes:', error);
      setClientesError('No se pudieron cargar los clientes. Verifica la API y la conexión con la base de datos.');
    } finally {
      setIsLoadingClientes(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const resetEditState = () => {
    setClienteEnEdicion(null);
    setClienteEditado(initialFormState);
  };

  const handleAddCliente = async () => {
    if (!nuevoCliente.nombre.trim() || !nuevoCliente.email.trim() || !nuevoCliente.telefono.trim()) {
      alert('Nombre, email y teléfono son obligatorios.');
      return;
    }

    setIsSavingCliente(true);
    try {
      const payload = buildClientePayload(nuevoCliente);
      const cliente = await crearClienteApi(payload);
      setClientes((prev) => [cliente, ...prev]);
      setIsAddModalOpen(false);
      setNuevoCliente(initialFormState);
    } catch (error) {
      console.error('Error al crear cliente:', error);
      alert('No se pudo guardar el cliente. Verifica la API y vuelve a intentar.');
    } finally {
      setIsSavingCliente(false);
    }
  };

  const handleOpenEditModal = (cliente: Cliente) => {
    setClienteEnEdicion(cliente);
    setClienteEditado({
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono,
      empresa: cliente.empresa ?? '',
      serviciosInteres: cliente.serviciosInteres,
      estado: cliente.estado,
      notas: cliente.notas ?? '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateCliente = async () => {
    if (!clienteEnEdicion) return;
    if (!clienteEditado.nombre.trim() || !clienteEditado.email.trim() || !clienteEditado.telefono.trim()) {
      alert('Nombre, email y teléfono son obligatorios.');
      return;
    }

    setIsUpdatingCliente(true);
    try {
      const payload = buildClientePayload(clienteEditado);
      const actualizado = await actualizarClienteApi(clienteEnEdicion.id, payload);
      setClientes((prev) => prev.map((cliente) => (cliente.id === actualizado.id ? actualizado : cliente)));
      setIsEditModalOpen(false);
      resetEditState();
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      alert('No se pudo actualizar el cliente. Intenta nuevamente.');
    } finally {
      setIsUpdatingCliente(false);
    }
  };

  const handleDeleteCliente = async (clienteId: string) => {
    if (!confirm('¿Está seguro de eliminar este cliente?')) return;
    
    try {
      await eliminarClienteApi(clienteId);
      setClientes((prev) => prev.filter((c) => c.id !== clienteId));
      setSelectedClientes((prev) => prev.filter((id) => id !== clienteId));
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      alert('No se pudo eliminar el cliente. Verifica la API.');
    }
  };

  const handleEnvioMasivoCorreo = async () => {
    const clientesSeleccionados = clientes.filter(c => selectedClientes.includes(c.id));
    const emails = clientesSeleccionados.map(c => c.email);
    
    try {
      // Importar el servicio dinámicamente
      const { enviarCorreoMasivo } = await import('../services/emailService');
      
      const resultado = await enviarCorreoMasivo({
        destinatarios: emails,
        asunto: envioCorreo.asunto,
        mensaje: envioCorreo.mensaje,
        archivosAdjuntos: envioCorreo.archivos,
      });

      // Mostrar resultado
      let mensaje = `✅ Correos enviados exitosamente a ${resultado.exitosos.length} clientes`;
      
      if (resultado.fallidos.length > 0) {
        mensaje += `\n\n❌ No se pudieron enviar ${resultado.fallidos.length} correos:`;
        resultado.fallidos.forEach(({ email, error }) => {
          mensaje += `\n• ${email}: ${error}`;
        });
      }

      alert(mensaje);
      
      setIsEnvioCorreoModalOpen(false);
      setSelectedClientes([]);
      setEnvioCorreo({ asunto: '', mensaje: '', archivos: [] });
    } catch (error) {
      console.error('Error al enviar correos masivos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al enviar correos: ${errorMessage}`);
    }
  };

  const handleEnvioMasivoWhatsApp = async () => {
    const clientesSeleccionados = clientes.filter(c => selectedClientes.includes(c.id));
    const numeros = clientesSeleccionados.map(c => c.telefono);
    
    try {
      // Importar el servicio dinámicamente
      const { enviarWhatsAppMasivo } = await import('../services/whatsappService');
      
      const resultado = await enviarWhatsAppMasivo({
        numeros,
        mensaje: envioWhatsApp.mensaje,
        archivos: envioWhatsApp.archivos,
      });

      // Mostrar resultado
      let mensaje = `✅ Mensajes enviados exitosamente a ${resultado.exitosos.length} clientes`;
      
      if (resultado.fallidos.length > 0) {
        mensaje += `\n\n❌ No se pudieron enviar ${resultado.fallidos.length} mensajes:`;
        resultado.fallidos.forEach(({ numero, error }) => {
          mensaje += `\n• ${numero}: ${error}`;
        });
      }

      alert(mensaje);
      
      setIsEnvioWhatsAppModalOpen(false);
      setSelectedClientes([]);
      setEnvioWhatsApp({ mensaje: '', archivos: [] });
    } catch (error) {
      console.error('Error al enviar WhatsApp masivo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al enviar mensajes: ${errorMessage}`);
    }
  };

  const toggleSelectCliente = (clienteId: string) => {
    setSelectedClientes(prev =>
      prev.includes(clienteId)
        ? prev.filter(id => id !== clienteId)
        : [...prev, clienteId]
    );
  };

  // Funciones para manejo de Excel
  const handleDescargarPlantilla = () => {
    descargarPlantillaExcel();
  };

  const handleExportarExcel = () => {
    if (clientes.length === 0) {
      alert('No hay clientes para exportar');
      return;
    }
    exportarClientesExcel(clientes);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea un archivo Excel
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    setIsImporting(true);
    setIsImportModalOpen(true);

    try {
      const resultado = await importarClientesExcel(file);
      const persistErrors: Array<{ fila: number; error: string; datos: Record<string, unknown> }> = [];
      const clientesGuardados: Cliente[] = [];

      for (const cliente of resultado.exitosos) {
        try {
          const payload = {
            nombre: cliente.nombre,
            email: cliente.email,
            telefono: cliente.telefono,
            empresa: cliente.empresa,
            serviciosInteres: ensureServicios(cliente.serviciosInteres),
            estado: cliente.estado,
            notas: cliente.notas,
          };
          const guardado = await crearClienteApi(payload);
          clientesGuardados.push(guardado);
        } catch (error) {
          persistErrors.push({
            fila: -1,
            error: `Error al guardar en la base de datos: ${(error as Error).message}`,
            datos: {
              'Nombre Completo': cliente.nombre,
              Email: cliente.email,
            },
          });
        }
      }

      if (clientesGuardados.length > 0) {
        setClientes((prev) => [...clientesGuardados, ...prev]);
      }

      setImportResult({
        exitosos: clientesGuardados,
        errores: [...resultado.errores, ...persistErrors],
      });
    } catch (error) {
      console.error('Error al importar archivo:', error);
      alert('Error al procesar el archivo Excel. Verifica el formato.');
      setIsImportModalOpen(false);
    } finally {
      setIsImporting(false);
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportarClick = () => {
    fileInputRef.current?.click();
  };

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefono.includes(searchTerm)
  );

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
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold">
                <span className="bg-gradient-to-r from-emerald-700 via-lime-600 to-emerald-500 bg-clip-text text-transparent">
                  Gestión de Clientes
                </span>
              </h1>
              <p className="text-gray-700 mt-3">
                Total: {clientes.length} clientes · Seleccionados: {selectedClientes.length}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={() => setIsEnvioCorreoModalOpen(true)}
                disabled={selectedClientes.length === 0}
              >
                📧 Envío Masivo Correo
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsEnvioWhatsAppModalOpen(true)}
                disabled={selectedClientes.length === 0}
              >
                💬 Envío Masivo WhatsApp
              </Button>
              <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                + Agregar Cliente
              </Button>
            </div>
          </div>

        {isLoadingClientes ? (
          <div className="py-24 flex justify-center">
            <Loading text="Cargando clientes..." />
          </div>
        ) : clientesError ? (
          <Card className="bg-red-50 border border-red-200 shadow-md shadow-red-100/40">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-red-800">No pudimos cargar los clientes</h3>
                <p className="text-sm text-red-700">{clientesError}</p>
              </div>
              <Button variant="primary" onClick={fetchClientes}>
                Reintentar
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Botones de Excel */}
            <Card className="mt-6 bg-white/80 border border-emerald-100 shadow-lg shadow-emerald-100/60">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-emerald-800 mb-1">Importación/Exportación Masiva</h3>
                  <p className="text-sm text-gray-600">Carga múltiples clientes desde Excel o exporta tu base de datos</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDescargarPlantilla}
                  >
                    📥 Descargar Plantilla
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleImportarClick}
                  >
                    📤 Importar Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportarExcel}
                    disabled={clientes.length === 0}
                  >
                    📊 Exportar a Excel
                  </Button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </Card>

            {/* Búsqueda */}
            <Card className="mb-6 mt-6 bg-white/80 border border-emerald-100 shadow-md shadow-emerald-100/40">
              <Input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
              />
            </Card>

            {/* Lista de clientes */}
            {clientesFiltrados.length === 0 ? (
              <Card className="bg-white/80 border border-emerald-100 shadow-md shadow-emerald-100/40">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-xl font-semibold text-emerald-900 mb-2">
                    No hay clientes registrados
                  </h3>
                  <p className="text-gray-600">
                    Agrega tu primer cliente para comenzar
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clientesFiltrados.map((cliente) => (
                  <div key={cliente.id} className="relative">
                    <input
                      type="checkbox"
                      checked={selectedClientes.includes(cliente.id)}
                      onChange={() => toggleSelectCliente(cliente.id)}
                      className="absolute top-4 left-4 h-5 w-5 rounded z-10 cursor-pointer"
                    />
                    <ClientCard
                      cliente={cliente}
                      onEdit={handleOpenEditModal}
                      onDelete={handleDeleteCliente}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

        {/* Modal Agregar Cliente */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Agregar Nuevo Cliente"
          size="xl"
        >
          <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-emerald-100 to-white border border-emerald-200 p-6 shadow-lg shadow-emerald-100/60">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-1">
              <Input
                label="Nombre completo *"
                value={nuevoCliente.nombre}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                fullWidth
                className="bg-white/90 border-emerald-200 focus:ring-emerald-400 focus:border-emerald-400"
                textClassName="text-emerald-900 placeholder:text-emerald-500"
                labelClassName="text-emerald-800"
              />
            </div>
            <div className="md:col-span-1">
              <Input
                label="Email *"
                type="email"
                value={nuevoCliente.email}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                fullWidth
                className="bg-white/90 border-emerald-200 focus:ring-emerald-400 focus:border-emerald-400"
                textClassName="text-emerald-900 placeholder:text-emerald-500"
                labelClassName="text-emerald-800"
              />
            </div>
            <div className="md:col-span-1">
              <Input
                label="Teléfono *"
                type="tel"
                value={nuevoCliente.telefono}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                fullWidth
                className="bg-white/90 border-emerald-200 focus:ring-emerald-400 focus:border-emerald-400"
                textClassName="text-emerald-900 placeholder:text-emerald-500"
                labelClassName="text-emerald-800"
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Empresa"
                value={nuevoCliente.empresa}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, empresa: e.target.value })}
                fullWidth
                className="bg-white/90 border-emerald-200 focus:ring-emerald-400 focus:border-emerald-400"
                textClassName="text-emerald-900 placeholder:text-emerald-500"
                labelClassName="text-emerald-800"
              />
            </div>
            <div className="md:col-span-1">
              <Select
                label="Estado"
                options={estadoOptions}
                value={nuevoCliente.estado}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, estado: e.target.value as EstadoCliente })}
                fullWidth
                className="bg-white/90 border-emerald-200 focus:ring-emerald-400 focus:border-emerald-400"
                textClassName="text-emerald-900"
                labelClassName="text-emerald-800"
              />
            </div>
            <div className="md:col-span-3">
              <TextArea
                label="Notas"
                value={nuevoCliente.notas}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, notas: e.target.value })}
                fullWidth
                className="bg-white/90 border-emerald-200 focus:ring-emerald-400 focus:border-emerald-400"
                textClassName="text-emerald-900 placeholder:text-emerald-500"
                rows={4}
                labelClassName="text-emerald-800"
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button
                variant="primary"
                onClick={handleAddCliente}
                className="w-full md:w-auto px-10"
                disabled={isSavingCliente}
              >
                {isSavingCliente ? 'Guardando...' : 'Agregar Cliente'}
              </Button>
            </div>
          </div>
          </div>
        </Modal>

        {/* Modal Editar Cliente */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            resetEditState();
          }}
          title="Editar Cliente"
          size="xl"
        >
      <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-emerald-100 to-white border border-emerald-200 p-6 shadow-lg shadow-emerald-100/60">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-1">
              <Input
                label="Nombre completo *"
                value={clienteEditado.nombre}
                onChange={(e) => setClienteEditado({ ...clienteEditado, nombre: e.target.value })}
                fullWidth
                className="bg-white/90 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500"
                textClassName="text-emerald-900 placeholder:text-emerald-500"
                labelClassName="text-emerald-800"
              />
            </div>
            <div className="md:col-span-1">
              <Input
                label="Email *"
                type="email"
                value={clienteEditado.email}
                onChange={(e) => setClienteEditado({ ...clienteEditado, email: e.target.value })}
                fullWidth
                className="bg-white/90 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500"
                textClassName="text-emerald-900 placeholder:text-emerald-500"
                labelClassName="text-emerald-800"
              />
            </div>
            <div className="md:col-span-1">
              <Input
                label="Teléfono *"
                type="tel"
                value={clienteEditado.telefono}
                onChange={(e) => setClienteEditado({ ...clienteEditado, telefono: e.target.value })}
                fullWidth
                className="bg-white/90 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500"
                textClassName="text-emerald-900 placeholder:text-emerald-500"
                labelClassName="text-emerald-800"
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Empresa"
                value={clienteEditado.empresa}
                onChange={(e) => setClienteEditado({ ...clienteEditado, empresa: e.target.value })}
                fullWidth
                className="bg-white/90 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500"
                textClassName="text-emerald-900 placeholder:text-emerald-500"
                labelClassName="text-emerald-800"
              />
            </div>
            <div className="md:col-span-1">
              <Select
                label="Estado"
                options={estadoOptions}
                value={clienteEditado.estado}
                onChange={(e) => setClienteEditado({ ...clienteEditado, estado: e.target.value as EstadoCliente })}
                fullWidth
                className="bg-white/90 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500"
                textClassName="text-emerald-900"
                labelClassName="text-emerald-800"
              />
            </div>
            <div className="md:col-span-3">
              <TextArea
                label="Notas"
                value={clienteEditado.notas}
                onChange={(e) => setClienteEditado({ ...clienteEditado, notas: e.target.value })}
                fullWidth
                className="bg-white/90 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500"
                textClassName="text-emerald-900 placeholder:text-emerald-500"
                rows={4}
                labelClassName="text-emerald-800"
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  resetEditState();
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateCliente}
                className="px-10"
                disabled={
                  !clienteEditado.nombre ||
                  !clienteEditado.email ||
                  !clienteEditado.telefono ||
                  isUpdatingCliente
                }
              >
                {isUpdatingCliente ? 'Actualizando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
      </div>
        </Modal>

        {/* Modal Envío Masivo Correo */}
        <Modal
          isOpen={isEnvioCorreoModalOpen}
          onClose={() => setIsEnvioCorreoModalOpen(false)}
          title={`Envío Masivo de Correos (${selectedClientes.length} destinatarios)`}
          size="lg"
        >
          <div className="space-y-4 rounded-3xl bg-gradient-to-br from-emerald-50 via-emerald-100 to-white border border-emerald-200 p-6 shadow-lg shadow-emerald-100/60">
            <Input
              label="Asunto *"
              value={envioCorreo.asunto}
              onChange={(e) => setEnvioCorreo({ ...envioCorreo, asunto: e.target.value })}
              fullWidth
              placeholder="Asunto del correo"
              className="bg-white/90 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500"
              textClassName="text-emerald-900 placeholder:text-emerald-500"
              labelClassName="text-emerald-800"
            />
            <TextArea
              label="Mensaje *"
              value={envioCorreo.mensaje}
              onChange={(e) => setEnvioCorreo({ ...envioCorreo, mensaje: e.target.value })}
              fullWidth
              rows={6}
              placeholder="Escribe tu mensaje aquí..."
              className="bg-white/90 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500"
              textClassName="text-emerald-900 placeholder:text-emerald-500"
              labelClassName="text-emerald-800"
            />
            <div>
              <label className="block text-sm font-medium text-emerald-800 mb-1">
                Archivos adjuntos
              </label>
              <input
                type="file"
                multiple
                className="w-full text-emerald-900"
                onChange={(e) => setEnvioCorreo({ ...envioCorreo, archivos: Array.from(e.target.files || []) })}
              />
              <p className="text-sm text-emerald-700 mt-1">
                Puedes adjuntar documentos, imágenes, videos o audios
              </p>
            </div>
            <Button
              variant="primary"
              fullWidth
              onClick={handleEnvioMasivoCorreo}
              disabled={!envioCorreo.asunto || !envioCorreo.mensaje}
            >
              Enviar Correos
            </Button>
          </div>
        </Modal>

        {/* Modal Envío Masivo WhatsApp */}
        <Modal
          isOpen={isEnvioWhatsAppModalOpen}
          onClose={() => setIsEnvioWhatsAppModalOpen(false)}
          title={`Envío Masivo WhatsApp (${selectedClientes.length} destinatarios)`}
          size="lg"
        >
          <div className="space-y-4 rounded-3xl bg-gradient-to-br from-emerald-50 via-emerald-100 to-white border border-emerald-200 p-6 shadow-lg shadow-emerald-100/60">
            <TextArea
              label="Mensaje *"
              value={envioWhatsApp.mensaje}
              onChange={(e) => setEnvioWhatsApp({ ...envioWhatsApp, mensaje: e.target.value })}
              fullWidth
              rows={6}
              placeholder="Escribe tu mensaje aquí..."
              className="bg-white/90 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500"
              textClassName="text-emerald-900 placeholder:text-emerald-500"
              labelClassName="text-emerald-800"
            />
            <div>
              <label className="block text-sm font-medium text-emerald-800 mb-1">
                Archivos adjuntos
              </label>
              <input
                type="file"
                multiple
                className="w-full text-emerald-900"
                onChange={(e) => setEnvioWhatsApp({ ...envioWhatsApp, archivos: Array.from(e.target.files || []) })}
              />
              <p className="text-sm text-emerald-700 mt-1">
                Puedes adjuntar documentos, imágenes, videos o audios
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> El envío masivo de WhatsApp requiere integración con WhatsApp Business API o servicios como Twilio.
              </p>
            </div>
            <Button
              variant="primary"
              fullWidth
              onClick={handleEnvioMasivoWhatsApp}
              disabled={!envioWhatsApp.mensaje}
            >
              Enviar Mensajes WhatsApp
            </Button>
          </div>
        </Modal>

        {/* Modal Resultado de Importación */}
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => {
            setIsImportModalOpen(false);
            setImportResult(null);
          }}
          title="Resultado de Importación"
          size="lg"
        >
          {isImporting ? (
            <div className="text-center py-8">
              <div className="animate-spin text-6xl mb-4">⏳</div>
              <p className="text-lg font-semibold">Procesando archivo Excel...</p>
              <p className="text-gray-600 mt-2">Por favor espera</p>
            </div>
          ) : importResult ? (
            <div className="space-y-4">
              {/* Resumen */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-50">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-700">{importResult.exitosos.length}</p>
                    <p className="text-sm text-green-600 mt-1">Clientes importados</p>
                  </div>
                </Card>
                <Card className="bg-red-50">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-700">{importResult.errores.length}</p>
                    <p className="text-sm text-red-600 mt-1">Errores encontrados</p>
                  </div>
                </Card>
              </div>

              {/* Clientes exitosos */}
              {importResult.exitosos.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">✅ Clientes Importados Correctamente:</h4>
                  <div className="max-h-48 overflow-y-auto bg-green-50 rounded-lg p-3">
                    {importResult.exitosos.map((cliente, index) => (
                      <div key={index} className="text-sm py-1 border-b border-green-200 last:border-0">
                        <strong>{cliente.nombre}</strong> - {cliente.email}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errores */}
              {importResult.errores.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-700 mb-2">❌ Errores en la Importación:</h4>
                  <div className="max-h-48 overflow-y-auto bg-red-50 rounded-lg p-3">
                    {importResult.errores.map((error, index) => (
                      <div key={index} className="text-sm py-2 border-b border-red-200 last:border-0">
                        <p className="font-semibold">Fila {error.fila}: {error.error}</p>
                        <p className="text-gray-600 text-xs mt-1">
                          {String(error.datos['Nombre Completo'] || 'Sin nombre')} - {String(error.datos['Email'] || 'Sin email')}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Tip:</strong> Corrige los errores en tu archivo Excel y vuelve a importar solo las filas con errores.
                    </p>
                  </div>
                </div>
              )}

              {/* Mensaje de éxito total */}
              {importResult.errores.length === 0 && importResult.exitosos.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-lg font-semibold text-green-700">
                    🎉 ¡Importación completada exitosamente!
                  </p>
                  <p className="text-green-600 mt-2">
                    Todos los clientes han sido importados correctamente
                  </p>
                </div>
              )}

              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportResult(null);
                }}
              >
                Cerrar
              </Button>
            </div>
          ) : null}
        </Modal>
      </div>
    </div>
  );
}

