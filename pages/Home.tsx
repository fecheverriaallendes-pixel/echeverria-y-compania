
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Package, 
  PackagePlus,
  Settings, 
  LayoutDashboard,
  Truck,
  Lock,
  LogIn,
  ChevronRight,
  FileText,
  ShieldCheck,
  RefreshCw,
  Database,
  CloudOff,
  AlertTriangle,
  CheckCircle,
  Globe,
  Link as LinkIcon,
  BookOpen,
  LayoutGrid,
  List,
  FileCode2,
  HelpCircle,
  Coins,
  Wallet,
  Flame,
  Copy,
  Check,
  Tag
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { StaffRole } from '../types';

const LOGO_URL = "https://i.ibb.co/ymf3nYWv/Chat-GPT-Image-10-jun-2026-18-30-56.png";

export default function Home() {
  const { staff, stock, currentUser, login, playSound, settings, updateSettings, syncWithCloud, isSyncing } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: '', pin: '' });
  const [error, setError] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{status: 'idle' | 'success' | 'error', msg: string}>({status: 'idle', msg: ''});
  const [copiedStockId, setCopiedStockId] = useState<string | null>(null);
  
  // Estado para vincular URL desde el inicio
  const [setupUrl, setSetupUrl] = useState('');

  const allAvailableUsers = [
    { id: 'master', nombre: 'ADMINISTRADOR MAESTRO', rol: StaffRole.ADMIN, pin: '2024' },
    ...staff.filter(u => u.activo)
  ];

  const handleManualSync = async () => {
      playSound('click');
      const success = await syncWithCloud();
      if (success) {
          setSyncFeedback({status: 'success', msg: '¡Sincronización Exitosa!'});
          playSound('success');
      } else {
          setSyncFeedback({status: 'error', msg: settings.lastError || 'Error de conexión'});
      }
      setTimeout(() => setSyncFeedback({status: 'idle', msg: ''}), 3000);
  };

  const handleInitialSetup = async () => {
    if (!setupUrl.includes('script.google.com')) {
      alert("⚠️ URL Inválida. Debe ser el link de tu Google Apps Script (terminado en /exec).");
      return;
    }
    setLoading(true);
    updateSettings({ cloudUrl: setupUrl, dbConnected: true });
    playSound('success');
    // Esperar un momento a que el estado se asiente y sincronizar
    setTimeout(async () => {
      const success = await syncWithCloud();
      if (!success) {
        alert("❌ No se pudo conectar. Verifica que el script esté desplegado como 'Anyone' (Cualquiera).");
      }
      setLoading(false);
    }, 1000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    playSound('click');

    setTimeout(() => {
      const u = allAvailableUsers.find(u => u.nombre === loginForm.user);
      if (u && u.pin === loginForm.pin) {
        login(u.nombre, u.rol);
      } else {
        setError(true);
      }
      setLoading(false);
    }, 600);
  };

  const menuOptions = [
    { 
      name: 'Modo Live TikTok', 
      desc: 'Registro ultra-rápido de ventas en vivo', 
      icon: Zap, 
      path: '/registrar',
      color: 'bg-emerald-500',
      shadow: 'shadow-emerald-500/30',
      roles: [StaffRole.ADMIN, StaffRole.VENDEDOR]
    },
    { 
      name: 'Ventas y Clientes', 
      desc: 'Historial completo y base de datos', 
      icon: FileText, 
      path: '/ventas',
      color: 'bg-blue-600',
      shadow: 'shadow-blue-600/30',
      roles: [StaffRole.ADMIN, StaffRole.VENDEDOR]
    },
    { 
      name: 'Bodega y Stock', 
      desc: 'Inventario físico, crear productos y carga masiva', 
      icon: Package, 
      path: '/stock',
      color: 'bg-slate-900',
      shadow: 'shadow-slate-900/40',
      roles: [StaffRole.ADMIN, StaffRole.BODEGA]
    },
    { 
      name: 'Crear Producto', 
      desc: 'Añadir nuevo producto o artículo al stock', 
      icon: PackagePlus, 
      path: '/stock?action=add',
      color: 'bg-emerald-600',
      shadow: 'shadow-emerald-600/30',
      roles: [StaffRole.ADMIN, StaffRole.BODEGA]
    },
    { 
      name: 'Logística Despacho', 
      desc: 'Control de envíos y etiquetado masivo', 
      icon: Truck, 
      path: '/despachos',
      color: 'bg-amber-500',
      shadow: 'shadow-amber-500/30',
      roles: [StaffRole.ADMIN, StaffRole.VENDEDOR, StaffRole.BODEGA, StaffRole.DESPACHO]
    },
    { 
      name: 'Nómina Comisiones', 
      desc: 'Gestión de pagos a vendedores', 
      icon: Coins, 
      path: '/comisiones',
      color: 'bg-purple-600',
      shadow: 'shadow-purple-600/30',
      roles: [StaffRole.ADMIN]
    },
    { 
      name: 'Pagos Proveedores', 
      desc: 'Control de pagos y abonos', 
      icon: Wallet, 
      path: '/proveedores',
      color: 'bg-indigo-600',
      shadow: 'shadow-indigo-600/30',
      roles: [StaffRole.ADMIN]
    },
    { 
      name: 'Dashboard', 
      desc: 'Métricas y estadísticas', 
      icon: LayoutDashboard, 
      path: '/dashboard',
      color: 'bg-pink-600',
      shadow: 'shadow-pink-600/30',
      roles: [StaffRole.ADMIN, StaffRole.VENDEDOR, StaffRole.BODEGA, StaffRole.DESPACHO]
    },
    { 
      name: 'Configuración', 
      desc: 'Ajustes del sistema y base de datos', 
      icon: Settings, 
      path: '/configuracion',
      color: 'bg-slate-800',
      shadow: 'shadow-slate-800/30',
      roles: [StaffRole.ADMIN]
    }
  ];

  if (!currentUser) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4 animate-gradient overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-400/20 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[150px] rounded-full animate-pulse delay-700"></div>

        <div className="w-full max-w-lg z-10 animate-in fade-in zoom-in duration-1000 flex flex-col items-center">
          <div className="text-center -mt-8 sm:-mt-12 md:-mt-16 -mb-6 sm:-mb-10 md:-mb-12 drop-shadow-2xl transition-transform">
            <img src={LOGO_URL} alt="Logo" className="w-64 sm:w-80 md:w-[360px] mx-auto drop-shadow-2xl" />
          </div>

          <div className="w-full max-w-md bg-white/10 backdrop-blur-3xl p-6 sm:p-8 rounded-[40px] shadow-2xl border border-white/20">
                <form onSubmit={handleLogin} className="space-y-4">
                  {staff.length === 0 && (
                    <div className="space-y-3">
                        <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-3xl text-center">
                            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1">Firebase Activo</p>
                            <p className="text-white/70 text-xs font-medium">Ingresa con el Administrador Maestro para comenzar a configurar el sistema.</p>
                        </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] ml-6">PERFIL PROFESIONAL</label>
                    <select 
                      required
                      className="w-full px-6 py-3.5 bg-white border-none rounded-[22px] font-black text-sm text-slate-900 focus:ring-4 focus:ring-emerald-400/50 outline-none appearance-none transition-all shadow-xl"
                      value={loginForm.user}
                      onChange={(e) => setLoginForm({...loginForm, user: e.target.value})}
                    >
                      <option value="">ELIJA SU USUARIO...</option>
                      {allAvailableUsers.map(u => (
                        <option key={u.id} value={u.nombre}>{u.nombre} ({u.rol})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] ml-6">PIN DE SEGURIDAD</label>
                    <input 
                      required
                      type="password"
                      placeholder="••••"
                      maxLength={4}
                      className="w-full px-6 py-3 bg-white border-none rounded-[22px] text-center text-3xl font-black tracking-[0.5em] text-slate-900 focus:ring-4 focus:ring-emerald-400/50 outline-none transition-all shadow-xl"
                      value={loginForm.pin}
                      onChange={(e) => setLoginForm({...loginForm, pin: e.target.value})}
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-600/90 text-white rounded-[20px] text-[10px] font-black text-center flex items-center justify-center gap-3 animate-shake">
                      <Lock size={14} /> PIN INCORRECTO
                    </div>
                  )}

                  <button 
                    type="submit" disabled={loading || isSyncing}
                    className="w-full py-4 bg-slate-900 text-white rounded-[22px] font-black text-lg flex items-center justify-center gap-4 hover:bg-black transition-all shadow-2xl disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="animate-spin" /> : <LogIn size={20} />} 
                    {loading ? 'VALIDANDO...' : 'ENTRAR AL SISTEMA'}
                  </button>
                </form>
          </div>
        </div>
      </div>
    );
  }

  const canSeeCatalogue = currentUser.rol === StaffRole.ADMIN || currentUser.rol === StaffRole.VENDEDOR;

  return (
    <div className="relative min-h-full flex flex-col items-center justify-center py-12 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-[40px] overflow-hidden shadow-lg border border-slate-800">
      {/* Modern dotted/grid texture pattern overlay */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none z-0" 
        style={{ 
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1.5px, transparent 1.5px)', 
          backgroundSize: '24px 24px' 
        }}
      />

      <div className="text-center mb-10 animate-in fade-in zoom-in duration-700 z-10 relative">
        <img src={LOGO_URL} alt="Logo" className="w-[320px] sm:w-[460px] md:w-[500px] mx-auto mb-1.5 drop-shadow-2xl" />
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-wide mb-2 uppercase">
          BIENVENIDO A <span className="text-emerald-400 italic">ECHEVERRIA & CO.</span>
        </h1>
        <p className="text-slate-300 font-bold uppercase tracking-[0.4em] text-[10px] mb-8">Central de Inteligencia Logística</p>
        
        <div className="inline-flex items-center gap-3 px-6 py-2 bg-emerald-950/40 border border-emerald-500/30 rounded-full shadow-lg mb-2 backdrop-blur-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
            {currentUser.nombre} • Firebase Activo
          </span>
        </div>
      </div>

      {/* SECCIÓN CATÁLOGO RÁPIDO PARA VENDEDORES */}
      {canSeeCatalogue && (
        <div className="w-full max-w-6xl mb-12 animate-in slide-in-from-top duration-700 z-10 relative">
           <div className="flex items-center gap-4 mb-6">
              <BookOpen size={24} className="text-emerald-400" />
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Módulo de Catálogo Maestro</h2>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={() => { playSound('transition'); navigate('/catalogo?mode=digital'); }}
                className="group flex items-center justify-between p-8 bg-emerald-500 rounded-[40px] text-white shadow-xl hover:bg-emerald-600 transition-all hover:scale-[1.02] active:scale-95 text-left"
              >
                <div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4"><LayoutGrid size={24} /></div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Catálogo Digital</h3>
                  <p className="text-emerald-100 text-[10px] font-bold uppercase italic mt-1 tracking-widest">Especial para WhatsApp (Cuadrícula)</p>
                </div>
                <ChevronRight size={32} className="opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>

              <button 
                onClick={() => { playSound('transition'); navigate('/catalogo?mode=print'); }}
                className="group flex items-center justify-between p-8 bg-slate-950 border border-slate-800 rounded-[40px] text-white shadow-xl hover:bg-black transition-all hover:scale-[1.02] active:scale-95 text-left"
              >
                <div>
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4"><List size={24} /></div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Lista de Precios</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase italic mt-1 tracking-widest">Formato Impreso (Líneas)</p>
                </div>
                <ChevronRight size={32} className="opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>
           </div>
        </div>
      )}

      {/* SECCIÓN DE PRODUCTOS EN PROMOCIÓN PARA VENDEDORES */}
      {canSeeCatalogue && (
         <div className="w-full max-w-6xl mb-12 animate-in slide-in-from-top duration-700 delay-100 z-10 relative">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-rose-500/15 text-rose-400 rounded-2xl animate-pulse">
                     <Flame size={24} />
                  </div>
                  <div>
                     <h2 className="text-xl font-black text-white uppercase tracking-tighter">🔥 Productos en Promoción 🔥</h2>
                     <p className="text-xs text-rose-450 font-extrabold uppercase mt-0.5 tracking-wider">¡Comisión de venta especial de $1.500!</p>
                  </div>
               </div>
               
               <span className="hidden sm:inline-flex px-3.5 py-1.5 bg-rose-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
                  Campañas Activas
               </span>
            </div>

            {(() => {
               const promoItems = (stock || []).filter(item => item.promocion && item.stockActual > 0);
               if (promoItems.length === 0) {
                  return (
                     <div className="bg-slate-950/40 backdrop-blur-md p-10 rounded-[36px] border border-slate-800 text-center space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-rose-500"></div>
                        <div className="w-14 h-14 bg-slate-900 text-slate-500 rounded-full flex items-center justify-center mx-auto">
                           <Tag size={24} />
                        </div>
                        <p className="font-extrabold text-slate-200 text-base uppercase tracking-tight">Sin Ofertas Activas</p>
                        <p className="text-slate-400 text-xs font-medium max-w-md mx-auto leading-relaxed">No hay productos etiquetados en promoción actualmente. Los administradores pueden marcar promociones directamente en la pestaña de <b className="text-slate-300">Bodega y Stock</b>.</p>
                     </div>
                  );
               }

               return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {promoItems.map((item) => {
                        const lowStock = item.stockActual <= 3;
                        const outOfStock = item.stockActual === 0;
                        const promoMessage = `🔥 ¡SUPER PROMOCIÓN! "${item.tipo.toUpperCase()}" (${item.unidad}) código: *${item.codigo}* por sólo *$${item.precioSugerido?.toLocaleString('es-CL')}* CLP. ¡Aprovecha ya antes que se agote! 🚚💨 Quedan pocas unidades en nuestra bodega central. Contáctanos de inmediato.`;

                        const handleCopyMessage = () => {
                           navigator.clipboard.writeText(promoMessage);
                           setCopiedStockId(item.id);
                           playSound('success');
                           setTimeout(() => setCopiedStockId(null), 2500);
                        };

                        return (
                           <div key={item.id} className="relative bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col justify-between p-6">
                              {/* Left Indicator bar */}
                              <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
                              
                              {/* Header Card */}
                              <div className="space-y-3">
                                 <div className="flex justify-between items-start gap-2">
                                    <span className="inline-flex px-2 px-3.5 py-1 bg-slate-900 text-rose-450 text-[9px] font-black tracking-widest uppercase rounded-full border border-slate-800">
                                       PROMO
                                    </span>
                                    <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${
                                       outOfStock 
                                          ? 'bg-red-50 text-red-500' 
                                          : lowStock 
                                             ? 'bg-amber-50 text-amber-600 animate-pulse' 
                                             : 'bg-emerald-50 text-emerald-600'
                                    }`}>
                                       {outOfStock ? 'Sin Stock' : `${item.stockActual} disponibles`}
                                    </span>
                                 </div>

                                 <div className="space-y-0.5">
                                    <h4 className="font-mono text-[10px] font-bold text-slate-400 tracking-wider">CÓDIGO: {item.codigo}</h4>
                                    <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight leading-tight line-clamp-2">
                                       {item.tipo}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{item.categoria || 'PRODUCTO'} • {item.unidad}</p>
                                 </div>
                              </div>

                              {/* Price Container and Action buttons */}
                              <div className="mt-6 space-y-4">
                                 <div className="flex items-baseline justify-between border-t border-slate-100 pt-4">
                                    <div>
                                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Precio Oferta</span>
                                       <p className="text-2xl font-black text-slate-900 tracking-tight font-sans">
                                          ${item.precioSugerido?.toLocaleString('es-CL')}
                                       </p>
                                    </div>
                                    <div className="text-right">
                                       <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Tu Comisión</span>
                                       <p className="text-sm font-extrabold text-rose-600 font-mono">+$1.500</p>
                                    </div>
                                 </div>

                                 <button 
                                    onClick={handleCopyMessage}
                                    className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                       copiedStockId === item.id 
                                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10' 
                                          : 'bg-rose-50 hover:bg-rose-100 text-rose-600 active:scale-95'
                                    }`}
                                 >
                                    {copiedStockId === item.id ? (
                                       <>
                                          <Check size={14} /> ¡Mensaje Copiado!
                                       </>
                                    ) : (
                                       <>
                                          <Copy size={14} /> Mensaje WhatsApp
                                       </>
                                    )}
                                 </button>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               );
            })()}
         </div>
      )}

      <div className="w-full max-w-6xl animate-in fade-in slide-in-from-bottom duration-1000 z-10 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {menuOptions
            .filter(opt => opt.roles.includes(currentUser.rol))
            .map((opt) => {
            const Icon = opt.icon;
            return (
              <Link 
                key={opt.path} 
                to={opt.path}
                onClick={() => playSound('transition')}
                className="group relative bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 ${opt.color} opacity-0 group-hover:opacity-10 rounded-full translate-x-10 -translate-y-10 transition-all duration-500`}></div>
                
                <div className={`w-14 h-14 ${opt.color} rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform duration-500 ${opt.shadow}`}>
                  <Icon size={24} />
                </div>
                
                <h3 className="text-xl font-black text-slate-900 mb-2 leading-none uppercase">{opt.name}</h3>
                <p className="text-slate-500 text-[10px] font-medium mb-8 leading-relaxed italic">{opt.desc}</p>
                
                <div className="flex items-center text-slate-900 font-black text-[11px] uppercase tracking-[0.2em]">
                  INGRESAR <ChevronRight size={16} className="ml-1 text-emerald-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
