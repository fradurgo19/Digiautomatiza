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
import { useAuth } from '../context/AuthContext';
import { Propuesta, Cliente, Oportunidad, ServicioTipo, ItemPropuesta, EstadoPropuesta, AdjuntoPropuesta } from '../types';
import {
  obtenerPropuestas,
  crearPropuesta,
  actualizarPropuesta,
  eliminarPropuesta,
  obtenerClientes,
  obtenerOportunidades,
} from '../services/databaseService';
import { subirArchivoPropuesta } from '../services/storageService';
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
  const { usuario } = useAuth();
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [propuestaPreview, setPropuestaPreview] = useState<Propuesta | null>(null);
  const [propuestaEditando, setPropuestaEditando] = useState<Propuesta | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<EstadoPropuesta | 'todos'>('todos');

  const [nuevaPropuesta, setNuevaPropuesta] = useState({
    oportunidadId: '',
    clienteId: '',
    titulo: '',
    servicio: '' as ServicioTipo,
    especificaciones: '',
    valorTotal: '',
    descuento: '',
    validez: '30',
    notas: '',
  });

  const [adjuntos, setAdjuntos] = useState<AdjuntoPropuesta[]>([]);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);

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
    const subtotal = parseFloat(nuevaPropuesta.valorTotal) || 0;
    const descuento = parseFloat(nuevaPropuesta.descuento) || 0;
    return {
      subtotal,
      descuento,
      total: subtotal - descuento,
    };
  };

  const handleSubirArchivo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSubiendoArchivo(true);
    try {
      const resultado = await subirArchivoPropuesta(file);
      setAdjuntos([...adjuntos, resultado]);
      alert('✅ Archivo subido exitosamente');
    } catch (error: any) {
      console.error('Error al subir archivo:', error);
      alert(`Error al subir archivo: ${error.message}`);
    } finally {
      setSubiendoArchivo(false);
      // Resetear el input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const eliminarAdjunto = (index: number) => {
    setAdjuntos(adjuntos.filter((_, i) => i !== index));
  };

  const handleGuardarPropuesta = async () => {
    if (!nuevaPropuesta.clienteId || !nuevaPropuesta.titulo || !nuevaPropuesta.servicio) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    if (!nuevaPropuesta.especificaciones || nuevaPropuesta.especificaciones.trim() === '') {
      alert('Por favor ingresa las especificaciones del servicio.');
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

      // Crear un item único con las especificaciones
      const itemUnico: ItemPropuesta = {
        id: '1',
        descripcion: nuevaPropuesta.especificaciones,
        cantidad: 1,
        precioUnitario: calcularTotal().subtotal,
        subtotal: calcularTotal().subtotal,
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
        items: [itemUnico],
        especificaciones: nuevaPropuesta.especificaciones,
        adjuntos: adjuntos.length > 0 ? adjuntos : null,
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
      especificaciones: '',
      valorTotal: '',
      descuento: '',
      validez: '30',
      notas: '',
    });
    setAdjuntos([]);
    setPropuestaEditando(null);
  };

  const handleEditarPropuesta = (propuesta: Propuesta) => {
    setPropuestaEditando(propuesta);
    setNuevaPropuesta({
      oportunidadId: propuesta.oportunidadId || '',
      clienteId: propuesta.clienteId,
      titulo: propuesta.titulo,
      servicio: propuesta.servicio,
      especificaciones: propuesta.especificaciones || '',
      valorTotal: propuesta.valorTotal.toString(),
      descuento: (propuesta.descuento || 0).toString(),
      validez: propuesta.validez.toString(),
      notas: propuesta.notas || '',
    });
    setAdjuntos(propuesta.adjuntos || []);
    setIsEditModalOpen(true);
  };

  const handleCambiarEstadoAprobacion = async (propuesta: Propuesta) => {
    const nuevoEstado = propuesta.estadoAprobacion === 'Aprobada' ? 'Sin Aprobar' : 'Aprobada';
    
    if (!confirm(`¿Estás seguro de cambiar el estado de aprobación a "${nuevoEstado}"?`)) {
      return;
    }

    try {
      await actualizarPropuesta(propuesta.id, {
        estadoAprobacion: nuevoEstado as 'Aprobada' | 'Sin Aprobar',
      });
      
      // Recargar propuestas
      const propuestasActualizadas = await obtenerPropuestas();
      setPropuestas(propuestasActualizadas);
      
      alert(`✅ Estado de aprobación actualizado a "${nuevoEstado}"`);
    } catch (error) {
      console.error('Error al cambiar estado de aprobación:', error);
      alert('Error al cambiar el estado de aprobación. Intenta nuevamente.');
    }
  };

  const handleActualizarPropuesta = async () => {
    if (!propuestaEditando) return;

    if (!nuevaPropuesta.clienteId || !nuevaPropuesta.titulo || !nuevaPropuesta.servicio) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    if (!nuevaPropuesta.especificaciones || nuevaPropuesta.especificaciones.trim() === '') {
      alert('Por favor ingresa las especificaciones del servicio.');
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

      // Crear un item único con las especificaciones
      const itemUnico: ItemPropuesta = {
        id: '1',
        descripcion: nuevaPropuesta.especificaciones,
        cantidad: 1,
        precioUnitario: calcularTotal().subtotal,
        subtotal: calcularTotal().subtotal,
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
        items: [itemUnico],
        especificaciones: nuevaPropuesta.especificaciones,
        adjuntos: adjuntos.length > 0 ? adjuntos : null,
        notas: nuevaPropuesta.notas || undefined,
      };

      console.log('📤 Enviando actualización con adjuntos:', adjuntos.length > 0 ? adjuntos : null);
      const actualizada = await actualizarPropuesta(propuestaEditando.id, propuestaData);
      
      // Recargar todas las propuestas para asegurar datos actualizados
      const todasLasPropuestas = await obtenerPropuestas();
      setPropuestas(todasLasPropuestas);
      
      // Buscar la propuesta actualizada en la lista recargada
      const propuestaActualizada = todasLasPropuestas.find(p => p.id === actualizada.id) || actualizada;
      
      console.log('📥 Propuesta recargada con adjuntos:', propuestaActualizada.adjuntos);
      
      // Actualizar la vista previa si está abierta
      if (propuestaPreview && propuestaPreview.id === propuestaActualizada.id) {
        setPropuestaPreview(propuestaActualizada);
      }
      
      // Si el modal de edición está abierto, actualizar también el estado local
      if (isEditModalOpen && propuestaEditando && propuestaEditando.id === propuestaActualizada.id) {
        setPropuestaEditando(propuestaActualizada);
        setAdjuntos(propuestaActualizada.adjuntos || []);
      }
      
      setIsEditModalOpen(false);
      resetFormulario();
      
      alert('✅ Propuesta actualizada exitosamente');
    } catch (error) {
      console.error('Error al actualizar propuesta:', error);
      alert('Error al actualizar la propuesta. Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerPropuesta = async (propuesta: Propuesta) => {
    // Recargar la propuesta desde la base de datos para obtener los datos más recientes
    try {
      const todasLasPropuestas = await obtenerPropuestas();
      const propuestaActualizada = todasLasPropuestas.find(p => p.id === propuesta.id) || propuesta;
      setPropuestaPreview(propuestaActualizada);
      setIsPreviewModalOpen(true);
    } catch (error) {
      console.error('Error al cargar propuesta:', error);
      // Si falla, usar la propuesta que se pasó como parámetro
      setPropuestaPreview(propuesta);
      setIsPreviewModalOpen(true);
    }
  };

  const handleExportarPDF = async (propuesta: Propuesta) => {
    try {
      console.log('Generando PDF directamente desde los datos de la propuesta...');
      
      // Crear PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;
      const contentWidth = pdfWidth - (2 * margin);
      
      // Colores corporativos
      const colorPrimary = [16, 185, 129]; // emerald-600
      const colorPrimaryLight = [209, 250, 229]; // emerald-100
      const colorDark = [17, 24, 39]; // gray-900
      const colorGray = [107, 114, 128]; // gray-500
      const colorLightGray = [243, 244, 246]; // gray-100
      
      // Función para limpiar texto y evitar problemas de codificación
      const cleanText = (text: string): string => {
        if (!text) return '';
        // Reemplazar caracteres problemáticos comunes, pero mantener números, símbolos de moneda y caracteres comunes
        return String(text)
          .replace(/[^\x00-\x7F]/g, (char) => {
            // Mapeo de caracteres especiales comunes
            const map: { [key: string]: string } = {
              'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
              'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
              'ñ': 'n', 'Ñ': 'N',
              'ü': 'u', 'Ü': 'U',
              'ç': 'c', 'Ç': 'C',
            };
            return map[char] || char;
          });
      };
      
      // Función para agregar texto con salto de página automático
      const addText = (text: string, fontSize: number, isBold: boolean = false, color: number[] = [0, 0, 0]) => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        pdf.setTextColor(color[0], color[1], color[2]);
        const cleanedText = cleanText(text);
        const lines = pdf.splitTextToSize(cleanedText, contentWidth);
        
        lines.forEach((line: string) => {
          if (yPosition + 10 > pdfHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin, yPosition);
          yPosition += fontSize * 0.5;
        });
        yPosition += 5;
      };
      
      // Función para agregar caja con fondo
      const addBox = (x: number, y: number, width: number, height: number, color: number[]) => {
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.roundedRect(x, y, width, height, 2, 2, 'F');
      };
      
      // Header moderno con fondo degradado
      const headerHeight = 40;
      addBox(margin, yPosition, contentWidth, headerHeight, colorPrimaryLight);
      
      // Logo - posicionado a la izquierda
      let logoWidth = 0;
      try {
        const logoUrl = 'https://res.cloudinary.com/dbufrzoda/image/upload/v1760908611/Captura_de_pantalla_2025-10-19_122805_v4gvpt.png';
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve) => {
          logoImg.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (ctx) {
                canvas.width = logoImg.width;
                canvas.height = logoImg.height;
                ctx.drawImage(logoImg, 0, 0);
                const logoData = canvas.toDataURL('image/png');
                const logoHeight = 22;
                logoWidth = (logoHeight * logoImg.width) / logoImg.height;
                pdf.addImage(logoData, 'PNG', margin + 5, yPosition + 9, logoWidth, logoHeight);
              }
            } catch (e) {
              console.warn('Error al agregar logo:', e);
            }
            resolve();
          };
          logoImg.onerror = () => resolve();
          logoImg.src = logoUrl;
          setTimeout(() => resolve(), 3000);
        });
      } catch (e) {
        console.warn('Error al cargar logo:', e);
      }
      
      // Título de la empresa - posicionado después del logo con espacio adecuado
      const logoEndX = margin + 5 + (logoWidth || 0) + 8;
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
      pdf.text(cleanText('Digiautomatiza'), logoEndX, yPosition + 14);
      
      pdf.setFontSize(9);
      pdf.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
      pdf.setFont('helvetica', 'normal');
      pdf.text(cleanText('Innovacion Digital | Transformando Ideas en Soluciones'), logoEndX, yPosition + 21);
      
      // Número de propuesta y fecha en el header
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
      pdf.text(`Propuesta N° ${propuesta.numeroPropuesta}`, pdfWidth - margin - 5, yPosition + 12, { align: 'right' });
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
      pdf.text(`Fecha: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`, pdfWidth - margin - 5, yPosition + 18, { align: 'right' });
      
      yPosition += headerHeight + 10;
      
      // Caja de información del cliente (diseño moderno)
      const clienteBoxHeight = propuesta.cliente.empresa ? 35 : 30;
      addBox(margin, yPosition, contentWidth, clienteBoxHeight, colorLightGray);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
      pdf.text('CLIENTE', margin + 8, yPosition + 7);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
      pdf.text(cleanText(propuesta.cliente.nombre), margin + 8, yPosition + 15);
      
      if (propuesta.cliente.empresa) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
        pdf.text(cleanText(propuesta.cliente.empresa), margin + 8, yPosition + 22);
      }
      
      pdf.setFontSize(9);
      pdf.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
      pdf.text(cleanText(`Email: ${propuesta.cliente.email}`), margin + 8, yPosition + (propuesta.cliente.empresa ? 29 : 22));
      pdf.text(cleanText(`Telefono: ${propuesta.cliente.telefono}`), margin + 8, yPosition + (propuesta.cliente.empresa ? 33 : 26));
      
      yPosition += clienteBoxHeight + 12;
      
      // Título con estilo moderno
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
      const tituloLines = pdf.splitTextToSize(cleanText(propuesta.titulo), contentWidth);
      tituloLines.forEach((line: string) => {
        if (yPosition + 10 > pdfHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += 9;
      });
      
      // Línea decorativa bajo el título
      pdf.setDrawColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
      pdf.setLineWidth(2);
      pdf.line(margin, yPosition, margin + 50, yPosition);
      yPosition += 10;
      
      // Contenido
      try {
        const contenido = typeof propuesta.contenido === 'string' 
          ? JSON.parse(propuesta.contenido) 
          : propuesta.contenido;
        if (contenido.introduccion) {
          addText(cleanText(contenido.introduccion), 10, false, colorDark);
        }
        if (contenido.descripcionServicio) {
          yPosition += 3;
          addText(cleanText(contenido.descripcionServicio), 10, false, colorDark);
        }
      } catch (e) {
        console.warn('Error al parsear contenido:', e);
      }
      
      // Especificaciones con diseño mejorado
      if (propuesta.especificaciones) {
        yPosition += 15; // Aumentado el espaciado antes de las especificaciones
        if (yPosition + 40 > pdfHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        // Calcular altura necesaria para las especificaciones
        const especTextLines = pdf.splitTextToSize(cleanText(propuesta.especificaciones), contentWidth - 20);
        const titleHeight = 12; // Altura del título
        const titleSpacing = 15; // Espaciado después del título
        const textHeight = especTextLines.length * 5; // Altura del texto
        const bottomPadding = 8; // Padding inferior
        const especTextHeight = titleHeight + titleSpacing + textHeight + bottomPadding;
        
        // Guardar posición inicial de la caja
        const especBoxY = yPosition;
        
        // Caja para especificaciones
        addBox(margin, especBoxY, contentWidth, especTextHeight, colorPrimaryLight);
        
        // Título
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
        pdf.text('Especificaciones del Servicio', margin + 5, especBoxY + 8);
        
        // Posición para el contenido (después del título y espaciado)
        yPosition = especBoxY + titleHeight + titleSpacing;
        
        // Contenido de las especificaciones
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
        especTextLines.forEach((line: string) => {
          if (yPosition + 6 > pdfHeight - margin - 5) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(cleanText(line), margin + 5, yPosition);
          yPosition += 5;
        });
        
        // Actualizar posición final después de la caja
        yPosition = especBoxY + especTextHeight + 8; // Espaciado después de las especificaciones
      }
      
      // Totales con diseño moderno y elegante
      yPosition += 8; // Reducido el espaciado entre especificaciones y costos
      
      // Verificar que el cuadro de costos no quede tapado por el footer (footer empieza en pdfHeight - 25)
      const totalesHeight = propuesta.descuento && propuesta.descuento > 0 ? 60 : 50;
      const espacioNecesario = totalesHeight + 10; // Altura del cuadro + margen de seguridad
      
      if (yPosition + espacioNecesario > pdfHeight - 30) { // 30mm de margen para el footer
        pdf.addPage();
        yPosition = margin;
      }
      
      // Caja para totales - altura aumentada para asegurar que el TOTAL quepa
      addBox(margin, yPosition, contentWidth, totalesHeight, colorLightGray);
      
      // Borde superior verde
      pdf.setDrawColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
      pdf.setLineWidth(3);
      pdf.line(margin, yPosition, pdfWidth - margin, yPosition);
      
      yPosition += 8;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
      pdf.text(cleanText('Subtotal:'), pdfWidth - margin - 5, yPosition, { align: 'right' });
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
      const subtotalFormateado = formatearMoneda(propuesta.valorTotal || 0);
      // No usar cleanText en valores monetarios para preservar símbolos y números
      pdf.text(subtotalFormateado, pdfWidth - margin - 5, yPosition + 5, { align: 'right' });
      yPosition += 10;
      
      if (propuesta.descuento && propuesta.descuento > 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(220, 38, 38); // red-600
        pdf.text(cleanText('Descuento:'), pdfWidth - margin - 5, yPosition, { align: 'right' });
        pdf.setFont('helvetica', 'bold');
        const descuentoFormateado = formatearMoneda(propuesta.descuento);
        // No usar cleanText en valores monetarios
        pdf.text(`-${descuentoFormateado}`, pdfWidth - margin - 5, yPosition + 5, { align: 'right' });
        yPosition += 10;
      }
      
      // Línea separadora antes del total
      pdf.setDrawColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
      pdf.setLineWidth(1);
      pdf.line(margin + 5, yPosition, pdfWidth - margin - 5, yPosition);
      yPosition += 8;
      
      // Total destacado
      const valorTotalFormateado = formatearMoneda(propuesta.valorFinal || 0);
      console.log('Valor Total formateado:', valorTotalFormateado, 'Valor original:', propuesta.valorFinal);
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
      pdf.text('TOTAL:', pdfWidth - margin - 5, yPosition, { align: 'right' });
      
      // Valor del total con color y tamaño destacado
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]); // Verde corporativo
      // No usar cleanText en valores monetarios para preservar símbolos y números
      pdf.text(valorTotalFormateado, pdfWidth - margin - 5, yPosition + 7, { align: 'right' });
      
      yPosition += 20;
      
      // Adjuntos - Agregar imágenes directamente al PDF con diseño mejorado
      if (propuesta.adjuntos && propuesta.adjuntos.length > 0) {
        yPosition += 5;
        if (yPosition + 20 > pdfHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
        pdf.text('Archivos Adjuntos', margin, yPosition);
        yPosition += 8;
        
        // Línea decorativa
        pdf.setDrawColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
        pdf.setLineWidth(1);
        pdf.line(margin, yPosition, margin + 40, yPosition);
        yPosition += 10;
        
        for (const adjunto of propuesta.adjuntos) {
          if (yPosition + 50 > pdfHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          
          // Caja para cada adjunto
          addBox(margin, yPosition, contentWidth, 8, colorLightGray);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
        pdf.text(cleanText(adjunto.nombre), margin + 3, yPosition + 6);
          yPosition += 10;
          
          // Si es imagen, intentar agregarla al PDF
          if (adjunto.tipo === 'imagen' || adjunto.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            try {
              // Cargar imagen y convertir a base64
              const img = new Image();
              img.crossOrigin = 'anonymous';
              
              await new Promise<void>((resolve, reject) => {
                img.onload = () => {
                  try {
                    // Crear canvas para convertir imagen
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                      reject(new Error('No se pudo obtener contexto del canvas'));
                      return;
                    }
                    
                    // Imagen ocupa el ancho completo con márgenes del documento
                    const maxWidthMM = contentWidth; // Ancho completo en milímetros
                    const maxHeightMM = 250; // Altura máxima en milímetros (aumentada significativamente)
                    
                    // Obtener dimensiones originales de la imagen
                    let originalWidth = img.width;
                    let originalHeight = img.height;
                    
                    // Calcular aspect ratio original
                    const aspectRatio = originalWidth / originalHeight;
                    
                    // Calcular dimensiones finales en milímetros manteniendo aspect ratio
                    let imgWidthMM = maxWidthMM;
                    let imgHeightMM = imgWidthMM / aspectRatio;
                    
                    // Si la altura excede el máximo, ajustar proporcionalmente
                    if (imgHeightMM > maxHeightMM) {
                      imgHeightMM = maxHeightMM;
                      imgWidthMM = imgHeightMM * aspectRatio;
                    }
                    
                    // Convertir milímetros a píxeles para el canvas (aproximadamente 3.78 px por mm a 96 DPI)
                    const scaleFactor = 3.779527559; // píxeles por milímetro
                    const canvasWidth = Math.round(imgWidthMM * scaleFactor);
                    const canvasHeight = Math.round(imgHeightMM * scaleFactor);
                    
                    canvas.width = canvasWidth;
                    canvas.height = canvasHeight;
                    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
                    
                    const imgData = canvas.toDataURL('image/jpeg', 0.9); // Mejor calidad
                    
                    // Verificar si necesita nueva página
                    if (yPosition + imgHeightMM + 15 > pdfHeight - margin) {
                      pdf.addPage();
                      yPosition = margin;
                    }
                    
                    // Borde decorativo alrededor de la imagen
                    pdf.setDrawColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
                    pdf.setLineWidth(1.5);
                    pdf.roundedRect(margin, yPosition, imgWidthMM, imgHeightMM + 4, 3, 3, 'S');
                    
                    // Agregar imagen centrada en el ancho disponible
                    pdf.addImage(imgData, 'JPEG', margin, yPosition + 2, imgWidthMM, imgHeightMM);
                    yPosition += imgHeightMM + 12; // Espaciado después de la imagen
                    resolve();
                  } catch (error) {
                    console.error('Error al agregar imagen al PDF:', error);
                    addText(`[Imagen: ${adjunto.nombre} - Ver en línea: ${adjunto.url}]`, 8);
                    resolve();
                  }
                };
                img.onerror = () => {
                  addText(`[Imagen no disponible: ${adjunto.nombre} - Ver en línea: ${adjunto.url}]`, 8);
                  resolve();
                };
                img.src = adjunto.url;
                
                setTimeout(() => {
                  if (!img.complete) {
                    addText(`[Imagen: ${adjunto.nombre} - Ver en línea: ${adjunto.url}]`, 8);
                    resolve();
                  }
                }, 5000);
              });
            } catch (error) {
              console.error('Error al procesar imagen:', error);
              addText(`[Imagen: ${adjunto.nombre} - Ver en línea: ${adjunto.url}]`, 8);
            }
          } else {
            // Para documentos PDF u otros, agregar enlace
            addText(`[Documento: ${adjunto.nombre} - Ver en línea: ${adjunto.url}]`, 8);
          }
          
          yPosition += 5;
        }
      }
      
      // Sección de contacto con diseño moderno
      yPosition += 15;
      if (yPosition + 50 > pdfHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      
      // Caja de contacto con fondo verde claro
      const contactoHeight = usuario?.nombre ? 45 : 38;
      addBox(margin, yPosition, contentWidth, contactoHeight, colorPrimaryLight);
      
      // Borde superior verde
      pdf.setDrawColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
      pdf.setLineWidth(3);
      pdf.line(margin, yPosition, pdfWidth - margin, yPosition);
      
      yPosition += 8;
      
      // Título de contacto
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
      pdf.text('Informacion de Contacto', margin + 5, yPosition);
      yPosition += 10;
      
      // Información del comercial
      if (usuario?.nombre) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
        pdf.text('Comercial:', margin + 5, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
        pdf.text(cleanText(usuario.nombre), margin + 30, yPosition);
        yPosition += 7;
      }
      
      // Información de contacto de la empresa en dos columnas
      const col1X = margin + 5;
      const col2X = margin + contentWidth / 2 + 5;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
      pdf.text('Telefono:', col1X, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
      pdf.text('+57 313 368 3567', col1X + 25, yPosition);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
      pdf.text('Web:', col2X, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
      pdf.text('www.digiautomatiza.co', col2X + 20, yPosition);
      yPosition += 7;
      
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
      pdf.text('Email:', col1X, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
      pdf.text('digiautomatiza1@gmail.com', col1X + 25, yPosition);
      
      // Footer elegante en todas las páginas
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        
        // Fondo del footer
        addBox(margin, pdfHeight - 25, contentWidth, 20, colorPrimaryLight);
        
        // Línea superior verde
        pdf.setDrawColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
        pdf.setLineWidth(2);
        pdf.line(margin, pdfHeight - 25, pdfWidth - margin, pdfHeight - 25);
        
        // Logo pequeño en el footer (opcional, solo texto por ahora)
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
        pdf.text('Digiautomatiza', margin + 3, pdfHeight - 18);
        
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
      // "Innovación Digital" y URL en la misma línea
      const innovacionText = 'Innovacion Digital';
      const webText = 'www.digiautomatiza.co';
      const combinedText = `${innovacionText} | ${webText}`;
      pdf.text(cleanText(combinedText), margin + 3, pdfHeight - 13);
      
      // Información de contacto compacta
      pdf.setFontSize(6);
      pdf.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
      pdf.text('Telefono: +57 313 368 3567', margin + 3, pdfHeight - 8);
      pdf.text('Email: digiautomatiza1@gmail.com', margin + 45, pdfHeight - 8);
        
        // Número de página con estilo
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
        pdf.text(
          `${i} / ${totalPages}`,
          pdfWidth - margin - 3,
          pdfHeight - 10,
          { align: 'right' }
        );
      }

      console.log('PDF creado, descargando...');
      pdf.save(`Propuesta-${propuesta.numeroPropuesta}.pdf`);
    } catch (error) {
      console.error('Error completo al exportar PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al exportar PDF: ${errorMessage}. Por favor, intenta nuevamente.`);
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
                        {propuesta.adjuntos && propuesta.adjuntos.length > 0 && (
                          <span className="text-emerald-600" title={`${propuesta.adjuntos.length} archivo(s) adjunto(s)`}>
                            📎 {propuesta.adjuntos.length}
                          </span>
                        )}
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
                        onClick={() => handleEditarPropuesta(propuesta)}
                      >
                        ✏️ Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportarPDF(propuesta)}
                      >
                        📥 PDF
                      </Button>
                      <Button
                        variant={propuesta.estadoAprobacion === 'Aprobada' ? 'success' : 'outline'}
                        size="sm"
                        onClick={() => handleCambiarEstadoAprobacion(propuesta)}
                        title={propuesta.estadoAprobacion === 'Aprobada' ? 'Cambiar a Sin Aprobar' : 'Aprobar Propuesta'}
                      >
                        {propuesta.estadoAprobacion === 'Aprobada' ? '✅ Aprobada' : '⏳ Sin Aprobar'}
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
              className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
              textClassName="text-emerald-900"
            />

            <Select
              label="Cliente *"
              options={clientes.map(c => ({ value: c.id, label: `${c.nombre} - ${c.empresa || c.email}` }))}
              value={nuevaPropuesta.clienteId}
              onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, clienteId: e.target.value })}
              fullWidth
              className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
              textClassName="text-emerald-900"
            />

            <Input
              label="Título de la Propuesta *"
              value={nuevaPropuesta.titulo}
              onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, titulo: e.target.value })}
              fullWidth
              placeholder="Ej: Desarrollo de Página Web Corporativa"
              className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
              textClassName="text-emerald-900 placeholder:text-emerald-500"
            />

            <Select
              label="Servicio *"
              options={serviciosOptions.map(s => ({ value: s.value, label: `${s.icon} ${s.label}` }))}
              value={nuevaPropuesta.servicio}
              onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, servicio: e.target.value as ServicioTipo })}
              fullWidth
              className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
              textClassName="text-emerald-900"
            />

            <TextArea
              label="Especificaciones del Servicio *"
              value={nuevaPropuesta.especificaciones}
              onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, especificaciones: e.target.value })}
              fullWidth
              rows={6}
              placeholder="Describe detalladamente las características, funcionalidades y especificaciones del servicio que se ofrecerá..."
              className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
              textClassName="text-emerald-900 placeholder:text-emerald-500"
            />

            <div className="border-t pt-4">
              <h3 className="font-semibold text-emerald-800 mb-3">Archivos Adjuntos (Opcional)</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors">
                    <span>📎</span>
                    <span>{subiendoArchivo ? 'Subiendo...' : 'Seleccionar Archivo'}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleSubirArchivo}
                      disabled={subiendoArchivo}
                    />
                  </label>
                  <span className="text-sm text-gray-600">
                    Cualquier tipo de archivo - Máx. 50MB
                  </span>
                </div>

                {adjuntos.length > 0 && (
                  <div className="space-y-2">
                    {adjuntos.map((adjunto, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {adjunto.tipo === 'imagen' ? (
                            <img 
                              src={adjunto.url} 
                              alt={adjunto.nombre}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <span className="text-3xl">📄</span>
                          )}
                          <div>
                            <p className="font-medium text-emerald-900">{adjunto.nombre}</p>
                            <p className="text-sm text-gray-600">
                              {(adjunto.tamaño / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => eliminarAdjunto(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-emerald-800 mb-3">Valores</h3>
              <div className="space-y-3">
                <Input
                  label="Valor Total *"
                  type="number"
                  value={nuevaPropuesta.valorTotal}
                  onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, valorTotal: e.target.value })}
                  fullWidth
                  placeholder="0"
                  className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                  textClassName="text-emerald-900 placeholder:text-emerald-500"
                />
                <div className="flex items-center gap-2">
                  <Input
                    label="Descuento (Opcional)"
                    type="number"
                    value={nuevaPropuesta.descuento}
                    onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, descuento: e.target.value })}
                    className="flex-1 bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                    placeholder="0"
                    textClassName="text-emerald-900 placeholder:text-emerald-500"
                  />
                </div>
                <div className="p-4 bg-emerald-100 rounded-lg">
                  <div className="flex justify-between text-lg font-bold text-emerald-800">
                    <span>Total:</span>
                    <span>{formatearMoneda(calcularTotal().total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <Input
              label="Validez (días)"
              type="number"
              value={nuevaPropuesta.validez}
              onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, validez: e.target.value })}
              fullWidth
              className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
              textClassName="text-emerald-900 placeholder:text-emerald-500"
            />

            <TextArea
              label="Notas Internas (Opcional)"
              value={nuevaPropuesta.notas}
              onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, notas: e.target.value })}
              fullWidth
              rows={3}
              placeholder="Notas adicionales sobre esta propuesta..."
              className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
              textClassName="text-emerald-900 placeholder:text-emerald-500"
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
                disabled={isSaving || !nuevaPropuesta.clienteId || !nuevaPropuesta.titulo || !nuevaPropuesta.servicio || !nuevaPropuesta.especificaciones || !nuevaPropuesta.valorTotal}
              >
                {isSaving ? 'Guardando...' : 'Guardar Propuesta'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal Editar Propuesta */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            resetFormulario();
          }}
          title="Editar Propuesta"
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
              className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
              textClassName="text-emerald-900"
            />

            <Select
              label="Cliente *"
              options={clientes.map(c => ({ value: c.id, label: `${c.nombre} - ${c.empresa || c.email}` }))}
              value={nuevaPropuesta.clienteId}
              onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, clienteId: e.target.value })}
              fullWidth
              className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
              textClassName="text-emerald-900"
            />

            <Input
              label="Título de la Propuesta *"
              value={nuevaPropuesta.titulo}
              onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, titulo: e.target.value })}
              fullWidth
              placeholder="Ej: Desarrollo de Página Web Corporativa"
              className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
              textClassName="text-emerald-900 placeholder:text-emerald-500"
            />

            <Select
              label="Servicio *"
              options={serviciosOptions.map(s => ({ value: s.value, label: `${s.icon} ${s.label}` }))}
              value={nuevaPropuesta.servicio}
              onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, servicio: e.target.value as ServicioTipo })}
              fullWidth
              className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
              textClassName="text-emerald-900"
            />

            <TextArea
              label="Especificaciones del Servicio *"
              value={nuevaPropuesta.especificaciones}
              onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, especificaciones: e.target.value })}
              fullWidth
              rows={6}
              placeholder="Describe detalladamente las características, funcionalidades y especificaciones del servicio que se ofrecerá..."
              className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
              textClassName="text-emerald-900 placeholder:text-emerald-500"
            />

            <div className="border-t pt-4">
              <h3 className="font-semibold text-emerald-800 mb-3">Archivos Adjuntos (Opcional)</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors">
                    <span>📎</span>
                    <span>{subiendoArchivo ? 'Subiendo...' : 'Agregar Archivo'}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleSubirArchivo}
                      disabled={subiendoArchivo}
                    />
                  </label>
                  <span className="text-sm text-gray-600">
                    Cualquier tipo de archivo - Máx. 50MB
                  </span>
                </div>

                {adjuntos.length > 0 && (
                  <div className="space-y-2">
                    {adjuntos.map((adjunto, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {adjunto.tipo === 'imagen' ? (
                            <img 
                              src={adjunto.url} 
                              alt={adjunto.nombre}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <span className="text-3xl">📄</span>
                          )}
                          <div>
                            <p className="font-medium text-emerald-900">{adjunto.nombre}</p>
                            <p className="text-sm text-gray-600">
                              {(adjunto.tamaño / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => eliminarAdjunto(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-emerald-800 mb-3">Valores</h3>
              <div className="space-y-3">
                <Input
                  label="Valor Total *"
                  type="number"
                  value={nuevaPropuesta.valorTotal}
                  onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, valorTotal: e.target.value })}
                  fullWidth
                  placeholder="0"
                  className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                  textClassName="text-emerald-900 placeholder:text-emerald-500"
                />
                <div className="flex items-center gap-2">
                  <Input
                    label="Descuento (Opcional)"
                    type="number"
                    value={nuevaPropuesta.descuento}
                    onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, descuento: e.target.value })}
                    className="flex-1 bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                    placeholder="0"
                    textClassName="text-emerald-900 placeholder:text-emerald-500"
                  />
                </div>
                <div className="p-4 bg-emerald-100 rounded-lg">
                  <div className="flex justify-between text-lg font-bold text-emerald-800">
                    <span>Total:</span>
                    <span>{formatearMoneda(calcularTotal().total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <Input
              label="Validez (días)"
              type="number"
              value={nuevaPropuesta.validez}
              onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, validez: e.target.value })}
              fullWidth
              className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
              textClassName="text-emerald-900 placeholder:text-emerald-500"
            />

            <TextArea
              label="Notas Internas (Opcional)"
              value={nuevaPropuesta.notas}
              onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, notas: e.target.value })}
              fullWidth
              rows={3}
              placeholder="Notas adicionales sobre esta propuesta..."
              className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
              textClassName="text-emerald-900 placeholder:text-emerald-500"
            />

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setIsEditModalOpen(false);
                  resetFormulario();
                }}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleActualizarPropuesta}
                disabled={isSaving || !nuevaPropuesta.clienteId || !nuevaPropuesta.titulo || !nuevaPropuesta.servicio || !nuevaPropuesta.especificaciones || !nuevaPropuesta.valorTotal}
              >
                {isSaving ? 'Guardando...' : 'Actualizar Propuesta'}
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

                {/* Especificaciones */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Especificaciones del Servicio:</h3>
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {propuestaPreview.especificaciones || 
                       (propuestaPreview.items && propuestaPreview.items.length > 0 
                         ? propuestaPreview.items[0].descripcion 
                         : 'No hay especificaciones disponibles')}
                    </p>
                  </div>
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

                {/* Adjuntos */}
                {propuestaPreview.adjuntos && propuestaPreview.adjuntos.length > 0 && (
                  <div className="mb-6 border-t pt-6">
                    <h3 className="font-semibold text-gray-800 mb-4 text-lg">Archivos Adjuntos</h3>
                    <div className="space-y-6">
                      {propuestaPreview.adjuntos.map((adjunto, index) => {
                        const esPDF = adjunto.nombre.toLowerCase().endsWith('.pdf');
                        const esImagen = adjunto.tipo === 'imagen' || 
                          adjunto.nombre.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i);
                        
                        return (
                          <div key={index} className="border-2 border-emerald-200 rounded-lg p-4 bg-gray-50">
                            <p className="text-sm font-semibold text-gray-700 mb-3">{adjunto.nombre}</p>
                            
                            {esPDF ? (
                              <div>
                                <div className="bg-white p-4 rounded border border-gray-300 mb-2" style={{ height: '600px', overflow: 'auto' }}>
                                  {/* Verificar que la URL sea válida antes de cargar el iframe */}
                                  {adjunto.url && !adjunto.url.includes(']') && adjunto.url.startsWith('http') ? (
                                    <iframe
                                      src={`${adjunto.url}#toolbar=0&navpanes=0`}
                                      className="w-full h-full border-0"
                                      title={adjunto.nombre}
                                      onLoad={() => {
                                        console.log('PDF cargado exitosamente:', adjunto.url);
                                      }}
                                      onError={(e) => {
                                        console.error('Error al cargar PDF:', adjunto.url);
                                        const iframe = e.target as HTMLIFrameElement;
                                        iframe.style.display = 'none';
                                        const parent = iframe.parentElement;
                                        if (parent) {
                                          parent.innerHTML = `
                                            <div class="text-center p-4">
                                              <p class="text-red-600 mb-2">⚠️ No se pudo cargar el PDF en el visor</p>
                                              <a href="${adjunto.url}" target="_blank" rel="noopener noreferrer" 
                                                 class="text-emerald-600 hover:text-emerald-800 text-sm underline font-semibold">
                                                Abrir PDF completo en nueva pestaña: ${adjunto.nombre}
                                              </a>
                                            </div>
                                          `;
                                        }
                                      }}
                                    />
                                  ) : (
                                    <div className="text-center p-4">
                                      <p className="text-red-600 mb-2">⚠️ URL de PDF inválida</p>
                                      {adjunto.url && (
                                        <a 
                                          href={adjunto.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-emerald-600 hover:text-emerald-800 text-sm underline font-semibold"
                                        >
                                          Intentar abrir PDF: {adjunto.nombre}
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="text-center mt-2">
                                  <a 
                                    href={adjunto.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-emerald-600 hover:text-emerald-800 text-sm underline font-semibold"
                                  >
                                    Abrir PDF completo en nueva pestaña
                                  </a>
                                </div>
                              </div>
                            ) : esImagen ? (
                              <div>
                                <div className="flex justify-center bg-white p-2 rounded mb-2">
                                  <img 
                                    src={adjunto.url} 
                                    alt={adjunto.nombre}
                                    className="max-w-full h-auto rounded"
                                    style={{ maxHeight: '600px', objectFit: 'contain' }}
                                    crossOrigin="anonymous"
                                    onError={(e) => {
                                      console.error('Error al cargar imagen:', adjunto.url);
                                      const imgElement = e.target as HTMLImageElement;
                                      imgElement.style.display = 'none';
                                      const parent = imgElement.parentElement;
                                      if (parent) {
                                        parent.innerHTML = `
                                          <div class="text-center p-4">
                                            <p class="text-red-600 mb-2">⚠️ No se pudo cargar la imagen</p>
                                            <a href="${adjunto.url}" target="_blank" rel="noopener noreferrer" 
                                               class="text-emerald-600 hover:text-emerald-800 text-sm underline font-semibold">
                                              Ver imagen en línea: ${adjunto.nombre}
                                            </a>
                                          </div>
                                        `;
                                      }
                                    }}
                                  />
                                </div>
                                <div className="text-center">
                                  <a 
                                    href={adjunto.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-emerald-600 hover:text-emerald-800 text-xs underline"
                                  >
                                    Ver imagen completa en línea
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <div className="bg-emerald-100 rounded-lg p-6 mb-3">
                                  <span className="text-6xl block mb-2">📄</span>
                                  <p className="text-sm font-semibold text-gray-700">{adjunto.nombre}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {(adjunto.tamaño ? (adjunto.tamaño / 1024).toFixed(2) : 'N/A')} KB
                                  </p>
                                </div>
                                <a 
                                  href={adjunto.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-emerald-600 hover:text-emerald-800 text-sm underline font-semibold"
                                >
                                  Ver documento completo en línea
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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

