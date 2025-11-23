import { TareaProyecto } from '../types';

interface GanttChartProps {
  tareas: TareaProyecto[];
  fechaInicio?: Date;
  fechaEntrega?: Date;
  onTareaUpdate?: (tareaId: string, updates: Partial<TareaProyecto>) => void;
}

export default function GanttChart({ tareas, fechaInicio, fechaEntrega, onTareaUpdate }: GanttChartProps) {
  if (!tareas || tareas.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
        <p>No hay tareas definidas para este proyecto.</p>
        <p className="text-sm mt-2">Agrega tareas para visualizar el diagrama de Gantt.</p>
      </div>
    );
  }

  // Calcular el rango de fechas
  const todasLasFechas = tareas.flatMap(t => [
    new Date(t.fechaInicio),
    new Date(t.fechaFin),
  ]);
  
  if (fechaInicio) todasLasFechas.push(fechaInicio);
  if (fechaEntrega) todasLasFechas.push(fechaEntrega);

  const fechaMin = new Date(Math.min(...todasLasFechas.map(d => d.getTime())));
  const fechaMax = new Date(Math.max(...todasLasFechas.map(d => d.getTime())));

  // Calcular días totales
  const diasTotales = Math.ceil((fechaMax.getTime() - fechaMin.getTime()) / (1000 * 60 * 60 * 24));
  const diasPorPixel = Math.max(1, diasTotales / 800); // 800px de ancho máximo

  // Función para calcular posición y ancho de una tarea
  const calcularPosicionTarea = (tarea: TareaProyecto) => {
    const fechaInicioTarea = new Date(tarea.fechaInicio);
    const fechaFinTarea = new Date(tarea.fechaFin);
    
    const diasDesdeInicio = Math.ceil((fechaInicioTarea.getTime() - fechaMin.getTime()) / (1000 * 60 * 60 * 24));
    const duracion = Math.ceil((fechaFinTarea.getTime() - fechaInicioTarea.getTime()) / (1000 * 60 * 60 * 24));
    
    const left = (diasDesdeInicio / diasTotales) * 100;
    const width = (duracion / diasTotales) * 100;
    
    return { left: Math.max(0, left), width: Math.max(2, width) };
  };

  // Generar días del mes para el encabezado
  const generarDias = () => {
    const dias = [];
    const fechaActual = new Date(fechaMin);
    
    while (fechaActual <= fechaMax) {
      dias.push(new Date(fechaActual));
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
    
    return dias;
  };

  const dias = generarDias();
  const diasAgrupados = [];
  
  // Agrupar días por semana
  for (let i = 0; i < dias.length; i += 7) {
    diasAgrupados.push(dias.slice(i, i + 7));
  }

  const colores = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-teal-500',
  ];

  return (
    <div className="w-full overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Encabezado con fechas */}
      <div className="border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
        <div className="flex">
          <div className="w-64 p-3 font-semibold text-gray-700 border-r border-gray-200 bg-gray-100">
            Tarea
          </div>
          <div className="flex-1 relative" style={{ minWidth: '800px' }}>
            {diasAgrupados.map((semana, semanaIdx) => (
              <div key={semanaIdx} className="inline-block border-r border-gray-200" style={{ width: `${(7 / dias.length) * 100}%` }}>
                <div className="text-xs text-center p-1 text-gray-600 font-medium">
                  {semana[0].toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                  {' - '}
                  {semana[semana.length - 1].toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Línea de tiempo actual */}
      {fechaInicio && fechaEntrega && (
        <div className="relative" style={{ minWidth: '800px' }}>
          <div
            className="absolute top-0 bottom-0 bg-emerald-200 opacity-30 z-0"
            style={{
              left: `${((new Date(fechaInicio).getTime() - fechaMin.getTime()) / (1000 * 60 * 60 * 24) / diasTotales) * 100}%`,
              width: `${((new Date(fechaEntrega).getTime() - new Date(fechaInicio).getTime()) / (1000 * 60 * 60 * 24) / diasTotales) * 100}%`,
            }}
          />
        </div>
      )}

      {/* Tareas */}
      <div className="relative">
        {tareas.map((tarea, index) => {
          const { left, width } = calcularPosicionTarea(tarea);
          const color = colores[index % colores.length];
          
          return (
            <div key={tarea.id} className="flex border-b border-gray-100 hover:bg-gray-50 transition-colors">
              {/* Nombre de la tarea */}
              <div className="w-64 p-3 border-r border-gray-200 flex items-center justify-between bg-white">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{tarea.nombre}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {tarea.duracion} día{tarea.duracion !== 1 ? 's' : ''}
                    {tarea.responsable && ` • ${tarea.responsable}`}
                  </div>
                </div>
                <div className="ml-2 flex-shrink-0">
                  <div className="text-xs font-semibold text-gray-700">
                    {tarea.progreso}%
                  </div>
                </div>
              </div>

              {/* Barra de Gantt */}
              <div className="flex-1 relative" style={{ minWidth: '800px', height: '60px' }}>
                {/* Fondo con grid */}
                <div className="absolute inset-0 flex">
                  {diasAgrupados.map((_, semanaIdx) => (
                    <div
                      key={semanaIdx}
                      className="border-r border-gray-100"
                      style={{ width: `${(7 / dias.length) * 100}%` }}
                    />
                  ))}
                </div>

                {/* Barra de la tarea */}
                <div
                  className={`absolute top-3 bottom-3 rounded ${color} shadow-sm flex items-center justify-between px-2 text-white text-xs font-medium`}
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    minWidth: '60px',
                  }}
                  title={`${tarea.nombre} - ${tarea.fechaInicio} a ${tarea.fechaFin} (${tarea.duracion} días)`}
                >
                  <span className="truncate flex-1">{tarea.nombre}</span>
                  
                  {/* Barra de progreso dentro de la tarea */}
                  {tarea.progreso > 0 && (
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-emerald-600 rounded"
                      style={{ width: `${tarea.progreso}%` }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-200 rounded"></div>
            <span>Período del proyecto</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-600 rounded"></div>
            <span>Progreso completado</span>
          </div>
        </div>
      </div>
    </div>
  );
}

