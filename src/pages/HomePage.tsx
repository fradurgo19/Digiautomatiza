import { useState, useEffect } from 'react';
import ContactForm from '../molecules/ContactForm';
import Modal from '../molecules/Modal';
import LoginForm from '../molecules/LoginForm';
import Button from '../atoms/Button';
import { Contacto, ServicioTipo } from '../types';
import { useAuth } from '../context/AuthContext';
import { enviarFormularioContacto } from '../services/emailService';
import { useNavigate } from 'react-router-dom';

type ServicioDestacado = {
  icono: string;
  titulo: string;
  descripcion: string;
  servicio: ServicioTipo;
  resumen: string;
  beneficios: string[];
  casos: string;
};

export default function HomePage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [selectedService, setSelectedService] = useState<null | {
    titulo: string;
    resumen: string;
    beneficios: string[];
    casos: string;
  }>(null);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const servicios: ServicioDestacado[] = [
    {
      icono: '🌐',
      titulo: 'Páginas Web',
      descripcion: 'Diseño y desarrollo de sitios web modernos, responsivos y optimizados para SEO con las últimas tecnologías.',
      servicio: 'paginas-web' as const,
      resumen: 'Construimos experiencias web que conectan con tus clientes desde el primer segundo y convierten visitas en ventas.',
      beneficios: [
        'Arquitectura escalable y segura lista para crecer con tu empresa.',
        'Velocidad extrema optimizada para SEO y Core Web Vitals.',
        'Integraciones nativas con CRM, pagos, chatbots y analítica avanzada.'
      ],
      casos: 'Ideal para empresas que necesitan una presencia premium, catálogos vivos o portales transaccionales con identidad propia.'
    },
    {
      icono: '💻',
      titulo: 'Aplicaciones Web',
      descripcion: 'Desarrollo de aplicaciones web personalizadas con Power Apps, React, Node.js, TypeScript y Java.',
      servicio: 'aplicaciones-web' as const,
      resumen: 'Llevamos tus procesos críticos a entornos web flexibles y personalizados.',
      beneficios: [
        'Digitalizamos flujos complejos en semanas, no meses.',
        'Interfaz intuitiva que reduce tiempos operativos hasta un 60%.',
        'Integración total con ERP, Power Platform, SAP y bases de datos corporativas.'
      ],
      casos: 'Perfecto para compañías que desean automatizar ventas internas, control operativo o tableros de seguimiento a medida.'
    },
    {
      icono: '🤖',
      titulo: 'Chatbot con IA',
      descripcion: 'Construcción de chatbots inteligentes con agentes de IA para mejorar la atención al cliente 24/7.',
      servicio: 'chatbot-ia' as const,
      resumen: 'Creamos asesores inteligentes que responden, aprenden y venden en todos tus canales.',
      beneficios: [
        'Modelos híbridos con GPTs, Llama y conocimiento propio de tu negocio.',
        'Entrenamiento supervisado para respuestas coherentes y alineadas con tu tono.',
        'Integración con WhatsApp, web, redes sociales y contact centers.'
      ],
      casos: 'Empresas que buscan atención 24/7, calificación automática de leads y soporte inteligente sin incrementar costos.'
    },
    {
      icono: '⚙️',
      titulo: 'Automatización',
      descripcion: 'Automatización de procesos empresariales con N8N y Power Automate para optimizar tu operación.',
      servicio: 'automatizacion' as const,
      resumen: 'Conectamos tus sistemas para que la información fluya sin fricciones ni tareas manuales repetitivas.',
      beneficios: [
        'Orquestamos automatizaciones con n8n, Power Automate, Zapier y APIs propietarias.',
        'Monitoreo inteligente para detectar cuellos de botella en tiempo real.',
        'Gobernanza y seguridad corporativa con logs y auditorías completas.'
      ],
      casos: 'Procesos de logística, finanzas, RRHH y marketing que necesitan sincronización entre plataformas.'
    },
    {
      icono: '📊',
      titulo: 'Análisis de Datos',
      descripcion: 'Análisis y visualización de datos empresariales con Power BI para toma de decisiones estratégicas.',
      servicio: 'analisis-datos' as const,
      resumen: 'Transformamos datos dispersos en historias claras que impulsan decisiones rentables.',
      beneficios: [
        'Modelado dimensional y dashboards ejecutivos en Power BI o Looker.',
        'Alertas proactivas con inteligencia predictiva y escenarios simulados.',
        'Conectores a data warehouses, ERPs, CRMs y archivos en la nube.'
      ],
      casos: 'Direcciones comerciales, financieras y de operaciones que requieren visibilidad integral KPI a KPI.'
    },
    {
      icono: '🏭',
      titulo: 'Soporte SAP ERP & HANA',
      descripcion: 'Automatizamos procesos críticos conectando Excel, SAP ERP y SAP HANA para eliminar tareas manuales.',
      servicio: 'sap-hana' as const,
      resumen: 'Integramos tus macros de Excel con SAP HANA para que tus equipos operen con precisión industrial.',
      beneficios: [
        'Bots que cargan y extraen datos entre Excel y SAP sin intervención manual.',
        'Scripts certificados SAP GUI y OData con logs y rollback automático.',
        'Monitoreo 24/7 de errores y alertas proactivas a los responsables.'
      ],
      casos: 'Finanzas, logística y compras que dependen de Excel pero necesitan trazabilidad y velocidad en SAP.'
    },
  ];

  const stats = [
    { number: '100+', label: 'Proyectos Completados' },
    { number: '50+', label: 'Clientes Satisfechos' },
    { number: '99%', label: 'Tasa de Éxito' },
    { number: '24/7', label: 'Soporte Continuo' },
  ];

  const tecnologias = [
    'React', 'Node.js', 'TypeScript', 'Python', 'Power BI', 
    'N8N', 'Power Apps', 'Azure', 'AWS', 'PostgreSQL'
  ];

  const handleContactSubmit = async (data: Contacto) => {
    try {
      console.log('Enviando formulario de contacto:', data);
      await enviarFormularioContacto(data);
    } catch (error) {
      console.error('Error al enviar contacto:', error);
      throw error;
    }
  };

  const handleLogin = async (credentials: { email: string; password: string }) => {
    await login(credentials);
    setIsLoginModalOpen(false);
    navigate('/dashboard');
  };

  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Fondo animado con gradientes */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-green-900 to-gray-900" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02ek0yNCAzOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
      </div>

      {/* Navbar Futurista con Glassmorphism */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-gray-900/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative">
                <img 
                  src="https://res.cloudinary.com/dbufrzoda/image/upload/v1760908611/Captura_de_pantalla_2025-10-19_122805_v4gvpt.png" 
                  alt="Digiautomatiza Logo" 
                  className="h-16 w-auto transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl group-hover:blur-2xl transition-all" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-300 to-gray-200 bg-clip-text text-transparent">
                  Digiautomatiza
                </h1>
                <p className="text-sm text-gray-300 font-medium">Innovación Digital</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#servicios" className="text-gray-300 hover:text-white transition-colors">Servicios</a>
              <a href="#tecnologias" className="text-gray-300 hover:text-white transition-colors">Tecnologías</a>
              <a href="#contacto" className="text-gray-300 hover:text-white transition-colors">Contacto</a>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLoginModalOpen(true)}
                className="border-emerald-500 text-emerald-300 hover:bg-emerald-500/10"
              >
                Iniciar Sesión
              </Button>
            </nav>

            <div className="md:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLoginModalOpen(true)}
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section Futurista */}
      <section className="relative min-h-screen flex items-center justify-center pt-40 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center z-10">
          {/* Efecto de brillo animado - contenido en la sección */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/30 rounded-full blur-3xl animate-pulse pointer-events-none"
            style={{ 
              transform: `translate(-50%, -50%) translateY(${Math.min(scrollY * 0.3, 200)}px)`,
              opacity: Math.max(0, 1 - scrollY / 800)
            }}
          />
          
          <div className="relative">
            <div className="inline-block mb-6">
              <span className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-semibold backdrop-blur-sm">
                🚀 Transformación Digital Empresarial
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-emerald-300 via-lime-300 to-gray-100 bg-clip-text text-transparent animate-gradient">
                Llevamos tu Negocio
              </span>
              <br />
              <span className="text-white">al Futuro Digital</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
              Expertos en <span className="text-emerald-400 font-semibold">digitalización</span>, 
              <span className="text-lime-400 font-semibold"> automatización inteligente</span> y 
              <span className="text-gray-200 font-semibold"> análisis de datos</span>.
              Transformamos procesos complejos en soluciones simples y eficientes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <a href="#contacto">
                <Button size="lg" className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600">
                  <span className="relative z-10">Solicitar Consultoría Gratis</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-lime-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </Button>
              </a>
              <a href="#servicios">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/20 hover:bg-white/10 backdrop-blur-sm"
                >
                  Explorar Servicios
                </Button>
              </a>
            </div>

            {/* Stats destacados */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="group backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-4xl font-bold bg-gradient-to-r from-emerald-300 to-gray-200 bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-400 mt-2">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator - se oculta completamente al hacer scroll */}
        <div 
          className={`absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce transition-all duration-300 z-50 ${
            scrollY > 50 ? 'opacity-0 invisible pointer-events-none' : 'opacity-100 visible'
          }`}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2 backdrop-blur-sm bg-gray-900/30">
            <div className="w-1 h-2 bg-white rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Servicios Section - Diseño Futurista */}
      <section id="servicios" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-emerald-300 to-gray-200 bg-clip-text text-transparent">
                Nuestros Servicios
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Soluciones tecnológicas de vanguardia diseñadas para impulsar tu empresa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicios.map((servicio, index) => (
              <div
                key={servicio.servicio}
                className="group relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-lime-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-500" />
                
                {/* Card */}
                <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 h-full hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:border-emerald-400/50">
                  <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    {servicio.icono}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {servicio.titulo}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {servicio.descripcion}
                  </p>
                  
                  {/* Hover indicator */}
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedService({
                        titulo: servicio.titulo,
                        resumen: servicio.resumen,
                        beneficios: servicio.beneficios,
                        casos: servicio.casos,
                      })
                    }
                    className="mt-6 flex items-center text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity hover:text-lime-300"
                  >
                    <span className="text-sm font-semibold">Saber más</span>
                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tecnologías Section */}
      <section id="tecnologias" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-emerald-950/15 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Stack Tecnológico de
              <span className="bg-gradient-to-r from-emerald-300 to-gray-200 bg-clip-text text-transparent"> Vanguardia</span>
            </h2>
            <p className="text-gray-400">Trabajamos con las tecnologías más modernas y demandadas del mercado</p>
          </div>

          {/* Marquee de tecnologías */}
          <div className="relative overflow-hidden">
            <div className="flex gap-6 animate-marquee">
              {[...tecnologias, ...tecnologias].map((tech, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 backdrop-blur-lg bg-white/5 border border-white/10 px-8 py-4 rounded-full hover:bg-white/10 transition-colors"
                >
                  <span className="text-lg font-semibold whitespace-nowrap">{tech}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Por Qué Elegirnos */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                ¿Por Qué Elegir
                <span className="bg-gradient-to-r from-emerald-300 to-gray-200 bg-clip-text text-transparent"> Digiautomatiza</span>?
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Somos más que un proveedor de servicios tecnológicos. Somos tu socio estratégico en transformación digital.
              </p>

              <div className="space-y-6">
                {[
                  { icon: '⚡', title: 'Rapidez', desc: 'Entregas ágiles sin comprometer calidad' },
                  { icon: '🎯', title: 'Precisión', desc: 'Soluciones personalizadas a tu medida' },
                  { icon: '🔒', title: 'Seguridad', desc: 'Protección de datos de nivel empresarial' },
                  { icon: '📈', title: 'Escalabilidad', desc: 'Crece sin limitaciones técnicas' },
                ].map((item, index) => (
                  <div key={index} className="flex gap-4 items-start group">
                    <div className="text-4xl transform group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{item.title}</h3>
                      <p className="text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-gray-500/20 blur-3xl" />
              <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-emerald-400/50 transition-all">
                <div className="space-y-4">
                  <div className="h-2 bg-gradient-to-r from-emerald-500 to-gray-400 rounded-full w-3/4 animate-pulse" />
                  <div className="h-2 bg-gradient-to-r from-emerald-500 to-gray-400 rounded-full w-full" />
                  <div className="h-2 bg-gradient-to-r from-emerald-500 to-gray-400 rounded-full w-5/6" />
                  <div className="grid grid-cols-3 gap-4 mt-8">
                    {[
                      { label: 'IA', sub: 'Inteligencia' },
                      { label: 'RPA', sub: 'Automatización' },
                      { label: 'API', sub: 'Integraciones' },
                      { label: 'BI', sub: 'Analítica' },
                      { label: 'ERP', sub: 'Procesos' },
                      { label: 'N8N', sub: 'Orquestación' },
                    ].map((stack, i) => (
                      <div 
                        key={i} 
                        className="aspect-square backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 hover:border-emerald-400/50 transition-colors p-4 flex flex-col items-center justify-center text-center text-gray-300"
                      >
                        <span className="text-2xl font-bold text-emerald-300">{stack.label}</span>
                        <span className="text-xs mt-2 text-gray-400 uppercase tracking-wide">{stack.sub}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proceso de Trabajo */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-purple-950/20 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Nuestro Proceso
              <span className="bg-gradient-to-r from-emerald-300 to-gray-200 bg-clip-text text-transparent"> Probado</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: '01', title: 'Análisis', desc: 'Entendemos tu negocio y necesidades' },
              { num: '02', title: 'Diseño', desc: 'Creamos la solución perfecta' },
              { num: '03', title: 'Desarrollo', desc: 'Implementamos con excelencia' },
              { num: '04', title: 'Soporte', desc: 'Te acompañamos siempre' },
            ].map((step, index) => (
              <div key={index} className="relative group">
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all hover:scale-105 h-full">
                <div className="text-6xl font-bold bg-gradient-to-br from-emerald-500/20 to-gray-500/20 bg-clip-text text-transparent mb-4">
                    {step.num}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-gray-400">{step.desc}</p>
                </div>
                
                {/* Línea conectora */}
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-emerald-400 to-gray-400 opacity-30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Laboratorio de Innovación */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900/0 via-emerald-950/10 to-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-semibold backdrop-blur-sm">
              Expertise Full-Stack Senior
            </span>
            <h2 className="mt-6 text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-emerald-300 via-gray-100 to-emerald-200 bg-clip-text text-transparent">
                Laboratorio de Innovación Digiautomatiza
              </span>
            </h2>
            <p className="mt-4 text-gray-400 text-lg max-w-3xl mx-auto">
              El equipo full-stack senior con +10 años de experiencia que diseña, codifica y automatiza soluciones críticas para corporaciones latinoamericanas.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Credenciales */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-emerald-400/50 transition-all">
              <div className="text-emerald-300 text-sm font-semibold uppercase tracking-widest mb-4">
                Certificaciones & Arquitectura
              </div>
              <ul className="space-y-4 text-gray-300">
                <li>
                  <p className="font-semibold text-white">AWS Solutions Architect</p>
                  <p className="text-sm text-gray-400">Resiliencia multi-región, pipelines CI/CD y zero-downtime deployments.</p>
                </li>
                <li>
                  <p className="font-semibold text-white">SAP Basis & Power Platform</p>
                  <p className="text-sm text-gray-400">Integraciones certificadas con SAP ERP, HANA y automatización de macros Excel.</p>
                </li>
                <li>
                  <p className="font-semibold text-white">IA & Orquestación</p>
                  <p className="text-sm text-gray-400">Agentes GPT, n8n, Power Automate y workflows event-driven.</p>
                </li>
              </ul>
            </div>

            {/* Terminal narrativa */}
            <div className="relative backdrop-blur-xl bg-gray-900/80 border border-emerald-500/40 rounded-3xl p-6 text-sm font-mono text-emerald-200 shadow-lg shadow-emerald-500/10">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-3 text-gray-400 text-xs uppercase tracking-widest">Console · Senior Engineer</span>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed text-emerald-100">
{`> Inicializando blueprint de automatización...
✓ Arquitectura hexagonal con microfrontends React + GraphQL Federation
✓ Orquestador n8n conectado a SAP HANA + Power BI
✓ Despliegue serverless (Vercel + Neon + Resend)

commit: "feat(automation): Multi-agent flow for SAP <> Excel <> WhatsApp"
impacto: -70% tiempo operativo · +45% tasa de respuesta · SLA 99.95%`}
              </pre>
            </div>

            {/* Casos destacados */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-emerald-400/50 transition-all">
              <div className="text-emerald-300 text-sm font-semibold uppercase tracking-widest mb-4">
                Casos Realizados
              </div>
              <div className="space-y-6">
                {[
                  {
                    title: 'Retail regional',
                    desc: 'Automatización de inventario SAP ↔ Excel ↔ WhatsApp Business con bots n8n y Twilio.',
                    result: 'Ahorro 320h/mes · 0 errores de digitación',
                  },
                  {
                    title: 'Holding financiero',
                    desc: 'Plataforma full-stack React + Node + Power BI para onboarding digital con RPA y firma electrónica.',
                    result: 'Onboarding 6x más rápido · Cumplimiento 100%',
                  },
                  {
                    title: 'Industria manufactura',
                    desc: 'Data Lake en Neon + dashboards Power BI + alertas IA para mantenimiento predictivo.',
                    result: 'Reducción 35% paradas · ROI en 5 meses',
                  },
                ].map((caso) => (
                  <div key={caso.title} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <h4 className="text-lg font-bold text-white">{caso.title}</h4>
                    <p className="text-sm text-gray-400 mt-2">{caso.desc}</p>
                    <p className="text-sm text-emerald-300 font-semibold mt-3">{caso.result}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contacto Section - Glassmorphism */}
      <section id="contacto" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-emerald-300 to-gray-200 bg-clip-text text-transparent">
                Hablemos de tu Proyecto
              </span>
            </h2>
            <p className="text-xl text-gray-400">
              Completa el formulario y recibe una consultoría gratuita en 24 horas
            </p>
          </div>

          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-lime-500 to-gray-500 rounded-3xl opacity-20 group-hover:opacity-30 blur-xl transition-opacity" />
            
            {/* Form container */}
            <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 md:p-12">
              <ContactForm onSubmit={handleContactSubmit} />
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 text-center">
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Respuesta en 24h</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>100% Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span>+50 Clientes Satisfechos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Futurista */}
      <footer className="relative border-t border-white/10 backdrop-blur-md bg-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Logo y descripción */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-5 mb-4">
                <img 
                  src="https://res.cloudinary.com/dbufrzoda/image/upload/v1760908611/Captura_de_pantalla_2025-10-19_122805_v4gvpt.png" 
                  alt="Digiautomatiza" 
                  className="h-20 w-auto"
                />
                <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-300 to-gray-200 bg-clip-text text-transparent">
                  Digiautomatiza
                </h3>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Transformamos negocios a través de la digitalización, automatización y análisis de datos.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full backdrop-blur-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full backdrop-blur-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full backdrop-blur-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>

            {/* Enlaces rápidos */}
            <div>
              <h4 className="font-bold mb-4 text-lg">Servicios</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#servicios" className="hover:text-emerald-400 transition-colors">Páginas Web</a></li>
                <li><a href="#servicios" className="hover:text-emerald-400 transition-colors">Aplicaciones Web</a></li>
                <li><a href="#servicios" className="hover:text-emerald-400 transition-colors">Chatbot IA</a></li>
                <li><a href="#servicios" className="hover:text-emerald-400 transition-colors">Automatización</a></li>
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="font-bold mb-4 text-lg">Contacto</h4>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:digiautomatiza1@gmail.com" className="hover:text-emerald-400 transition-colors">
                    digiautomatiza1@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+57 3143315108</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/10 pt-8 mt-8 text-center">
            <p className="text-gray-400">
              © 2025 <span className="text-emerald-400 font-semibold">Digiautomatiza</span>. 
              Todos los derechos reservados.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Digitalización • Automatización • Innovación
            </p>
          </div>
        </div>
      </footer>

      {/* Modal de Login */}
      <Modal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        size="sm"
      >
        <div className="backdrop-blur-2xl bg-gradient-to-br from-emerald-900/90 via-emerald-800/80 to-gray-900/90 border border-emerald-400/30 rounded-2xl shadow-lg shadow-emerald-900/40 px-6 py-4">
          <LoginForm
            onSubmit={handleLogin}
            onCancel={() => setIsLoginModalOpen(false)}
          />
        </div>
      </Modal>

      {/* Modal Detalle Servicio */}
      <Modal
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
        size="lg"
        title={selectedService?.titulo}
      >
        {selectedService && (
          <div className="bg-emerald-50 rounded-3xl shadow-2xl border border-emerald-100 p-8 space-y-6 text-gray-700">
            <p className="text-lg leading-relaxed font-semibold text-emerald-900">
              {selectedService.resumen}
            </p>

            <div className="space-y-3">
              <h4 className="text-sm uppercase tracking-widest text-emerald-600 font-bold">
                Beneficios Tangibles
              </h4>
              <ul className="space-y-3">
                {selectedService.beneficios.map((beneficio, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="mt-1 w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    <p className="text-gray-700 leading-relaxed">{beneficio}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl border border-emerald-200 bg-white">
              <h4 className="text-sm uppercase tracking-widest text-emerald-600 font-bold mb-2">
                Ideal para
              </h4>
              <p className="text-gray-800 leading-relaxed font-medium">
                {selectedService.casos}
              </p>
            </div>

            <div className="flex gap-4 flex-wrap">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setSelectedService(null);
                  document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Quiero cotizar este servicio
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setSelectedService(null)}
              >
                Seguir explorando
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .animate-marquee {
          animation: marquee 30s linear infinite;
        }

        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
