
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  Tags, 
  Menu, 
  X,
  PlusCircle,
  FileText,
  Settings,
  Home as HomeIcon,
  User as UserIcon,
  ShieldAlert,
  LogOut,
  Coins,
  Wallet,
  Activity,
  Cloud,
  BookOpen,
  CreditCard,
  Factory,
  Percent
} from 'lucide-react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import RegistrarVenta from './pages/RegistrarVenta';
import Ventas from './pages/Ventas';
import Stock from './pages/Stock';
import Despachos from './pages/Despachos';
import Etiquetas from './pages/Etiquetas';
import Configuracion from './pages/Configuracion';
import Comisiones from './pages/Comisiones';
import Proveedores from './pages/Proveedores';
import Catalogo from './pages/Catalogo';
import CatalogoPublico from './pages/CatalogoPublico';
import CRM from './pages/CRM';
import PostVenta from './pages/PostVenta';
import Produccion from './pages/Produccion';
import Cheques from './pages/Cheques';
import TransportistaView from './pages/TransportistaView';
import { useStore } from './store/GlobalContext';
import { StaffRole } from './types';

const Sidebar = ({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) => {
  const location = useLocation();
  const { currentUser, logout, playSound } = useStore();
  
  if (!currentUser) return null;

  const allMenuItems = [
    { name: 'Inicio', icon: HomeIcon, path: '/', roles: [StaffRole.ADMIN, StaffRole.VENDEDOR, StaffRole.BODEGA, StaffRole.DESPACHO] },
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: [StaffRole.ADMIN] },
    { name: 'Catálogo', icon: BookOpen, path: '/catalogo', roles: [StaffRole.ADMIN, StaffRole.VENDEDOR] },
    { name: 'CRM Clientes', icon: UserIcon, path: '/crm', roles: [StaffRole.ADMIN, StaffRole.VENDEDOR] },
    { name: 'Registrar Venta', icon: PlusCircle, path: '/registrar', roles: [StaffRole.ADMIN, StaffRole.VENDEDOR] },
    { name: 'Ventas y Clientes', icon: FileText, path: '/ventas', roles: [StaffRole.ADMIN, StaffRole.VENDEDOR] },
    { name: 'Nómina Comisiones', icon: Coins, path: '/comisiones', roles: [StaffRole.ADMIN] },
    { name: 'Cheques', icon: CreditCard, path: '/cheques', roles: [StaffRole.ADMIN] },
    { name: 'Pagos Proveedores', icon: Wallet, path: '/proveedores', roles: [StaffRole.ADMIN] },
    { name: 'Inventario Stock', icon: Package, path: '/stock', roles: [StaffRole.ADMIN, StaffRole.BODEGA, StaffRole.DESPACHO] },
    { name: 'Logística Despacho', icon: Truck, path: '/despachos', roles: [StaffRole.ADMIN, StaffRole.VENDEDOR, StaffRole.BODEGA, StaffRole.DESPACHO] },
    { name: 'Mis Despachos', icon: Truck, path: '/transportista', roles: [StaffRole.TRANSPORTISTA, StaffRole.ADMIN] },
    { name: 'Post-Venta', icon: Percent, path: '/post-venta', roles: [StaffRole.POST_VENTA, StaffRole.ADMIN] },
    { name: 'Etiquetas Térmicas', icon: Tags, path: '/etiquetas', roles: [StaffRole.ADMIN, StaffRole.VENDEDOR, StaffRole.BODEGA, StaffRole.DESPACHO] },
    { name: 'Producción', icon: Factory, path: '/produccion', roles: [StaffRole.ADMIN] },
    { name: 'Configuración', icon: Settings, path: '/configuracion', roles: [StaffRole.ADMIN] },
  ];

  const menuItems = allMenuItems.filter(item => 
    item.roles.includes(currentUser.rol) || (item.name === 'Producción' && (currentUser.nombre || '').toUpperCase() === 'CAMILA VIVAR')
  );

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={toggle} />}
      <aside className={`fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-white transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 shadow-2xl flex flex-col no-print`}>
        <div className="p-5 flex items-center justify-between border-b border-slate-800">
          <Link to="/" onClick={() => playSound('transition')} className="text-[15px] sm:text-base font-black tracking-tighter flex items-center gap-1.5 whitespace-nowrap overflow-hidden">
            <span className="bg-emerald-500 px-1.5 py-1 rounded-lg text-white font-black text-[10px]">E&C</span>
            ECHEVERRIA <span className="text-emerald-500 italic">& CO.</span>
          </Link>
          <button onClick={toggle} className="lg:hidden p-1 text-slate-400 hover:text-white flex-shrink-0"><X size={20} /></button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                onClick={() => {
                  playSound('transition');
                  if (window.innerWidth < 1024) toggle();
                }}
                className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <Icon size={18} /><span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800 space-y-4">
          <div className="bg-slate-800/50 p-4 rounded-3xl border border-slate-700/50">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Usuario Activo</p>
            <p className="text-xs font-black text-white truncate uppercase">{currentUser.nombre}</p>
            <p className="text-[8px] text-emerald-500 font-black uppercase mt-0.5">{currentUser.rol}</p>
          </div>
          <button 
            onClick={() => { logout(); window.location.hash = '#/'; }}
            className="w-full flex items-center gap-2 px-4 py-4 rounded-2xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-black text-[10px] uppercase tracking-widest"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
};

const Header = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const { currentUser, settings } = useStore();
  if (!currentUser) return null;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30 no-print">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <Menu size={24} />
        </button>
        <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
             Firebase Activo
             <Activity size={12} className="text-emerald-500" />
           </span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-black text-slate-900 leading-none uppercase">{currentUser.nombre}</p>
          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">{currentUser.rol}</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
          <UserIcon size={18} />
        </div>
      </div>
    </header>
  );
};

const ProtectedRoute = ({ children, roles, extraCheck }: React.PropsWithChildren<{ roles: StaffRole[], extraCheck?: (user: any) => boolean }>) => {
  const { currentUser } = useStore();
  if (!currentUser) return <Navigate to="/" />;
  if (!roles.includes(currentUser.rol) && (!extraCheck || !extraCheck(currentUser))) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <ShieldAlert size={64} className="text-red-500" />
        <h2 className="text-2xl font-black text-slate-900 uppercase">Acceso Restringido</h2>
        <p className="text-slate-500">No tienes permisos para ver este módulo.</p>
        <Link to="/" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs tracking-widest">Volver al Inicio</Link>
      </div>
    );
  }
  return <>{children}</>;
};

const BottomNav = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const location = useLocation();
  const { currentUser, playSound } = useStore();
  if (!currentUser) return null;

  const handleNavClick = () => {
    playSound('transition');
  };

  const isVendedorOrAdmin = currentUser.rol === StaffRole.ADMIN || currentUser.rol === StaffRole.VENDEDOR;
  const isBodegaOrDespacho = currentUser.rol === StaffRole.BODEGA || currentUser.rol === StaffRole.DESPACHO || currentUser.rol === StaffRole.ADMIN;
  const isTransportista = currentUser.rol === StaffRole.TRANSPORTISTA;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 text-white flex items-center justify-around h-16 px-2 lg:hidden shadow-[0_-4px_24px_rgba(0,0,0,0.3)] pb-[calc(env(safe-area-inset-bottom,0px)*0.5)] no-print">
      <Link 
        to="/" 
        onClick={handleNavClick}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-400 active:text-amber-500 ${location.pathname === '/' ? 'text-emerald-400' : ''}`}
      >
        <HomeIcon size={20} />
        <span className="text-[9px] font-black uppercase mt-1 tracking-wider">Inicio</span>
      </Link>

      {isVendedorOrAdmin && (
        <Link 
          to="/registrar" 
          onClick={handleNavClick}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-400 active:text-amber-500 ${location.pathname === '/registrar' ? 'text-emerald-400' : ''}`}
        >
          <div className="bg-emerald-500 text-white p-2 rounded-xl -mt-6 shadow-lg shadow-emerald-500/40">
            <PlusCircle size={20} />
          </div>
          <span className="text-[9px] font-black uppercase mt-1 tracking-wider">Registrar</span>
        </Link>
      )}

      {isVendedorOrAdmin && (
        <Link 
          to="/ventas" 
          onClick={handleNavClick}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-400 active:text-amber-500 ${location.pathname === '/ventas' ? 'text-emerald-400' : ''}`}
        >
          <FileText size={20} />
          <span className="text-[9px] font-black uppercase mt-1 tracking-wider">Ventas</span>
        </Link>
      )}

      {isBodegaOrDespacho && !isVendedorOrAdmin && (
        <Link 
          to="/stock" 
          onClick={handleNavClick}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-400 active:text-amber-500 ${location.pathname === '/stock' ? 'text-emerald-400' : ''}`}
        >
          <Package size={20} />
          <span className="text-[9px] font-black uppercase mt-1 tracking-wider">Stock</span>
        </Link>
      )}

      {isBodegaOrDespacho && (
        <Link 
          to="/despachos" 
          onClick={handleNavClick}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-400 active:text-amber-500 ${location.pathname === '/despachos' ? 'text-emerald-400' : ''}`}
        >
          <Truck size={20} />
          <span className="text-[9px] font-black uppercase mt-1 tracking-wider">Despacho</span>
        </Link>
      )}

      {isTransportista && (
        <Link 
          to="/transportista" 
          onClick={handleNavClick}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-400 active:text-amber-500 ${location.pathname === '/transportista' ? 'text-emerald-400' : ''}`}
        >
          <Truck size={20} />
          <span className="text-[9px] font-black uppercase mt-1 tracking-wider">Mis Rutas</span>
        </Link>
      )}

      <button 
        onClick={() => { playSound('click'); toggleSidebar(); }}
        className="flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-400 active:text-emerald-400"
      >
        <Menu size={20} />
        <span className="text-[9px] font-black uppercase mt-1 tracking-wider">Menú</span>
      </button>
    </div>
  );
};

export default function App() {
  const { currentUser } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <HashRouter>
      <div className="h-screen bg-slate-50 overflow-hidden relative">
        {currentUser && <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />}
        
        <div className={`flex flex-col h-full overflow-hidden transition-all duration-300 ${currentUser ? 'lg:ml-64' : ''}`}>
          {currentUser && <Header toggleSidebar={toggleSidebar} />}
          
          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 lg:pb-8 scroll-smooth">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/catalogo-publico" element={<CatalogoPublico />} />
              <Route path="/dashboard" element={<ProtectedRoute roles={[StaffRole.ADMIN]}><Dashboard /></ProtectedRoute>} />
              <Route path="/catalogo" element={<ProtectedRoute roles={[StaffRole.ADMIN, StaffRole.VENDEDOR]}><Catalogo /></ProtectedRoute>} />
              <Route path="/registrar" element={<ProtectedRoute roles={[StaffRole.ADMIN, StaffRole.VENDEDOR]}><RegistrarVenta /></ProtectedRoute>} />
              <Route path="/ventas" element={<ProtectedRoute roles={[StaffRole.ADMIN, StaffRole.VENDEDOR]}><Ventas /></ProtectedRoute>} />
              <Route path="/stock" element={<ProtectedRoute roles={[StaffRole.ADMIN, StaffRole.BODEGA, StaffRole.DESPACHO]}><Stock /></ProtectedRoute>} />
              <Route path="/transportista" element={<ProtectedRoute roles={[StaffRole.TRANSPORTISTA, StaffRole.ADMIN]}><TransportistaView /></ProtectedRoute>} />
              <Route path="/despachos" element={<ProtectedRoute roles={[StaffRole.ADMIN, StaffRole.VENDEDOR, StaffRole.BODEGA, StaffRole.DESPACHO]}><Despachos /></ProtectedRoute>} />
              <Route path="/produccion" element={<ProtectedRoute roles={[StaffRole.ADMIN]} extraCheck={(u) => (u?.nombre || '').toUpperCase() === 'CAMILA VIVAR'}><Produccion /></ProtectedRoute>} />
              <Route path="/crm" element={<ProtectedRoute roles={[StaffRole.ADMIN, StaffRole.VENDEDOR]}><CRM /></ProtectedRoute>} />
              <Route path="/post-venta" element={<ProtectedRoute roles={[StaffRole.POST_VENTA, StaffRole.ADMIN]}><PostVenta /></ProtectedRoute>} />
              <Route path="/etiquetas" element={<ProtectedRoute roles={[StaffRole.ADMIN, StaffRole.VENDEDOR, StaffRole.BODEGA, StaffRole.DESPACHO]}><Etiquetas /></ProtectedRoute>} />
              <Route path="/configuracion" element={<ProtectedRoute roles={[StaffRole.ADMIN]}><Configuracion /></ProtectedRoute>} />
              <Route path="/comisiones" element={<ProtectedRoute roles={[StaffRole.ADMIN]}><Comisiones /></ProtectedRoute>} />
              <Route path="/cheques" element={<ProtectedRoute roles={[StaffRole.ADMIN]}><Cheques /></ProtectedRoute>} />
              <Route path="/proveedores" element={<ProtectedRoute roles={[StaffRole.ADMIN]}><Proveedores /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          
          {currentUser && <BottomNav toggleSidebar={toggleSidebar} />}
        </div>
      </div>
    </HashRouter>
  );
}
