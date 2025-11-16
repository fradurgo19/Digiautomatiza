import * as XLSX from 'xlsx';
import { Cliente, ServicioTipo, EstadoCliente } from '../types';

/**
 * Servicio para importar y exportar clientes en formato Excel
 */

// Genera y descarga una plantilla de Excel vacía
export function descargarPlantillaExcel() {
  const plantilla = [
    {
      'Nombre Completo': 'Juan Pérez',
      'Email': 'juan.perez@ejemplo.com',
      'Teléfono': '+57 300 123 4567',
      'Empresa': 'Empresa Ejemplo S.A.S',
      'Servicios de Interés': 'paginas-web, chatbot-ia',
      'Estado': 'nuevo',
      'Notas': 'Cliente potencial interesado en página web corporativa',
    },
    {
      'Nombre Completo': 'María González',
      'Email': 'maria.gonzalez@ejemplo.com',
      'Teléfono': '+57 301 234 5678',
      'Empresa': 'Tech Solutions',
      'Servicios de Interés': 'aplicaciones-web, automatizacion',
      'Estado': 'interesado',
      'Notas': 'Ya tuvo una llamada inicial',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(plantilla);
  
  // Ajustar ancho de columnas
  const columnWidths = [
    { wch: 25 }, // Nombre Completo
    { wch: 30 }, // Email
    { wch: 20 }, // Teléfono
    { wch: 30 }, // Empresa
    { wch: 40 }, // Servicios de Interés
    { wch: 15 }, // Estado
    { wch: 50 }, // Notas
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

  // Agregar hoja de instrucciones
  const instrucciones = [
    { 'INSTRUCCIONES PARA IMPORTAR CLIENTES': '' },
    { 'INSTRUCCIONES PARA IMPORTAR CLIENTES': '1. Complete los datos de cada cliente en las filas' },
    { 'INSTRUCCIONES PARA IMPORTAR CLIENTES': '2. Los campos Nombre, Email y Teléfono son obligatorios' },
    { 'INSTRUCCIONES PARA IMPORTAR CLIENTES': '3. Empresa y Notas son opcionales' },
    { 'INSTRUCCIONES PARA IMPORTAR CLIENTES': '' },
    { 'INSTRUCCIONES PARA IMPORTAR CLIENTES': 'SERVICIOS DE INTERÉS (separados por comas):' },
    { 'INSTRUCCIONES PARA IMPORTAR CLIENTES': '  - paginas-web' },
    { 'INSTRUCCIONES PARA IMPORTAR CLIENTES': '  - aplicaciones-web' },
    { 'INSTRUCCIONES PARA IMPORTAR CLIENTES': '  - chatbot-ia' },
    { 'INSTRUCCIONES PARA IMPORTAR CLIENTES': '  - automatizacion' },
    { 'INSTRUCCIONES PARA IMPORTAR CLIENTES': '  - analisis-datos' },
    { 'INSTRUCCIONES PARA IMPORTAR CLIENTES': '' },
    { 'INSTRUCCIONES PARA IMPORTAR CLIENTES': 'ESTADOS VÁLIDOS:' },
    { 'INSTRUCCIONES PARA IMPORTAR CLIENTES': '  - nuevo' },
    { 'INSTRUCCIONES PARA IMPORTAR CLIENTES': '  - contactado' },
    { 'INSTRUCCIONES PARA IMPORTAR CLIENTES': '  - interesado' },
    { 'INSTRUCCIONES PARA IMPORTAR CLIENTES': '  - en-negociacion' },
    { 'INSTRUCCIONES PARA IMPORTAR CLIENTES': '  - convertido' },
    { 'INSTRUCCIONES PARA IMPORTAR CLIENTES': '  - inactivo' },
  ];

  const worksheetInstrucciones = XLSX.utils.json_to_sheet(instrucciones);
  worksheetInstrucciones['!cols'] = [{ wch: 60 }];
  XLSX.utils.book_append_sheet(workbook, worksheetInstrucciones, 'Instrucciones');

  // Descargar archivo
  XLSX.writeFile(workbook, 'Plantilla_Clientes_Digiautomatiza.xlsx');
}

// Exporta los clientes actuales a Excel
export function exportarClientesExcel(clientes: Cliente[]) {
  const datosExport = clientes.map(cliente => ({
    'Nombre Completo': cliente.nombre,
    'Email': cliente.email,
    'Teléfono': cliente.telefono,
    'Empresa': cliente.empresa || '',
    'Servicios de Interés': cliente.serviciosInteres.join(', '),
    'Estado': cliente.estado,
    'Notas': cliente.notas || '',
    'Fecha de Registro': new Date(cliente.fechaRegistro).toLocaleDateString('es-ES'),
  }));

  const worksheet = XLSX.utils.json_to_sheet(datosExport);
  
  // Ajustar ancho de columnas
  const columnWidths = [
    { wch: 25 }, // Nombre Completo
    { wch: 30 }, // Email
    { wch: 20 }, // Teléfono
    { wch: 30 }, // Empresa
    { wch: 40 }, // Servicios de Interés
    { wch: 15 }, // Estado
    { wch: 50 }, // Notas
    { wch: 15 }, // Fecha de Registro
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Clientes_Digiautomatiza_${fecha}.xlsx`);
}

interface ResultadoImportacion {
  exitosos: Cliente[];
  errores: Array<{ fila: number; error: string; datos: any }>;
}

// Importa clientes desde un archivo Excel
export async function importarClientesExcel(file: File): Promise<ResultadoImportacion> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const exitosos: Cliente[] = [];
        const errores: Array<{ fila: number; error: string; datos: any }> = [];

        jsonData.forEach((row: any, index: number) => {
          try {
            // Validar campos requeridos
            if (!row['Nombre Completo']) {
              throw new Error('Nombre Completo es requerido');
            }
            if (!row['Email']) {
              throw new Error('Email es requerido');
            }
            if (!row['Teléfono']) {
              throw new Error('Teléfono es requerido');
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(row['Email'])) {
              throw new Error('Formato de email inválido');
            }

            // Procesar servicios de interés
            let serviciosInteres: ServicioTipo[] = [];
            if (row['Servicios de Interés']) {
              const serviciosString = row['Servicios de Interés'].toString();
              const serviciosArray = serviciosString.split(',').map(s => s.trim());
              
              const serviciosValidos = ['paginas-web', 'aplicaciones-web', 'chatbot-ia', 'automatizacion', 'analisis-datos'];
              serviciosInteres = serviciosArray.filter(s => serviciosValidos.includes(s)) as ServicioTipo[];
              
              if (serviciosInteres.length === 0) {
                throw new Error('Debe incluir al menos un servicio válido');
              }
            } else {
              throw new Error('Servicios de Interés es requerido');
            }

            // Validar estado
            const estadosValidos = ['nuevo', 'contactado', 'interesado', 'en-negociacion', 'convertido', 'inactivo'];
            const estado = (row['Estado'] || 'nuevo').toString().toLowerCase();
            if (!estadosValidos.includes(estado)) {
              throw new Error(`Estado "${estado}" no es válido`);
            }

            // Crear objeto cliente
            const cliente: Cliente = {
              id: Date.now().toString() + index,
              nombre: row['Nombre Completo'],
              email: row['Email'],
              telefono: row['Teléfono'].toString(),
              empresa: row['Empresa'] || undefined,
              serviciosInteres,
              estado: estado as EstadoCliente,
              notas: row['Notas'] || undefined,
              fechaRegistro: new Date(),
            };

            exitosos.push(cliente);
          } catch (error: any) {
            errores.push({
              fila: index + 2, // +2 porque Excel empieza en 1 y hay header
              error: error.message,
              datos: row,
            });
          }
        });

        resolve({ exitosos, errores });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsBinaryString(file);
  });
}

