
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Zap, ClipboardList, CheckCircle2, User, Phone, DollarSign, Package, MapPin, Tag, Truck, CreditCard, FileText, ChevronRight, Coins, Building2, Home } from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { SaleType, SaleStatus, StaffRole, CommissionType, DispatchType } from '../types';

export default function RegistrarVenta() {
  const { stock, staff, customers, addSale, playSound } = useStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'QUICK' | 'NORMAL' | 'NOTA_VENTA'>('QUICK');
  const [success, setSuccess] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [items, setItems] = useState<{codigoFardo: string, cantidad: number, valorUnitario: number, esManual?: boolean, tipoComision?: CommissionType}[]>([]);
  const [newItem, setNewItem] = useState({codigoFardo: '', cantidad: 1, valorUnitario: 0, esManual: false, tipoComision: CommissionType.FARDO_NORMAL});
  
  const vendedores = staff.filter(m => m.rol === StaffRole.VENDEDOR);
  const quickNameRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<{
    cliente: string;
    vendedor: string;
    telefono: string;
    rut: string;
    codigoFardo: string;
    esManual: boolean;
    variante: string;
    valorUnitario: number;
    cantidad: number;
    direccion: string;
    estadoPago: string;
    tipoComision: CommissionType;
    juntaCompra: string;
    observaciones: string;
    tipoDespacho?: DispatchType;
    agencia?: string;
  }>({
    cliente: '',
    vendedor: '',
    telefono: '',
    rut: '',
    codigoFardo: '',
    esManual: true,
    variante: '', // Se completará después en ventas rápidas
    valorUnitario: 0,
    cantidad: 1,
    direccion: '',
    estadoPago: 'Pendiente',
    tipoComision: CommissionType.FARDO_NORMAL,
    juntaCompra: 'DESPACHO INMEDIATO',
    observaciones: '',
    tipoDespacho: undefined,
    agencia: ''
  });

  const handleClientChange = (name: string) => {
      setFormData(prev => ({...prev, cliente: name.toUpperCase()}));
      const found = customers.find(c => c.nombre.toLowerCase() === name.toLowerCase());
      if (found) {
          setFormData(prev => ({
              ...prev,
              telefono: found.telefono,
              rut: found.rut || '',
              direccion: found.direccion || ''
          }));
      }
  };

    const handleItemCodeChange = (code: string, isNotaVenta: boolean) => {
    const uppercaseCode = code.toUpperCase();
    const foundItem = stock.find(s => s.codigo === uppercaseCode);
    const price = foundItem ? foundItem.precioSugerido : 0;
    const esManual = !foundItem;
    
    // Determine commission type correctly
    let newCommissionType = CommissionType.FARDO_NORMAL;
    if (foundItem) {
        if (foundItem.categoria === 'LOTE' || foundItem.unidad === 'LOTE') {
            newCommissionType = CommissionType.LOTE;
        } else if (foundItem.unidad === 'MEDIO FARDO') {
            newCommissionType = CommissionType.MEDIO_FARDO;
        } else if (foundItem.promocion) {
            newCommissionType = CommissionType.FARDO_PROMO;
        }
    } else if (uppercaseCode.startsWith('L')) {
        newCommissionType = CommissionType.LOTE;
    }
    
    if (isNotaVenta) {
      setNewItem(prev => ({...prev, codigoFardo: uppercaseCode, valorUnitario: price, tipoComision: newCommissionType, esManual}));
    } else {
      setFormData(prev => ({
          ...prev, 
          codigoFardo: uppercaseCode, 
          valorUnitario: price,
          tipoComision: newCommissionType,
          esManual
      }));
    }
  };

  const calculatedTotal = mode === 'NOTA_VENTA' 
    ? items.reduce((acc, item) => acc + item.valorUnitario * item.cantidad, 0)
    : (formData.valorUnitario * (formData.cantidad || 1));

  useEffect(() => {
    if (mode === 'QUICK') quickNameRef.current?.focus();
  }, [mode, success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isQuick = mode === 'QUICK';
    const isNotaVenta = mode === 'NOTA_VENTA';
    
    if (isNotaVenta) {
      if (items.length === 0) {
        alert("⚠️ Por favor agrega al menos un producto a la lista antes de registrar la nota de venta.");
        return;
      }
      for (const item of items) {
        const foundStockItem = stock.find(s => s.codigo === item.codigoFardo.trim().toUpperCase());
        if (foundStockItem) {
          if (foundStockItem.stockActual <= 0) {
            alert(`⚠️ Error: El producto ${foundStockItem.codigo} está agotado (Stock actual: ${foundStockItem.stockActual}). No se puede registrar la venta.`);
            return;
          }
          if (foundStockItem.stockActual < item.cantidad) {
            alert(`⚠️ Error: El producto ${foundStockItem.codigo} no tiene stock suficiente (Stock actual: ${foundStockItem.stockActual}, Solicitado: ${item.cantidad}). No se puede registrar la venta.`);
            return;
          }
        }
      }
    } else {
      const selectedStockItem = formData.codigoFardo ? stock.find(s => s.codigo === formData.codigoFardo.trim().toUpperCase()) : null;
      if (selectedStockItem) {
        if (selectedStockItem.stockActual <= 0) {
          alert(`⚠️ Error: El producto ${selectedStockItem.codigo} está agotado (Stock actual: ${selectedStockItem.stockActual}). No se puede registrar la venta.`);
          return;
        }
        if (selectedStockItem.stockActual < (formData.cantidad || 1)) {
          alert(`⚠️ Error: El producto ${selectedStockItem.codigo} no tiene stock suficiente (Stock actual: ${selectedStockItem.stockActual}, Solicitado: ${formData.cantidad || 1}). No se puede registrar la venta.`);
          return;
        }
      }
    }
    
    const finalData = {
      ...formData,
      tipoVenta: isQuick ? SaleType.LIVE : isNotaVenta ? SaleType.NOTA_VENTA : SaleType.NORMAL,
      items: isNotaVenta ? items : undefined,
      total: isNotaVenta ? items.reduce((acc, item) => acc + item.valorUnitario * item.cantidad, 0) : formData.valorUnitario * formData.cantidad,
      status: SaleStatus.PENDIENTE,
      datosCompletos: !isQuick,
      variante: isQuick ? '' : formData.variante, 
      tipoDespacho: isQuick ? undefined : (formData.tipoDespacho || DispatchType.AGENCIA),
      agencia: isQuick ? undefined : formData.agencia
    };

    console.log("Final data to be saved:", finalData);
    console.log("Items to be saved:", items);

    await addSale(finalData);
    setSuccess(true);
    playSound('success');
    
    setFormData({
      cliente: '', vendedor: formData.vendedor, telefono: '', rut: '',
      codigoFardo: '', esManual: true, variante: isQuick ? '' : 'Estándar', valorUnitario: 0, cantidad: 1,
      direccion: '', estadoPago: 'Pendiente', tipoComision: CommissionType.FARDO_NORMAL,
      juntaCompra: 'DESPACHO INMEDIATO', observaciones: '', tipoDespacho: undefined
    });
    setItems([]);
    setNewItem({codigoFardo: '', cantidad: 1, valorUnitario: 0, esManual: false, tipoComision: CommissionType.FARDO_NORMAL});
    
    setTimeout(() => setSuccess(false), 2000);
  };

  const selectedStockItem = formData.codigoFardo ? stock.find(s => s.codigo === formData.codigoFardo.trim().toUpperCase()) : null;
  const selectedNewItemStock = newItem.codigoFardo ? stock.find(s => s.codigo === newItem.codigoFardo.trim().toUpperCase()) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Terminal de Ventas</h2>
          <p className="text-slate-500 font-medium italic">Selecciona el flujo operativo Echeverria & Co.</p>
        </div>
        <div className="flex bg-slate-200 p-1.5 rounded-[24px] shadow-inner w-full sm:w-auto">
          <button 
            onClick={() => { setMode('QUICK'); playSound('click'); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${mode === 'QUICK' ? 'bg-emerald-500 text-white shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <Zap size={20} /> Modo Live
          </button>
          <button 
            onClick={() => { setMode('NORMAL'); playSound('click'); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${mode === 'NORMAL' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <ClipboardList size={20} /> Venta Normal
          </button>
          <button 
            onClick={() => { setMode('NOTA_VENTA'); playSound('click'); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${mode === 'NOTA_VENTA' ? 'bg-amber-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <FileText size={20} /> Nota de Venta
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-500 text-white px-8 py-6 rounded-[32px] flex items-center gap-4 animate-bounce shadow-2xl shadow-emerald-500/30">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><CheckCircle2 size={32} /></div>
          <div>
            <p className="font-black text-xl uppercase italic">¡Operación Exitosa!</p>
            <p className="text-emerald-100 text-sm font-bold">Venta registrada en el sistema central.</p>
          </div>
        </div>
      )}

      <div className={`bg-white rounded-[48px] border-2 transition-all shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] overflow-hidden ${mode === 'QUICK' ? 'border-emerald-100' : 'border-blue-100'}`}>
        <div className={`p-8 border-b flex items-center justify-between ${mode === 'QUICK' ? 'bg-emerald-50/30 border-emerald-100' : 'bg-blue-50/30 border-blue-100'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${mode === 'QUICK' ? 'bg-emerald-500' : 'bg-blue-600'}`}>
              {mode === 'QUICK' ? <Zap size={24} /> : <FileText size={24} />}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase">{mode === 'QUICK' ? 'Captura Rápida TikTok' : 'Venta con Detalle Completo'}</h3>
              <p className="text-slate-500 text-xs font-medium italic">{mode === 'QUICK' ? 'Campos mínimos para fluidez del Live' : 'Información completa para logística y facturación'}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">
                <User size={14} className="text-blue-500" /> Cliente
              </label>
              <input ref={quickNameRef} required list="customers-suggestions" type="text" className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] text-xl font-black focus:border-blue-500 outline-none transition-all uppercase" placeholder="NOMBRE" value={formData.cliente} onChange={(e) => handleClientChange(e.target.value)}/>
              <datalist id="customers-suggestions">
                  {customers.map(c => <option key={c.id} value={c.nombre} />)}
              </datalist>
            </div>
            
            <div className="md:col-span-1">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">
                <Phone size={14} className="text-emerald-500" /> WhatsApp
              </label>
              <input required type="tel" className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] text-xl font-black focus:border-emerald-500 outline-none transition-all" placeholder="+569..." value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})}/>
            </div>

            <div className="md:col-span-1">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Vendedor</label>
              <select required className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] text-lg font-black focus:border-slate-900 outline-none transition-all appearance-none" value={formData.vendedor} onChange={(e) => setFormData({...formData, vendedor: e.target.value})}>
                <option value="">ELEGIR...</option>
                {vendedores.map(v => ( <option key={v.id} value={v.nombre}>{v.nombre}</option> ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-1">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2"><CreditCard size={14} className="text-blue-500" /> RUT Cliente</label>
              <input required type="text" className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-lg" placeholder="12.345.678-9" value={formData.rut} onChange={(e) => setFormData({...formData, rut: e.target.value})}/>
            </div>
            <div className="md:col-span-1">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2"><MapPin size={14} className="text-blue-500" /> Dirección Despacho</label>
              <textarea required className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-lg uppercase resize-none h-24" placeholder="CALLE, NÚMERO, DEPTO/OFICINA, COMUNA, CIUDAD" value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value.toUpperCase()})}/>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="relative">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-4"><Package size={18} className="text-blue-500" /> {mode === 'NOTA_VENTA' ? 'Agregar Producto' : 'Código de Producto'}</label>
              
              {mode === 'NOTA_VENTA' ? (
                <div>
                  <div className="flex flex-wrap gap-2">
                      <input list="stock-suggestions" type="text" className="w-[120px] px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-[20px] font-black outline-none" placeholder="CODIGO" value={newItem.codigoFardo} onChange={(e) => handleItemCodeChange(e.target.value, true)}/>
                      <input type="number" className="w-16 px-2 py-4 bg-slate-50 border-2 border-slate-100 rounded-[20px] font-black outline-none" placeholder="CANT" value={newItem.cantidad} onChange={(e) => setNewItem({...newItem, cantidad: Number(e.target.value)})}/>
                      <input type="number" className="w-24 px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-[20px] font-black outline-none" placeholder="VALOR" value={newItem.valorUnitario} onChange={(e) => setNewItem({...newItem, valorUnitario: Number(e.target.value)})}/>
                      <select className="px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-[20px] font-black outline-none text-[10px]" value={newItem.tipoComision} onChange={(e) => setNewItem({...newItem, tipoComision: e.target.value as CommissionType})}>
                          <option value={CommissionType.FARDO_NORMAL}>ESTÁNDAR</option>
                          <option value={CommissionType.FARDO_PROMO}>PROMO</option>
                          <option value={CommissionType.MEDIO_FARDO}>ESPECIAL</option>
                          <option value={CommissionType.LOTE}>MAYORISTA</option>
                      </select>
                      <button type="button" onClick={() => { 
                          if(newItem.codigoFardo && newItem.cantidad > 0 && newItem.valorUnitario > 0) {
                              const foundStockItem = stock.find(s => s.codigo === newItem.codigoFardo.trim().toUpperCase());
                              if (foundStockItem) {
                                  if (foundStockItem.stockActual <= 0) {
                                      alert(`⚠️ Error: El producto ${foundStockItem.codigo} está agotado (Stock actual: ${foundStockItem.stockActual}). No se puede agregar.`);
                                      return;
                                  }
                                  if (foundStockItem.stockActual < newItem.cantidad) {
                                      alert(`⚠️ Error: El producto ${foundStockItem.codigo} no tiene stock suficiente (Stock actual: ${foundStockItem.stockActual}, Solicitado: ${newItem.cantidad}). No se puede agregar.`);
                                      return;
                                  }
                              }
                              setItems([...items, newItem]);
                              setNewItem({codigoFardo: '', cantidad: 1, valorUnitario: 0, esManual: false, tipoComision: CommissionType.FARDO_NORMAL});
                          }
                      }} className="bg-amber-600 text-white rounded-2xl px-4">+</button>
                  </div>
                  {selectedNewItemStock && (
                    <div className="mt-3 text-[10px] font-black uppercase tracking-wider">
                      {selectedNewItemStock.stockActual <= 0 ? (
                        <span className="text-red-500 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg inline-block">
                          ⚠️ ¡Agotado! (Stock: {selectedNewItemStock.stockActual} {selectedNewItemStock.unidad}s)
                        </span>
                      ) : selectedNewItemStock.stockActual < 3 ? (
                        <span className="text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg inline-block">
                          ⚠️ Stock bajo: solo quedan {selectedNewItemStock.stockActual} {selectedNewItemStock.unidad}s
                        </span>
                      ) : (
                        <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg inline-block">
                          ✅ Stock disponible: {selectedNewItemStock.stockActual} {selectedNewItemStock.unidad}s
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                      <input required list="stock-suggestions" type="text" className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[28px] text-2xl font-black focus:border-blue-500 outline-none transition-all uppercase" placeholder="CÓDIGO (Ej: EC-001)" value={formData.codigoFardo} onChange={(e) => handleItemCodeChange(e.target.value, false)}/>
                      <input required type="number" className="w-32 px-4 py-6 bg-slate-50 border-2 border-slate-100 rounded-[28px] text-xl font-black outline-none transition-all" placeholder="VALOR" value={formData.valorUnitario || ''} onChange={(e) => setFormData({...formData, valorUnitario: Number(e.target.value)})}/>
                  </div>
                  {selectedStockItem && (
                    <div className="mt-3 text-[11px] font-black uppercase tracking-wider">
                      {selectedStockItem.stockActual <= 0 ? (
                        <span className="text-red-500 bg-red-50 border border-red-100 px-3 py-1.5 rounded-xl inline-block">
                          ⚠️ ¡Producto agotado! Stock: {selectedStockItem.stockActual} {selectedStockItem.unidad}s
                        </span>
                      ) : selectedStockItem.stockActual < 3 ? (
                        <span className="text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl inline-block">
                          ⚠️ Stock bajo: solo quedan {selectedStockItem.stockActual} {selectedStockItem.unidad}s
                        </span>
                      ) : (
                        <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl inline-block">
                          ✅ Stock disponible: {selectedStockItem.stockActual} {selectedStockItem.unidad}s
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              <datalist id="stock-suggestions">
                {stock.filter(s => s.disponible).map(s => ( <option key={s.id} value={s.codigo}>{s.tipo}{s.proveedor ? ` (${s.proveedor})` : ''} [Stock: {s.stockActual}]</option> ))}
              </datalist>
            </div>
            
            {mode === 'NOTA_VENTA' ? (
              <div className="max-h-40 overflow-y-auto bg-slate-50 border-2 border-slate-100 rounded-[28px] p-4">
                {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-bold p-1">
                        <span>{item.cantidad} x {stock.find(s => s.codigo === item.codigoFardo)?.tipo || item.codigoFardo}</span>
                        <span>${(item.valorUnitario * item.cantidad).toLocaleString()}</span>
                    </div>
                ))}
                <div className="border-t mt-2 pt-2 text-right font-black text-sm">
                    Total: ${calculatedTotal.toLocaleString()}
                </div>
              </div>
            ) : (
                <div />
            )}
          </div>

          {mode === 'NOTA_VENTA' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-10 bg-amber-50/30 rounded-[40px] border-2 border-amber-100 animate-in fade-in slide-in-from-top duration-500">
              <div className="md:col-span-2 space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3 ml-2"><Truck size={14} /> Opciones de Despacho</label>
                <div className="flex bg-white p-1.5 rounded-[24px] border-2 border-amber-100 shadow-sm">
                  <button type="button" onClick={() => setFormData({...formData, tipoDespacho: DispatchType.AGENCIA})} className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest ${formData.tipoDespacho === DispatchType.AGENCIA ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400'}`}>Agencia</button>
                  <button type="button" onClick={() => setFormData({...formData, tipoDespacho: DispatchType.DOMICILIO})} className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest ${formData.tipoDespacho === DispatchType.DOMICILIO ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400'}`}>Domicilio</button>
                  <button type="button" onClick={() => setFormData({...formData, tipoDespacho: DispatchType.RETIRO})} className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest ${formData.tipoDespacho === DispatchType.RETIRO ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400'}`}>Retiro</button>
                </div>
                {formData.tipoDespacho === DispatchType.AGENCIA && <input required type="text" className="w-full px-7 py-5 bg-white border-2 border-amber-100 rounded-[24px] font-black uppercase" placeholder="NOMBRE DE LA AGENCIA" value={formData.agencia || ''} onChange={(e) => setFormData({...formData, agencia: e.target.value.toUpperCase()})}/>}
              </div>
            </div>
          )}
          {mode === 'NORMAL' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-10 bg-blue-50/30 rounded-[40px] border-2 border-blue-100 animate-in fade-in slide-in-from-top duration-500">
               <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 ml-2"><Tag size={14} /> Variante</label>
                <select required className="w-full px-7 py-5 bg-white border-2 border-blue-100 rounded-[24px] font-black text-lg" value={formData.variante} onChange={(e) => {
                    const newVar = e.target.value;
                    let newComm = formData.tipoComision;
                    if (formData.esManual) {
                        if (newVar === 'CAJA') newComm = CommissionType.LOTE;
                        else if (newVar === 'SET' || newVar === 'PACK') newComm = CommissionType.MEDIO_FARDO;
                        else if (newVar === 'UNIDAD') newComm = CommissionType.FARDO_NORMAL;
                    }
                    setFormData({...formData, variante: newVar, tipoComision: newComm});
                }}>
                    <option value="">ELEGIR...</option>
                    <option value="UNIDAD">UNIDAD STANDARD</option>
                    <option value="CAJA">CAJA COMPLETA</option>
                    <option value="SET">SET DE PRODUCTOS</option>
                    <option value="PACK">PACK DE PRODUCTOS</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 ml-2"><Truck size={14} /> Opciones de Despacho</label>
                <div className="flex bg-white p-1.5 rounded-[24px] border-2 border-blue-100 shadow-sm">
                  <button type="button" onClick={() => setFormData({...formData, tipoDespacho: DispatchType.AGENCIA})} className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest ${formData.tipoDespacho === DispatchType.AGENCIA ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>Agencia</button>
                  <button type="button" onClick={() => setFormData({...formData, tipoDespacho: DispatchType.DOMICILIO})} className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest ${formData.tipoDespacho === DispatchType.DOMICILIO ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>Domicilio</button>
                  <button type="button" onClick={() => setFormData({...formData, tipoDespacho: DispatchType.RETIRO})} className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest ${formData.tipoDespacho === DispatchType.RETIRO ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>Retiro</button>
                </div>
                {formData.tipoDespacho === DispatchType.AGENCIA && <input required type="text" className="w-full px-7 py-5 bg-white border-2 border-blue-100 rounded-[24px] font-black uppercase" placeholder="NOMBRE DE LA AGENCIA" value={formData.agencia || ''} onChange={(e) => setFormData({...formData, agencia: e.target.value.toUpperCase()})}/>}
              </div>
            </div>
          )}

          <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-4"><DollarSign size={18} className="text-emerald-400" /> Valor Final Venta ($)</label>
            <div className="w-full px-8 py-6 bg-slate-800 border-2 border-slate-700 rounded-[28px] text-5xl font-black text-emerald-400">
               ${calculatedTotal.toLocaleString()}
            </div>
          </div>

          <button type="submit" className={`group w-full py-8 rounded-[32px] text-white font-black text-3xl flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-[0.97] ${mode === 'QUICK' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'}`}>
            <Save size={32} /> {mode === 'QUICK' ? 'REGISTRAR LIVE' : 'REGISTRAR VENTA COMPLETA'}
            <ChevronRight size={28} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}
