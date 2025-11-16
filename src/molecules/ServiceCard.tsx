import Card from '../atoms/Card';
import { ServicioTipo } from '../types';

interface ServiceCardProps {
  icono: string;
  titulo: string;
  descripcion: string;
  servicio: ServicioTipo;
}

export default function ServiceCard({ icono, titulo, descripcion }: ServiceCardProps) {
  return (
    <Card hover className="h-full">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="text-5xl">{icono}</div>
        <h3 className="text-xl font-bold text-gray-800">{titulo}</h3>
        <p className="text-gray-600">{descripcion}</p>
      </div>
    </Card>
  );
}

