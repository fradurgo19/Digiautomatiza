import Card from '../atoms/Card';
import Badge from '../atoms/Badge';
import Button from '../atoms/Button';
import { Cliente } from '../types';

interface ClientCardProps {
  cliente: Cliente;
  onEdit?: (cliente: Cliente) => void;
  onDelete?: (clienteId: string) => void;
}

const estadoColors = {
  'nuevo': 'info',
  'contactado': 'primary',
  'interesado': 'success',
  'en-negociacion': 'warning',
  'convertido': 'success',
  'inactivo': 'gray',
} as const;

const estadoLabels = {
  'nuevo': 'Nuevo',
  'contactado': 'Contactado',
  'interesado': 'Interesado',
  'en-negociacion': 'En Negociación',
  'convertido': 'Convertido',
  'inactivo': 'Inactivo',
};

export default function ClientCard({ cliente, onEdit, onDelete }: ClientCardProps) {
  return (
    <Card>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{cliente.nombre}</h3>
          {cliente.empresa && (
            <p className="text-sm text-gray-600">{cliente.empresa}</p>
          )}
        </div>
        <Badge variant={estadoColors[cliente.estado]}>
          {estadoLabels[cliente.estado]}
        </Badge>
      </div>
      
      <div className="space-y-2 text-sm text-gray-700">
        <p>📧 {cliente.email}</p>
        <p>📱 {cliente.telefono}</p>
        <div>
          <p className="font-semibold mb-1">Servicios de interés:</p>
          <div className="flex flex-wrap gap-1">
            {cliente.serviciosInteres.map((servicio) => (
              <Badge key={servicio} variant="gray" size="sm">
                {servicio}
              </Badge>
            ))}
          </div>
        </div>
        {cliente.notas && (
          <div className="mt-3 pt-3 border-t">
            <p className="font-semibold">Notas:</p>
            <p className="text-gray-600 mt-1">{cliente.notas}</p>
          </div>
        )}
      </div>
      
      <div className="flex gap-2 mt-4">
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={() => onEdit(cliente)}
          >
            Editar
          </Button>
        )}
        {onDelete && (
          <Button
            variant="danger"
            size="sm"
            fullWidth
            onClick={() => onDelete(cliente.id)}
          >
            Eliminar
          </Button>
        )}
      </div>
    </Card>
  );
}

