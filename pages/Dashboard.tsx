
import React, { useMemo } from 'react';
import { ReportModal } from '../components/ReportModal';
import { 
  TrendingUp, 
  Package, 
  DollarSign,
  AlertCircle,
  ArrowRight,
  Zap,
  Ticket,
  RefreshCw,
  Cloud,
  PieChart,
  BarChart3,
  Users,
  ArrowUpRight,
  LayoutDashboard,
  FileText,
  Truck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useStore } from '../store/GlobalContext';
import { Sale } from '../types';

const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }: any) => (
  <div className="bg-white p-7 rounded-[40px] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.03)] relative overflow-hidden group hover:shadow-xl transition-all duration-500">
    <div className={`absolute -right-6 -top-6 w-28 h-28 bg-${color}-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 scale-150`}></div>
    <div className={`w-14 h-14 rounded-2xl bg-${color}-50 text-${color}-600 flex items-center justify-center mb-6 relative z-10 transition-transform group-hover:rotate-6`}>
      <Icon size={28} />
    </div>
    <div className="relative z-10">
      <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">{title}</p>
      <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
      <div className="flex items-center justify-between mt-3">
        <p className="text-[10px] text-slate-400 font-bold uppercase">{subtitle}</p>
        {trend && (
          <span className="flex items-center text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
            <ArrowUpRight size={12} className="mr-1" /> {trend}
          </span>
        )}
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { getStats, getReportData, syncWithCloud, isSyncing, settings, sales, coupons } = useStore();
  const [reportState, setReportState] = React.useState<{isOpen: boolean, type: 'weekly' | 'monthly' | 'custom', sales: Sale[]}>({isOpen: false, type: 'weekly', sales: []});
  const [dateRange, setDateRange] = React.useState({ start: '', end: '' });
  const stats = getStats();

  const pendingCoupons = coupons.filter(c => !c.used).length;
  const totalPendingValue = coupons.filter(c => !c.used).reduce((acc, c) => acc + c.value, 0);

  const openReport = (type: 'weekly' | 'monthly' | 'custom') => {
    if (type === 'custom') {
      if (!dateRange.start || !dateRange.end) {
        alert("Por favor selecciona ambas fechas");
        return;
      }
      setReportState({ isOpen: true, type, sales: getReportData(type, new Date(dateRange.start), new Date(dateRange.end)) });
    } else {
      setReportState({ isOpen: true, type, sales: getReportData(type) });
    }
  };

  // Procesar datos para el gráfico de área (Ventas últimos 7 días)
  const chartData = useMemo(() => {
    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString();
    });

    return days.map(day => {
      const daySales = sales.filter(s => s.fecha === day);
      const total = daySales.reduce((acc, s) => acc + s.total, 0);
      return { name: day.split('/')[0], total };
    });
  }, [sales]);

  const pendingBySeller = useMemo(() => {
    const summary: Record<string, {
      vendedor: string;
      incompletas: number;
      sinEtiquetar: number;
      sinPagar: number;
      totalPendientes: number;
    }> = {};

    sales.forEach(s => {
      if (!s) return;
      const seller = s.vendedor || 'SISTEMA';
      
      const isIncompleta = !s.datosCompletos;
      const isSinEtiquetar = s.datosCompletos && !s.impresa;
      const isSinPagar = s.estadoPago !== 'Pagado';

      if (isIncompleta || isSinEtiquetar || isSinPagar) {
        if (!summary[seller]) {
          summary[seller] = {
            vendedor: seller,
            incompletas: 0,
            sinEtiquetar: 0,
            sinPagar: 0,
            totalPendientes: 0
          };
        }
        
        if (isIncompleta) summary[seller].incompletas++;
        if (isSinEtiquetar) summary[seller].sinEtiquetar++;
        if (isSinPagar) summary[seller].sinPagar++;
        
        summary[seller].totalPendientes = 
          summary[seller].incompletas + 
          summary[seller].sinEtiquetar + 
          summary[seller].sinPagar;
      }
    });

    return Object.values(summary).sort((a, b) => b.totalPendientes - a.totalPendientes);
  }, [sales]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
            <LayoutDashboard size={14} /> Sistema Inteligente v2.5
          </div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tight uppercase">Dashboard <span className="text-emerald-500 italic">E&C</span></h2>
          <p className="text-slate-500 font-medium italic mt-2">Inteligencia de negocios y control operativo centralizado</p>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-[24px]">
             <input type="date" onChange={e => setDateRange({...dateRange, start: e.target.value})} className="px-4 py-2 rounded-xl border-none outline-none text-xs font-bold" />
             <span className="text-slate-400 font-black">A</span>
             <input type="date" onChange={e => setDateRange({...dateRange, end: e.target.value})} className="px-4 py-2 rounded-xl border-none outline-none text-xs font-bold" />
             <button 
              onClick={() => openReport('custom')}
              className="px-6 py-2 bg-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all active:scale-95"
            >
              Histórico
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={() => openReport('weekly')}
              className="flex items-center gap-3 px-6 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-[24px] font-black text-xs uppercase tracking-widest hover:border-amber-200 transition-all shadow-sm active:scale-95"
            >
              <FileText size={18} /> Reporte Semanal
            </button>
            
            <button 
              onClick={() => openReport('monthly')}
              className="flex items-center gap-3 px-6 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-[24px] font-black text-xs uppercase tracking-widest hover:border-amber-200 transition-all shadow-sm active:scale-95"
            >
              <FileText size={18} /> Reporte Mensual
            </button>

            <button 
              onClick={() => syncWithCloud()}
              disabled={isSyncing}
              className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-[24px] font-black text-xs uppercase tracking-widest hover:border-slate-300 transition-all shadow-sm active:scale-95"
            >
              <RefreshCw className={isSyncing ? 'animate-spin text-blue-500' : 'text-slate-400'} size={18} /> 
              {isSyncing ? 'Actualizando...' : 'Refrescar'}
            </button>
          </div>
          
          {stats.stockCritico > 0 && (
            <Link 
              to="/stock"
              className="flex items-center justify-center gap-3 bg-red-500 text-white px-8 py-4 rounded-[24px] font-black animate-pulse shadow-xl shadow-red-500/20 text-xs uppercase tracking-widest"
            >
              <AlertCircle size={18} />
              {stats.stockCritico} Alertas Stock
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          title="Ventas de Hoy" 
          value={`$${stats.ventasHoy.toLocaleString()}`} 
          icon={TrendingUp} 
          color="emerald" 
          subtitle={`${stats.countHoy} órdenes cerradas`}
          trend="+12%"
        />
        <StatCard 
          title="Utilidad Neta Est." 
          value={`$${stats.utilidadTotal.toLocaleString()}`} 
          icon={DollarSign} 
          color="blue" 
          subtitle="Margen después de costos"
        />
        <StatCard 
          title="Valor Bodega" 
          value={`$${stats.valorInventarioVenta.toLocaleString()}`} 
          icon={Package} 
          color="amber" 
          subtitle={`${stats.disponibles} artículos en stock`}
        />
        <StatCard 
          title="Eficiencia TikTok" 
          value={stats.pendientesDatos > 0 ? `${stats.pendientesDatos} Pend.` : 'Óptima'} 
          icon={Zap} 
          color="purple" 
          subtitle="Datos de envío faltantes"
        />
        <StatCard title="Falta Completar" value={stats.faltaCompletar} icon={AlertCircle} color="red" subtitle="Pedidos con datos incompletos" />
        <StatCard title="Falta Pagar" value={stats.faltaPagar} icon={DollarSign} color="amber" subtitle="Pedidos pendientes de pago" />
        <StatCard title="Falta Despachar" value={stats.faltaDespachar} icon={Truck} color="blue" subtitle="Pedidos listos para salir" />
        <StatCard title="Cupones Pendientes" value={pendingCoupons} icon={Ticket} color="emerald" subtitle="Cupones por canjear" />
        <StatCard title="Dinero en Cupones" value={`$${totalPendingValue.toLocaleString()}`} icon={DollarSign} color="red" subtitle="Valor total pendiente" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Tendencia */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl overflow-hidden relative">
           <div className="flex items-center justify-between mb-8">
             <div>
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Tendencia de Ventas</h3>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Últimos 7 días de operación</p>
             </div>
             <div className="flex gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Ingresos</div>
             </div>
           </div>
           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold', fontSize: 10}} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
           </div>
        </div>

        {/* Ranking de Vendedores */}
        <div className="bg-slate-900 p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Users size={120} /></div>
          <h3 className="text-xl font-black uppercase tracking-tighter mb-8 relative z-10">Leaderboard Ventas</h3>
          <div className="space-y-6 relative z-10">
            {stats.topSellers.map(([name, total]: any, idx: number) => (
              <div key={name} className="flex items-center gap-4 bg-white/5 p-5 rounded-[28px] border border-white/10 hover:bg-white/10 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-amber-400 text-slate-900 shadow-[0_0_20px_rgba(251,191,36,0.5)]' : 'bg-slate-700 text-white'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black uppercase tracking-tight">{name}</p>
                  <p className="text-emerald-400 font-bold text-sm tracking-tight">${total.toLocaleString()}</p>
                </div>
                <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${(total / stats.totalVendido) * 100}%` }}></div>
                </div>
              </div>
            ))}
            {stats.topSellers.length === 0 && (
               <div className="text-center py-10 opacity-30">
                 <p className="text-xs font-black uppercase italic">Sin datos de venta registrados hoy</p>
               </div>
            )}
          </div>
          <Link to="/ventas" className="mt-8 w-full py-4 bg-white/10 hover:bg-white/20 rounded-[20px] flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all">
            Ver Detalle Completo <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Control de Pendientes por Vendedor */}
      <div id="pending-sales-by-seller" className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2 font-sans">
              <AlertCircle className="text-rose-500 animate-pulse" size={24} /> Pendientes por Vendedor
            </h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
              Ventas con datos incompletos, productos sin etiquetar o pagos pendientes de confirmar
            </p>
          </div>
          <span className="px-4 py-2 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 self-start md:self-auto font-sans">
            {pendingBySeller.reduce((acc, curr) => acc + curr.totalPendientes, 0)} Alertas Totales
          </span>
        </div>

        {pendingBySeller.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">Vendedor</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center font-sans">Datos Incompletos</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center font-sans">Sin Etiquetar/Imprimir</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center font-sans">Pendiente de Pago</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right font-sans">Total Pendientes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-sans">
                {pendingBySeller.map((item) => (
                  <tr key={item.vendedor} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-5">
                      <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.vendedor}</p>
                    </td>
                    <td className="py-5 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-black ${item.incompletas > 0 ? 'bg-amber-100 text-amber-700 font-mono' : 'bg-slate-100 text-slate-400 font-mono'}`}>
                        {item.incompletas}
                      </span>
                    </td>
                    <td className="py-5 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-black ${item.sinEtiquetar > 0 ? 'bg-blue-100 text-blue-700 font-mono' : 'bg-slate-100 text-slate-400 font-mono'}`}>
                        {item.sinEtiquetar}
                      </span>
                    </td>
                    <td className="py-5 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-black ${item.sinPagar > 0 ? 'bg-rose-100 text-rose-700 font-mono' : 'bg-slate-100 text-slate-400 font-mono'}`}>
                        {item.sinPagar}
                      </span>
                    </td>
                    <td className="py-5 text-right font-black text-slate-900 text-sm">
                      <span className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 text-white rounded-2xl text-[11px] font-black tracking-tight shadow-sm font-mono">
                        {item.totalPendientes} u.
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-100 font-sans">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
              <TrendingUp size={28} />
            </div>
            <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">¡Felicitaciones! Todo al día</h4>
            <p className="text-slate-400 text-xs mt-2 max-w-md font-medium">No hay ventas con datos incompletos, etiquetas pendientes o pagos sin registrar en el sistema.</p>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[56px] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[150%] bg-white/10 blur-[80px] rounded-full rotate-12 pointer-events-none"></div>
        <div className="space-y-6 text-center md:text-left relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-black/20 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-full">
            <Zap size={16} /> Alta Disponibilidad
          </div>
          <h3 className="text-5xl font-black uppercase tracking-tighter leading-none">Aumenta tu Margen <br/>con Estrategia</h3>
          <p className="text-white/80 font-medium max-w-lg text-xl italic leading-relaxed">Nuestro sistema ha detectado que la línea de "Polerones Premium" tiene el mejor retorno de inversión este mes.</p>
        </div>
        <div className="flex flex-col gap-4 relative z-10">
          <Link 
            to="/registrar" 
            className="bg-white text-emerald-600 px-12 py-7 rounded-[32px] font-black text-2xl transition-all shadow-2xl hover:scale-105 active:scale-95 flex items-center gap-4"
          >
            <Zap size={32} />
            NUEVO LIVE
          </Link>
        </div>
      </div>

      {/* Indicador de conexión */}
      <div className="flex items-center justify-center gap-3 text-[10px] font-black text-slate-300 uppercase tracking-widest pt-4">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
        Sincronizado vía Cloud Protocol <Cloud size={12} className="text-blue-400" />
      </div>
      
      <ReportModal 
        isOpen={reportState.isOpen} 
        onClose={() => setReportState({...reportState, isOpen: false})} 
        title={`Reporte ${reportState.type === 'weekly' ? 'Semanal' : reportState.type === 'monthly' ? 'Mensual' : 'Histórico (Personalizado)'}`}
        sales={reportState.sales}
        stats={stats}
      />
    </div>
  );
}
