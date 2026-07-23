
import React, { useState, useRef } from 'react';
import { Search, Phone, CheckCircle2, AlertCircle, X, Save, MapPin, CreditCard, UserCheck, Tag, Info, FileEdit, BadgeDollarSign, Truck, Building2, Home, Package, Trash2, Camera } from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { SaleStatus, SaleType, Sale, DispatchType, StaffRole } from '../types';
import { Label } from '../components/Label';
import { Invoice } from '../components/Invoice';

function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const datePart = dateStr.split('T')[0].split(' ')[0];
  const parts = datePart.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  const slashParts = datePart.split('/');
  if (slashParts.length === 3) {
    if (slashParts[0].length === 4) {
      return new Date(parseInt(slashParts[0], 10), parseInt(slashParts[1], 10) - 1, parseInt(slashParts[2], 10));
    } else {
      return new Date(parseInt(slashParts[2], 10), parseInt(slashParts[1], 10) - 1, parseInt(slashParts[0], 10));
    }
  }
  return new Date(dateStr);
}

export default function Ventas() {
  const { sales, updateSale, playSound, deleteSale, deleteAllSales, currentUser, stock } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'READY' | 'CREDITS'>('PENDING');
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [printSale, setPrintSale] = useState<Sale | null>(null);
  const [printType, setPrintType] = useState<'FACTURA' | 'ETIQUETAS' | null>(null);
  const [sortKey, setSortKey] = useState<'numeroVenta' | 'fecha'>('numeroVenta');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const isAdmin = currentUser?.rol === StaffRole.ADMIN;

  const pendingLiveSales = sales.filter(s => s && !s.datosCompletos && s.tipoVenta === SaleType.LIVE && (isAdmin || s.vendedor === currentUser?.nombre));
  
  const readySales = sales.filter(s => {
    if (!s) return false;
    if (!(s.datosCompletos || s.tipoVenta === SaleType.NORMAL || s.tipoVenta === SaleType.NOTA_VENTA)) return false;
    if (!(isAdmin || s.vendedor === currentUser?.nombre)) return false;
    
    // Attempt parsing; if it fails, default to today or skip
    const d = s.fecha ? parseLocalDate(s.fecha) : new Date();
    if (isNaN(d.getTime())) return false; // Invalid date
    
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  });

  const debtorSales = sales.filter(s => {
    if (!s) return false;
    if (!(s.datosCompletos || s.tipoVenta === SaleType.NORMAL || s.tipoVenta === SaleType.NOTA_VENTA)) return false;
    if (!(isAdmin || s.vendedor === currentUser?.nombre)) return false;

    const total = s.total || 0;
    const abonado = s.montoAbonado !== undefined ? s.montoAbonado : (s.estadoPago === 'Pagado' ? total : 0);
    return s.estadoPago !== 'Pagado' || abonado < total;
  });

  const currentSales = activeTab === 'PENDING' 
    ? pendingLiveSales 
    : activeTab === 'CREDITS' 
      ? debtorSales 
      : readySales;

  const normalizeText = (text: string) => 
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredSales = currentSales
    .filter(s => {
      const normalizedSearch = normalizeText(searchTerm);
      return normalizeText(s.cliente).includes(normalizedSearch) || 
             (s.codigoFardo && normalizeText(s.codigoFardo).includes(normalizedSearch)) ||
             s.numeroVenta.toString().includes(searchTerm);
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'numeroVenta') {
        comparison = a.numeroVenta - b.numeroVenta;
      } else {
        comparison = parseLocalDate(a.fecha).getTime() - parseLocalDate(b.fecha).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSaveSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    
    // Ensure dispatch type is set, default to AGENCIA if not selected
    const finalSale = {
      ...editingSale,
      datosCompletos: true,
      status: editingSale.status === SaleStatus.PENDIENTE ? SaleStatus.PENDIENTE : editingSale.status,
      tipoDespacho: editingSale.tipoDespacho || DispatchType.AGENCIA
    };

    updateSale(editingSale.id, finalSale);
    setEditingSale(null);
    playSound('success');
  };

  const togglePaymentStatus = (sale: Sale) => {
    const isPaying = sale.estadoPago !== 'Pagado';
    const newStatus = isPaying ? 'Pagado' : 'Pendiente';
    const newAbono = isPaying ? sale.total : 0;
    updateSale(sale.id, { 
      estadoPago: newStatus,
      montoAbonado: newAbono
    });
    playSound('success');
  };

  const handlePrint = (sale: Sale, type: 'FACTURA' | 'ETIQUETAS') => {
    setPrintSale(sale);
    setPrintType(type);
  };

  React.useEffect(() => {
    if (printSale && printType) {
      console.log(`Debug print: ${printType} for ${printSale.numeroVenta}`);
      const timer = setTimeout(() => {
        window.print();
        // Clear print state after printing
        setTimeout(() => {
          setPrintSale(null);
          setPrintType(null);
        }, 1000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [printSale, printType]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="print-only">
        {printSale && printType === 'FACTURA' && (
          <div className="invoice-container">
            <Invoice sale={printSale} stock={stock} />
            {console.log("Invoice rendered")}
          </div>
        )}
        {printSale && printType === 'ETIQUETAS' && (
          (printSale.items && printSale.items.length > 0 ? printSale.items : [{codigoFardo: printSale.codigoFardo || 'N/A', cantidad: printSale.cantidad || 1}]).map((item, idx) => (
            <div key={idx} className="label-container"><Label sale={printSale} stock={stock} item={item} /></div>
          ))
        )}
      </div>
      <style>{`
          @media print {
            body { background: white !important; }
            .no-print { display: none !important; }
            .print-only, .print-only * { display: block !important; visibility: visible !important; }
            .print-only { position: absolute; left: 0; top: 0; width: 100%; }
            
            /* Reset body limits to allow printing full content without cutoff */
            body, html {
              height: auto !important;
              overflow: visible !important;
            }
            #root, #root > div, main {
              height: auto !important;
              overflow: visible !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            .label-container { width: 100mm; height: 150mm; page-break-after: always; overflow: hidden; }
            .invoice-container { 
              width: 100%; 
              padding: 15mm 20mm; 
              box-sizing: border-box; 
              page-break-after: always; 
              overflow: visible; 
            }
            @page { size: auto; margin: 0; }
          }
          
          /* Hide print-only on screen */
          @media screen {
            .print-only { display: none; }
          }
        `}</style>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 no-print">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Historial de Ventas</h2>
          <p className="text-slate-500 italic font-medium">Gestión de clientes y recolección de datos pendientes</p>
        </div>
        <div className="flex flex-wrap bg-slate-200 p-1.5 rounded-[24px] shadow-inner gap-1 sm:gap-0">
          <button 
            onClick={() => { setActiveTab('PENDING'); playSound('click'); }}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'PENDING' ? 'bg-amber-500 text-white shadow-xl' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <AlertCircle size={18} /> Pendientes Live ({pendingLiveSales.length})
          </button>
          <button 
            onClick={() => { setActiveTab('READY'); playSound('click'); }}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'READY' ? 'bg-emerald-500 text-white shadow-xl' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <CheckCircle2 size={18} /> Ventas Completas ({readySales.length})
          </button>
          <button 
            onClick={() => { setActiveTab('CREDITS'); playSound('click'); }}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'CREDITS' ? 'bg-red-500 text-white shadow-xl' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <BadgeDollarSign size={18} /> Créditos / Deudores ({debtorSales.length})
          </button>
        </div>
      </div>

      <div className="relative group no-print">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={28} />
        <input 
          type="text" 
          placeholder="Buscar por cliente, producto o número de venta..."
          className="w-full pl-16 pr-8 py-5 rounded-[32px] border-2 border-slate-100 focus:border-slate-300 outline-none transition-all shadow-sm text-xl font-bold"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {activeTab === 'READY' && (
        <div className="flex gap-4 p-4 bg-slate-50 rounded-[24px] no-print">
          <select className="px-6 py-3 rounded-xl border font-bold" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="px-6 py-3 rounded-xl border font-bold" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
            {Array.from({length: 12}).map((_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('es-ES', { month: 'long' })}</option>)}
          </select>
          <select className="px-6 py-3 rounded-xl border font-bold" value={sortKey} onChange={(e) => setSortKey(e.target.value as 'numeroVenta' | 'fecha')}>
            <option value="numeroVenta">Ordenar por Nº Venta</option>
            <option value="fecha">Ordenar por Fecha</option>
          </select>
          <button className="px-6 py-3 rounded-xl border font-bold bg-white" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
             {sortOrder === 'asc' ? 'A-Z (Asc)' : 'Z-A (Desc)'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operación / Fecha</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto / Mercadería</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Monto</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado Pago</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="group hover:bg-slate-50/80 transition-colors">
                  <td className="px-8 py-6 font-mono font-black text-slate-900 text-lg flex items-center gap-3">
                    <div className="flex flex-col">
                      <span>#{sale.numeroVenta}</span>
                      <span className="text-[10px] text-slate-500 font-bold">{parseLocalDate(sale.fecha).toLocaleDateString()}</span>
                    </div>
                    {sale.comprobante && (
                      <a href={sale.comprobante} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-700">
                        <Camera size={16} />
                      </a>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 uppercase tracking-tight">{sale.cliente}</span>
                      <a 
                        href={`https://wa.me/${sale.telefono.replace(/\D/g, '')}`} 
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-emerald-600 font-black hover:underline"
                      >
                        <Phone size={14} /> {sale.telefono}
                      </a>
                      <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">Vendedor: {sale.vendedor || 'Desconocido'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                        <Tag size={18} className="text-slate-400" />
                        <span className="font-black text-slate-700 uppercase">
                          {sale.tipoVenta === SaleType.NOTA_VENTA 
                            ? 'Nota de Venta (Varios)' 
                            : stock.find(item => item.codigo === sale.codigoFardo)?.tipo || sale.codigoFardo}
                        </span>
                      </div>
                      <span className="text-[9px] font-black text-slate-400 uppercase ml-7">
                        {sale.tipoVenta === SaleType.NOTA_VENTA 
                          ? sale.items?.map(i => i.codigoFardo).join(', ') 
                          : (sale.variante || 'Pendiente Clasificar')}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-black text-slate-900 text-2xl tracking-tighter">
                        ${sale.total.toLocaleString()}
                      </span>
                      {(sale.datosCompletos || sale.tipoVenta === SaleType.NORMAL || sale.tipoVenta === SaleType.NOTA_VENTA) && (
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1 space-y-0.5 text-right font-sans">
                          <div className="flex justify-end gap-1">
                            <span>Abonado:</span>
                            <span className="text-emerald-600">
                              ${(sale.montoAbonado !== undefined ? sale.montoAbonado : (sale.estadoPago === 'Pagado' ? sale.total : 0)).toLocaleString()}
                            </span>
                          </div>
                          {((sale.total || 0) - (sale.montoAbonado !== undefined ? sale.montoAbonado : (sale.estadoPago === 'Pagado' ? sale.total : 0))) > 0 && (
                            <div className="flex justify-end gap-1">
                              <span>Pendiente:</span>
                              <span className="text-red-500 font-extrabold">
                                ${((sale.total || 0) - (sale.montoAbonado !== undefined ? sale.montoAbonado : (sale.estadoPago === 'Pagado' ? sale.total : 0))).toLocaleString()}
                              </span>
                            </div>
                          )}
                          {(sale.medioPago || sale.estadoPago === 'Pagado') && (
                            <div className="text-[9px] text-slate-400 italic font-medium">
                              M. Pago: {sale.medioPago || 'Efectivo (Def.)'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button 
                      onClick={() => togglePaymentStatus(sale)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${sale.estadoPago === 'Pagado' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-100'}`}
                    >
                      <BadgeDollarSign size={14} /> {sale.estadoPago}
                    </button>
                  </td>
                      <td className="px-8 py-6 text-center">
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => setEditingSale(sale)}
                          className={`px-6 py-3 rounded-[18px] font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 mx-auto shadow-xl ${activeTab === 'PENDING' ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                        >
                          <FileEdit size={16} /> {activeTab === 'PENDING' ? 'Completar' : 'Editar'}
                        </button>
                        {(sale.datosCompletos || sale.tipoVenta === SaleType.NOTA_VENTA || console.log(`Debug sale: ${sale.numeroVenta}, tipoVenta: ${sale.tipoVenta}, datosCompletos: ${sale.datosCompletos}`)) && (
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => { handlePrint(sale, 'FACTURA'); }} className="text-blue-500 hover:text-blue-700">Factura</button>
                            <button onClick={() => { handlePrint(sale, 'ETIQUETAS'); }} className="text-emerald-500 hover:text-emerald-700">Etiquetas</button>
                          </div>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => { if(confirm('¿Borrar venta?')) deleteSale(sale.id); }}
                            className="mt-2 text-red-500 hover:text-red-700 block mx-auto pt-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingSale && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[56px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 bg-slate-900 text-white flex justify-between items-center relative">
              <div className="relative z-10">
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                  {editingSale.datosCompletos ? 'Editar Datos de Venta' : 'Completar Datos de Venta Live'}
                </p>
                <h3 className="text-4xl font-black uppercase tracking-tighter">
                  {editingSale.datosCompletos ? `VENTA #${editingSale.numeroVenta}` : `CLIENTE: ${editingSale.cliente}`}
                </h3>
              </div>
              <button onClick={() => setEditingSale(null)} className="relative z-10 p-3 hover:bg-white/10 rounded-full transition-colors">
                <X size={36} />
              </button>
            </div>
            
            <form onSubmit={handleSaveSale} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block flex items-center gap-2">
                    <UserCheck size={14} className="text-indigo-500" /> Nombre del Cliente
                  </label>
                  <input required type="text" className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-lg uppercase" placeholder="NOMBRE COMPLETO" value={editingSale.cliente || ''} onChange={(e) => setEditingSale({...editingSale, cliente: e.target.value.toUpperCase()})}/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block flex items-center gap-2">
                    <Phone size={14} className="text-emerald-500" /> Teléfono / WhatsApp
                  </label>
                  <input required type="text" className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-lg" placeholder="+56 9 ..." value={editingSale.telefono || ''} onChange={(e) => setEditingSale({...editingSale, telefono: e.target.value})}/>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block flex items-center gap-2">
                    <CreditCard size={14} className="text-blue-500" /> RUT Cliente
                  </label>
                  <input required type="text" className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-lg uppercase" placeholder="12.345.678-9" value={editingSale.rut || ''} onChange={(e) => setEditingSale({...editingSale, rut: e.target.value.toUpperCase()})}/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block flex items-center gap-2">
                    <Info size={14} className="text-purple-500" /> Vendedor Asignado
                  </label>
                  <input required type="text" className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-lg uppercase" placeholder="NOMBRE VENDEDOR" value={editingSale.vendedor || ''} onChange={(e) => setEditingSale({...editingSale, vendedor: e.target.value.toUpperCase()})}/>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-[28px] border-2 border-slate-100 space-y-4">
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <BadgeDollarSign size={16} className="text-blue-500" /> Control de Pago y Abonos
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Estado Pago Actual</label>
                    <select 
                      className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-[18px] font-black text-sm" 
                      value={editingSale.estadoPago} 
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setEditingSale({
                          ...editingSale, 
                          estadoPago: newStatus,
                          montoAbonado: newStatus === 'Pagado' ? (editingSale.total || 0) : (editingSale.montoAbonado || 0)
                        });
                      }}
                    >
                      <option value="Pendiente">PENDIENTE DE PAGO</option>
                      <option value="Pagado">YA PAGADO / COMPLETO</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Medio de Pago</label>
                    <select 
                      className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-[18px] font-black text-sm" 
                      value={editingSale.medioPago || 'Efectivo'} 
                      onChange={(e) => setEditingSale({ ...editingSale, medioPago: e.target.value })}
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Tarjeta">Tarjeta Débito/Crédito</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Crédito / Cuenta Corriente">Crédito / Cta. Corriente</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-sans">Abonado ($)</label>
                      <button 
                        type="button" 
                        onClick={() => setEditingSale({ ...editingSale, montoAbonado: editingSale.total || 0, estadoPago: 'Pagado' })}
                        className="text-[8px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full uppercase hover:bg-emerald-100 transition-all font-sans"
                      >
                        Totalizar
                      </button>
                    </div>
                    <input 
                      type="number" 
                      min="0"
                      max={editingSale.total || 0}
                      className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-[18px] font-black text-sm" 
                      value={editingSale.montoAbonado !== undefined ? editingSale.montoAbonado : 0} 
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setEditingSale({ 
                          ...editingSale, 
                          montoAbonado: val,
                          estadoPago: val >= (editingSale.total || 0) ? 'Pagado' : 'Pendiente'
                        });
                      }}
                    />
                  </div>
                </div>
                {((editingSale.total || 0) - (editingSale.montoAbonado || 0)) > 0 && (
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-red-500 bg-red-50/50 border border-red-100 p-2.5 rounded-xl font-sans">
                    <span>Deuda / Saldo Pendiente:</span>
                    <span>${((editingSale.total || 0) - (editingSale.montoAbonado || 0)).toLocaleString('es-CL')}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Prioridad Envío</label>
                  <select className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-lg" value={editingSale.juntaCompra} onChange={(e) => setEditingSale({...editingSale, juntaCompra: e.target.value})}>
                    <option value="DESPACHO INMEDIATO">DESPACHO INMEDIATO</option>
                    <option value="JUNTA COMPRA">JUNTA COMPRA</option>
                    <option value="RETIRO BODEGA">RETIRO BODEGA</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block flex items-center gap-2">
                  <MapPin size={14} className="text-amber-500" /> Dirección Completa Despacho
                </label>
                <textarea required className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-lg uppercase resize-y min-h-[160px]" placeholder="CALLE, N°, COMUNA, REGIÓN" value={editingSale.direccion || ''} onChange={(e) => setEditingSale({...editingSale, direccion: e.target.value.toUpperCase()})}/>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block flex items-center gap-2">
                  <Truck size={14} className="text-blue-500" /> Tipo de Entrega
                </label>
                <div className="flex bg-slate-50 p-1.5 rounded-[24px] border-2 border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setEditingSale({...editingSale, tipoDespacho: DispatchType.AGENCIA})}
                    className={`flex-1 py-3 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${editingSale.tipoDespacho === DispatchType.AGENCIA ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200'}`}
                  >
                    <Building2 size={16} /> Agencia
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingSale({...editingSale, tipoDespacho: DispatchType.DOMICILIO})}
                    className={`flex-1 py-3 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${editingSale.tipoDespacho === DispatchType.DOMICILIO ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200'}`}
                  >
                    <Home size={16} /> Domicilio
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingSale({...editingSale, tipoDespacho: DispatchType.RETIRO})}
                    className={`flex-1 py-3 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${editingSale.tipoDespacho === DispatchType.RETIRO ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200'}`}
                  >
                    <Package size={16} /> Retiro
                  </button>
                </div>
                {editingSale.tipoDespacho === DispatchType.AGENCIA && (
                  <input required type="text" className="w-full mt-4 px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black uppercase" placeholder="NOMBRE DE LA AGENCIA" value={editingSale.agencia || ''} onChange={(e) => setEditingSale({...editingSale, agencia: e.target.value.toUpperCase()})}/>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Tipo de Mercadería (Obligatorio)</label>
                  <select 
                    required 
                    className="w-full px-7 py-4 bg-blue-50 border-2 border-blue-200 text-blue-900 rounded-[24px] font-black text-lg outline-none appearance-none" 
                    value={editingSale.variante} 
                    onChange={(e) => setEditingSale({...editingSale, variante: e.target.value})}
                  >
                    <option value="">SELECCIONAR TIPO...</option>
                    <option value="UNIDAD">UNIDAD STANDARD</option>
                    <option value="CAJA">CAJA COMPLETA</option>
                    <option value="SET">SET DE PRODUCTOS</option>
                    <option value="PACK">PACK DE PRODUCTOS</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 flex gap-6">
                <button type="button" onClick={() => setEditingSale(null)} className="flex-1 py-5 border-2 border-slate-100 text-slate-400 font-black rounded-[24px] hover:bg-slate-50 transition-all uppercase tracking-widest text-xs">Cerrar</button>
                <button type="submit" className="flex-[2] py-6 bg-emerald-500 text-white font-black rounded-[24px] shadow-2xl flex items-center justify-center gap-3 text-xl hover:bg-emerald-600 transition-all active:scale-95">
                  <Save size={24} /> GUARDAR Y FINALIZAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
