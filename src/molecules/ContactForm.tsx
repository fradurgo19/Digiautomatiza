import { useState } from 'react';
import Input from '../atoms/Input';
import TextArea from '../atoms/TextArea';
import Select from '../atoms/Select';
import Button from '../atoms/Button';
import { Contacto, ServicioTipo } from '../types';

interface ContactFormProps {
  onSubmit: (data: Contacto) => Promise<void>;
}

const serviciosOptions = [
  { value: 'paginas-web', label: 'Páginas Web' },
  { value: 'aplicaciones-web', label: 'Aplicaciones Web' },
  { value: 'chatbot-ia', label: 'Chatbot con IA' },
  { value: 'automatizacion', label: 'Automatización de Procesos' },
  { value: 'analisis-datos', label: 'Análisis de Datos' },
];

export default function ContactForm({ onSubmit }: ContactFormProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    servicio: '' as ServicioTipo,
    mensaje: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.email.trim()) newErrors.email = 'El email es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es requerido';
    if (!formData.servicio) newErrors.servicio = 'Debe seleccionar un servicio';
    if (!formData.mensaje.trim()) newErrors.mensaje = 'El mensaje es requerido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Limpiar formulario después del envío exitoso
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        empresa: '',
        servicio: '' as ServicioTipo,
        mensaje: '',
      });
      alert('¡Mensaje enviado exitosamente! Nos pondremos en contacto pronto.');
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      alert('Error al enviar el mensaje. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre completo *"
          type="text"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          error={errors.nombre}
          fullWidth
          placeholder="Ej: Juan Pérez"
        />

        <Input
          label="Email *"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
          fullWidth
          placeholder="correo@ejemplo.com"
        />

        <Input
          label="Teléfono *"
          type="tel"
          value={formData.telefono}
          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
          error={errors.telefono}
          fullWidth
          placeholder="+57 300 123 4567"
        />

        <Input
          label="Empresa (opcional)"
          type="text"
          value={formData.empresa}
          onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
          fullWidth
          placeholder="Nombre de tu empresa"
        />

        <Select
          label="Servicio de interés *"
          options={serviciosOptions}
          value={formData.servicio}
          onChange={(e) => setFormData({ ...formData, servicio: e.target.value as ServicioTipo })}
          error={errors.servicio}
          fullWidth
          placeholder="Selecciona un servicio"
        />
      </div>

      <TextArea
        label="Mensaje *"
        value={formData.mensaje}
        onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
        error={errors.mensaje}
        fullWidth
        rows={5}
        placeholder="Cuéntanos sobre tu proyecto..."
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isSubmitting}
      >
        Enviar mensaje
      </Button>
    </form>
  );
}

