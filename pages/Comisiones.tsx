
import React, { useState, useMemo } from 'react';
import { 
  Coins, 
  Calendar, 
  User, 
  ArrowRight, 
  Printer, 
  FileCheck, 
  TrendingUp,
  ChevronDown,
  Info,
  BadgeDollarSign,
  Download,
  AlertTriangle,
  PlusCircle,
  Trash2
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { CommissionType, Sale, CommissionAdjustment } from '../types';

export default function Comisiones() {
  const { sales, staff, adjustments, addAdjustment, removeAdjustment, playSound, stock, rates } = useStore();
  
  const dynamicCommissionValues: Record<string, number> = {
    [CommissionType.FARDO_NORMAL]: rates?.commissionFardoNormal !== undefined ? rates.commissionFardoNormal : 3000,
    [CommissionType.FARDO_PROMO]: rates?.commissionFardoPromo !== undefined ? rates.commissionFardoPromo : 1500,
    [CommissionType.MEDIO_FARDO]: rates?.commissionMedioFardo !== undefined ? rates.commissionMedioFardo : 1500,
    [CommissionType.LOTE]: rates?.commissionLote !== undefined ? rates.commissionLote : 1000,
  };
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [newAdjustment, setNewAdjustment] = useState({
    vendedor: '',
    monto: '',
    motivo: ''
  });

  const handleAddAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdjustment.vendedor || !newAdjustment.monto || !newAdjustment.motivo) {
      alert("Por favor completa todos los campos");
      return;
    }

    addAdjustment({
      fecha: new Date().toLocaleDateString(),
      vendedor: newAdjustment.vendedor,
      monto: Number(newAdjustment.monto), // Can be negative
      motivo: newAdjustment.motivo
    });

    setNewAdjustment({ vendedor: '', monto: '', motivo: '' });
    setShowAdjustmentForm(false);
    playSound('success');
  };

  // Generador de rango de fechas ultra-seguro
  const weekRange = useMemo(() => {
    try {
      const now = new Date();
      // Ajuste para que Lunes sea el primer día de la semana (1) y Domingo el último (7)
      const currentDay = now.getDay() === 0 ? 7 : now.getDay();
      
      const start = new Date(now);
      start.setDate(now.getDate() - currentDay + 1 + (selectedWeekOffset * 7));
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      
      return { start, end };
    } catch (e) {
      console.error("Error calculando rango de fechas:", e);
      return { start: new Date(), end: new Date() };
    }
  }, [selectedWeekOffset]);

  // Filtrado de ventas con validación de nulidad para evitar "White Screen"
  const weeklySales = useMemo(() => {
    if (!Array.isArray(sales)) return [];

    return sales.filter(s => {
      if (!s || !s.fecha || typeof s.fecha !== 'string') return false;
      
      try {
        // Verificar si la fecha tiene formato DD/MM/YYYY o YYYY-MM-DD
        let saleDate: Date;
        if (s.fecha.includes('/')) {
            const parts = s.fecha.split('/');
            if (parts.length !== 3) return false;
            const [d, m, y] = parts;
            saleDate = new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0);
        } else {
            const parts = s.fecha.split('-');
            if (parts.length !== 3) return false;
            const [y, m, d] = parts;
            saleDate = new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0);
        }
        
        // Verificar si la fecha es válida
        if (isNaN(saleDate.getTime())) return false;
        
        return saleDate >= weekRange.start && saleDate <= weekRange.end;
      } catch (e) {
        return false;
      }
    });
  }, [sales, weekRange]);

  // Filtrado de ajustes por semana
  const weeklyAdjustments = useMemo(() => {
    if (!Array.isArray(adjustments)) return [];
    
    return adjustments.filter(a => {
      try {
        const parts = a.fecha.split('/');
        if (parts.length !== 3) return false;
        const [d, m, y] = parts;
        const adjDate = new Date(Number(y), Number(m) - 1, Number(d));
        return adjDate >= weekRange.start && adjDate <= weekRange.end;
      } catch (e) {
        return false;
      }
    });
  }, [adjustments, weekRange]);

  // Agrupamiento por Vendedor con salvaguarda para datos antiguos
  const sellerCommissions = useMemo(() => {
    const report: Record<string, { 
      total: number, 
      count: number, 
      details: { type: CommissionType, qty: number, subtotal: number }[],
      entries: {
          id: string;
          fecha: string;
          vendedor: string;
          tipo: CommissionType;
          qty: number;
          subtotal: number;
          codigo: string;
          saleNumber: number;
          source: string;
          esManual: boolean;
      }[],
      adjustments: CommissionAdjustment[]
    }> = {};

    // Process Sales
    weeklySales.forEach(s => {
      const vendedorName = s.vendedor || 'Sin Vendedor';
      
      if (!report[vendedorName]) {
        report[vendedorName] = { total: 0, count: 0, details: [], entries: [], adjustments: [] };
      }

      // Helper function to process a single commissionable entry
      const processEntry = (tipo: CommissionType | undefined, qty: number, codigo: string, esManual: boolean = false, saleVariante?: string) => {
          let finalTipo = tipo;
          
          const uppercaseCode = (codigo || '').toUpperCase();
          const variantUpper = (saleVariante || '').toUpperCase();

          // Force correct type if detection is certain, regardless of saved tipoComision
          if (uppercaseCode.startsWith('L') || variantUpper.includes('LOTE')) {
             finalTipo = CommissionType.LOTE;
          } else if (variantUpper.includes('MEDIO')) {
             finalTipo = CommissionType.MEDIO_FARDO;
          }
          
          // Fallback detection for older or manually entered sales if still null
          if (!finalTipo) {
             finalTipo = CommissionType.FARDO_NORMAL;
          }

          const commValue = (dynamicCommissionValues[finalTipo as string] || 0) * qty;
          
          report[vendedorName].total += commValue;
          report[vendedorName].count += qty;

          const existingType = report[vendedorName].details.find(d => d.type === finalTipo);
          if (existingType) {
            existingType.qty += qty;
            existingType.subtotal += commValue;
          } else {
            report[vendedorName].details.push({ type: finalTipo, qty: qty, subtotal: commValue });
          }

          report[vendedorName].entries.push({
              id: `${s.id}-${codigo}`,
              fecha: s.fecha,
              vendedor: s.vendedor,
              tipo: finalTipo,
              qty: qty,
              subtotal: commValue,
              codigo: codigo,
              saleNumber: s.numeroVenta,
              source: s.tipoVenta,
              esManual: esManual
          });
      };

      if (s.items && s.items.length > 0) {
          // Multi-item sale (Nota de Venta)
          s.items.forEach(item => {
              processEntry(item.tipoComision, item.cantidad, item.codigoFardo, item.esManual || false, s.variante);
          });
      } else {
          // Individual sale
          processEntry(s.tipoComision, s.cantidad || 1, s.codigoFardo || '', s.esManual || false, s.variante);
      }
    });

    // Process Adjustments
    weeklyAdjustments.forEach(a => {
      if (!report[a.vendedor]) {
        report[a.vendedor] = { total: 0, count: 0, details: [], entries: [], adjustments: [] };
      }
      report[a.vendedor].total += a.monto;
      report[a.vendedor].adjustments.push(a);
    });

    return Object.entries(report).sort((a, b) => b[1].total - a[1].total);
  }, [weeklySales, weeklyAdjustments]);

  const totalCommissionsToPay = useMemo(() => 
    sellerCommissions.reduce((acc, [_, data]) => acc + (data.total || 0), 0)
  , [sellerCommissions]);

  const handlePrint = () => {
    window.print();
    playSound('success');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-[1400px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 no-print">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-4 shadow-lg shadow-amber-500/20">
            <Coins size={14} /> Gestión de Nómina Semanal
          </div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">Cálculo de <span className="text-amber-500 italic">Comisiones</span></h2>
          <p className="text-slate-500 font-medium italic mt-4 flex items-center gap-2">
            <Calendar size={18} className="text-slate-400" /> 
            Periodo: <span className="text-slate-900 font-black">{weekRange.start.toLocaleDateString()}</span> al <span className="text-slate-900 font-black">{weekRange.end.toLocaleDateString()}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-200 p-1.5 rounded-[24px] shadow-inner">
            <button 
              onClick={() => { setSelectedWeekOffset(-1); playSound('click'); }}
              className={`px-6 py-3 rounded-[18px] font-black text-[10px] uppercase tracking-widest transition-all ${selectedWeekOffset === -1 ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500'}`}
            >
              Semana Pasada
            </button>
            <button 
              onClick={() => { setSelectedWeekOffset(0); playSound('click'); }}
              className={`px-6 py-3 rounded-[18px] font-black text-[10px] uppercase tracking-widest transition-all ${selectedWeekOffset === 0 ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500'}`}
            >
              Esta Semana
            </button>
          </div>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-2xl active:scale-95"
          >
            <Printer size={18} /> Imprimir Nómina
          </button>
        </div>
      </div>

      {/* Adjustment Form Toggle */}
      <div className="no-print">
        <button 
          onClick={() => setShowAdjustmentForm(!showAdjustmentForm)}
          className="flex items-center gap-2 px-6 py-3 bg-red-100 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-200 transition-all"
        >
          <PlusCircle size={16} /> {showAdjustmentForm ? 'Cancelar Ajuste' : 'Agregar Descuento / Bono'}
        </button>

        {showAdjustmentForm && (
          <div className="mt-6 p-8 bg-white rounded-[32px] border-2 border-red-100 shadow-xl animate-in slide-in-from-top duration-300">
            <h3 className="text-lg font-black text-red-600 uppercase mb-6">Registrar Ajuste Manual</h3>
            <form onSubmit={handleAddAdjustment} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Vendedor</label>
                <select 
                  required
                  className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none"
                  value={newAdjustment.vendedor}
                  onChange={e => setNewAdjustment({...newAdjustment, vendedor: e.target.value})}
                >
                  <option value="">Seleccionar...</option>
                  {staff.filter(s => s.rol === 'Vendedor').map(s => (
                    <option key={s.id} value={s.nombre}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Monto (Negativo para descuento)</label>
                <input 
                  required
                  type="number" onWheel={(e) => e.currentTarget.blur()}
                  placeholder="-5000"
                  className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none"
                  value={newAdjustment.monto}
                  onChange={e => setNewAdjustment({...newAdjustment, monto: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Motivo</label>
                <input 
                  required
                  type="text"
                  placeholder="Error en despacho, Bono meta, etc."
                  className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none"
                  value={newAdjustment.motivo}
                  onChange={e => setNewAdjustment({...newAdjustment, motivo: e.target.value})}
                />
              </div>
              <button type="submit" className="py-4 bg-red-500 text-white rounded-xl font-black uppercase tracking-widest hover:bg-red-600 shadow-lg">
                Guardar Ajuste
              </button>
            </form>
          </div>
        )}
      </div>

      {/* KPI Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[56px] p-12 text-white relative overflow-hidden shadow-2xl no-print">
        <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[150%] bg-emerald-500/10 blur-[100px] rounded-full rotate-12"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="space-y-4">
            <p className="text-amber-400 text-xs font-black uppercase tracking-[0.4em]">Total a Desembolsar este Sábado</p>
            <h3 className="text-7xl font-black tracking-tighter leading-none">${(totalCommissionsToPay || 0).toLocaleString()} <span className="text-2xl text-slate-400">CLP</span></h3>
            <p className="text-slate-400 font-bold italic">Basado en {weeklySales.length} unidades procesadas.</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] backdrop-blur-md">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Ventas Brutas Periodo</p>
                <p className="text-2xl font-black">${weeklySales.reduce((acc, s) => acc + (s.total || 0), 0).toLocaleString()}</p>
             </div>
             <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] backdrop-blur-md">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Staff a Liquidar</p>
                <p className="text-2xl font-black">{sellerCommissions.length}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Listado */}
      <div className="grid grid-cols-1 gap-8 no-print">
        {sellerCommissions.map(([name, data]) => (
          <div key={name} className="bg-white rounded-[48px] border border-slate-100 shadow-xl overflow-hidden group hover:border-amber-200 transition-all">
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-1/3 p-10 bg-slate-50/50 border-r border-slate-100">
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-20 h-20 bg-slate-900 text-white rounded-[28px] flex items-center justify-center shadow-xl">
                    <User size={40} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{name}</h4>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                       <FileCheck size={14} /> Reporte Validado
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {data.details.map((d, i) => (
                    <div key={i} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase">{d.type ? d.type.split(' (')[0] : 'Normal'}</span>
                      <span className="font-black text-slate-900">x{d.qty}</span>
                    </div>
                  ))}

                  {data.adjustments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                      <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">Ajustes / Descuentos</p>
                      {data.adjustments.map(adj => (
                        <div key={adj.id} className="flex items-center justify-between bg-red-50 p-3 rounded-xl border border-red-100 group/adj">
                          <div>
                            <p className="text-[10px] font-bold text-red-800 uppercase">{adj.motivo}</p>
                            <p className="text-[9px] text-red-400">{adj.fecha}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-red-600">{adj.monto > 0 ? '+' : ''}{adj.monto.toLocaleString()}</span>
                            <button onClick={() => removeAdjustment(adj.id)} className="text-red-300 hover:text-red-600 opacity-0 group-hover/adj:opacity-100 transition-opacity">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Sábado</p>
                    <p className="text-3xl font-black text-slate-900">${(data.total || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-10">
                 <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                   <Info size={14} /> Detalle Individual de Ventas
                 </h5>
                 <div className="space-y-3 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                   {data.entries.map((entry) => (
                     <div key={entry.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-[24px] border border-transparent hover:border-slate-200 transition-all">
                       <div className="flex items-center gap-6">
                         <span className="font-mono font-black text-slate-400 text-[10px]">#{entry.saleNumber}</span>
                         <div>
                            <div className="flex items-center gap-2 mb-1">
                               <p className="text-xs font-black text-slate-900 uppercase">{stock.find(item => item.codigo === entry.codigo)?.tipo || entry.codigo}</p>
                               {entry.source === 'Nota de Venta' && (
                                 <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[8px] font-black rounded-md uppercase tracking-tighter">Nota</span>
                               )}
                               {entry.esManual ? (
                                 <span className="px-2 py-0.5 bg-red-50 text-red-400 text-[8px] font-black rounded-md uppercase tracking-tighter">Manual</span>
                               ) : (
                                 <span className="px-2 py-0.5 bg-emerald-50 text-emerald-500 text-[8px] font-black rounded-md uppercase tracking-tighter">Stock</span>
                               )}
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{entry.fecha}</p>
                         </div>
                       </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900">+ ${entry.subtotal.toLocaleString()}</p>
                          {entry.qty > 1 && <p className="text-[9px] text-slate-400 font-bold uppercase">{entry.qty} Unid. x ${(entry.subtotal / entry.qty).toLocaleString()}</p>}
                        </div>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </div>
        ))}

        {sellerCommissions.length === 0 && (
          <div className="py-40 text-center bg-white rounded-[56px] border-4 border-dashed border-slate-100">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                <BadgeDollarSign size={64} />
             </div>
             <h3 className="text-3xl font-black text-slate-300 uppercase tracking-tighter">Sin Movimientos</h3>
             <p className="text-slate-400 font-medium italic">No se han encontrado registros de comisión para esta semana.</p>
          </div>
        )}
      </div>

      {/* Print View */}
      <div className="hidden print:block p-10 bg-white">
        <h1 className="text-3xl font-black uppercase text-center mb-10 border-b-4 border-black pb-4">Nómina de Pago Semanal</h1>
        <p className="text-center font-bold mb-10 uppercase tracking-widest">Periodo: {weekRange.start.toLocaleDateString()} al {weekRange.end.toLocaleDateString()}</p>
        
        {sellerCommissions.map(([name, data]) => (
          <div key={name} className="mb-12 border-2 border-black p-8 rounded-xl page-break-inside-avoid">
             <div className="flex justify-between items-end border-b-2 border-black pb-4 mb-6">
               <h2 className="text-2xl font-black uppercase">{name}</h2>
               <div className="text-right">
                 <p className="text-xs font-bold uppercase">Monto a Liquidar:</p>
                 <p className="text-3xl font-black">${(data.total || 0).toLocaleString()}</p>
               </div>
             </div>
             <table className="w-full text-[10px]">
               <thead>
                 <tr className="border-b border-black">
                   <th className="text-left py-2 uppercase">Fecha</th>
                   <th className="text-left py-2 uppercase">Venta</th>
                   <th className="text-left py-2 uppercase">Producto</th>
                   <th className="text-right py-2 uppercase">Monto</th>
                 </tr>
               </thead>
               <tbody>
                  {data.entries.map(entry => (
                    <tr key={entry.id} className="border-b border-slate-200">
                      <td className="py-2">{entry.fecha}</td>
                      <td className="py-2">#{entry.saleNumber}</td>
                      <td className="py-2 font-bold uppercase">
                        {stock.find(item => item.codigo === entry.codigo)?.tipo || entry.codigo}
                        <span className="ml-2 text-[7px] text-slate-400">
                           ({entry.source === 'Nota de Venta' ? 'NOTA' : 'REG'}) · {entry.esManual ? 'MANUAL' : 'STOCK'}
                        </span>
                      </td>
                       <td className="py-2 text-right font-black">
                         ${entry.subtotal.toLocaleString()}
                         {entry.qty > 1 && <span className="block text-[8px] opacity-70">({entry.qty} x ${(entry.subtotal / entry.qty).toLocaleString()})</span>}
                       </td>
                    </tr>
                  ))}
                 {data.adjustments.map(adj => (
                   <tr key={adj.id} className="border-b border-red-100 bg-red-50/30">
                     <td className="py-2 text-red-600">{adj.fecha}</td>
                     <td className="py-2 text-red-600" colSpan={2}>AJUSTE: {adj.motivo}</td>
                     <td className="py-2 text-right font-black text-red-600">{adj.monto > 0 ? '+' : ''}{adj.monto.toLocaleString()}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
             <div className="mt-12 flex justify-between items-center px-10">
                <div className="w-48 border-t border-black pt-2 text-center text-[8px] font-black uppercase">Firma Vendedor</div>
                <div className="w-48 border-t border-black pt-2 text-center text-[8px] font-black uppercase">Timbre Caja / Autorizado</div>
             </div>
          </div>
        ))}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .page-break-inside-avoid { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
