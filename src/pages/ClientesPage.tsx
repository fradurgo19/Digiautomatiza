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
import { enviarWhatsAppMasivo, formatearNumeroWhatsApp, validarNumerosWhatsApp } from '../services/whatsappService';

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

  // Plantillas de WhatsApp disponibles
  const plantillasWhatsApp = [
    {
      nombre: 'template_marketing_20251120221528',
      descripcion: 'Plantilla de Marketing - Promoción de Servicios',
      categoria: 'MARKETING',
      estado: 'Activo',
      idioma: 'es_CO', // Español Colombia
      tieneVariables: false // Esta plantilla NO tiene variables
    }
  ];

  // Formulario envío masivo WhatsApp
  const [envioWhatsApp, setEnvioWhatsApp] = useState({
    mensaje: '',
    archivos: [] as File[],
    usarPlantilla: false,
    nombrePlantilla: '',
    idiomaPlantilla: 'es_CO',
    parametrosPlantilla: [] as string[],
  });
  const [isEnviandoWhatsApp, setIsEnviandoWhatsApp] = useState(false);
  const [resultadoEnvioWhatsApp, setResultadoEnvioWhatsApp] = useState<{
    exitosos: string[];
    fallidos: Array<{ numero: string; error: string }>;
    total: number;
  } | null>(null);

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
      console.log('🔄 Actualizando cliente:', clienteEnEdicion.id, payload);
      
      const actualizado = await actualizarClienteApi(clienteEnEdicion.id, payload);
      console.log('✅ Cliente actualizado:', actualizado);
      
      // Actualizar la lista de clientes
      setClientes((prev) => prev.map((cliente) => (cliente.id === actualizado.id ? actualizado : cliente)));
      
      // Recargar clientes para asegurar sincronización
      await fetchClientes();
      
      setIsEditModalOpen(false);
      resetEditState();
    } catch (error) {
      console.error('❌ Error al actualizar cliente:', error);
      alert('No se pudo actualizar el cliente. Intenta nuevamente.');
    } finally {
      setIsUpdatingCliente(false);
    }
  };

  const handleDeleteCliente = async (clienteId: string) => {
    if (!confirm('¿Está seguro de eliminar este cliente?')) return;
    
    try {
      console.log('🗑️ Eliminando cliente:', clienteId);
      await eliminarClienteApi(clienteId);
      console.log('✅ Cliente eliminado exitosamente');
      
      // Actualizar la lista de clientes
      setClientes((prev) => prev.filter((c) => c.id !== clienteId));
      setSelectedClientes((prev) => prev.filter((id) => id !== clienteId));
      
      // Recargar clientes para asegurar sincronización
      await fetchClientes();
    } catch (error) {
      console.error('❌ Error al eliminar cliente:', error);
      alert('No se pudo eliminar el cliente. Verifica la API.');
    }
  };

  const handleEnvioMasivoWhatsApp = async () => {
    // Validar mensaje solo si NO se usa plantilla, o si se usa plantilla CON variables
    if (!envioWhatsApp.usarPlantilla) {
      // Si no usa plantilla, siempre requiere mensaje
      if (!envioWhatsApp.mensaje.trim()) {
        alert('Por favor, escribe un mensaje antes de enviar.');
        return;
      }
    } else {
      // Si usa plantilla, verificar si tiene variables
      const plantillaSeleccionada = plantillasWhatsApp.find(p => p.nombre === envioWhatsApp.nombrePlantilla);
      const tieneVariables = plantillaSeleccionada?.tieneVariables || false;
      
      // Solo requiere mensaje si la plantilla tiene variables
      if (tieneVariables && !envioWhatsApp.mensaje.trim()) {
        alert('Por favor, ingresa los parámetros de la plantilla separados por comas.');
        return;
      }
    }

    if (selectedClientes.length === 0) {
      alert('Por favor, selecciona al menos un cliente.');
      return;
    }

    setIsEnviandoWhatsApp(true);
    setResultadoEnvioWhatsApp(null);

    try {
      // Obtener números de teléfono de los clientes seleccionados
      const numeros = selectedClientes
        .map(id => {
          const cliente = clientes.find(c => c.id === id);
          return cliente?.telefono;
        })
        .filter((telefono): telefono is string => Boolean(telefono));

      if (numeros.length === 0) {
        alert('No se encontraron números de teléfono para los clientes seleccionados.');
        setIsEnviandoWhatsApp(false);
        return;
      }

      // Validar números
      const { validos, invalidos } = validarNumerosWhatsApp(numeros);

      if (invalidos.length > 0) {
        const confirmar = confirm(
          `Se encontraron ${invalidos.length} números inválidos:\n${invalidos.join(', ')}\n\n¿Deseas continuar solo con los números válidos?`
        );
        if (!confirmar) {
          setIsEnviandoWhatsApp(false);
          return;
        }
      }

      if (validos.length === 0) {
        alert('No hay números válidos para enviar.');
        setIsEnviandoWhatsApp(false);
        return;
      }

      console.log(`📤 Enviando ${validos.length} mensajes de WhatsApp...`);

      // Preparar archivos (nota: YCloud requiere URLs públicas, por ahora solo enviamos el mensaje)
      // TODO: Implementar subida de archivos a servidor público si es necesario
      const archivosParaEnviar = envioWhatsApp.archivos.length > 0 
        ? [] // Por ahora no enviamos archivos, solo mensajes de texto
        : undefined;

      // Enviar mensajes
      // Obtener información de la plantilla seleccionada
      const plantillaSeleccionada = plantillasWhatsApp.find(p => p.nombre === envioWhatsApp.nombrePlantilla);
      const idiomaPlantilla = plantillaSeleccionada?.idioma || envioWhatsApp.idiomaPlantilla || 'es_CO';
      const tieneVariables = plantillaSeleccionada?.tieneVariables || false;

      // Preparar parámetros de plantilla SOLO si la plantilla tiene variables
      let parametrosPlantilla: string[] = [];
      if (envioWhatsApp.usarPlantilla && tieneVariables && envioWhatsApp.mensaje.trim()) {
        parametrosPlantilla = envioWhatsApp.mensaje.trim().split(',').map(p => p.trim()).filter(p => p.length > 0);
      }

      const resultado = await enviarWhatsAppMasivo({
        numeros: validos,
        mensaje: envioWhatsApp.usarPlantilla ? '' : envioWhatsApp.mensaje.trim(), // Solo mensaje si no es plantilla
        archivos: archivosParaEnviar,
        usarPlantilla: envioWhatsApp.usarPlantilla,
        nombrePlantilla: envioWhatsApp.usarPlantilla ? envioWhatsApp.nombrePlantilla : undefined,
        idiomaPlantilla: envioWhatsApp.usarPlantilla ? idiomaPlantilla : undefined,
        parametrosPlantilla: envioWhatsApp.usarPlantilla && tieneVariables && parametrosPlantilla.length > 0 ? parametrosPlantilla : undefined,
      });

      console.log('✅ Resultado del envío:', resultado);

      // Guardar resultado
      setResultadoEnvioWhatsApp({
        exitosos: resultado.exitosos,
        fallidos: resultado.fallidos,
        total: validos.length,
      });

      // Si todos fueron exitosos, limpiar formulario y cerrar modal después de mostrar resultado
      if (resultado.fallidos.length === 0) {
        setTimeout(() => {
          setEnvioWhatsApp({ mensaje: '', archivos: [] });
          setSelectedClientes([]);
          setIsEnvioWhatsAppModalOpen(false);
          setResultadoEnvioWhatsApp(null);
        }, 3000);
      }

    } catch (error) {
      console.error('❌ Error al enviar WhatsApp masivo:', error);
      alert(`Error al enviar mensajes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsEnviandoWhatsApp(false);
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
                textClassName="text-emerald-900 placeholder:text-emerald-500"
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
          onClose={() => {
            if (!isEnviandoWhatsApp) {
              setIsEnvioWhatsAppModalOpen(false);
              setResultadoEnvioWhatsApp(null);
              setEnvioWhatsApp({ mensaje: '', archivos: [], usarPlantilla: false, nombrePlantilla: '', idiomaPlantilla: 'es_CO', parametrosPlantilla: [] });
            }
          }}
          title={`Envío Masivo WhatsApp (${selectedClientes.length} destinatarios)`}
          size="xl"
        >
          <div className="space-y-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-emerald-100 to-white border border-emerald-200 p-6 shadow-lg shadow-emerald-100/60">
            {resultadoEnvioWhatsApp ? (
              // Mostrar resultados del envío
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-green-50 border-green-200">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-700">{resultadoEnvioWhatsApp.exitosos.length}</p>
                      <p className="text-sm text-green-600 mt-1">Enviados</p>
                    </div>
                  </Card>
                  <Card className="bg-red-50 border-red-200">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-red-700">{resultadoEnvioWhatsApp.fallidos.length}</p>
                      <p className="text-sm text-red-600 mt-1">Fallidos</p>
                    </div>
                  </Card>
                  <Card className="bg-blue-50 border-blue-200">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-700">{resultadoEnvioWhatsApp.total}</p>
                      <p className="text-sm text-blue-600 mt-1">Total</p>
                    </div>
                  </Card>
                </div>

                {resultadoEnvioWhatsApp.exitosos.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                      ✅ Mensajes Enviados Exitosamente ({resultadoEnvioWhatsApp.exitosos.length})
                    </h4>
                    <div className="max-h-40 overflow-y-auto bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="space-y-1">
                        {resultadoEnvioWhatsApp.exitosos.map((numero, index) => {
                          const cliente = clientes.find(c => formatearNumeroWhatsApp(c.telefono) === numero);
                          return (
                            <div key={index} className="text-sm py-1 border-b border-green-200 last:border-0">
                              <strong className="text-green-800">{cliente?.nombre || numero}</strong>
                              <span className="text-green-600 ml-2">{numero}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {resultadoEnvioWhatsApp.fallidos.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                      ❌ Mensajes Fallidos ({resultadoEnvioWhatsApp.fallidos.length})
                    </h4>
                    <div className="max-h-40 overflow-y-auto bg-red-50 rounded-lg p-3 border border-red-200">
                      <div className="space-y-2">
                        {resultadoEnvioWhatsApp.fallidos.map((fallido, index) => {
                          const cliente = clientes.find(c => formatearNumeroWhatsApp(c.telefono) === fallido.numero);
                          return (
                            <div key={index} className="text-sm py-2 border-b border-red-200 last:border-0">
                              <p className="font-semibold text-red-800">
                                {cliente?.nombre || fallido.numero}
                              </p>
                              <p className="text-red-600 text-xs">{fallido.numero}</p>
                              <p className="text-red-500 text-xs mt-1">Error: {fallido.error}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      setResultadoEnvioWhatsApp(null);
                      setEnvioWhatsApp({ mensaje: '', archivos: [], usarPlantilla: false, nombrePlantilla: '', idiomaPlantilla: 'es_CO', parametrosPlantilla: [] });
                    }}
                  >
                    Enviar Otro Mensaje
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => {
                      setIsEnvioWhatsAppModalOpen(false);
                      setResultadoEnvioWhatsApp(null);
                      setEnvioWhatsApp({ mensaje: '', archivos: [], usarPlantilla: false, nombrePlantilla: '', idiomaPlantilla: 'es_CO', parametrosPlantilla: [] });
                      setSelectedClientes([]);
                    }}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            ) : (
              // Formulario de envío
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 font-semibold mb-2">
                    📱 Envío Directo con YCloud
                  </p>
                  <p className="text-xs text-blue-800">
                    Los mensajes se enviarán automáticamente a través de YCloud API. Asegúrate de tener las variables de entorno configuradas en Vercel.
                  </p>
                </div>

                {/* Opción para usar plantilla - MÁS VISIBLE */}
                <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-5 shadow-lg" style={{ backgroundColor: '#fffbeb', borderColor: '#fbbf24' }}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={envioWhatsApp.usarPlantilla}
                      onChange={(e) => setEnvioWhatsApp({ 
                        ...envioWhatsApp, 
                        usarPlantilla: e.target.checked,
                        nombrePlantilla: e.target.checked ? envioWhatsApp.nombrePlantilla : '',
                      })}
                      disabled={isEnviandoWhatsApp}
                      className="w-6 h-6 mt-1 text-emerald-600 border-emerald-300 rounded focus:ring-emerald-500 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-base font-bold text-amber-900 mb-1">
                        📋 Usar Plantilla de WhatsApp (Recomendado para envío masivo)
                      </p>
                      <p className="text-sm text-amber-800">
                        Las plantillas permiten enviar mensajes fuera de la ventana de 24 horas. 
                        Debes tener una plantilla aprobada en YCloud.
                      </p>
                    </div>
                  </label>
                  
                  {envioWhatsApp.usarPlantilla && (
                    <div className="mt-5 space-y-4 border-t border-amber-300 pt-4">
                      <div>
                        <label className="block text-sm font-bold text-amber-900 mb-2">
                          Nombre de la Plantilla *
                        </label>
                        <select
                          value={envioWhatsApp.nombrePlantilla}
                          onChange={(e) => {
                            const plantillaSeleccionada = plantillasWhatsApp.find(p => p.nombre === e.target.value);
                            setEnvioWhatsApp({ 
                              ...envioWhatsApp, 
                              nombrePlantilla: e.target.value,
                              idiomaPlantilla: plantillaSeleccionada?.idioma || 'es_CO'
                            });
                          }}
                          className="w-full px-4 py-3 border-2 border-amber-400 rounded-lg bg-white text-amber-900 font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          disabled={isEnviandoWhatsApp}
                        >
                          <option value="">Selecciona una plantilla</option>
                          {plantillasWhatsApp.map((plantilla) => (
                            <option key={plantilla.nombre} value={plantilla.nombre}>
                              {plantilla.nombre} - {plantilla.descripcion} ({plantilla.estado})
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-amber-700 mt-2 font-medium">
                          Selecciona la plantilla aprobada en YCloud que deseas usar
                        </p>
                      </div>
                      <div className="bg-amber-100 border border-amber-300 rounded-lg p-3">
                        <p className="text-xs text-amber-900 font-semibold mb-2">ℹ️ Nota sobre plantillas:</p>
                        <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                          <li>La plantilla debe estar aprobada por WhatsApp en YCloud</li>
                          <li>Si tu plantilla tiene variables (ej: variable1, variable2), puedes agregarlas en el campo "Mensaje" separadas por comas</li>
                          <li>Ejemplo: Si la plantilla tiene variables, escribe los valores separados por comas: "Juan, #12345"</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {envioWhatsApp.usarPlantilla ? (
                  (() => {
                    const plantillaActual = plantillasWhatsApp.find(p => p.nombre === envioWhatsApp.nombrePlantilla);
                    const tieneVars = plantillaActual?.tieneVariables || false;
                    
                    if (!tieneVars) {
                      return (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-blue-900 font-semibold">
                            ℹ️ Esta plantilla no requiere parámetros
                          </p>
                          <p className="text-xs text-blue-800 mt-1">
                            La plantilla seleccionada no tiene variables. El mensaje se enviará tal como está configurado en YCloud.
                          </p>
                        </div>
                      );
                    }
                    
                    return (
                      <TextArea
                        label="Parámetros de la Plantilla *"
                        value={envioWhatsApp.mensaje}
                        onChange={(e) => setEnvioWhatsApp({ ...envioWhatsApp, mensaje: e.target.value })}
                        fullWidth
                        rows={4}
                        placeholder="Ingresa los valores de las variables separados por comas. Ej: Juan, Empresa XYZ, #12345"
                        className="bg-white/90 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500"
                        textClassName="text-emerald-900 placeholder:text-emerald-500"
                        labelClassName="text-emerald-800 font-semibold"
                        disabled={isEnviandoWhatsApp}
                      />
                    );
                  })()
                ) : (
                  <TextArea
                    label="Mensaje *"
                    value={envioWhatsApp.mensaje}
                    onChange={(e) => setEnvioWhatsApp({ ...envioWhatsApp, mensaje: e.target.value })}
                    fullWidth
                    rows={8}
                    placeholder="Escribe tu mensaje aquí..."
                    className="bg-white/90 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500"
                    textClassName="text-emerald-900 placeholder:text-emerald-500"
                    labelClassName="text-emerald-800 font-semibold"
                    disabled={isEnviandoWhatsApp}
                  />
                )}

                <div>
                  <label className="block text-sm font-medium text-emerald-800 mb-2">
                    Archivos adjuntos (Opcional)
                  </label>
                  <input
                    type="file"
                    multiple
                    className="w-full text-emerald-900 border border-emerald-200 rounded-lg p-2 bg-white"
                    onChange={(e) => setEnvioWhatsApp({ ...envioWhatsApp, archivos: Array.from(e.target.files || []) })}
                    disabled={isEnviandoWhatsApp}
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
                  />
                  <p className="text-xs text-emerald-700 mt-1">
                    Nota: Los archivos deben estar en URLs públicas para YCloud. Por ahora solo se envían mensajes de texto.
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-sm text-emerald-900 font-semibold mb-2">
                    📋 Destinatarios Seleccionados ({selectedClientes.length})
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {selectedClientes.map((clienteId) => {
                      const cliente = clientes.find(c => c.id === clienteId);
                      if (!cliente) return null;
                      return (
                        <div
                          key={cliente.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-white px-3 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-emerald-900 truncate">
                              {cliente.nombre}
                            </p>
                            <p className="text-xs text-emerald-700 truncate">
                              {cliente.telefono}
                            </p>
                          </div>
                          <div className="text-xs text-emerald-600">
                            {validarNumerosWhatsApp([cliente.telefono]).validos.length > 0 ? '✅' : '⚠️'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {isEnviandoWhatsApp ? (
                  <div className="text-center py-6">
                    <Loading text="Enviando mensajes..." />
                    <p className="text-sm text-emerald-700 mt-4">
                      Por favor espera, esto puede tomar unos momentos...
                    </p>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleEnvioMasivoWhatsApp}
                    disabled={
                      selectedClientes.length === 0 || 
                      (envioWhatsApp.usarPlantilla 
                        ? (() => {
                            const plantillaActual = plantillasWhatsApp.find(p => p.nombre === envioWhatsApp.nombrePlantilla);
                            const tieneVars = plantillaActual?.tieneVariables || false;
                            // Si no hay plantilla seleccionada, deshabilitar
                            if (!envioWhatsApp.nombrePlantilla.trim()) return true;
                            // Si la plantilla tiene variables, requerir mensaje
                            if (tieneVars && !envioWhatsApp.mensaje.trim()) return true;
                            // Si la plantilla no tiene variables, solo requiere nombre
                            return false;
                          })()
                        : !envioWhatsApp.mensaje.trim())
                    }
                    className="py-3 text-lg font-semibold"
                  >
                    📤 Enviar a {selectedClientes.length} {selectedClientes.length === 1 ? 'Cliente' : 'Clientes'}
                  </Button>
                )}
              </>
            )}
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

