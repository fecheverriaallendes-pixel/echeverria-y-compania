import React, { useState, useMemo } from 'react';
import { 
  Coins, 
  Calendar, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Printer, 
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Info,
  BadgeDollarSign,
  PlusCircle,
  Trash2,
  Settings,
  DollarSign,
  PackageCheck,
  ShoppingBag,
  Award,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { Sale, StockItem, StaffMember, CommissionAdjustment, DispatchStatus } from '../types';

export default function Comisiones() {
  const { 
    sales, 
    staff, 
    adjustments, 
    addAdjustment, 
    removeAdjustment, 
    updateSale, 
    playSound, 
    stock 
  } = useStore();

  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [expandedSeller, setExpandedSeller] = useState<string | null>(null);
  const [showRulesConfig, setShowRulesConfig] = useState(false);
  
  // Custom states for manual adjustment
  const [newAdjustment, setNewAdjustment] = useState({
    vendedor: '',
    monto: '',
    motivo: ''
  });

  // Base configurations based on user rules
  const BASE_SEMANAL = 100000; // $100.000 líquidos base
  
  // Category tiers
  const COMISION_CATEGORIAS = [
    { label: 'Categoría A', range: 'Hasta $9.990', max: 9990, comm: 500 },
    { label: 'Categoría B', range: '$10.000 - $19.990', max: 19990, comm: 800 },
    { label: 'Categoría C', range: '$20.000 - $39.990', max: 39990, comm: 1500 },
    { label: 'Categoría D', range: '$40.000 - $69.990', max: 69990, comm: 2500 },
    { label: 'Categoría E', range: '$70.000 - $99.990', max: 99990, comm: 3500 },
    { label: 'Categoría F', range: '$100.000 - $199.990', max: 199990, comm: 5000 },
    { label: 'Categoría G', range: 'Sobre $200.000', max: Infinity, comm: 8000 },
  ];

  // Volume bonuses
  const BONOS_VOLUMEN = [
    { target: 180, amount: 100000 },
    { target: 120, amount: 50000 },
    { target: 80, amount: 25000 },
    { target: 50, amount: 10000 }
  ];

  // Premium product rules
  const PREMIUM_RULES = [
    { keyword: 'silla', bonus: 3000, label: 'Silla Gamer' },
    { keyword: 'monitor', bonus: 5000, label: 'Monitor' },
    { keyword: 'parlante', bonus: 1000, label: 'Parlante Premium' }
  ];

  // Helper to calculate base commission for a product sold at a specific unit price
  const calculateBaseCommission = (itemCode: string, unitPrice: number): number => {
    const product = stock.find(p => p.codigo === itemCode);
    // 1. If product has an explicit fixed commission configured, use it first (user's preferred pro model)
    if (product && product.comision !== undefined && product.comision !== null && product.comision >= 0) {
      return product.comision;
    }

    // 2. Fallback to automatic price tier-based commission
    const tier = COMISION_CATEGORIAS.find(t => unitPrice <= t.max);
    return tier ? tier.comm : 500;
  };

  // Helper to calculate premium bonus
  const calculatePremiumBonus = (itemCode: string): number => {
    const product = stock.find(p => p.codigo === itemCode);
    if (!product) return 0;
    
    const description = (product.tipo || '').toLowerCase();
    const matchedRule = PREMIUM_RULES.find(r => description.includes(r.keyword.toLowerCase()));
    return matchedRule ? matchedRule.bonus : 0;
  };

  // Cálculo de rango de fecha (Lunes a Sábado)
  const weekRange = useMemo(() => {
    try {
      const now = new Date();
      // Ajustar fecha base según el offset de semanas
      const targetDate = new Date(now.getTime() + selectedWeekOffset * 7 * 24 * 60 * 60 * 1000);
      const day = targetDate.getDay(); // 0 es Domingo, 1 es Lunes, ..., 6 es Sábado
      
      // Calcular los días de diferencia para llegar al Lunes de esa semana
      // Si es Domingo (0), el Lunes de esa semana de comisiones fue hace 6 días.
      // Si es de Lunes (1) a Sábado (6), la diferencia es (1 - day) para llegar al Lunes.
      const diffToMonday = day === 0 ? -6 : 1 - day;
      
      const start = new Date(targetDate);
      start.setDate(targetDate.getDate() + diffToMonday);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(start);
      end.setDate(start.getDate() + 5); // Lunes + 5 días = Sábado
      end.setHours(23, 59, 59, 999);
      
      return { start, end };
    } catch (e) {
      console.error("Error al calcular los rangos de fecha de comisiones:", e);
      return { start: new Date(), end: new Date() };
    }
  }, [selectedWeekOffset]);

  // Format date helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  // Handle manual adjustment submission
  const handleAddAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdjustment.vendedor || !newAdjustment.monto || !newAdjustment.motivo) {
      alert("Por favor completa todos los campos del ajuste");
      return;
    }

    addAdjustment({
      fecha: new Date().toLocaleDateString(),
      vendedor: newAdjustment.vendedor,
      monto: Number(newAdjustment.monto),
      motivo: newAdjustment.motivo
    });

    setNewAdjustment({ vendedor: '', monto: '', motivo: '' });
    setShowAdjustmentForm(false);
    playSound('success');
  };

  // Filter sales belonging to the current selected week
  const weeklySales = useMemo(() => {
    if (!Array.isArray(sales)) return [];

    return sales.filter(s => {
      if (!s || !s.fecha || typeof s.fecha !== 'string') return false;
      
      try {
        let saleDate: Date;
        if (s.fecha.includes('/')) {
          const parts = s.fecha.split('/');
          if (parts.length !== 3) return false;
          const [d, m, y] = parts;
          saleDate = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
        } else {
          const parts = s.fecha.split('-');
          if (parts.length !== 3) return false;
          const [y, m, d] = parts;
          saleDate = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
        }
        
        if (isNaN(saleDate.getTime())) return false;
        
        return saleDate >= weekRange.start && saleDate <= weekRange.end;
      } catch (e) {
        return false;
      }
    });
  }, [sales, weekRange]);

  // Filter weekly adjustments
  const weeklyAdjustments = useMemo(() => {
    if (!Array.isArray(adjustments)) return [];
    
    return adjustments.filter(a => {
      try {
        let adjDate: Date;
        if (a.fecha.includes('/')) {
          const parts = a.fecha.split('/');
          if (parts.length !== 3) return false;
          const [d, m, y] = parts;
          adjDate = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
        } else {
          const parts = a.fecha.split('-');
          if (parts.length !== 3) return false;
          const [y, m, d] = parts;
          adjDate = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
        }
        return adjDate >= weekRange.start && adjDate <= weekRange.end;
      } catch (e) {
        return false;
      }
    });
  }, [adjustments, weekRange]);

  // Main structure containing each seller's payroll breakdown
  const sellerPayrollReport = useMemo(() => {
    const report: Record<string, {
      vendedor: string;
      ventasElegibles: {
        sale: Sale;
        codigoFardo: string;
        tipo: string;
        cantidad: number;
        precioUnitario: number;
        comisionBase: number;
        bonoPremium: number;
        subtotalComision: number;
        subtotalBonoPremium: number;
        totalFardo: number;
      }[];
      ventasExcluidas: {
        sale: Sale;
        codigoFardo: string;
        tipo: string;
        cantidad: number;
        precioUnitario: number;
        razones: string[];
      }[];
      totalProductosVendidos: number;
      totalComisionBase: number;
      totalBonoPremium: number;
      montoBonoVolumen: number;
      ajustes: CommissionAdjustment[];
      totalAjustes: number;
      totalAPagar: number;
    }> = {};

    // Initialize all active sellers to ensure transparent empty reports are generated
    staff
      .filter(member => member.rol === 'Vendedor' && member.activo)
      .forEach(seller => {
        report[seller.nombre] = {
          vendedor: seller.nombre,
          ventasElegibles: [],
          ventasExcluidas: [],
          totalProductosVendidos: 0,
          totalComisionBase: 0,
          totalBonoPremium: 0,
          montoBonoVolumen: 0,
          ajustes: [],
          totalAjustes: 0,
          totalAPagar: BASE_SEMANAL
        };
      });

    // Process all sales from this week
    weeklySales.forEach(s => {
      const sellerName = s.vendedor;
      if (!sellerName) return;

      // Auto initialize if not in staff list
      if (!report[sellerName]) {
        report[sellerName] = {
          vendedor: sellerName,
          ventasElegibles: [],
          ventasExcluidas: [],
          totalProductosVendidos: 0,
          totalComisionBase: 0,
          totalBonoPremium: 0,
          montoBonoVolumen: 0,
          ajustes: [],
          totalAjustes: 0,
          totalAPagar: BASE_SEMANAL
        };
      }

      const isPaid = (s.estadoPago || '').toLowerCase() === 'pagado';
      const isDelivered = s.estadoDespacho === 'Entregado';
      const isReturned = !!s.devuelta;
      const isExchanged = !!s.cambio;
      const isCancelled = !!s.anulada;

      const ineligibleReasons: string[] = [];
      if (!isPaid) ineligibleReasons.push('Cliente no ha pagado completamente');
      if (!isDelivered) ineligibleReasons.push('Pedido no se ha entregado');
      if (isReturned) ineligibleReasons.push('Hubo devolución de producto');
      if (isExchanged) ineligibleReasons.push('Hubo cambio de producto');
      if (isCancelled) ineligibleReasons.push('Venta se encuentra anulada');

      // Helper to process items inside sale
      const processSaleItem = (codigoFardo: string, qty: number, price: number, snapshottedComm?: number) => {
        const itemInfo = stock.find(p => p.codigo === codigoFardo);
        const name = itemInfo ? itemInfo.tipo : codigoFardo;

        if (ineligibleReasons.length > 0) {
          // EXCLUDED item
          report[sellerName].ventasExcluidas.push({
            sale: s,
            codigoFardo,
            tipo: name,
            cantidad: qty,
            precioUnitario: price,
            razones: ineligibleReasons
          });
        } else {
          // ELIGIBLE item
          // Retrieve commission: prefer snapshotted one, fallback to dynamic calculation
          let comisionBase = snapshottedComm;
          if (comisionBase === undefined || comisionBase === null) {
            comisionBase = calculateBaseCommission(codigoFardo, price);
          }
          
          const bonoPremium = calculatePremiumBonus(codigoFardo);
          const subtotalComision = comisionBase * qty;
          const subtotalBonoPremium = bonoPremium * qty;
          const totalFardo = subtotalComision + subtotalBonoPremium;

          report[sellerName].ventasElegibles.push({
            sale: s,
            codigoFardo,
            tipo: name,
            cantidad: qty,
            precioUnitario: price,
            comisionBase,
            bonoPremium,
            subtotalComision,
            subtotalBonoPremium,
            totalFardo
          });

          // Accumulate volume
          report[sellerName].totalProductosVendidos += qty;
          report[sellerName].totalComisionBase += subtotalComision;
          report[sellerName].totalBonoPremium += subtotalBonoPremium;
        }
      };

      // Extract items from single sale or multi-item sale (Nota de Venta)
      if (s.items && s.items.length > 0) {
        s.items.forEach(item => {
          processSaleItem(item.codigoFardo, item.cantidad, item.valorUnitario, item.comisionCalculada);
        });
      } else {
        processSaleItem(s.codigoFardo || 'S/C', s.cantidad || 1, s.valorUnitario || s.total || 0, s.comisionCalculada);
      }
    });

    // Process manual adjustments and finalize totals
    Object.keys(report).forEach(name => {
      const r = report[name];
      
      // Calculate Volumetric Volume Bonus
      const matchedBono = BONOS_VOLUMEN.find(b => r.totalProductosVendidos >= b.target);
      r.montoBonoVolumen = matchedBono ? matchedBono.amount : 0;

      // Filter manual adjustments
      r.ajustes = weeklyAdjustments.filter(a => a.vendedor === name);
      r.totalAjustes = r.ajustes.reduce((sum, adj) => sum + adj.monto, 0);

      // Final total pay calculation
      r.totalAPagar = BASE_SEMANAL + r.totalComisionBase + r.totalBonoPremium + r.montoBonoVolumen + r.totalAjustes;
    });

    return Object.values(report).sort((a, b) => b.totalAPagar - a.totalAPagar);
  }, [weeklySales, weeklyAdjustments, stock, staff]);

  // Aggregate stats
  const totalPayrollCost = useMemo(() => 
    sellerPayrollReport.reduce((acc, r) => acc + r.totalAPagar, 0)
  , [sellerPayrollReport]);

  const totalWeeklySalesAmount = useMemo(() => 
    weeklySales.reduce((acc, s) => acc + (s.total || 0), 0)
  , [weeklySales]);

  const totalProductsSold = useMemo(() => 
    sellerPayrollReport.reduce((acc, r) => acc + r.totalProductosVendidos, 0)
  , [sellerPayrollReport]);

  // Quick helper to mutate sale properties on-the-fly
  const handleToggleSaleStatus = (saleId: string, field: 'estadoPago' | 'estadoDespacho' | 'devuelta' | 'cambio' | 'anulada', value: any) => {
    updateSale(saleId, { [field]: value });
    playSound('success');
  };

  const handlePrintPayroll = () => {
    window.print();
    playSound('success');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-[1400px] mx-auto pb-24 px-4 sm:px-6">
      {/* Upper header action area */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 no-print">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-4 shadow-lg shadow-amber-500/20">
            <Coins size={14} className="animate-bounce" /> Nómina y Comisiones Automatizadas
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">
            Pago de <span className="text-amber-500 italic">Comisiones</span>
          </h2>
          <p className="text-slate-500 font-medium italic mt-4 flex items-center gap-2 flex-wrap">
            <Calendar size={18} className="text-slate-400" /> 
            Semana del <span className="text-slate-900 font-black underline decoration-amber-400 decoration-2">{weekRange.start.toLocaleDateString('es-CL')}</span> al <span className="text-slate-900 font-black underline decoration-amber-400 decoration-2">{weekRange.end.toLocaleDateString('es-CL')}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => { setShowRulesConfig(!showRulesConfig); playSound('click'); }}
            className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
          >
            <Settings size={16} /> {showRulesConfig ? 'Ocultar Reglas' : 'Ver Reglas y Tramos'}
          </button>
          
          <div className="flex bg-slate-200 p-1.5 rounded-[24px] shadow-inner">
            <button 
              onClick={() => { setSelectedWeekOffset(prev => prev - 1); playSound('click'); }}
              className="px-4 py-2.5 rounded-[18px] font-black text-[10px] uppercase tracking-widest transition-all text-slate-600 hover:text-slate-900"
            >
              ← Ant
            </button>
            <button 
              onClick={() => { setSelectedWeekOffset(0); playSound('click'); }}
              className={`px-5 py-2.5 rounded-[18px] font-black text-[10px] uppercase tracking-widest transition-all ${selectedWeekOffset === 0 ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500'}`}
            >
              Actual
            </button>
            <button 
              onClick={() => { setSelectedWeekOffset(prev => prev + 1); playSound('click'); }}
              className="px-4 py-2.5 rounded-[18px] font-black text-[10px] uppercase tracking-widest transition-all text-slate-600 hover:text-slate-900"
            >
              Sig →
            </button>
          </div>

          <button 
            onClick={handlePrintPayroll}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl hover:shadow-slate-900/10 active:scale-95"
          >
            <Printer size={18} /> Imprimir Nómina
          </button>
        </div>
      </div>

      {/* Rules policy display panel (Dynamic & Expandable) */}
      {showRulesConfig && (
        <div className="p-8 bg-slate-50 border-2 border-slate-200 rounded-[36px] grid grid-cols-1 md:grid-cols-3 gap-8 no-print animate-in slide-in-from-top-4 duration-300">
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-950 uppercase flex items-center gap-2">
              <BadgeDollarSign size={20} className="text-amber-500" /> Tramos de Comisión
            </h3>
            <p className="text-xs text-slate-500 font-medium">Comisiones dinámicas automáticas basadas en el precio de venta unitario, a menos que el producto tenga una comisión fija configurada en el Catálogo.</p>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 divide-y divide-slate-100 text-xs">
              <div className="py-2 flex justify-between items-center font-black text-slate-400 text-[10px] uppercase tracking-wider">
                <span>Categoría / Rango</span>
                <span>Comisión</span>
              </div>
              {COMISION_CATEGORIAS.map((tier, idx) => (
                <div key={idx} className="py-2.5 flex justify-between items-center font-bold">
                  <div>
                    <span className="text-slate-900 block">{tier.label}</span>
                    <span className="text-slate-400 text-[10px] font-normal block">{tier.range}</span>
                  </div>
                  <span className="text-amber-600 font-black text-sm">${tier.comm.toLocaleString('es-CL')}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-950 uppercase flex items-center gap-2">
              <Award size={20} className="text-indigo-500" /> Bonos Semanales de Volumen
            </h3>
            <p className="text-xs text-slate-500 font-medium">Incentivos para impulsar la rotación de inventarios basados en la suma total de productos calificados vendidos durante la semana.</p>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 divide-y divide-slate-100 text-xs">
              {BONOS_VOLUMEN.map((bono, idx) => (
                <div key={idx} className="py-2 flex justify-between items-center font-bold">
                  <span className="text-slate-500">Mínimo {bono.target} productos vendidos</span>
                  <span className="text-indigo-600 font-black">+ ${bono.amount.toLocaleString('es-CL')}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-950 uppercase flex items-center gap-2">
              <Sparkles size={20} className="text-emerald-500" /> Bonos por Ventas Premium
            </h3>
            <p className="text-xs text-slate-500 font-medium">Incentivos adicionales fijos aplicados por cada unidad vendida de productos calificados (mecanismo inteligente por palabras clave).</p>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 divide-y divide-slate-100 text-xs">
              {PREMIUM_RULES.map((rule, idx) => (
                <div key={idx} className="py-2 flex justify-between items-center font-bold">
                  <span className="text-slate-500">Contiene "{rule.keyword}"</span>
                  <span className="text-emerald-600 font-black">+ ${rule.bonus.toLocaleString('es-CL')} / un</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manual adjustments / discount & bonus manager form */}
      <div className="no-print">
        <button 
          onClick={() => setShowAdjustmentForm(!showAdjustmentForm)}
          className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
        >
          <PlusCircle size={16} /> {showAdjustmentForm ? 'Cerrar Panel' : 'Registrar Ajuste Manual (Bono / Descuento)'}
        </button>

        {showAdjustmentForm && (
          <div className="mt-6 p-8 bg-white rounded-[32px] border-2 border-red-100 shadow-xl animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertCircle size={20} />
              <h3 className="text-md font-black uppercase">Registrar Ajuste de Liquidación</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">Puedes aplicar bonificaciones manuales o descuentos por errores en despachos, devoluciones especiales, etc. Aplica de inmediato a la liquidación semanal del vendedor seleccionado.</p>
            <form onSubmit={handleAddAdjustment} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Vendedor</label>
                <select 
                  required
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-red-500 transition-all"
                  value={newAdjustment.vendedor}
                  onChange={e => setNewAdjustment({...newAdjustment, vendedor: e.target.value})}
                >
                  <option value="">Seleccionar vendedor...</option>
                  {staff.filter(s => s.rol === 'Vendedor' && s.activo).map(s => (
                    <option key={s.id} value={s.nombre}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Monto (Negativo para descuento)</label>
                <input 
                  required
                  type="number" onWheel={(e) => e.currentTarget.blur()}
                  placeholder="Ej: 25000 o -5000"
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-red-500 transition-all"
                  value={newAdjustment.monto}
                  onChange={e => setNewAdjustment({...newAdjustment, monto: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Motivo / Justificación</label>
                <input 
                  required
                  type="text"
                  placeholder="Ej: Bono por meta extraordinaria"
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-red-500 transition-all"
                  value={newAdjustment.motivo}
                  onChange={e => setNewAdjustment({...newAdjustment, motivo: e.target.value})}
                />
              </div>
              <button type="submit" className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all">
                Guardar Ajuste
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Main KPI Stats Dashboard */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[48px] p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl no-print">
        <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[150%] bg-amber-500/10 blur-[100px] rounded-full rotate-12 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="space-y-4">
            <p className="text-amber-400 text-xs font-black uppercase tracking-[0.4em]">Fondo Total de Nómina Liquidado</p>
            <h3 className="text-5xl sm:text-7xl font-black tracking-tighter leading-none text-slate-50">
              ${(totalPayrollCost || 0).toLocaleString('es-CL')} <span className="text-xl sm:text-2xl text-slate-400">CLP</span>
            </h3>
            <p className="text-slate-400 font-medium italic">
              Compuesto por {sellerPayrollReport.length} vendedores calificados, sumando {totalWeeklySalesAmount.toLocaleString('es-CL')} CLP de facturación bruta.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
             <div className="bg-white/5 border border-white/10 p-5 sm:p-6 rounded-[28px] backdrop-blur-md min-w-[150px]">
                <p className="text-[9px] font-black text-amber-400 uppercase mb-2">Unidades Elegibles</p>
                <p className="text-2xl sm:text-3xl font-black text-white">{totalProductsSold} un</p>
             </div>
             <div className="bg-white/5 border border-white/10 p-5 sm:p-6 rounded-[28px] backdrop-blur-md min-w-[150px]">
                <p className="text-[9px] font-black text-amber-400 uppercase mb-2">Total en Comisiones</p>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  ${sellerPayrollReport.reduce((acc, r) => acc + r.totalComisionBase + r.totalBonoPremium, 0).toLocaleString('es-CL')}
                </p>
             </div>
             <div className="bg-white/5 border border-white/10 p-5 sm:p-6 rounded-[28px] backdrop-blur-md min-w-[150px]">
                <p className="text-[9px] font-black text-amber-400 uppercase mb-2">Bonos de Volumen</p>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  ${sellerPayrollReport.reduce((acc, r) => acc + r.montoBonoVolumen, 0).toLocaleString('es-CL')}
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Main List of Salespeople with their specific payroll receipts */}
      <div className="grid grid-cols-1 gap-8 no-print">
        {sellerPayrollReport.map((reportItem) => {
          const isExpanded = expandedSeller === reportItem.vendedor;
          return (
            <div 
              key={reportItem.vendedor} 
              className={`bg-white rounded-[36px] border transition-all duration-300 overflow-hidden ${
                isExpanded 
                  ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-2xl' 
                  : 'border-slate-100 shadow-lg hover:border-amber-200'
              }`}
            >
              {/* Receipt Header Bar */}
              <div 
                onClick={() => { setExpandedSeller(isExpanded ? null : reportItem.vendedor); playSound('click'); }}
                className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 cursor-pointer hover:bg-slate-50/50 select-none transition-colors"
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-md">
                    <User size={30} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{reportItem.vendedor}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[9px] font-black rounded-lg uppercase tracking-wider">
                        Sueldo Base: ${BASE_SEMANAL.toLocaleString('es-CL')}
                      </span>
                      {reportItem.totalProductosVendidos > 0 ? (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 size={10} /> {reportItem.totalProductosVendidos} un calificados
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-100 text-slate-400 text-[9px] font-black rounded-lg uppercase tracking-wider">
                          Sin ventas
                        </span>
                      )}
                      {reportItem.montoBonoVolumen > 0 && (
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-[9px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1">
                          <Award size={10} /> Bono de Volumen Reclamado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sueldo Neto Semanal</p>
                    <p className="text-3xl font-black text-slate-950">${reportItem.totalAPagar.toLocaleString('es-CL')}</p>
                  </div>
                  <div className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

              {/* Collapsed/Expanded Drawer */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/30 p-8 space-y-8 animate-in slide-in-from-top duration-300">
                  {/* Summary grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Sueldo Base Líquido</p>
                      <p className="text-xl font-black text-slate-900 mt-1">${BASE_SEMANAL.toLocaleString('es-CL')}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Comisiones de Artículos</p>
                      <p className="text-xl font-black text-slate-900 mt-1">${reportItem.totalComisionBase.toLocaleString('es-CL')}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Bonos Ventas Premium</p>
                      <p className="text-xl font-black text-emerald-600 mt-1">+ ${reportItem.totalBonoPremium.toLocaleString('es-CL')}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Incentivo Volumen</p>
                      <p className="text-xl font-black text-indigo-600 mt-1">+ ${reportItem.montoBonoVolumen.toLocaleString('es-CL')}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Ajustes / Descuentos</p>
                      <p className={`text-xl font-black mt-1 ${reportItem.totalAjustes >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                        {reportItem.totalAjustes >= 0 ? '+' : ''} ${reportItem.totalAjustes.toLocaleString('es-CL')}
                      </p>
                    </div>
                  </div>

                  {/* Eligible products list */}
                  <div className="space-y-4">
                    <h5 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle2 size={16} /> Ventas Calificadas ({reportItem.ventasElegibles.length})
                    </h5>
                    
                    {reportItem.ventasElegibles.length > 0 ? (
                      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-400 font-black uppercase tracking-wider border-b border-slate-100 text-[9px]">
                              <th className="py-4 px-6">Venta / Fecha</th>
                              <th className="py-4 px-6">Código / Producto</th>
                              <th className="py-4 px-6 text-center">Unidades</th>
                              <th className="py-4 px-6">Comisión Unit.</th>
                              <th className="py-4 px-6">Incentivo Premium</th>
                              <th className="py-4 px-6 text-right">Monto Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                            {reportItem.ventasElegibles.map((el, index) => (
                              <tr key={index} className="hover:bg-slate-50/50">
                                <td className="py-4 px-6">
                                  <span className="text-slate-900 font-black">#{el.sale.numeroVenta}</span>
                                  <span className="block text-[10px] text-slate-400 font-normal">{el.sale.fecha}</span>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono text-[9px] rounded uppercase">
                                      {el.codigoFardo}
                                    </span>
                                    <span className="text-slate-900 uppercase font-black text-xs block truncate max-w-[200px]">
                                      {el.tipo}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-center text-slate-900 font-black">{el.cantidad}</td>
                                <td className="py-4 px-6 text-slate-500">${el.comisionBase.toLocaleString('es-CL')}</td>
                                <td className="py-4 px-6">
                                  {el.bonoPremium > 0 ? (
                                    <span className="text-emerald-600 flex items-center gap-1">
                                      <Sparkles size={12} /> +${el.bonoPremium.toLocaleString('es-CL')}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-right text-slate-900 font-black">
                                  ${el.totalFardo.toLocaleString('es-CL')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 font-medium italic py-2 pl-4">No se registran ventas que cumplan todos los requisitos de liquidación en esta semana.</p>
                    )}
                  </div>

                  {/* Excluded products list with toggle action controls */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                        <AlertTriangle size={16} /> Ventas No Calificadas / Pendientes ({reportItem.ventasExcluidas.length})
                      </h5>
                      <span className="text-[10px] text-slate-400 font-bold">Estas ventas no pagan comisión temporalmente hasta cumplir las condiciones.</span>
                    </div>

                    {reportItem.ventasExcluidas.length > 0 ? (
                      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-400 font-black uppercase tracking-wider border-b border-slate-100 text-[9px]">
                              <th className="py-4 px-6">Venta / Fecha</th>
                              <th className="py-4 px-6">Producto</th>
                              <th className="py-4 px-6">Causa de Exclusión</th>
                              <th className="py-4 px-6 text-right">Acción Rápida de Habilitación</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                            {reportItem.ventasExcluidas.map((ex, index) => {
                              const sale = ex.sale;
                              const isPaid = (sale.estadoPago || '').toLowerCase() === 'pagado';
                              const isDelivered = sale.estadoDespacho === 'Entregado';
                              
                              return (
                                <tr key={index} className="hover:bg-slate-50/50 bg-amber-50/5">
                                  <td className="py-4 px-6">
                                    <span className="text-slate-900 font-black">#{sale.numeroVenta}</span>
                                    <span className="block text-[10px] text-slate-400 font-normal">{sale.fecha}</span>
                                  </td>
                                  <td className="py-4 px-6">
                                    <span className="text-slate-900 uppercase font-black block truncate max-w-[150px]">{ex.tipo}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">{ex.cantidad} un x ${ex.precioUnitario.toLocaleString('es-CL')}</span>
                                  </td>
                                  <td className="py-4 px-6 space-y-1">
                                    {ex.razones.map((razon, ri) => (
                                      <span key={ri} className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-[9px] font-black rounded-lg uppercase tracking-tight block w-fit">
                                        <XCircle size={10} /> {razon}
                                      </span>
                                    ))}
                                  </td>
                                  <td className="py-4 px-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      {/* Quick Payment Toggle */}
                                      {!isPaid && (
                                        <button 
                                          onClick={() => handleToggleSaleStatus(sale.id, 'estadoPago', 'Pagado')}
                                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-600/10"
                                        >
                                          ✓ Pagó
                                        </button>
                                      )}
                                      
                                      {/* Quick Delivery Toggle */}
                                      {!isDelivered && (
                                        <button 
                                          onClick={() => handleToggleSaleStatus(sale.id, 'estadoDespacho', 'Entregado')}
                                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-600/10"
                                        >
                                          ✓ Entregado
                                        </button>
                                      )}

                                      {/* If Returned or Exchanged, option to clear */}
                                      {(sale.devuelta || sale.cambio) && (
                                        <button 
                                          onClick={() => {
                                            updateSale(sale.id, { devuelta: false, cambio: false });
                                            playSound('success');
                                          }}
                                          className="px-3 py-1.5 bg-slate-800 hover:bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
                                        >
                                          Restaurar Venta
                                        </button>
                                      )}

                                      {(!sale.devuelta && !sale.cambio && isPaid && isDelivered) && (
                                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                          <CheckCircle2 size={12} /> Procesando habilitación...
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 font-medium italic py-2 pl-4">No hay ventas excluidas esta semana. Todos los despachos y pagos del vendedor se encuentran al día.</p>
                    )}
                  </div>

                  {/* Adjustments details */}
                  {reportItem.ajustes.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h5 className="text-xs font-black text-red-600 uppercase tracking-widest flex items-center gap-1.5">
                        <AlertCircle size={16} /> Ajustes Manuales Registrados ({reportItem.ajustes.length})
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {reportItem.ajustes.map((adj) => (
                          <div key={adj.id} className="bg-white p-4 rounded-2xl border border-red-100 flex items-center justify-between group/adj">
                            <div>
                              <p className="font-black text-slate-900 uppercase text-xs">{adj.motivo}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{adj.fecha}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`font-black text-sm ${adj.monto >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {adj.monto >= 0 ? '+' : ''}${adj.monto.toLocaleString('es-CL')}
                              </span>
                              <button 
                                onClick={() => { removeAdjustment(adj.id); playSound('click'); }} 
                                className="text-red-300 hover:text-red-600 opacity-0 group-hover/adj:opacity-100 transition-all p-1"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Print single voucher action */}
                  <div className="flex justify-end pt-4 border-t border-slate-100">
                     <button 
                       onClick={() => {
                         setExpandedSeller(reportItem.vendedor);
                         setTimeout(() => window.print(), 200);
                       }}
                       className="flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-lg transition-all"
                     >
                       <FileText size={14} /> Imprimir Comprobante de {reportItem.vendedor}
                     </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {sellerPayrollReport.length === 0 && (
          <div className="py-40 text-center bg-white rounded-[48px] border-4 border-dashed border-slate-100">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                <BadgeDollarSign size={64} />
             </div>
             <h3 className="text-3xl font-black text-slate-300 uppercase tracking-tighter">Sin Vendedores</h3>
             <p className="text-slate-400 font-medium italic">Registra personal con rol "Vendedor" en la pantalla de Configuración para calcular comisiones.</p>
          </div>
        )}
      </div>

      {/* Print View Voucher Layout (Hidden on screen, optimized for standard 8.5x11 paper) */}
      <div className="hidden print:block p-10 bg-white text-slate-900 font-sans text-xs">
        <h1 className="text-3xl font-black uppercase text-center mb-1 border-b-4 border-slate-950 pb-4 tracking-tighter">
          NÓMINA DE LIQUIDACIÓN DE COMISIONES
        </h1>
        <p className="text-center font-bold text-[10px] tracking-widest uppercase mb-10 text-slate-500">
          ECHEVERRIA & CO. · PERIODO: {weekRange.start.toLocaleDateString('es-CL')} AL {weekRange.end.toLocaleDateString('es-CL')}
        </p>

        {sellerPayrollReport
          .filter(r => expandedSeller === null || r.vendedor === expandedSeller)
          .map((reportItem) => (
            <div key={reportItem.vendedor} className="mb-20 border-2 border-slate-950 p-8 rounded-3xl page-break-inside-avoid">
              <div className="flex justify-between items-end border-b-2 border-slate-950 pb-4 mb-6">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">{reportItem.vendedor}</h2>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Cargo: Vendedor de Sucursal / Terreno</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Semanal Líquido:</p>
                  <p className="text-3xl font-black text-slate-950">${reportItem.totalAPagar.toLocaleString('es-CL')}</p>
                </div>
              </div>

              {/* Payroll breakdown list */}
              <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-200 font-bold">
                <div>
                  <p className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Pago Base Semanal:</span>
                    <span>${BASE_SEMANAL.toLocaleString('es-CL')}</span>
                  </p>
                  <p className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Comisiones de Artículos:</span>
                    <span>${reportItem.totalComisionBase.toLocaleString('es-CL')}</span>
                  </p>
                  <p className="flex justify-between py-1 border-b border-slate-200 text-emerald-700">
                    <span>Bonificaciones de Productos Premium:</span>
                    <span>+${reportItem.totalBonoPremium.toLocaleString('es-CL')}</span>
                  </p>
                </div>
                <div>
                  <p className="flex justify-between py-1 border-b border-slate-200 text-indigo-700">
                    <span>Incentivo por Meta de Volumen ({reportItem.totalProductosVendidos} un):</span>
                    <span>+${reportItem.montoBonoVolumen.toLocaleString('es-CL')}</span>
                  </p>
                  <p className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Ajustes Manuales / Descuentos:</span>
                    <span className={reportItem.totalAjustes >= 0 ? 'text-slate-900' : 'text-red-700'}>
                      {reportItem.totalAjustes >= 0 ? '+' : ''}${reportItem.totalAjustes.toLocaleString('es-CL')}
                    </span>
                  </p>
                  <p className="flex justify-between py-1 border-b border-slate-200 text-slate-950 text-sm font-black">
                    <span>Total Neto Liquidado:</span>
                    <span>${reportItem.totalAPagar.toLocaleString('es-CL')}</span>
                  </p>
                </div>
              </div>

              {/* Individual details */}
              <h3 className="text-[10px] font-black uppercase tracking-wider mb-3 pb-1 border-b border-slate-400">Ventas Elegibles Detalladas</h3>
              <table className="w-full text-left border-collapse text-[9px] mb-8">
                <thead>
                  <tr className="border-b border-slate-900 font-black text-slate-400 uppercase">
                    <th className="py-2">Venta</th>
                    <th className="py-2">Fecha</th>
                    <th className="py-2">Código Producto</th>
                    <th className="py-2">Descripción</th>
                    <th className="py-2 text-center">Cant</th>
                    <th className="py-2">Comisión Unit</th>
                    <th className="py-2">Premio</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-bold">
                  {reportItem.ventasElegibles.map((el, i) => (
                    <tr key={i}>
                      <td className="py-2">#{el.sale.numeroVenta}</td>
                      <td className="py-2">{el.sale.fecha}</td>
                      <td className="py-2 font-mono uppercase">{el.codigoFardo}</td>
                      <td className="py-2 uppercase truncate max-w-[150px]">{el.tipo}</td>
                      <td className="py-2 text-center">{el.cantidad}</td>
                      <td className="py-2">${el.comisionBase.toLocaleString('es-CL')}</td>
                      <td className="py-2">+{el.bonoPremium.toLocaleString('es-CL')}</td>
                      <td className="py-2 text-right">${el.totalFardo.toLocaleString('es-CL')}</td>
                    </tr>
                  ))}
                  {reportItem.ventasElegibles.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-slate-400 italic">No se registran ventas liquidadas en este periodo.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Adjustments */}
              {reportItem.ajustes.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-[10px] font-black uppercase tracking-wider mb-3 pb-1 border-b border-slate-400">Ajustes / Descuentos Manuales</h3>
                  <table className="w-full text-left border-collapse text-[9px]">
                    <thead>
                      <tr className="border-b border-slate-900 font-black text-slate-400 uppercase">
                        <th className="py-2">Fecha</th>
                        <th className="py-2">Motivo</th>
                        <th className="py-2 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-bold">
                      {reportItem.ajustes.map((adj, i) => (
                        <tr key={i}>
                          <td className="py-2">{adj.fecha}</td>
                          <td className="py-2 uppercase">{adj.motivo}</td>
                          <td className="py-2 text-right font-black">
                            {adj.monto >= 0 ? '+' : ''}${adj.monto.toLocaleString('es-CL')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Signature lines */}
              <div className="mt-16 flex justify-between items-center px-12">
                <div className="text-center">
                  <div className="w-56 border-t-2 border-slate-950 pt-2 text-[9px] font-black uppercase tracking-widest">
                    Firma Vendedor
                  </div>
                  <p className="text-[7px] text-slate-400 mt-1 uppercase font-semibold">Conforme con el cálculo y condiciones de pago</p>
                </div>
                <div className="text-center">
                  <div className="w-56 border-t-2 border-slate-950 pt-2 text-[9px] font-black uppercase tracking-widest">
                    Autorizado Caja Central
                  </div>
                  <p className="text-[7px] text-slate-400 mt-1 uppercase font-semibold">ECHEVERRIA & CO. - Control de Gestión</p>
                </div>
              </div>
            </div>
          ))}
      </div>

      <style>{`
        @media print {
          body { 
            background: white !important; 
            color: black !important;
          }
          .no-print { 
            display: none !important; 
          }
          .page-break-inside-avoid { 
            page-break-inside: avoid; 
          }
        }
      `}</style>
    </div>
  );
}
