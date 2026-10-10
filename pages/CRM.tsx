import React, { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useStore } from '../store/GlobalContext';
import { Customer, Sale, SaleType, DispatchType, LabelFormat } from '../types';
import { 
  Phone, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  MessageSquare, 
  Clock, 
  Printer, 
  Tag, 
  FileText, 
  X, 
  CheckCircle2, 
  CheckSquare, 
  Square, 
  Truck, 
  Package, 
  User 
} from 'lucide-react';
import { Label } from '../components/Label';
import { Invoice } from '../components/Invoice';

export default function CRM() {
  const { customers, addCustomer, updateCustomer, removeCustomer, sales, stock, playSound, currentUser, updateSale } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newNote, setNewNote] = useState('');

  // Thermal Label Format preference
  const [labelFormat, setLabelFormat] = useState<LabelFormat>(() => {
    return (localStorage.getItem('preferred_label_format') as LabelFormat) || 'logistica';
  });

  // Modal for customer labeling & invoices
  const [selectedCustomerForLabel, setSelectedCustomerForLabel] = useState<Customer | null>(null);
  const [selectedSaleForLabel, setSelectedSaleForLabel] = useState<Sale | null>(null);
  
  // Simultaneous multi-product state for Notas de Venta in CRM
  const [selectedMultiItemIndices, setSelectedMultiItemIndices] = useState<number[]>([]);
  const [multiItemMultiplier, setMultiItemMultiplier] = useState<'by_product' | 'by_unit'>('by_product');
  const [customTotalBultos, setCustomTotalBultos] = useState<number>(0);

  // Direct manual label fields
  const [directLabelProduct, setDirectLabelProduct] = useState('PAQUETE / ENCOMIENDA');
  const [directLabelDispatch, setDirectLabelDispatch] = useState('STARKEN');
  const [directLabelQty, setDirectLabelQty] = useState(1);
  const [directLabelObs, setDirectLabelObs] = useState('');

  // Print spooler state
  const [activePrintType, setActivePrintType] = useState<'FACTURA' | 'ETIQUETAS' | null>(null);
  const [labelsToPrint, setLabelsToPrint] = useState<{ 
    sale: Sale; 
    item: { codigoFardo: string; cantidad: number }; 
    bultoIndex: number; 
    totalBultos: number; 
  }[]>([]);
  const [invoicesToPrint, setInvoicesToPrint] = useState<Sale[]>([]);
  const [printSuccessBanner, setPrintSuccessBanner] = useState<string | null>(null);

  const handleFormatChange = (fmt: LabelFormat) => {
    setLabelFormat(fmt);
    localStorage.setItem('preferred_label_format', fmt);
  };

  const normalizeText = (text: string) => 
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredCustomers = customers.filter(c => {
    const normalizedSearch = normalizeText(searchTerm);
    return normalizeText(c.nombre).includes(normalizedSearch) ||
           c.telefono.includes(searchTerm) ||
           (c.rut && c.rut.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const handleWhatsApp = (telefono: string) => {
    const formattedPhone = telefono.replace(/\D/g, ''); 
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  const addNota = (customer: Customer) => {
    if (!newNote.trim()) return;
    updateCustomer({
      ...customer,
      notas: [...customer.notas, `${new Date().toLocaleDateString()}: ${newNote.trim()}`],
      lastContacted: new Date().toISOString()
    });
    setNewNote('');
  };

  // Execution of thermal printing
  const executePrintLabels = (
    queue: { 
      sale: Sale; 
      item: { codigoFardo: string; cantidad: number }; 
      bultoIndex: number; 
      totalBultos: number; 
    }[]
  ) => {
    if (queue.length === 0) return;

    flushSync(() => {
      setActivePrintType('ETIQUETAS');
      setLabelsToPrint(queue);
      setInvoicesToPrint([]);
    });

    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error('Error al imprimir etiquetas desde CRM:', err);
      }
    }, 150);
  };

  const executePrintInvoice = (sale: Sale) => {
    flushSync(() => {
      setActivePrintType('FACTURA');
      setInvoicesToPrint([sale]);
      setLabelsToPrint([]);
    });

    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error('Error al imprimir factura desde CRM:', err);
      }
    }, 150);
  };

  // After print cleanup
  useEffect(() => {
    const handleAfterPrint = () => {
      if (labelsToPrint.length > 0) {
        playSound('success');
        setPrintSuccessBanner(`Se enviaron ${labelsToPrint.length} etiqueta(s) a impresión.`);
        setTimeout(() => setPrintSuccessBanner(null), 4000);
      }
      setTimeout(() => {
        setLabelsToPrint([]);
        setInvoicesToPrint([]);
        setActivePrintType(null);
      }, 1000);
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [playSound, labelsToPrint.length]);

  // Open label modal for a customer
  const handleOpenCustomerLabelModal = (customer: Customer) => {
    setSelectedCustomerForLabel(customer);
    const customerSales = sales.filter(s => s && s.cliente && s.cliente.trim().toUpperCase() === customer.nombre.trim().toUpperCase());
    const latestSale = customerSales.sort((a, b) => b.numeroVenta - a.numeroVenta)[0] || null;
    setSelectedSaleForLabel(latestSale);

    if (latestSale) {
      const items = latestSale.items && latestSale.items.length > 0 
        ? latestSale.items 
        : [{ codigoFardo: latestSale.codigoFardo || 'N/A', cantidad: latestSale.cantidad || 1 }];
      setSelectedMultiItemIndices(items.map((_, i) => i));
      setCustomTotalBultos(items.length);
    } else {
      setSelectedMultiItemIndices([]);
      setCustomTotalBultos(1);
    }
  };

  // Confirm multi-product label printing for selected sale in CRM
  const handleConfirmSaleLabelPrintInCRM = () => {
    if (!selectedSaleForLabel || !selectedCustomerForLabel) return;
    const sale = selectedSaleForLabel;
    const items = sale.items && sale.items.length > 0 
      ? sale.items 
      : [{ codigoFardo: sale.codigoFardo || 'N/A', cantidad: sale.cantidad || 1 }];

    const queue: { 
      sale: Sale; 
      item: { codigoFardo: string; cantidad: number }; 
      bultoIndex: number; 
      totalBultos: number; 
    }[] = [];

    const selectedItems = selectedMultiItemIndices.map(idx => items[idx]).filter(Boolean);
    if (selectedItems.length === 0) return;

    if (multiItemMultiplier === 'by_product') {
      const totalCount = selectedItems.length;
      const effectiveTotal = customTotalBultos > 0 ? customTotalBultos : totalCount;

      selectedItems.forEach((it, idx) => {
        queue.push({
          sale,
          item: { codigoFardo: it.codigoFardo, cantidad: it.cantidad || 1 },
          bultoIndex: idx + 1,
          totalBultos: effectiveTotal
        });
      });
    } else {
      let totalUnits = 0;
      selectedItems.forEach(it => { totalUnits += (it.cantidad || 1); });
      const effectiveTotal = customTotalBultos > 0 ? customTotalBultos : totalUnits;

      let bultoCounter = 1;
      selectedItems.forEach(it => {
        const qty = it.cantidad || 1;
        for (let u = 0; u < qty; u++) {
          queue.push({
            sale,
            item: { codigoFardo: it.codigoFardo, cantidad: 1 },
            bultoIndex: bultoCounter++,
            totalBultos: effectiveTotal
          });
        }
      });
    }

    setSelectedCustomerForLabel(null);
    executePrintLabels(queue);
  };

  // Direct label printing without a registered sale
  const handlePrintDirectCustomerLabel = () => {
    if (!selectedCustomerForLabel) return;
    const c = selectedCustomerForLabel;

    const pseudoSale: Sale = {
      id: `direct-${c.id}-${Date.now()}`,
      numeroVenta: 9999,
      tipoVenta: SaleType.NORMAL,
      cliente: c.nombre.toUpperCase(),
      telefono: c.telefono,
      rut: c.rut || 'SIN REGISTRAR',
      direccion: c.direccion || 'RETIRO EN AGENCIA / POR COORDINAR',
      metodoDespacho: directLabelDispatch,
      tipoDespacho: DispatchType.DOMICILIO,
      total: 0,
      datosCompletos: true,
      enviado: false,
      status: 'Pendiente' as any,
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().slice(0, 5),
      vendedor: currentUser?.nombre || 'VENTAS',
      estadoPago: 'Pagado',
      tipoComision: 'FARDO_NORMAL' as any,
      variante: directLabelProduct,
      codigoFardo: 'ENV-DIRECTO',
      cantidad: directLabelQty,
      observaciones: directLabelObs
    };

    const queue = [];
    const totalBultos = Math.max(1, directLabelQty);
    for (let i = 1; i <= totalBultos; i++) {
      queue.push({
        sale: pseudoSale,
        item: { codigoFardo: 'ENV-DIRECTO', cantidad: 1 },
        bultoIndex: i,
        totalBultos: totalBultos
      });
    }

    setSelectedCustomerForLabel(null);
    executePrintLabels(queue);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-slate-900">CRM de Clientes</h1>
        <button onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }} className="px-4 py-2 bg-slate-900 text-white rounded-xl flex items-center gap-2 font-bold text-sm">
          <Plus size={16} /> Nuevo Cliente
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-slate-200 outline-none focus:border-amber-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form 
            className="bg-white p-6 rounded-2xl w-full max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                nombre: formData.get('nombre') as string,
                telefono: formData.get('telefono') as string,
                rut: formData.get('rut') as string || '',
                email: formData.get('email') as string || '',
                direccion: formData.get('direccion') as string || '',
              };
              if (editingCustomer) {
                updateCustomer({ ...editingCustomer, ...data });
              } else {
                addCustomer(data);
              }
              setIsModalOpen(false);
            }}
          >
            <h2 className="text-lg font-black mb-4">{editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            <input name="nombre" defaultValue={editingCustomer?.nombre} placeholder="Nombre" className="w-full p-2 mb-2 border rounded" required />
            <input name="telefono" defaultValue={editingCustomer?.telefono} placeholder="Teléfono" className="w-full p-2 mb-2 border rounded" required />
            <input name="rut" defaultValue={editingCustomer?.rut} placeholder="RUT" className="w-full p-2 mb-2 border rounded" />
            <input name="email" defaultValue={editingCustomer?.email} placeholder="Email" className="w-full p-2 mb-2 border rounded" />
            <textarea name="direccion" defaultValue={editingCustomer?.direccion} placeholder="Dirección Completa" className="w-full p-2 mb-4 border rounded h-24 resize-none" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold">Guardar</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
        {filteredCustomers.map(c => {
          const customerSales = sales.filter(s => s && s.cliente && s.cliente.trim().toUpperCase() === c.nombre.trim().toUpperCase());
          const pendingDebt = customerSales.reduce((acc, s) => {
            const total = s.total || 0;
            const abonado = s.montoAbonado !== undefined ? s.montoAbonado : (s.estadoPago === 'Pagado' ? total : 0);
            return acc + (total - abonado);
          }, 0);

          return (
            <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
              {pendingDebt > 0 && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider">
                  Debe ${pendingDebt.toLocaleString('es-CL')}
                </div>
              )}
              <h3 className="font-black text-lg text-slate-900 pr-24 uppercase tracking-tight">{c.nombre}</h3>
              <p className="text-sm font-bold text-slate-500 mb-2">{c.telefono}</p>
            
            <div className="mt-4 border-t pt-4">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Historial</p>
                <div className="max-h-32 overflow-y-auto mb-2 space-y-1">
                    {c.notas.map((n, i) => <p key={i} className="text-xs text-slate-600 bg-slate-50 p-2 rounded">{n}</p>)}
                </div>
                <div className="flex gap-1">
                    <input value={newNote} onChange={e => setNewNote(e.target.value)} className="text-xs p-2 flex-grow border rounded" placeholder="Nueva nota..." />
                    <button onClick={() => addNota(c)} className="bg-amber-500 text-white p-2 rounded"><Plus size={14} /></button>
                </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => handleOpenCustomerLabelModal(c)} 
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                title="Imprimir etiquetas de despacho térmicas o ver Notas de Venta"
              >
                <Printer size={15} />
                <span>Rotular Envío</span>
              </button>

              <div className="flex items-center gap-1">
                <button onClick={() => handleWhatsApp(c.telefono)} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors cursor-pointer" title="WhatsApp"><MessageSquare size={16} /></button>
                <button onClick={() => { setEditingCustomer(c); setIsModalOpen(true); }} className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl transition-colors cursor-pointer" title="Editar"><Edit2 size={16} /></button>
                <button onClick={() => removeCustomer(c.id)} className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-colors cursor-pointer" title="Eliminar"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* NOTIFICACIÓN FLOTANTE DE ÉXITO */}
      {printSuccessBanner && (
        <div className="fixed top-6 right-6 z-50 p-4 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 no-print">
          <CheckCircle2 size={20} className="flex-shrink-0" />
          <span className="text-xs font-black uppercase tracking-wider">{printSuccessBanner}</span>
        </div>
      )}

      {/* MODAL: ROTULADO Y ETIQUETAS DE DESPACHO DESDE CRM */}
      {selectedCustomerForLabel && (() => {
        const c = selectedCustomerForLabel;
        const customerSales = sales
          .filter(s => s && s.cliente && s.cliente.trim().toUpperCase() === c.nombre.trim().toUpperCase())
          .sort((a, b) => b.numeroVenta - a.numeroVenta);

        const currentSale = selectedSaleForLabel;
        const saleItems = currentSale && currentSale.items && currentSale.items.length > 0 
          ? currentSale.items 
          : currentSale ? [{ codigoFardo: currentSale.codigoFardo || 'N/A', cantidad: currentSale.cantidad || 1 }] : [];

        const selectedItems = selectedMultiItemIndices.map(idx => saleItems[idx]).filter(Boolean);
        const totalUnits = selectedItems.reduce((acc, it) => acc + (it.cantidad || 1), 0);
        const calculatedLabelsCount = multiItemMultiplier === 'by_product' ? selectedItems.length : totalUnits;
        const effectiveTotalBultos = customTotalBultos > 0 ? customTotalBultos : calculatedLabelsCount;

        return (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 no-print animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <Printer size={22} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                      Rotulado de Despacho — {c.nombre}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      RUT: <strong className="text-slate-700">{c.rut || 'S/R'}</strong> • Tel: <strong className="text-slate-700">{c.telefono}</strong>
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomerForLabel(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              {/* Dirección de Entrega Registrada */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Dirección Registrada:</span>
                  <p className="font-bold text-slate-800 uppercase mt-0.5">{c.direccion || 'Sin dirección registrada en ficha (completar o retiro)'}</p>
                </div>
                <div className="flex items-center gap-1">
                  {(['logistica', 'industrial', 'clasica'] as LabelFormat[]).map(fmt => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => handleFormatChange(fmt)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        labelFormat === fmt ? 'bg-slate-900 text-white' : 'bg-white border text-slate-600'
                      }`}
                    >
                      {fmt === 'logistica' ? 'Logística' : fmt === 'industrial' ? 'Industrial' : 'Clásica'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selección de Venta / Nota de Venta Asociada */}
              {customerSales.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center justify-between">
                      <span>Seleccionar Venta o Nota de Venta ({customerSales.length} disponible{customerSales.length > 1 ? 's' : ''}):</span>
                      {currentSale && (
                        <button
                          type="button"
                          onClick={() => executePrintInvoice(currentSale)}
                          className="text-blue-600 hover:text-blue-700 text-[11px] font-black flex items-center gap-1 underline cursor-pointer"
                        >
                          <FileText size={12} /> Imprimir Factura / Nota #{currentSale.numeroVenta}
                        </button>
                      )}
                    </label>

                    <select
                      className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xs text-slate-800"
                      value={currentSale?.id || ''}
                      onChange={(e) => {
                        const s = customerSales.find(x => x.id === e.target.value) || null;
                        setSelectedSaleForLabel(s);
                        if (s) {
                          const items = s.items && s.items.length > 0 
                            ? s.items 
                            : [{ codigoFardo: s.codigoFardo || 'N/A', cantidad: s.cantidad || 1 }];
                          setSelectedMultiItemIndices(items.map((_, i) => i));
                          setCustomTotalBultos(items.length);
                        }
                      }}
                    >
                      {customerSales.map(s => {
                        const count = s.items?.length || 1;
                        return (
                          <option key={s.id} value={s.id}>
                            Folio #{s.numeroVenta} — {s.tipoVenta || 'Venta'} ({count} prod.) — ${ (s.total || 0).toLocaleString('es-CL') } — {s.fecha}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Configuración de Impresión Simultánea para la Venta */}
                  {currentSale && saleItems.length > 0 && (
                    <div className="space-y-4 border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                          Modo de Rotulado:
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] font-bold text-slate-500">Total Bultos:</label>
                          <input
                            type="number"
                            min="1"
                            value={effectiveTotalBultos}
                            onChange={(e) => setCustomTotalBultos(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono font-black text-xs text-center"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setMultiItemMultiplier('by_product');
                            setCustomTotalBultos(selectedMultiItemIndices.length);
                          }}
                          className={`p-3 rounded-xl border-2 text-left font-black text-xs uppercase transition-all flex flex-col justify-between cursor-pointer ${
                            multiItemMultiplier === 'by_product'
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                              : 'border-slate-200 bg-white text-slate-600'
                          }`}
                        >
                          <span>1 Etiqueta por Producto</span>
                          <span className="text-[10px] font-normal text-slate-500">Bulto 1 de N, 2 de N...</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMultiItemMultiplier('by_unit');
                            setCustomTotalBultos(totalUnits);
                          }}
                          className={`p-3 rounded-xl border-2 text-left font-black text-xs uppercase transition-all flex flex-col justify-between cursor-pointer ${
                            multiItemMultiplier === 'by_unit'
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                              : 'border-slate-200 bg-white text-slate-600'
                          }`}
                        >
                          <span>1 por Unidad Física</span>
                          <span className="text-[10px] font-normal text-slate-500">Multiplicado por cantidad</span>
                        </button>
                      </div>

                      {/* Lista de Productos y su Numeración */}
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {(() => {
                          let bultoTracker = 1;
                          return saleItems.map((item, idx) => {
                            const isChecked = selectedMultiItemIndices.includes(idx);
                            const stockItem = stock.find(s => s.codigo?.trim().toUpperCase() === item.codigoFardo?.trim().toUpperCase());
                            const productName = stockItem ? stockItem.tipo : item.codigoFardo;
                            
                            const itemBultoStart = bultoTracker;
                            const itemUnits = item.cantidad || 1;
                            if (isChecked) {
                              bultoTracker += (multiItemMultiplier === 'by_product' ? 1 : itemUnits);
                            }
                            const itemBultoEnd = bultoTracker - 1;

                            return (
                              <div
                                key={idx}
                                onClick={() => {
                                  setSelectedMultiItemIndices(prev => 
                                    prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx]
                                  );
                                }}
                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                  isChecked 
                                    ? 'border-emerald-500 bg-white text-slate-900 shadow-2xs' 
                                    : 'border-slate-200 bg-slate-100/60 text-slate-400 opacity-60'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {isChecked ? (
                                    <CheckSquare size={16} className="text-emerald-600 flex-shrink-0" />
                                  ) : (
                                    <Square size={16} className="text-slate-400 flex-shrink-0" />
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-black text-xs uppercase leading-tight truncate">{productName}</p>
                                    <span className="text-[10px] font-mono text-slate-500">SKU: {item.codigoFardo} • Cant: {item.cantidad}</span>
                                  </div>
                                </div>

                                {isChecked && (
                                  <span className="px-2 py-0.5 bg-black text-white rounded font-mono text-[9.5px] font-black uppercase flex-shrink-0">
                                    {multiItemMultiplier === 'by_product' || itemUnits === 1
                                      ? `BULTO ${itemBultoStart} DE ${effectiveTotalBultos}`
                                      : `BULTOS ${itemBultoStart}-${itemBultoEnd} DE ${effectiveTotalBultos}`
                                    }
                                  </span>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>

                      <button
                        type="button"
                        disabled={selectedMultiItemIndices.length === 0}
                        onClick={handleConfirmSaleLabelPrintInCRM}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
                      >
                        <Printer size={16} />
                        <span>Imprimir {calculatedLabelsCount} Etiquetas Enumeradas</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                  <p className="text-xs font-black uppercase text-amber-900">
                    Este cliente aún no tiene ventas registradas en el sistema
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Puedes emitir una etiqueta de despacho directa utilizando los datos de su ficha de cliente.
                  </p>
                </div>
              )}

              {/* Sección de Etiqueta Manual Directa */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                  O Emitir Etiqueta Directa Personalizada:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={directLabelProduct}
                    onChange={e => setDirectLabelProduct(e.target.value.toUpperCase())}
                    placeholder="Descripción mercadería"
                    className="p-2 bg-slate-50 border rounded-xl text-xs font-bold uppercase sm:col-span-2"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={directLabelQty}
                      onChange={e => setDirectLabelQty(Math.max(1, parseInt(e.target.value) || 1))}
                      placeholder="Bultos"
                      className="w-16 p-2 bg-slate-50 border rounded-xl text-xs font-bold text-center"
                    />
                    <select
                      value={directLabelDispatch}
                      onChange={e => setDirectLabelDispatch(e.target.value)}
                      className="flex-1 p-2 bg-slate-50 border rounded-xl text-xs font-bold"
                    >
                      <option value="STARKEN EXPRESS">Starken</option>
                      <option value="CHILEXPRESS">Chilexpress</option>
                      <option value="BLUE EXPRESS">Blue Express</option>
                      <option value="TRANSPORTE PROPIO">Transp. Propio</option>
                      <option value="RETIRO EN LOCAL">Retiro Local</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500 font-medium">
                    Genera {directLabelQty} rótulo(s) con los datos del destinatario ({c.nombre})
                  </span>
                  <button
                    type="button"
                    onClick={handlePrintDirectCustomerLabel}
                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <Tag size={14} /> Imprimir Directa
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* PRINT CONTAINER FOR CRM SPOOLER (THERMAL LABELS & INVOICES) */}
      <div className="print-only">
        {activePrintType === 'FACTURA' && invoicesToPrint.length > 0 && (
          <div className="invoices-batch-container">
            {invoicesToPrint.map((s) => (
              <div key={s.id} className="invoice-container">
                <Invoice sale={s} stock={stock} />
              </div>
            ))}
          </div>
        )}

        {activePrintType === 'ETIQUETAS' && labelsToPrint.length > 0 && (
          <div className="labels-batch-container">
            {labelsToPrint.map((itemObj, idx) => (
              <div key={`${itemObj.sale.id}-${idx}`} className="label-container">
                <Label 
                  sale={itemObj.sale} 
                  stock={stock} 
                  item={itemObj.item} 
                  format={labelFormat}
                  bultoIndex={itemObj.bultoIndex}
                  totalBultos={itemObj.totalBultos}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PRINT CSS STYLES FOR THERMAL PRINTER (100x150MM) AND INVOICES */}
      <style>{`
        @media print {
          @page {
            ${activePrintType === 'ETIQUETAS' 
              ? 'size: 100mm 150mm portrait; margin: 0;' 
              : 'size: letter portrait; margin: 8mm;'}
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body { 
            margin: 0 !important; 
            padding: 0 !important; 
            background: white !important; 
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
          }
          #root, #root > div, div[class*="overflow-hidden"], main {
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            position: static !important;
          }
          .no-print, header, aside, nav, footer { 
            display: none !important; 
          }
          .print-only { 
            display: block !important; 
            position: static !important;
            width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }
          .label-container { 
            width: 100mm !important; 
            height: 150mm !important; 
            min-height: 150mm !important;
            max-height: 150mm !important;
            box-sizing: border-box !important; 
            page-break-after: always !important; 
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important; 
            align-items: center !important; 
            justify-content: center !important; 
            overflow: hidden !important; 
          }
          .invoice-container {
            width: 100% !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            break-after: page !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
