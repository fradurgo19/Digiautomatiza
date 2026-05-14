import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../organisms/Navbar';
import Card from '../atoms/Card';
import { useAuth } from '../context/AuthContext';
import { obtenerStatsDashboard, DashboardStats } from '../services/databaseService';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await obtenerStatsDashboard();
        if (data) {
          setStats(data);
        } else {
          setError('No se pudieron cargar las estadísticas.');
        }
      } catch (e) {
        console.error('Error al obtener estadísticas:', e);
        const errorMessage = e instanceof Error ? e.message : 'Error desconocido al cargar estadísticas.';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const quickActions = useMemo(
    () => [
      {
        title: 'Gestionar Clientes',
        description: 'Ver, agregar y editar información de clientes',
        icon: '👥',
        action: () => navigate('/clientes'),
      },
      {
        title: 'Programar Sesión',
        description: 'Agendar reuniones con clientes potenciales',
        icon: '📅',
        action: () => navigate('/sesiones'),
      },
      {
        title: 'Envío Masivo',
        description: 'Enviar correos y mensajes a múltiples clientes',
        icon: '📧',
        action: () => navigate('/clientes'),
      },
    ],
    [navigate]
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
      <div className="absolute -top-32 -right-20 w-96 h-96 bg-emerald-400/30 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-16 w-80 h-80 bg-lime-300/30 blur-3xl rounded-full pointer-events-none" />

      <Navbar />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl font-bold">
            <span className="bg-gradient-to-r from-emerald-700 via-lime-600 to-emerald-500 bg-clip-text text-transparent">
              Panel Comercial Digiautomatiza
            </span>
          </h1>
          <p className="text-gray-700 mt-4 text-lg max-w-2xl">
            Control total de clientes, campañas multicanal y automatizaciones críticas desde un único cockpit.
          </p>
          {stats && (
            <p className="text-sm text-emerald-700 mt-2">
              Vista:{' '}
              <span className="font-semibold">
                {stats.scope === 'global'
                  ? 'Global (Administrador)'
                  : `Mi cartera (${usuario?.nombre || 'Comercial'})`}
              </span>
            </p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {(() => {
            let statsContent: ReactNode;
            if (isLoading) {
              statsContent = (
                <>
                  {['clientes', 'interesados', 'programadas', 'completadas'].map((slot) => (
                    <Card
                      key={`skeleton-stat-${slot}`}
                      className="bg-white/80 border border-emerald-100 text-emerald-900 shadow-lg shadow-emerald-100/60"
                    >
                      <div className="flex items-center justify-between animate-pulse">
                        <div className="w-full">
                          <div className="h-3 bg-emerald-100 rounded w-24 mb-3"></div>
                          <div className="h-8 bg-emerald-200 rounded w-16"></div>
                        </div>
                        <div className="w-10 h-10 bg-emerald-100 rounded-full"></div>
                      </div>
                    </Card>
                  ))}
                </>
              );
            } else if (error || !stats) {
              statsContent = (
                <div className="col-span-4">
                  <Card className="bg-white/80 border border-red-100 text-red-800">
                    <p className="text-sm">{error || 'No se pudieron cargar las estadísticas.'}</p>
                  </Card>
                </div>
              );
            } else {
              statsContent = (
                <>
                  <Card className="bg-white/80 border border-emerald-100 text-emerald-900 shadow-lg shadow-emerald-100/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-emerald-600 mb-2">
                          Total Clientes
                        </p>
                        <p className="text-3xl font-bold text-emerald-700">
                          {stats.totalClientes}
                        </p>
                      </div>
                      <div className="text-4xl">👥</div>
                    </div>
                  </Card>
                  <Card className="bg-white/80 border border-emerald-100 text-emerald-900 shadow-lg shadow-emerald-100/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-emerald-600 mb-2">
                          Clientes Interesados
                        </p>
                        <p className="text-3xl font-bold text-lime-700">
                          {stats.clientesInteresados}
                        </p>
                      </div>
                      <div className="text-4xl">🧠</div>
                    </div>
                  </Card>
                  <Card className="bg-white/80 border border-emerald-100 text-emerald-900 shadow-lg shadow-emerald-100/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-emerald-600 mb-2">
                          Sesiones Programadas
                        </p>
                        <p className="text-3xl font-bold text-teal-700">
                          {stats.sesionesProgramadas}
                        </p>
                      </div>
                      <div className="text-4xl">📅</div>
                    </div>
                  </Card>
                  <Card className="bg-white/80 border border-emerald-100 text-emerald-900 shadow-lg shadow-emerald-100/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-emerald-600 mb-2">
                          Sesiones Completadas
                        </p>
                        <p className="text-3xl font-bold text-sky-700">
                          {stats.sesionesCompletadas}
                        </p>
                      </div>
                      <div className="text-4xl">✅</div>
                    </div>
                  </Card>
                </>
              );
            }
            return statsContent;
          })()}
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-emerald-900 mb-4">Acciones estratégicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <Card
                key={action.title}
                hover
                className="cursor-pointer bg-white/80 border border-emerald-100 shadow-lg shadow-emerald-100/40"
                padding="lg"
              >
                <button
                  type="button"
                  onClick={action.action}
                  className="w-full text-center transition-all rounded-2xl p-5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-0 cursor-pointer"
                >
                  <div className="text-5xl mb-3">{action.icon}</div>
                  <h3 className="text-xl font-bold text-emerald-900 mb-2">{action.title}</h3>
                  <p className="text-gray-600 text-sm">{action.description}</p>
                </button>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="bg-white/80 border border-emerald-100 text-emerald-900">
          <h2 className="text-xl font-bold mb-4">Actividad reciente</h2>
          <div className="text-center text-gray-600 py-8">
            Aún no registras actividad. Agrega clientes, agenda sesiones o lanza una campaña para comenzar.
          </div>
        </Card>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="backdrop-blur-xl bg-emerald-100/70 border border-emerald-200 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-emerald-900 mb-3">Automatizaciones activas</h3>
            <p className="text-gray-700 text-sm">
              Bots sincronizando SAP, CRM y WhatsApp para disparar workflows en tiempo real.
            </p>
          </div>
          <div className="backdrop-blur-xl bg-white/80 border border-emerald-100 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-emerald-900 mb-3">Próxima sesión</h3>
            <p className="text-gray-700 text-sm">
              Centraliza reuniones en un calendario inteligente conectado con Teams y Meet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

