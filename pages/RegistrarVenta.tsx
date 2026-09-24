
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Zap, ClipboardList, CheckCircle2, User, Phone, DollarSign, Package, MapPin, Tag, Truck, CreditCard, FileText, ChevronRight, Coins, Building2, Home, ShoppingBag, Store } from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { SaleType, SaleStatus, StaffRole, CommissionType, DispatchType, DispatchMethod, DISPATCH_OPTIONS, DispatchOptionDef, getItemDepartamento } from '../types';

export default function RegistrarVenta() {
  const { stock, staff, customers, addSale, playSound, carriers } = useStore();
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
    medioPago: string;
    montoAbonado: number;
    tipoComision: CommissionType;
    juntaCompra: string;
    observaciones: string;
    tipoDespacho?: DispatchType;
    metodoDespacho?: string;
    agencia?: string;
    transportista?: string;
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
    medioPago: 'Efectivo',
    montoAbonado: 0,
    tipoComision: CommissionType.FARDO_NORMAL,
    juntaCompra: 'DESPACHO INMEDIATO',
    observaciones: '',
    tipoDespacho: DispatchType.DOMICILIO,
    metodoDespacho: DispatchMethod.TRANSPORTE_PROPIO,
    agencia: '',
    transportista: 'Transporte propio'
  });

  const handleSelectDispatchOption = (option: DispatchOptionDef) => {
    playSound('click');
    let newDireccion = formData.direccion;
    let newJuntaCompra = formData.juntaCompra;

    if (option.id === DispatchMethod.RETIRO_LOCAL) {
      newJuntaCompra = 'RETIRO EN LOCAL';
      if (!newDireccion || newDireccion.trim() === '') {
        newDireccion = 'RETIRO EN LOCAL';
      }
    } else {
      newJuntaCompra = 'DESPACHO INMEDIATO';
      if (newDireccion === 'RETIRO EN LOCAL') {
        newDireccion = '';
      }
    }

    setFormData(prev => ({
      ...prev,
      metodoDespacho: option.label,
      tipoDespacho: option.type,
      transportista: option.carrier,
      agencia: option.agency,
      juntaCompra: newJuntaCompra,
      direccion: newDireccion
    }));
  };

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
    const qty = isNotaVenta ? newItem.cantidad : (formData.cantidad || 1);
    let price = 0;
    if (foundItem) {
      const minMayorista = foundItem.minUnidadesMayorista || 5;
      if (foundItem.precioMayorista && foundItem.precioMayorista > 0 && qty >= minMayorista) {
        price = foundItem.precioMayorista;
      } else {
        price = foundItem.precioSugerido;
      }
    }
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

  useEffect(() => {
    if (formData.estadoPago === 'Pagado') {
      setFormData(prev => ({ ...prev, montoAbonado: calculatedTotal }));
    }
  }, [calculatedTotal, formData.estadoPago]);

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
    
    const finalTotal = isNotaVenta ? items.reduce((acc, item) => acc + item.valorUnitario * item.cantidad, 0) : formData.valorUnitario * formData.cantidad;
    
    const selectedMethod = formData.metodoDespacho || DispatchMethod.TRANSPORTE_PROPIO;
    const matchingOption = DISPATCH_OPTIONS.find(o => o.label === selectedMethod || o.id === selectedMethod);

    const finalTipoDespacho = formData.tipoDespacho || matchingOption?.type || DispatchType.DOMICILIO;
    const finalTransportista = formData.transportista || matchingOption?.carrier || '';
    const finalAgencia = formData.agencia || matchingOption?.agency || '';
    const finalDireccion = (selectedMethod === DispatchMethod.RETIRO_LOCAL && (!formData.direccion || formData.direccion.trim() === ''))
      ? 'RETIRO EN LOCAL'
      : formData.direccion;

    const finalData = {
      ...formData,
      direccion: finalDireccion,
      tipoVenta: isQuick ? SaleType.LIVE : isNotaVenta ? SaleType.NOTA_VENTA : SaleType.NORMAL,
      items: isNotaVenta ? items : undefined,
      total: finalTotal,
      montoAbonado: isQuick ? 0 : (formData.estadoPago === 'Pagado' ? finalTotal : formData.montoAbonado),
      status: SaleStatus.PENDIENTE,
      datosCompletos: !isQuick,
      variante: isQuick ? '' : formData.variante, 
      tipoDespacho: finalTipoDespacho,
      metodoDespacho: selectedMethod,
      transportista: finalTransportista,
      agencia: finalAgencia
    };

    console.log("Final data to be saved:", finalData);
    console.log("Items to be saved:", items);

    await addSale(finalData);
    setSuccess(true);
    playSound('success');
    
    setFormData({
      cliente: '', vendedor: formData.vendedor, telefono: '', rut: '',
      codigoFardo: '', esManual: true, variante: isQuick ? '' : 'Estándar', valorUnitario: 0, cantidad: 1,
      direccion: '', estadoPago: 'Pendiente', medioPago: 'Efectivo', montoAbonado: 0, tipoComision: CommissionType.FARDO_NORMAL,
      juntaCompra: 'DESPACHO INMEDIATO', observaciones: '',
      tipoDespacho: DispatchType.DOMICILIO,
      metodoDespacho: DispatchMethod.TRANSPORTE_PROPIO,
      agencia: '',
      transportista: 'Transporte propio'
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

          {/* 5 Métodos de Despacho Solicitados */}
          <div className="p-6 sm:p-8 bg-white rounded-[36px] border-2 border-slate-200/90 shadow-sm space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900">
                <Truck size={18} className="text-blue-600" /> Método de Despacho ({DISPATCH_OPTIONS.length} Opciones)
              </label>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Canal Logístico
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {DISPATCH_OPTIONS.map((opt) => {
                const isSelected = formData.metodoDespacho === opt.label;
                const getIcon = () => {
                  switch (opt.id) {
                    case DispatchMethod.MERCADO_LIBRE:
                      return <ShoppingBag size={18} />;
                    case DispatchMethod.TRANSPORTE_PROPIO:
                      return <Home size={18} />;
                    case DispatchMethod.TAMARINDO:
                      return <Truck size={18} />;
                    case DispatchMethod.BLUEXPRESS:
                      return <Building2 size={18} />;
                    case DispatchMethod.RETIRO_LOCAL:
                      return <Store size={18} />;
                    default:
                      return <Truck size={18} />;
                  }
                };

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectDispatchOption(opt)}
                    className={`p-4 rounded-[22px] border-2 text-left transition-all duration-200 flex flex-col justify-between group ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 ring-2 ring-blue-400/30'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full mb-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-600 shadow-xs group-hover:bg-slate-200'
                      }`}>
                        {getIcon()}
                      </div>
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
                          <CheckCircle2 size={12} /> Activo
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {opt.shortLabel}
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="font-black text-xs uppercase tracking-tight leading-snug">
                        {opt.label}
                      </p>
                      <p className={`text-[10px] font-medium mt-1 leading-tight ${
                        isSelected ? 'text-white/80' : 'text-slate-400'
                      }`}>
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {formData.metodoDespacho === DispatchMethod.BLUEXPRESS && (
              <div className="p-4 bg-blue-50/60 rounded-[20px] border border-blue-200 shadow-xs space-y-1.5 animate-in fade-in duration-200">
                <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest block">
                  Sucursal Bluexpress o Destino Regional (Opcional)
                </label>
                <input
                  type="text"
                  className="w-full px-5 py-3 bg-white border-2 border-blue-100 rounded-xl font-bold uppercase text-xs outline-none focus:border-blue-500"
                  placeholder="EJ: SUCURSAL COQUIMBO / DOMICILIO TEMUCO"
                  value={formData.agencia || ''}
                  onChange={(e) => setFormData({...formData, agencia: e.target.value.toUpperCase()})}
                />
                <p className="text-[10px] text-blue-600/80 italic">
                  Si el envío regional es con retiro en sucursal Bluexpress, indícala aquí.
                </p>
              </div>
            )}

            {formData.metodoDespacho === DispatchMethod.TRANSPORTE_PROPIO && (
              <div className="p-4 bg-emerald-50/60 rounded-[20px] border border-emerald-200 shadow-xs space-y-1.5 animate-in fade-in duration-200">
                <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block">
                  Chofer / Móvil Asignado (Opcional)
                </label>
                <select
                  className="w-full px-5 py-3 bg-white border-2 border-emerald-100 rounded-xl font-bold uppercase text-xs outline-none focus:border-emerald-500"
                  value={formData.transportista || 'Transporte propio'}
                  onChange={(e) => setFormData({...formData, transportista: e.target.value})}
                >
                  <option value="Transporte propio">Transporte propio (Asignar chofer después en Despachos)</option>
                  {carriers.filter(c => c !== 'Transporte propio' && c !== 'Transporte MERCADO LIBRE' && c !== 'Bluexpress' && c !== 'Transportes Tamarindo').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {formData.metodoDespacho === DispatchMethod.RETIRO_LOCAL && (
              <div className="p-4 bg-purple-50 rounded-[20px] border border-purple-200 text-purple-900 flex items-center gap-3 animate-in fade-in duration-200">
                <Store size={20} className="text-purple-600 flex-shrink-0" />
                <p className="text-xs font-bold leading-relaxed">
                  <strong>Retiro en Local:</strong> El cliente retirará directamente su pedido en tienda o bodega central. La dirección se autocompleta con <em>RETIRO EN LOCAL</em>.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="relative">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-4"><Package size={18} className="text-blue-500" /> {mode === 'NOTA_VENTA' ? 'Agregar Producto' : 'Código de Producto'}</label>
              
              {mode === 'NOTA_VENTA' ? (
                <div>
                  <div className="flex flex-wrap gap-2">
                      <input list="stock-suggestions" type="text" className="w-[120px] px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-[20px] font-black outline-none" placeholder="CODIGO" value={newItem.codigoFardo} onChange={(e) => handleItemCodeChange(e.target.value, true)}/>
                      <input type="number" min="1" className="w-16 px-2 py-4 bg-slate-50 border-2 border-slate-100 rounded-[20px] font-black outline-none" placeholder="CANT" value={newItem.cantidad} onChange={(e) => {
                        const newQty = Number(e.target.value);
                        const found = stock.find(s => s.codigo === newItem.codigoFardo.trim().toUpperCase());
                        let price = newItem.valorUnitario;
                        if (found) {
                          const minM = found.minUnidadesMayorista || 5;
                          if (found.precioMayorista && found.precioMayorista > 0) {
                            price = newQty >= minM ? found.precioMayorista : found.precioSugerido;
                          }
                        }
                        setNewItem({...newItem, cantidad: newQty, valorUnitario: price});
                      }}/>
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
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
                      <span className={`px-2.5 py-1 rounded-xl text-white ${
                        (selectedNewItemStock.departamento || getItemDepartamento(selectedNewItemStock)) === 'BELLEZA' ? 'bg-pink-600' : 'bg-sky-600'
                      }`}>
                        {(selectedNewItemStock.departamento || getItemDepartamento(selectedNewItemStock)) === 'BELLEZA' ? '💄 Belleza' : '💻 Tecnología'}
                      </span>
                      {selectedNewItemStock.subcategoria && (
                        <span className="px-2 py-1 rounded-xl bg-slate-100 text-slate-700">
                          {selectedNewItemStock.subcategoria}
                        </span>
                      )}
                      {selectedNewItemStock.stockActual <= 0 ? (
                        <span className="text-red-500 bg-red-50 border border-red-200 px-2.5 py-1 rounded-xl inline-block">
                          ⚠️ ¡Agotado! (Stock: {selectedNewItemStock.stockActual} {selectedNewItemStock.unidad}s)
                        </span>
                      ) : selectedNewItemStock.stockActual < 3 ? (
                        <span className="text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl inline-block">
                          ⚠️ Stock bajo: solo quedan {selectedNewItemStock.stockActual} {selectedNewItemStock.unidad}s
                        </span>
                      ) : (
                        <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl inline-block">
                          ✅ Stock disponible: {selectedNewItemStock.stockActual} {selectedNewItemStock.unidad}s
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                      <input required list="stock-suggestions" type="text" className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[28px] text-2xl font-black focus:border-blue-500 outline-none transition-all uppercase" placeholder="CÓDIGO (Ej: TEC-001 o BEL-001)" value={formData.codigoFardo} onChange={(e) => handleItemCodeChange(e.target.value, false)}/>
                      <input required type="number" className="w-32 px-4 py-6 bg-slate-50 border-2 border-slate-100 rounded-[28px] text-xl font-black outline-none transition-all" placeholder="VALOR" value={formData.valorUnitario || ''} onChange={(e) => setFormData({...formData, valorUnitario: Number(e.target.value)})}/>
                  </div>
                  {selectedStockItem && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-black uppercase tracking-wider">
                      <span className={`px-2.5 py-1 rounded-xl text-white ${
                        (selectedStockItem.departamento || getItemDepartamento(selectedStockItem)) === 'BELLEZA' ? 'bg-pink-600' : 'bg-sky-600'
                      }`}>
                        {(selectedStockItem.departamento || getItemDepartamento(selectedStockItem)) === 'BELLEZA' ? '💄 Belleza' : '💻 Tecnología'}
                      </span>
                      {selectedStockItem.subcategoria && (
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
                          {selectedStockItem.subcategoria}
                        </span>
                      )}
                      {selectedStockItem.stockActual <= 0 ? (
                        <span className="text-red-500 bg-red-50 border border-red-100 px-3 py-1 rounded-xl inline-block">
                          ⚠️ ¡Producto agotado! Stock: {selectedStockItem.stockActual} {selectedStockItem.unidad}s
                        </span>
                      ) : selectedStockItem.stockActual < 3 ? (
                        <span className="text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-xl inline-block">
                          ⚠️ Stock bajo: solo quedan {selectedStockItem.stockActual} {selectedStockItem.unidad}s
                        </span>
                      ) : (
                        <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl inline-block">
                          ✅ Stock disponible: {selectedStockItem.stockActual} {selectedStockItem.unidad}s
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              <datalist id="stock-suggestions">
                {stock.filter(s => s.disponible).map(s => {
                  const depto = s.departamento || getItemDepartamento(s);
                  const tag = depto === 'BELLEZA' ? '💄 [Belleza]' : '💻 [Tech]';
                  return (
                    <option key={s.id} value={s.codigo}>
                      {tag} {s.tipo} {s.subcategoria ? `(${s.subcategoria})` : ''} - Stock: {s.stockActual}
                    </option>
                  );
                })}
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

          {mode === 'NORMAL' && (
            <div className="p-8 bg-blue-50/30 rounded-[40px] border-2 border-blue-100 animate-in fade-in slide-in-from-top duration-500">
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
          )}

          {mode !== 'QUICK' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Tarjeta de Pago y Abonos */}
              <div className="bg-white p-8 rounded-[40px] border-2 border-slate-100 shadow-xl space-y-6">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  <Coins size={14} className="text-blue-500" /> Detalle de Pago y Abonos
                </label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Estado de Pago</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm"
                      value={formData.estadoPago}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setFormData(prev => ({
                          ...prev, 
                          estadoPago: newStatus,
                          montoAbonado: newStatus === 'Pagado' ? calculatedTotal : prev.montoAbonado
                        }));
                      }}
                    >
                      <option value="Pendiente">PENDIENTE / CRÉDITO</option>
                      <option value="Pagado">PAGADO TOTAL</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Medio de Pago</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm"
                      value={formData.medioPago}
                      onChange={(e) => setFormData(prev => ({ ...prev, medioPago: e.target.value }))}
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Tarjeta">Tarjeta Débito/Crédito</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Crédito / Cuenta Corriente">Crédito / Cta. Corriente</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Monto Abonado ($)</label>
                    <button 
                      type="button" 
                      onClick={() => setFormData(prev => ({ ...prev, montoAbonado: calculatedTotal, estadoPago: 'Pagado' }))}
                      className="text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider hover:bg-emerald-100 transition-all"
                    >
                      Abonar Total
                    </button>
                  </div>
                  <input 
                    type="number" 
                    min="0"
                    max={calculatedTotal}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-lg"
                    placeholder="0"
                    value={formData.montoAbonado || ''}
                    onChange={(e) => {
                      const abono = Number(e.target.value);
                      setFormData(prev => ({ 
                        ...prev, 
                        montoAbonado: abono,
                        estadoPago: abono >= calculatedTotal ? 'Pagado' : 'Pendiente'
                      }));
                    }}
                  />
                  {formData.montoAbonado < calculatedTotal && (
                    <p className="text-[10px] font-bold text-red-500 mt-2 ml-2 uppercase tracking-wide">
                      Saldo Pendiente (Deuda): ${(calculatedTotal - formData.montoAbonado).toLocaleString('es-CL')}
                    </p>
                  )}
                </div>
              </div>

              {/* Tarjeta de Resumen y Valor Final */}
              <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl flex flex-col justify-between">
                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2"><DollarSign size={18} className="text-emerald-400" /> Valor Final Venta ($)</label>
                  <div className="w-full px-8 py-6 bg-slate-800 border-2 border-slate-700 rounded-[28px] text-4xl font-black text-emerald-400">
                     ${calculatedTotal.toLocaleString()}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Monto Abonado:</span>
                    <span className="font-bold text-slate-200">${(formData.montoAbonado || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saldo Pendiente (Crédito):</span>
                    <span className="font-bold text-red-400">${(calculatedTotal - (formData.montoAbonado || 0)).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-4"><DollarSign size={18} className="text-emerald-400" /> Valor Final Venta ($)</label>
              <div className="w-full px-8 py-6 bg-slate-800 border-2 border-slate-700 rounded-[28px] text-5xl font-black text-emerald-400">
                 ${calculatedTotal.toLocaleString()}
              </div>
            </div>
          )}

          <button type="submit" className={`group w-full py-8 rounded-[32px] text-white font-black text-3xl flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-[0.97] ${mode === 'QUICK' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'}`}>
            <Save size={32} /> {mode === 'QUICK' ? 'REGISTRAR LIVE' : 'REGISTRAR VENTA COMPLETA'}
            <ChevronRight size={28} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}
