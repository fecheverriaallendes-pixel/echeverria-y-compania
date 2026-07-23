
import React, { useState } from 'react';
import { 
  Send, 
  CheckCircle2, 
  Search, 
  LayoutGrid, 
  List, 
  Phone, 
  MapPin, 
  Truck,
  Package,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  Box,
  QrCode,
  Minus,
  Plus,
  Home,
  Building2,
  ArrowRight,
  Camera,
  Trash2,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { SaleStatus, Sale, DispatchType, DispatchStatus } from '../types';

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

export default function Despachos() {
  const { sales, stock, markAsSent, updateDispatchStatus, updateDispatchItems, assignCarrier, assignAgency, playSound, carriers, deleteSale } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vendedorFilter, setVendedorFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'AGENCIA' | 'DOMICILIO' | 'RETIRO' | 'HISTORIAL'>('AGENCIA');
  const [transportistaFilter, setTransportistaFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [verifyingSaleId, setVerifyingSaleId] = useState<string | null>(null);

  const allSales = sales;
  const vendedores = Array.from(new Set(sales.map(s => s.vendedor).filter(Boolean)));
  
  // Filter logic
  const filteredBase = allSales.filter(s => {
    // Date filter
    if (startDate && parseLocalDate(s.fecha) < parseLocalDate(startDate)) return false;
    if (endDate && parseLocalDate(s.fecha) > parseLocalDate(endDate)) return false;
    
    // Vendedor filter
    if (vendedorFilter && s.vendedor !== vendedorFilter) return false;

    // Search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        s.cliente.toLowerCase().includes(search) || 
        s.numeroVenta.toString().includes(search) ||
        s.codigoFardo?.toLowerCase().includes(search) ||
        (s.transportista?.toLowerCase().includes(search) ?? false) ||
        (s.agencia?.toLowerCase().includes(search) ?? false)
      );
    }
    
    return true;
  });

  const agencySales = filteredBase.filter(s => s.status === SaleStatus.PENDIENTE && s.tipoDespacho === DispatchType.AGENCIA && (s.juntaCompra === 'DESPACHO INMEDIATO' || !s.juntaCompra));
  const homeSales = filteredBase.filter(s => s.status === SaleStatus.PENDIENTE && s.tipoDespacho === DispatchType.DOMICILIO && (s.juntaCompra === 'DESPACHO INMEDIATO' || !s.juntaCompra));
  const withdrawalSales = filteredBase.filter(s => s.status === SaleStatus.PENDIENTE && (s.tipoDespacho === DispatchType.RETIRO || (s.juntaCompra && s.juntaCompra !== 'DESPACHO INMEDIATO')));
  const historySales = filteredBase.filter(s => s.status === SaleStatus.ENVIADO);
  
  let currentList = activeTab === 'AGENCIA' ? agencySales 
                    : activeTab === 'DOMICILIO' ? homeSales 
                    : activeTab === 'RETIRO' ? withdrawalSales
                    : historySales;

  if (transportistaFilter) {
      currentList = currentList.filter(s => s.transportista === transportistaFilter);
  }

  // Sorting
  currentList = [...currentList].sort((a, b) => {
    const dateA = parseLocalDate(a.fecha).getTime();
    const dateB = parseLocalDate(b.fecha).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const handleExportExcel = () => {
    import('xlsx').then(XLSX => {
      const data = currentList.map(s => ({
        "N_Venta": s.numeroVenta,
        "Cliente": s.cliente,
        "RUT": s.rut || 'N/A',
        "Direccion": s.direccion,
        "Telefono": s.telefono,
        "Producto": s.codigoFardo,
        "Cant": s.cantidad,
        "Tipo": s.tipoDespacho || 'N/A',
        "Status": s.status
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Despachos");
      XLSX.writeFile(wb, `Planilla_Despacho_${activeTab}_${new Date().toLocaleDateString()}.xlsx`);
      playSound('success');
    });
  };

  const handleIncrementItem = (sale: Sale) => {
    const current = sale.itemsDespachados || 0;
    if (current < sale.cantidad) {
      updateDispatchItems(sale.id, current + 1);
      playSound('click');
    } else {
      // Prevent over-scanning
      playSound('click'); 
    }
  };

  const handleDecrementItem = (sale: Sale) => {
    const current = sale.itemsDespachados || 0;
    if (current > 0) {
      updateDispatchItems(sale.id, current - 1);
      playSound('click');
    }
  };

  const handleConfirmDispatch = (sale: Sale) => {
    if ((sale.itemsDespachados || 0) !== sale.cantidad) {
      alert(`Error: La cantidad verificada (${sale.itemsDespachados || 0}) no coincide con la venta (${sale.cantidad}).`);
      return;
    }
    if ((sale.tipoDespacho === DispatchType.DOMICILIO || sale.tipoDespacho === DispatchType.AGENCIA) && !sale.transportista) {
      alert("Error: Debes asignar un transportista para este tipo de despacho.");
      return;
    }
    markAsSent(sale.id);
    setVerifyingSaleId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-amber-500 text-white rounded-[20px] flex items-center justify-center shadow-xl shadow-amber-500/20">
              <Truck size={28} />
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Centro Logístico</h2>
          </div>
          <p className="text-slate-500 italic ml-16 font-medium">Gestión de envíos, verificación de carga y rutas.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-3 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
          >
            <FileSpreadsheet size={18} /> Exportar Lista
          </button>
          
          <div className="flex bg-slate-200 p-1 rounded-[20px] shadow-inner">
            <button 
              onClick={() => { setViewMode('grid'); playSound('click'); }}
              className={`p-3 rounded-[16px] transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => { setViewMode('list'); playSound('click'); }}
              className={`p-3 rounded-[16px] transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-slate-200 rounded-[24px] w-full max-w-5xl mx-auto shadow-inner">
        <button 
          onClick={() => { setActiveTab('AGENCIA'); playSound('click'); }}
          className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'AGENCIA' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Building2 size={16} /> Envíos Agencia <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">{agencySales.length}</span>
        </button>
        <button 
          onClick={() => { setActiveTab('DOMICILIO'); playSound('click'); }}
          className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'DOMICILIO' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Home size={16} /> Despacho Domicilio <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">{homeSales.length}</span>
        </button>
        <button 
          onClick={() => { setActiveTab('RETIRO'); playSound('click'); }}
          className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'RETIRO' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Package size={16} /> Retiro Local / Junta Compra <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">{withdrawalSales.length}</span>
        </button>
        <button 
          onClick={() => { setActiveTab('HISTORIAL'); playSound('click'); }}
          className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'HISTORIAL' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <CheckCircle2 size={16} /> Historial
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative group flex-1 w-full">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors">
                <Search size={24} />
              </div>
              <input 
                type="text" 
                placeholder="Buscar cliente, código, transporte o agencia..."
                className="w-full pl-14 pr-6 py-4 bg-white rounded-[24px] border-2 border-slate-100 focus:border-amber-200 outline-none font-bold text-base shadow-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <div className="flex-1 lg:flex-none">
                <select 
                    className="w-full px-6 py-4 bg-white rounded-[24px] border-2 border-slate-100 font-bold text-sm outline-none"
                    value={transportistaFilter}
                    onChange={(e) => setTransportistaFilter(e.target.value)}
                >
                    <option value="">Transporte (Todos)</option>
                    {carriers.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1 lg:flex-none">
                <select 
                    className="w-full px-6 py-4 bg-white rounded-[24px] border-2 border-slate-100 font-bold text-sm outline-none"
                    value={vendedorFilter}
                    onChange={(e) => setVendedorFilter(e.target.value)}
                >
                    <option value="">Vendedor (Todos)</option>
                    {vendedores.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
        </div>

        {/* Date Ranges */}
        <div className="bg-white p-3 rounded-[32px] border-2 border-slate-100 shadow-sm flex flex-wrap items-center justify-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Desde</span>
            <input 
              type="date" 
              className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:border-amber-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="hidden md:block text-slate-200">|</div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hasta</span>
            <input 
              type="date" 
              className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:border-amber-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="hidden md:block text-slate-200">|</div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Orden</span>
            <button 
              onClick={() => {
                setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                playSound('click');
              }}
              className="group flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl hover:border-amber-500 transition-all font-bold text-[10px] uppercase tracking-widest text-slate-600"
            >
              {sortOrder === 'desc' ? (
                <>
                  <ArrowDownWideNarrow size={14} className="text-amber-500" /> Recientes primero
                </>
              ) : (
                <>
                  <ArrowUpNarrowWide size={14} className="text-amber-500" /> Antiguos primero
                </>
              )}
            </button>
          </div>
          {(startDate || endDate || vendedorFilter || searchTerm || transportistaFilter) && (
            <>
              <div className="hidden md:block text-slate-200">|</div>
              <button 
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setVendedorFilter('');
                  setSearchTerm('');
                  setTransportistaFilter('');
                  playSound('click');
                }}
                className="px-4 py-2 text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest"
              >
                Limpiar Filtros
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentList.map((sale) => (
            <div key={sale.id} className={`group bg-white rounded-[40px] border-2 ${verifyingSaleId === sale.id ? 'border-amber-400 ring-4 ring-amber-100' : 'border-slate-50'} shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col`}>
              
              {/* Card Header */}
              <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black mb-2">#{sale.numeroVenta}</span>
                    {sale.comprobante && (
                      <a href={sale.comprobante} target="_blank" rel="noreferrer" className="text-emerald-500 mb-2">
                        <Camera size={16} />
                      </a>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-500">{sale.fecha}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase ${sale.status === SaleStatus.PENDIENTE ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {sale.status}
                  </span>
                  <button 
                    onClick={() => {
                        if(confirm("¿Estás seguro de que quieres eliminar este despacho?")) {
                            deleteSale(sale.id);
                        }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
                  <p className="text-lg font-black text-slate-900 uppercase leading-tight truncate">{sale.cliente}</p>
                  <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-1">
                    <Phone size={12} /> {sale.telefono}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-[24px] border border-slate-100">
                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <MapPin size={10} /> Destino {sale.agencia && <span className="text-blue-500">| Agencia: {sale.agencia}</span>}
                  </p>
                  <p className="text-xs font-bold text-slate-700 uppercase leading-snug">
                    {sale.direccion || 'RETIRO EN TIENDA'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contenido</p>
                  <div className="flex items-center justify-between bg-white border-2 border-slate-100 p-3 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{stock.find(item => item.codigo === sale.codigoFardo)?.tipo || sale.codigoFardo}</p>
                        <p className="text-[10px] text-slate-500 font-bold">CANT: {sale.cantidad}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Section */}
                {verifyingSaleId === sale.id && sale.status === SaleStatus.PENDIENTE && (
                  <div className="bg-amber-50 p-4 rounded-[24px] border-2 border-amber-100 animate-in zoom-in duration-300">
                    {sale.tipoDespacho === DispatchType.RETIRO || (sale.juntaCompra && sale.juntaCompra !== 'DESPACHO INMEDIATO') ? (
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest text-center mb-3">Verificación para Retiro</p>
                    ) : (
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest text-center mb-3">Verificación para Envío</p>
                    )}
                    
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <button 
                        onClick={() => handleDecrementItem(sale)}
                        className="w-10 h-10 bg-white rounded-full shadow-sm border border-amber-200 flex items-center justify-center text-amber-600 hover:bg-amber-100 active:scale-90 transition-all"
                      >
                        <Minus size={20} />
                      </button>
                      <div className="text-center">
                        <span className={`text-3xl font-black ${sale.itemsDespachados === sale.cantidad ? 'text-emerald-500' : 'text-slate-900'}`}>
                          {sale.itemsDespachados || 0}
                        </span>
                        <span className="text-sm font-bold text-slate-400"> / {sale.cantidad}</span>
                      </div>
                      <button 
                        onClick={() => handleIncrementItem(sale)}
                        className="w-10 h-10 bg-white rounded-full shadow-sm border border-amber-200 flex items-center justify-center text-amber-600 hover:bg-amber-100 active:scale-90 transition-all"
                      >
                        <Plus size={20} />
                      </button>
                    </div>

                    {sale.itemsDespachados === sale.cantidad ? (
                      <div className="text-center text-[10px] font-black text-emerald-600 bg-emerald-100 py-2 rounded-xl mb-3 animate-pulse">
                        ¡CANTIDAD VERIFICADA!
                      </div>
                    ) : (sale.itemsDespachados || 0) > sale.cantidad ? (
                      <div className="text-center text-[10px] font-black text-red-600 bg-red-100 py-2 rounded-xl mb-3">
                        ¡EXCESO DE ITEMS!
                      </div>
                    ) : (
                      <div className="text-center text-[10px] font-bold text-amber-600/70 mb-3">
                        Confirma los productos físicamente
                      </div>
                    )}

                    {sale.tipoDespacho === DispatchType.DOMICILIO && (
                      <div className="mb-4">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest text-center mb-2">Asignar Transportista</p>
                        <select 
                          className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-amber-400"
                          value={sale.transportista || ''}
                          onChange={(e) => assignCarrier(sale.id, e.target.value)}
                        >
                          <option value="">Seleccionar Transportista...</option>
                          {carriers.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {sale.tipoDespacho === DispatchType.AGENCIA && (
                      <div className="mb-4 space-y-4">
                        <div>
                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest text-center mb-2">Nombre de Agencia</p>
                          <input 
                            type="text"
                            className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-amber-400"
                            placeholder="Nombre de la agencia..."
                            value={sale.agencia || ''}
                            onChange={(e) => assignAgency(sale.id, e.target.value)}
                          />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest text-center mb-2">Transporte a Agencia</p>
                          <select 
                            className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-amber-400"
                            value={sale.transportista || ''}
                            onChange={(e) => assignCarrier(sale.id, e.target.value)}
                          >
                            <option value="">Seleccionar Transportista...</option>
                            {carriers.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={() => handleConfirmDispatch(sale)}
                      disabled={(sale.itemsDespachados || 0) !== sale.cantidad || ((sale.tipoDespacho === DispatchType.DOMICILIO || sale.tipoDespacho === DispatchType.AGENCIA) && !sale.transportista)}
                      className="w-full py-3 bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      {sale.tipoDespacho === DispatchType.RETIRO || (sale.juntaCompra && sale.juntaCompra !== 'DESPACHO INMEDIATO') ? 'Confirmar Retiro' : 'Confirmar Salida'}
                    </button>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="p-6 bg-slate-50/50 mt-auto border-t border-slate-100">
                {sale.status === SaleStatus.PENDIENTE ? (
                  verifyingSaleId !== sale.id ? (
                    <button 
                      onClick={() => { setVerifyingSaleId(sale.id); playSound('click'); }}
                      className="w-full py-4 bg-slate-900 text-white rounded-[24px] text-xs font-black hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
                    >
                      <QrCode size={16} /> PREPARAR ENVÍO
                    </button>
                  ) : (
                    <button 
                      onClick={() => setVerifyingSaleId(null)}
                      className="w-full py-3 text-slate-400 font-bold text-xs hover:text-slate-600"
                    >
                      Cancelar Verificación
                    </button>
                  )
                ) : (
                  <div className="w-full py-4 bg-emerald-100 text-emerald-600 rounded-[24px] text-xs font-black flex items-center justify-center gap-2 uppercase tracking-widest">
                    <CheckCircle2 size={16} /> Completado
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Venta</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Destino</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Items</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Entrega</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transportista/Agencia</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentList.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-6 font-mono font-bold text-slate-600 flex items-center gap-2">#{sale.numeroVenta}</td>
                    <td className="px-8 py-6 font-bold text-slate-900">{sale.cliente}</td>
                    <td className="px-8 py-6 text-xs text-slate-500 uppercase max-w-xs truncate">{sale.direccion}</td>
                    <td className="px-8 py-6 font-bold text-slate-700">{sale.cantidad} x {stock.find(item => item.codigo === sale.codigoFardo)?.tipo || sale.codigoFardo}</td>
                    <td className="px-8 py-6 text-xs text-slate-600 font-bold">{sale.fechaDespacho ? new Date(sale.fechaDespacho).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-8 py-6 text-xs text-slate-700 font-bold">{sale.transportista || sale.agencia || 'N/A'}</td>
                    <td className="px-8 py-6 text-right">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${sale.status === SaleStatus.PENDIENTE ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {currentList.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-6">
            <Box size={40} />
          </div>
          <h3 className="text-2xl font-black text-slate-300 uppercase tracking-tight">Sin Movimientos</h3>
          <p className="text-slate-400 font-medium mt-2">No hay despachos pendientes en esta categoría.</p>
        </div>
      )}
    </div>
  );
}
