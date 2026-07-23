import React, { useState } from 'react';
import { useStore } from '../store/GlobalContext';
import { StaffRole } from '../types';
import { Calendar, DollarSign, TrendingUp, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Cheques() {
  const { cheques, addCheque, markChequeAsPaid, deleteCheque, currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'paid'>('pending');
  const [fecha, setFecha] = useState('');
  const [numeroCheque, setNumeroCheque] = useState('');
  const [monto, setMonto] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'Abierto' | 'Cruzado'>('Abierto');

  const isAdmin = currentUser?.rol === StaffRole.ADMIN;

  if (!isAdmin) return <div className="p-8 text-center bg-red-50 text-red-600 font-bold rounded-3xl">Acceso denegado</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCheque({
      fecha,
      numeroCheque,
      monto: Number(monto),
      nombre,
      tipo
    });
    setFecha('');
    setNumeroCheque('');
    setMonto('');
    setNombre('');
  };

  const filteredCheques = cheques
    .filter(c => activeTab === 'pending' ? !c.pagado : c.pagado)
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  // Metrics calculation
  const pendingCheques = cheques.filter(c => !c.pagado);
  const totalPendingAmount = pendingCheques.reduce((sum, c) => sum + c.monto, 0);
  
  // Weekly Projection logic
  const getStartOfWeek = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00'); // Ensure local time
    const day = date.getDay(); 
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const weeklyProjectionsMap = new Map<string, { amount: number, count: number, date: Date }>();
  
  pendingCheques.forEach(c => {
    const monday = getStartOfWeek(c.fecha);
    const key = monday.toISOString();
    const existing = weeklyProjectionsMap.get(key) || { amount: 0, count: 0, date: monday };
    weeklyProjectionsMap.set(key, {
      amount: existing.amount + c.monto,
      count: existing.count + 1,
      date: monday
    });
  });

  const weeklyProjections = Array.from(weeklyProjectionsMap.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const formatFecha = (fecha: string) => {
    const datePart = fecha.split('T')[0].split(' ')[0];
    const [y, m, d] = datePart.split('-');
    return `${d}/${m}/${y}`;
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase">Gestión de Cheques</h1>
          <p className="text-slate-500 font-medium">Control y seguimiento de documentos bancarios</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border-2 border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
            <AlertCircle size={30} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Cheques Pendientes</p>
            <p className="text-2xl font-black text-slate-900">{pendingCheques.length} docs</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border-2 border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
            <DollarSign size={30} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Monto por Cobrar</p>
            <p className="text-2xl font-black text-slate-900">${totalPendingAmount.toLocaleString('es-CL')}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border-2 border-slate-100 shadow-sm flex items-center gap-5 lg:col-span-1">
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
            <TrendingUp size={30} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Próximo Vencimiento</p>
            <p className="text-xl font-black text-slate-900">
              {pendingCheques.length > 0 
                ? formatFecha(pendingCheques.sort((a,b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())[0].fecha)
                : 'Sin pendientes'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Input & Weekly Projections */}
        <div className="lg:col-span-1 space-y-8">
          {/* New Cheque Form */}
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[38px] border-2 border-slate-100 shadow-lg space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                <Calendar size={20} />
              </div>
              <h2 className="font-black text-xl text-slate-900 uppercase">Ingreso</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-1 block tracking-widest">Fecha de Cobro</label>
                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-amber-500 outline-none transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-1 block tracking-widest">Número de Cheque</label>
                <input type="text" placeholder="Ej: 9821332" value={numeroCheque} onChange={e => setNumeroCheque(e.target.value)} required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-amber-500 outline-none transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-1 block tracking-widest">Monto</label>
                <input type="number" placeholder="$ 0" value={monto} onChange={e => setMonto(e.target.value)} required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-amber-500 outline-none transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-1 block tracking-widest">Nombre / Beneficiario</label>
                <input type="text" placeholder="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)} required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-amber-500 outline-none transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-1 block tracking-widest">Tipo</label>
                <select value={tipo} onChange={e => setTipo(e.target.value as 'Abierto' | 'Cruzado')} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-amber-500 outline-none transition-all">
                  <option value="Abierto">Abierto</option>
                  <option value="Cruzado">Cruzado</option>
                </select>
              </div>
            </div>
            
            <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
              Ingresar Documento
            </button>
          </form>

          {/* Weekly Projections */}
          <div className="bg-white p-8 rounded-[38px] border-2 border-slate-100 shadow-sm">
            <h2 className="font-black text-lg text-slate-900 uppercase mb-6 flex items-center gap-2">
              <TrendingUp size={20} /> Proyección Semanal
            </h2>
            <div className="space-y-4">
              {weeklyProjections.length > 0 ? weeklyProjections.map((week, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm">
                      {formatShortDate(week.date)}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase">Semana {idx + 1}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{week.count} documentos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">${week.amount.toLocaleString('es-CL')}</p>
                  </div>
                </div>
              )) : (
                <p className="text-center text-slate-400 font-medium py-8 italic">No hay cobros pendientes</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Cheque List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-2 rounded-3xl border-2 border-slate-100 flex shadow-sm w-fit">
            <button 
              onClick={() => setActiveTab('pending')} 
              className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Pendientes ({pendingCheques.length})
            </button>
            <button 
              onClick={() => setActiveTab('paid')} 
              className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'paid' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Pagados
            </button>
          </div>

          <div className="bg-white rounded-[40px] border-2 border-slate-100 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento</th>
                    <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Cobro</th>
                    <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                    <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado / Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-50">
                  {filteredCheques.length > 0 ? filteredCheques.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/100 transition-colors">
                      <td className="p-6">
                        <p className="font-black text-slate-900">{c.nombre}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase"># {c.numeroCheque} • {c.tipo}</p>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2 text-slate-600 font-bold">
                          <Calendar size={14} className="text-slate-300" />
                          {formatFecha(c.fecha)}
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="text-lg font-black text-emerald-600">${c.monto.toLocaleString('es-CL')}</span>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          {!c.pagado ? (
                            <button 
                              onClick={() => markChequeAsPaid(c.id)} 
                              className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2"
                            >
                              <CheckCircle2 size={12} /> Marcar Pagado
                            </button>
                          ) : (
                            <span className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                              <CheckCircle2 size={12} /> Cobrado
                            </span>
                          )}
                          <button 
                            onClick={() => { if(confirm('¿Eliminar cheque?')) deleteCheque(c.id); }} 
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <AlertCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <CheckCircle2 size={40} className="text-slate-100" />
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay documentos en esta lista</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

