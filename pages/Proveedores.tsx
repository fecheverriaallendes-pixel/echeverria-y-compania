
import React, { useState } from 'react';
import { 
  Wallet, 
  PlusCircle, 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  X, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Info,
  CreditCard,
  Container,
  FileText,
  BadgeDollarSign,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { PurchaseType, Purchase } from '../types';

export default function Proveedores() {
  const { purchases, addPurchase, removePurchase, addAbono, removeAbono, playSound } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [showAbonoForm, setShowAbonoForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [newPurchase, setNewPurchase] = useState({
    proveedor: '',
    tipo: PurchaseType.NOTA_VENTA,
    descripcion: '',
    montoTotal: 0,
    fecha: new Date().toLocaleDateString()
  });

  const [newAbono, setNewAbono] = useState({
    monto: 0,
    metodo: 'Transferencia',
    observacion: ''
  });

  const handleAddPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    addPurchase(newPurchase);
    setShowAdd(false);
    setNewPurchase({
      proveedor: '', tipo: PurchaseType.NOTA_VENTA, descripcion: '', montoTotal: 0, fecha: new Date().toLocaleDateString()
    });
    playSound('success');
  };

  const handleRemovePurchase = (id: string, proveedor: string) => {
    if (confirm(`⚠️ ¿Estás seguro de eliminar la compra de ${proveedor}? Esto también borrará todos sus abonos asociados.`)) {
      removePurchase(id);
      playSound('click');
    }
  };

  const handleAddAbono = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchase) return;
    addAbono(selectedPurchase.id, newAbono.monto, newAbono.metodo, newAbono.observacion);
    setShowAbonoForm(false);
    setSelectedPurchase(null);
    setNewAbono({ monto: 0, metodo: 'Transferencia', observacion: '' });
    playSound('success');
  };

  const handleRemoveAbono = (purchaseId: string, abonoId: string) => {
    if (confirm("¿Estás seguro de eliminar este abono? El saldo pendiente se restaurará automáticamente.")) {
      removeAbono(purchaseId, abonoId);
      // Actualizar la vista del modal si está abierto
      const updated = purchases.find(p => p.id === purchaseId);
      if (updated) setSelectedPurchase(updated);
      playSound('click');
    }
  };

  const filteredPurchases = purchases.filter(p => 
    p.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deudaTotal = purchases.reduce((acc, p) => acc + p.saldoPendiente, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Finanzas Proveedores</h2>
          <p className="text-slate-500 font-medium italic">Control de deudas, Notas de Venta y Contenedores</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-2xl active:scale-95"
        >
          <PlusCircle size={20} /> Registrar Nueva Compra
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Deuda Total Pendiente</p>
          <h3 className="text-4xl font-black text-slate-900 tracking-tighter">${deudaTotal.toLocaleString()}</h3>
          <p className="text-[10px] text-red-500 font-bold uppercase mt-4">Requiere atención semanal</p>
        </div>
        <div className="bg-emerald-500 p-8 rounded-[40px] text-white flex flex-col justify-between shadow-xl shadow-emerald-500/20">
          <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-2">Compras este Mes</p>
          <h3 className="text-4xl font-black tracking-tighter">{purchases.length} Operaciones</h3>
          <p className="text-[10px] text-emerald-100 font-bold uppercase mt-4">Fujo de mercadería activo</p>
        </div>
        <div className="bg-slate-900 p-8 rounded-[40px] text-white flex flex-col justify-between shadow-2xl">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contenedores en Tránsito</p>
          <h3 className="text-4xl font-black tracking-tighter">{purchases.filter(p => p.tipo === PurchaseType.CONTENEDOR && p.estado === 'PENDIENTE').length} Pendientes</h3>
          <p className="text-[10px] text-emerald-400 font-bold uppercase mt-4">Inversión de alto volumen</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={24} />
        <input 
          type="text" 
          placeholder="Buscar por proveedor o descripción de compra..."
          className="w-full pl-16 pr-8 py-5 rounded-[32px] border-2 border-slate-100 focus:border-slate-300 outline-none transition-all shadow-sm text-lg font-bold"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Listado de Compras */}
      <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proveedor / Tipo</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción Operación</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Monto Total</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo Pendiente</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.map((p) => (
                <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 uppercase tracking-tight">{p.proveedor}</span>
                      <span className={`flex items-center gap-1.5 text-[9px] font-black uppercase mt-1 ${p.tipo === PurchaseType.CONTENEDOR ? 'text-blue-600' : 'text-amber-600'}`}>
                        {p.tipo === PurchaseType.CONTENEDOR ? <Container size={12} /> : <FileText size={12} />} {p.tipo}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-bold text-slate-500 uppercase italic line-clamp-1">{p.descripcion}</p>
                    <p className="text-[9px] font-black text-slate-300 mt-1 uppercase">REGISTRADO: {p.fecha}</p>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-slate-400 text-sm">
                    ${p.montoTotal.toLocaleString()}
                  </td>
                  <td className="px-8 py-6 text-right font-black text-slate-900 text-xl tracking-tighter">
                    ${p.saldoPendiente.toLocaleString()}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${p.estado === 'PAGADO' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-50 text-red-600 animate-pulse'}`}>
                      {p.estado === 'PAGADO' ? <CheckCircle2 size={12} /> : <Clock size={12} />} {p.estado}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                       <button 
                        onClick={() => setSelectedPurchase(p)}
                        title="Ver Historial"
                        className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                      >
                        <History size={18} />
                      </button>
                      {p.estado === 'PENDIENTE' && (
                        <button 
                          onClick={() => { setSelectedPurchase(p); setShowAbonoForm(true); }}
                          className="px-4 py-3 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg"
                        >
                          ABONAR
                        </button>
                      )}
                      <button 
                        onClick={() => handleRemovePurchase(p.id, p.proveedor)}
                        title="Eliminar Compra"
                        className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Compra */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[56px] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Registro de Pasivos</p>
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">Nueva Compra</h3>
              </div>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={32} /></button>
            </div>
            <form onSubmit={handleAddPurchase} className="p-10 space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-4">Proveedor</label>
                <input required type="text" className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black uppercase outline-none focus:border-blue-400" placeholder="NOMBRE PROVEEDOR" value={newPurchase.proveedor} onChange={(e) => setNewPurchase({...newPurchase, proveedor: e.target.value.toUpperCase()})}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-4">Tipo de Compra</label>
                  <select className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black outline-none" value={newPurchase.tipo} onChange={(e) => setNewPurchase({...newPurchase, tipo: e.target.value as PurchaseType})}>
                    <option value={PurchaseType.NOTA_VENTA}>NOTA DE VENTA</option>
                    <option value={PurchaseType.CONTENEDOR}>CONTENEDOR CERRADO</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-4">Fecha</label>
                  <input required type="text" className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black outline-none" value={newPurchase.fecha} readOnly />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-4">Descripción / Observaciones</label>
                <textarea className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold italic outline-none min-h-[100px]" placeholder="Ej: Pago 20 fardos premium de invierno..." value={newPurchase.descripcion} onChange={(e) => setNewPurchase({...newPurchase, descripcion: e.target.value})}/>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-4">Monto Total Pactado ($)</label>
                <input required type="number" onWheel={(e) => e.currentTarget.blur()} className="w-full px-8 py-5 bg-slate-900 text-emerald-400 text-3xl font-black rounded-3xl outline-none" placeholder="0" value={newPurchase.montoTotal || ''} onChange={(e) => setNewPurchase({...newPurchase, montoTotal: Number(e.target.value)})}/>
              </div>
              <button type="submit" className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black text-xl shadow-2xl hover:bg-blue-700 transition-all active:scale-95">REGISTRAR EN CUENTAS POR PAGAR</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle / Historial de Abonos */}
      {selectedPurchase && !showAbonoForm && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[56px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <p className="text-amber-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Historial de Transacciones</p>
                <h3 className="text-3xl font-black uppercase tracking-tighter">{selectedPurchase.proveedor}</h3>
              </div>
              <button onClick={() => setSelectedPurchase(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={32} /></button>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto Inicial</p>
                  <p className="text-2xl font-black text-slate-900">${selectedPurchase.montoTotal.toLocaleString()}</p>
                </div>
                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Pagado a la Fecha</p>
                  <p className="text-2xl font-black text-emerald-600">${(selectedPurchase.montoTotal - selectedPurchase.saldoPendiente).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <History size={16} /> Detalle de Abonos realizados
                </h4>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {selectedPurchase.abonos.map((abono) => (
                    <div key={abono.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-3xl group">
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase">{abono.metodo}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{abono.fecha}</p>
                        {abono.observacion && <p className="text-[10px] italic text-slate-500 mt-1">"{abono.observacion}"</p>}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-black text-emerald-600">+ ${abono.monto.toLocaleString()}</p>
                        </div>
                        <button 
                          onClick={() => handleRemoveAbono(selectedPurchase.id, abono.id)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="Eliminar Abono"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {selectedPurchase.abonos.length === 0 && (
                    <div className="text-center py-10 opacity-30 italic font-medium">No hay abonos registrados para esta compra.</div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t flex justify-between items-center">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Restante</p>
                    <p className="text-4xl font-black text-red-600">${selectedPurchase.saldoPendiente.toLocaleString()}</p>
                 </div>
                 {selectedPurchase.estado === 'PENDIENTE' && (
                    <button 
                      onClick={() => setShowAbonoForm(true)}
                      className="px-8 py-5 bg-emerald-500 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-emerald-600 transition-all"
                    >
                      REALIZAR ABONO
                    </button>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Realizar Abono */}
      {showAbonoForm && (
        <div className="fixed inset-0 bg-slate-900/98 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[56px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 bg-emerald-600 text-white flex justify-between items-center">
              <div>
                <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Confirmación de Pago</p>
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">Abonar a Deuda</h3>
              </div>
              <button onClick={() => setShowAbonoForm(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={32} /></button>
            </div>
            <form onSubmit={handleAddAbono} className="p-10 space-y-6">
              <div className="bg-emerald-50 p-6 rounded-3xl text-center border-2 border-dashed border-emerald-200">
                <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Saldo Actual a Pagar</p>
                <p className="text-4xl font-black text-emerald-700">${selectedPurchase?.saldoPendiente.toLocaleString()}</p>
              </div>
              
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-4">Monto del Abono ($)</label>
                <input required type="number" max={selectedPurchase?.saldoPendiente} className="w-full px-8 py-6 bg-slate-100 border-2 border-emerald-100 rounded-3xl text-4xl font-black text-center outline-none focus:border-emerald-500" placeholder="0" value={newAbono.monto || ''} onChange={(e) => setNewAbono({...newAbono, monto: Number(e.target.value)})}/>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-4">Método de Pago</label>
                <select className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black outline-none" value={newAbono.metodo} onChange={(e) => setNewAbono({...newAbono, metodo: e.target.value})}>
                  <option value="Transferencia">TRANSFERENCIA BANCARIA</option>
                  <option value="Efectivo">EFECTIVO / CAJA</option>
                  <option value="Cheque">CHEQUE</option>
                  <option value="Crédito">CRÉDITO PROVEEDOR</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-4">Observación</label>
                <input type="text" className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold italic outline-none" placeholder="Ej: Pago parcial fardo polerones..." value={newAbono.observacion} onChange={(e) => setNewAbono({...newAbono, observacion: e.target.value})}/>
              </div>

              <button type="submit" className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black text-xl shadow-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                <BadgeDollarSign size={24} /> REGISTRAR ABONO
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
