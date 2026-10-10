import React, { useState, useRef, useEffect, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { 
  Search, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Save, 
  MapPin, 
  CreditCard, 
  UserCheck, 
  Tag, 
  Info, 
  FileEdit, 
  BadgeDollarSign, 
  Truck, 
  Building2, 
  Home, 
  Package, 
  Trash2, 
  Camera, 
  ShoppingBag, 
  Store,
  Printer,
  FileText,
  Tags,
  CheckSquare,
  Square,
  Eye,
  SlidersHorizontal,
  Check,
  Layers,
  Sparkles
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { SaleStatus, SaleType, Sale, DispatchType, StaffRole, DispatchMethod, DISPATCH_OPTIONS, LabelFormat } from '../types';
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
  const [sortKey, setSortKey] = useState<'numeroVenta' | 'fecha'>('numeroVenta');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Thermal Label Format preference (synced with Cuaderno MDF / Etiquetas)
  const [labelFormat, setLabelFormat] = useState<LabelFormat>(() => {
    return (localStorage.getItem('preferred_label_format') as LabelFormat) || 'logistica';
  });

  // Batch selection for multi-sale printing
  const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);

  // Print spooler state
  const [activePrintType, setActivePrintType] = useState<'FACTURA' | 'ETIQUETAS' | null>(null);
  const [labelsToPrint, setLabelsToPrint] = useState<{ sale: Sale; item: { codigoFardo: string; cantidad: number } }[]>([]);
  const [invoicesToPrint, setInvoicesToPrint] = useState<Sale[]>([]);
  const affectedSalesRef = useRef<Sale[]>([]);
  const [printSuccessBanner, setPrintSuccessBanner] = useState<string | null>(null);

  // Modal for multi-product Nota de Venta label printing
  const [multiProductModalSale, setMultiProductModalSale] = useState<Sale | null>(null);
  const [selectedMultiItemIndices, setSelectedMultiItemIndices] = useState<number[]>([]);
  const [multiItemMultiplier, setMultiItemMultiplier] = useState<'by_product' | 'by_unit'>('by_product');

  // Modal for Invoice / Nota de Venta Preview
  const [invoiceModalSale, setInvoiceModalSale] = useState<Sale | null>(null);

  const isAdmin = currentUser?.rol === StaffRole.ADMIN;

  const handleFormatChange = (fmt: LabelFormat) => {
    setLabelFormat(fmt);
    localStorage.setItem('preferred_label_format', fmt);
  };

  const pendingLiveSales = sales.filter(s => s && !s.datosCompletos && s.tipoVenta === SaleType.LIVE && (isAdmin || s.vendedor === currentUser?.nombre));
  
  const readySales = sales.filter(s => {
    if (!s) return false;
    if (!(s.datosCompletos || s.tipoVenta === SaleType.NORMAL || s.tipoVenta === SaleType.NOTA_VENTA)) return false;
    if (!(isAdmin || s.vendedor === currentUser?.nombre)) return false;
    
    const d = s.fecha ? parseLocalDate(s.fecha) : new Date();
    if (isNaN(d.getTime())) return false;
    
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
      return normalizeText(s.cliente || '').includes(normalizedSearch) || 
             (s.codigoFardo && normalizeText(s.codigoFardo).includes(normalizedSearch)) ||
             (s.items && s.items.some(i => normalizeText(i.codigoFardo || '').includes(normalizedSearch))) ||
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

  // Keep selectedSaleIds in sync with available sales
  const allCurrentSaleIds = filteredSales.map(s => s.id);
  const isAllSelected = allCurrentSaleIds.length > 0 && allCurrentSaleIds.every(id => selectedSaleIds.includes(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedSaleIds([]);
    } else {
      setSelectedSaleIds(allCurrentSaleIds);
    }
  };

  const toggleSelectSale = (id: string) => {
    setSelectedSaleIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Printing execution handlers
  const executePrintLabels = (
    queue: { sale: Sale; item: { codigoFardo: string; cantidad: number } }[],
    salesToUpdate: Sale[]
  ) => {
    if (queue.length === 0) return;
    affectedSalesRef.current = salesToUpdate;

    flushSync(() => {
      setActivePrintType('ETIQUETAS');
      setLabelsToPrint(queue);
      setInvoicesToPrint([]);
    });

    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error('Error al imprimir etiquetas térmicas:', err);
      }
    }, 150);
  };

  const executePrintInvoices = (salesList: Sale[]) => {
    if (salesList.length === 0) return;

    flushSync(() => {
      setActivePrintType('FACTURA');
      setInvoicesToPrint(salesList);
      setLabelsToPrint([]);
    });

    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error('Error al imprimir factura / nota de venta:', err);
      }
    }, 150);
  };

  // After print cleanup & update
  useEffect(() => {
    const handleAfterPrint = () => {
      if (affectedSalesRef.current.length > 0) {
        affectedSalesRef.current.forEach(s => {
          updateSale(s.id, { 
            impresa: true, 
            etiquetador: currentUser?.nombre || 'OPERARIO' 
          });
        });
        playSound('success');
        setPrintSuccessBanner(`Se enviaron ${labelsToPrint.length} etiqueta(s) a impresión.`);
        affectedSalesRef.current = [];
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
  }, [updateSale, playSound, currentUser, labelsToPrint.length]);

  // Click handler for single sale labels
  const handleOpenSaleLabels = (sale: Sale) => {
    const items = sale.items && sale.items.length > 0 
      ? sale.items 
      : [{ codigoFardo: sale.codigoFardo || 'N/A', cantidad: sale.cantidad || 1 }];

    if (items.length > 1) {
      // Multiple products: open simultaneous product label selection modal
      setMultiProductModalSale(sale);
      setSelectedMultiItemIndices(items.map((_, i) => i));
      setMultiItemMultiplier('by_product');
    } else {
      // Single product: print directly
      executePrintLabels([{ sale, item: items[0] }], [sale]);
    }
  };

  // Multi-product modal confirmation
  const handleConfirmMultiProductPrint = () => {
    if (!multiProductModalSale) return;
    const sale = multiProductModalSale;
    const items = sale.items && sale.items.length > 0 
      ? sale.items 
      : [{ codigoFardo: sale.codigoFardo || 'N/A', cantidad: sale.cantidad || 1 }];

    const queue: { sale: Sale; item: { codigoFardo: string; cantidad: number } }[] = [];

    selectedMultiItemIndices.forEach(idx => {
      const it = items[idx];
      if (!it) return;

      if (multiItemMultiplier === 'by_unit' && (it.cantidad || 1) > 1) {
        // Multiple physical units: generate 1 label per unit
        for (let u = 0; u < (it.cantidad || 1); u++) {
          queue.push({
            sale,
            item: { codigoFardo: it.codigoFardo, cantidad: 1 }
          });
        }
      } else {
        // 1 label for the product line item
        queue.push({
          sale,
          item: { codigoFardo: it.codigoFardo, cantidad: it.cantidad || 1 }
        });
      }
    });

    setMultiProductModalSale(null);
    executePrintLabels(queue, [sale]);
  };

  // Batch print labels for all selected sales
  const handlePrintBatchSelectedLabels = () => {
    const targetSales = filteredSales.filter(s => selectedSaleIds.includes(s.id));
    if (targetSales.length === 0) return;

    const queue: { sale: Sale; item: { codigoFardo: string; cantidad: number } }[] = [];

    targetSales.forEach(sale => {
      const items = sale.items && sale.items.length > 0 
        ? sale.items 
        : [{ codigoFardo: sale.codigoFardo || 'N/A', cantidad: sale.cantidad || 1 }];

      items.forEach(it => {
        queue.push({
          sale,
          item: { codigoFardo: it.codigoFardo, cantidad: it.cantidad || 1 }
        });
      });
    });

    executePrintLabels(queue, targetSales);
  };

  // Batch print invoices for all selected sales
  const handlePrintBatchSelectedInvoices = () => {
    const targetSales = filteredSales.filter(s => selectedSaleIds.includes(s.id));
    if (targetSales.length === 0) return;
    executePrintInvoices(targetSales);
  };

  const handleSaveSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    
    const selectedMethod = editingSale.metodoDespacho || (
      editingSale.tipoDespacho === DispatchType.RETIRO ? DispatchMethod.RETIRO_LOCAL :
      editingSale.tipoDespacho === DispatchType.AGENCIA ? DispatchMethod.BLUEXPRESS :
      DispatchMethod.TRANSPORTE_PROPIO
    );
    const matchingOption = DISPATCH_OPTIONS.find(o => o.label === selectedMethod || o.id === selectedMethod);

    const finalSale = {
      ...editingSale,
      datosCompletos: true,
      status: editingSale.status === SaleStatus.PENDIENTE ? SaleStatus.PENDIENTE : editingSale.status,
      tipoDespacho: editingSale.tipoDespacho || matchingOption?.type || DispatchType.DOMICILIO,
      metodoDespacho: selectedMethod,
      transportista: editingSale.transportista || matchingOption?.carrier || '',
      agencia: editingSale.agencia || matchingOption?.agency || ''
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* SUCCESS / FEEDBACK NOTIFICATION BANNER */}
      {printSuccessBanner && (
        <div className="fixed top-6 right-6 z-50 p-4 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 no-print">
          <CheckCircle2 size={20} className="flex-shrink-0" />
          <span className="text-xs font-black uppercase tracking-wider">{printSuccessBanner}</span>
        </div>
      )}

      {/* PRINT CONTAINER FOR SPOOLER (THERMAL LABELS & INVOICES) */}
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
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
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
          .label-container:last-child { 
            page-break-after: auto !important; 
            break-after: auto !important;
          }
          .invoice-container { 
            width: 100% !important; 
            box-sizing: border-box !important; 
            page-break-after: always !important; 
            break-after: page !important;
            overflow: visible !important;
          }
          .invoice-container:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
        @media screen {
          .print-only { display: none; }
        }
      `}</style>

      {/* HEADER & TABS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 no-print">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
              Control de Ventas & Clientes
            </span>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Printer size={12} /> Impresión Térmica Activa
            </span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Ventas y Clientes</h2>
          <p className="text-slate-500 italic font-medium">
            Impresión simultánea de etiquetas térmicas (100x150mm), emisión de Notas de Venta / Facturas y control de cobranza.
          </p>
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

      {/* SEARCH AND FILTERS */}
      <div className="relative group no-print">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={28} />
        <input 
          type="text" 
          placeholder="Buscar por cliente, producto, RUT o número de venta..."
          className="w-full pl-16 pr-8 py-5 rounded-[32px] border-2 border-slate-100 focus:border-slate-300 outline-none transition-all shadow-sm text-lg font-bold"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* CONTROLES ADICIONALES Y SELECTOR DE FORMATO TÉRMICO */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print shadow-xs">
        {/* Month & Sort Selector for Ready tab */}
        {activeTab === 'READY' ? (
          <div className="flex flex-wrap items-center gap-2">
            <select className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
              {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs uppercase" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
              {Array.from({length: 12}).map((_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('es-ES', { month: 'long' })}</option>)}
            </select>
            <select className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs" value={sortKey} onChange={(e) => setSortKey(e.target.value as 'numeroVenta' | 'fecha')}>
              <option value="numeroVenta">Nº Venta</option>
              <option value="fecha">Fecha</option>
            </select>
            <button className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs bg-white" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
              {sortOrder === 'asc' ? 'Asc ↑' : 'Desc ↓'}
            </button>
          </div>
        ) : (
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Mostrando {filteredSales.length} ventas en esta vista
          </div>
        )}

        {/* Formato de Etiquetas Térmicas (Estilo Cuaderno MDF) */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Formato Etiqueta Térmica:
          </span>
          <div className="flex items-center bg-white border border-slate-200 p-1 rounded-xl">
            <button
              onClick={() => handleFormatChange('logistica')}
              className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all ${
                labelFormat === 'logistica' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Logística Pro (100x150)
            </button>
            <button
              onClick={() => handleFormatChange('industrial')}
              className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all ${
                labelFormat === 'industrial' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Industrial
            </button>
            <button
              onClick={() => handleFormatChange('clasica')}
              className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all ${
                labelFormat === 'clasica' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Clásica
            </button>
          </div>
        </div>
      </div>

      {/* BARRA DE ACCIÓN MASIVA CUANDO HAY VENTAS SELECCIONADAS */}
      {selectedSaleIds.length > 0 && (
        <div className="sticky top-20 z-20 p-4 bg-slate-900 text-white rounded-3xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-3 no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black">
              {selectedSaleIds.length}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-white">
                {selectedSaleIds.length} venta(s) seleccionadas
              </p>
              <p className="text-[10px] text-slate-400">
                Listas para imprimir etiquetas simultáneas o emitir notas de venta
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrintBatchSelectedLabels}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
            >
              <Printer size={15} />
              Imprimir Todas las Etiquetas Térmicas
            </button>

            <button
              onClick={handlePrintBatchSelectedInvoices}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
            >
              <FileText size={15} />
              Imprimir Notas de Venta / Facturas
            </button>

            <button
              onClick={() => setSelectedSaleIds([])}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase transition-all"
            >
              Deseleccionar
            </button>
          </div>
        </div>
      )}

      {/* TABLA DE VENTAS CON ACCIONES DE IMPRESIÓN */}
      <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-7 px-5 w-12 text-center">
                  <button
                    onClick={toggleSelectAll}
                    className="p-1 text-slate-400 hover:text-slate-900 transition-colors"
                    title={isAllSelected ? "Deseleccionar todas" : "Seleccionar todas"}
                  >
                    {isAllSelected ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} />}
                  </button>
                </th>
                <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operación / Fecha</th>
                <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto / Mercadería</th>
                <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Monto</th>
                <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado Pago</th>
                <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Impresión & Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 font-bold">
                    No se encontraron ventas para los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isSelected = selectedSaleIds.includes(sale.id);
                  const isNotaVenta = sale.tipoVenta === SaleType.NOTA_VENTA || (Array.isArray(sale.items) && sale.items.length > 0);
                  const itemsCount = sale.items?.length || 1;

                  return (
                    <tr 
                      key={sale.id} 
                      className={`group transition-colors ${isSelected ? 'bg-emerald-50/40' : 'hover:bg-slate-50/80'}`}
                    >
                      {/* Checkbox Columna */}
                      <td className="py-6 px-5 text-center">
                        <button
                          onClick={() => toggleSelectSale(sale.id)}
                          className="p-1 text-slate-400 hover:text-slate-900 transition-colors"
                        >
                          {isSelected ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} />}
                        </button>
                      </td>

                      {/* Operación / Fecha */}
                      <td className="px-6 py-6 font-mono font-black text-slate-900 text-base">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span>#{sale.numeroVenta}</span>
                            {sale.comprobante && (
                              <a href={sale.comprobante} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-700">
                                <Camera size={15} />
                              </a>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-bold">
                            {parseLocalDate(sale.fecha).toLocaleDateString('es-CL')}
                          </span>
                          {sale.impresa && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md mt-1 w-fit">
                              <Printer size={10} /> Rotulada
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="px-6 py-6">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 uppercase tracking-tight leading-snug">
                            {sale.cliente}
                          </span>
                          {sale.telefono && (
                            <a 
                              href={`https://wa.me/${sale.telefono.replace(/\D/g, '')}`} 
                              target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 text-xs text-emerald-600 font-bold hover:underline"
                            >
                              <Phone size={12} /> {sale.telefono}
                            </a>
                          )}
                          <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                            Vendedor: {sale.vendedor || 'Desconocido'}
                          </span>
                          {sale.metodoDespacho && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md mt-1 w-fit">
                              <Truck size={10} /> {sale.metodoDespacho}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Producto / Mercadería */}
                      <td className="px-6 py-6">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Tag size={16} className="text-slate-400 flex-shrink-0" />
                            <span className="font-black text-slate-800 uppercase text-xs">
                              {isNotaVenta 
                                ? `Nota de Venta (${itemsCount} productos)` 
                                : stock.find(item => item.codigo === sale.codigoFardo)?.tipo || sale.codigoFardo}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold ml-6 line-clamp-2">
                            {isNotaVenta 
                              ? sale.items?.map(i => `${i.codigoFardo} (${i.cantidad} un.)`).join(', ') 
                              : (sale.variante || 'Producto estándar')}
                          </span>
                        </div>
                      </td>

                      {/* Monto */}
                      <td className="px-6 py-6 text-right font-mono">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-slate-900 text-xl tracking-tighter">
                            ${(sale.total || 0).toLocaleString('es-CL')}
                          </span>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1 space-y-0.5 text-right font-sans">
                            <div className="flex justify-end gap-1">
                              <span>Abonado:</span>
                              <span className="text-emerald-600">
                                ${(sale.montoAbonado !== undefined ? sale.montoAbonado : (sale.estadoPago === 'Pagado' ? sale.total : 0)).toLocaleString('es-CL')}
                              </span>
                            </div>
                            {((sale.total || 0) - (sale.montoAbonado !== undefined ? sale.montoAbonado : (sale.estadoPago === 'Pagado' ? sale.total : 0))) > 0 && (
                              <div className="flex justify-end gap-1">
                                <span>Saldo:</span>
                                <span className="text-red-500 font-black">
                                  ${((sale.total || 0) - (sale.montoAbonado !== undefined ? sale.montoAbonado : (sale.estadoPago === 'Pagado' ? sale.total : 0))).toLocaleString('es-CL')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Estado Pago */}
                      <td className="px-6 py-6 text-center">
                        <button 
                          onClick={() => togglePaymentStatus(sale)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${
                            sale.estadoPago === 'Pagado' 
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                              : 'bg-red-50 text-red-600 border border-red-100'
                          }`}
                        >
                          <BadgeDollarSign size={13} /> {sale.estadoPago}
                        </button>
                      </td>

                      {/* Impresión y Gestión */}
                      <td className="px-6 py-6 text-center">
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          {/* BOTONES DE IMPRESIÓN PROFESIONALES */}
                          <div className="grid grid-cols-2 gap-1.5">
                            {/* Botón Factura / Nota de Venta */}
                            <button
                              onClick={() => setInvoiceModalSale(sale)}
                              className="px-2.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
                              title="Ver e imprimir Nota de Venta / Factura completa"
                            >
                              <FileText size={13} />
                              <span>Factura</span>
                            </button>

                            {/* Botón Etiquetas Térmicas (Soporta múltiples productos simultáneos) */}
                            <button
                              onClick={() => handleOpenSaleLabels(sale)}
                              className="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
                              title={isNotaVenta ? `Imprimir etiquetas para los ${itemsCount} productos de esta Nota de Venta` : "Imprimir etiqueta térmica 100x150mm"}
                            >
                              <Printer size={13} />
                              <span>{itemsCount > 1 ? `Etiquetas (${itemsCount})` : 'Etiqueta'}</span>
                            </button>
                          </div>

                          {/* Botón Editar / Completar */}
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => setEditingSale(sale)}
                              className={`px-4 py-2 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                activeTab === 'PENDING' ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              <FileEdit size={13} />
                              <span>{activeTab === 'PENDING' ? 'Completar' : 'Editar'}</span>
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => { if(confirm('¿Eliminar esta venta?')) deleteSale(sale.id); }}
                                className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                title="Eliminar venta"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: IMPRESIÓN DE ETIQUETAS POR PRODUCTOS SIMULTÁNEOS (NOTAS DE VENTA) */}
      {multiProductModalSale && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Printer size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    Impresión de Etiquetas Simultáneas
                  </h3>
                  <p className="text-xs text-slate-500">
                    Nota de Venta #{multiProductModalSale.numeroVenta} • {multiProductModalSale.cliente}
                  </p>
                </div>
              </div>
              <button onClick={() => setMultiProductModalSale(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl">
                <X size={20} />
              </button>
            </div>

            {/* Opciones de Multiplicación de Etiquetas */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Modo de Generación:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMultiItemMultiplier('by_product')}
                  className={`p-3 rounded-2xl border-2 text-left font-black text-xs uppercase transition-all flex flex-col justify-between gap-1 ${
                    multiItemMultiplier === 'by_product'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>1 Etiqueta por Producto</span>
                  <span className="text-[10px] font-normal text-slate-500">1 rótulo por cada ítem de la lista</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMultiItemMultiplier('by_unit')}
                  className={`p-3 rounded-2xl border-2 text-left font-black text-xs uppercase transition-all flex flex-col justify-between gap-1 ${
                    multiItemMultiplier === 'by_unit'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>1 Etiqueta por Unidad/Bulto</span>
                  <span className="text-[10px] font-normal text-slate-500">Multiplicar por la cantidad física</span>
                </button>
              </div>
            </div>

            {/* Formato Térmico */}
            <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="font-bold text-slate-600 uppercase">Formato Térmico:</span>
              <div className="flex gap-1">
                {(['logistica', 'industrial', 'clasica'] as LabelFormat[]).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => handleFormatChange(fmt)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                      labelFormat === fmt ? 'bg-slate-900 text-white' : 'bg-white border text-slate-600'
                    }`}
                  >
                    {fmt === 'logistica' ? 'Logística (100x150)' : fmt === 'industrial' ? 'Industrial' : 'Clásica'}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Productos con Checkbox */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-black uppercase text-slate-500">
                <span>Seleccionar productos a rotular:</span>
                <button
                  onClick={() => {
                    const totalItems = multiProductModalSale.items?.length || 1;
                    if (selectedMultiItemIndices.length === totalItems) {
                      setSelectedMultiItemIndices([]);
                    } else {
                      setSelectedMultiItemIndices(Array.from({ length: totalItems }, (_, i) => i));
                    }
                  }}
                  className="text-emerald-600 hover:underline text-[11px]"
                >
                  {selectedMultiItemIndices.length === (multiProductModalSale.items?.length || 1) ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {(multiProductModalSale.items && multiProductModalSale.items.length > 0 
                  ? multiProductModalSale.items 
                  : [{ codigoFardo: multiProductModalSale.codigoFardo || 'N/A', cantidad: multiProductModalSale.cantidad || 1 }]
                ).map((item, idx) => {
                  const isChecked = selectedMultiItemIndices.includes(idx);
                  const stockItem = stock.find(s => s.codigo?.trim().toUpperCase() === item.codigoFardo?.trim().toUpperCase());
                  const productName = stockItem ? stockItem.tipo : item.codigoFardo;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedMultiItemIndices(prev => 
                          prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx]
                        );
                      }}
                      className={`p-3 rounded-2xl border-2 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isChecked 
                          ? 'border-emerald-500 bg-emerald-50/40 text-slate-900' 
                          : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isChecked ? <CheckSquare size={18} className="text-emerald-600 flex-shrink-0" /> : <Square size={18} className="text-slate-400 flex-shrink-0" />}
                        <div>
                          <p className="font-black text-xs uppercase leading-tight">{productName}</p>
                          <span className="text-[10px] font-mono text-slate-400">SKU: {item.codigoFardo}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] font-black uppercase">
                          Cant: {item.cantidad}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Acciones del Modal */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMultiProductModalSale(null)}
                className="px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={selectedMultiItemIndices.length === 0}
                onClick={handleConfirmMultiProductPrint}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <Printer size={16} />
                <span>Imprimir Etiquetas Seleccionadas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVISUALIZACIÓN DE FACTURA / NOTA DE VENTA */}
      {invoiceModalSale && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    Nota de Venta / Factura Interna
                  </h3>
                  <p className="text-xs text-slate-500">
                    Folio #{invoiceModalSale.numeroVenta} • {invoiceModalSale.cliente}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    executePrintInvoices([invoiceModalSale]);
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  <Printer size={16} />
                  Imprimir Documento
                </button>
                <button onClick={() => setInvoiceModalSale(null)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Render de la Factura / Nota de Venta */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner bg-slate-50/50 p-2 sm:p-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <Invoice sale={invoiceModalSale} stock={stock} />
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN DE VENTA */}
      {editingSale && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] max-w-4xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-1">Modificar Datos de Despacho</span>
                <h3 className="text-2xl font-black uppercase tracking-tight">
                  Venta #{editingSale.numeroVenta} • {editingSale.cliente}
                </h3>
              </div>
              <button onClick={() => setEditingSale(null)} className="relative z-10 p-3 hover:bg-white/10 rounded-full transition-colors">
                <X size={28} />
              </button>
            </div>
            
            <form onSubmit={handleSaveSale} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
                    <UserCheck size={14} className="text-indigo-500" /> Nombre del Cliente
                  </label>
                  <input required type="text" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm uppercase" placeholder="NOMBRE COMPLETO" value={editingSale.cliente || ''} onChange={(e) => setEditingSale({...editingSale, cliente: e.target.value.toUpperCase()})}/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
                    <Phone size={14} className="text-emerald-500" /> Teléfono / WhatsApp
                  </label>
                  <input required type="text" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm" placeholder="+56 9 ..." value={editingSale.telefono || ''} onChange={(e) => setEditingSale({...editingSale, telefono: e.target.value})}/>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
                    <CreditCard size={14} className="text-blue-500" /> RUT Cliente
                  </label>
                  <input required type="text" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm uppercase" placeholder="12.345.678-9" value={editingSale.rut || ''} onChange={(e) => setEditingSale({...editingSale, rut: e.target.value.toUpperCase()})}/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
                    <Info size={14} className="text-purple-500" /> Vendedor Asignado
                  </label>
                  <input required type="text" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm uppercase" placeholder="NOMBRE VENDEDOR" value={editingSale.vendedor || ''} onChange={(e) => setEditingSale({...editingSale, vendedor: e.target.value.toUpperCase()})}/>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 space-y-3">
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <BadgeDollarSign size={16} className="text-blue-500" /> Control de Pago y Abonos
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Estado Pago Actual</label>
                    <select 
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-100 rounded-xl font-black text-xs" 
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

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Medio de Pago</label>
                    <select 
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-100 rounded-xl font-black text-xs" 
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

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Abonado ($)</label>
                      <button 
                        type="button" 
                        onClick={() => setEditingSale({ ...editingSale, montoAbonado: editingSale.total || 0, estadoPago: 'Pagado' })}
                        className="text-[8px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full uppercase"
                      >
                        Totalizar
                      </button>
                    </div>
                    <input 
                      type="number" 
                      min="0"
                      max={editingSale.total || 0}
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-100 rounded-xl font-black text-xs font-mono" 
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
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
                  <MapPin size={14} className="text-amber-500" /> Dirección Completa Despacho
                </label>
                <textarea required className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm uppercase resize-y min-h-[90px]" placeholder="CALLE, N°, COMUNA, REGIÓN" value={editingSale.direccion || ''} onChange={(e) => setEditingSale({...editingSale, direccion: e.target.value.toUpperCase()})}/>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Truck size={14} className="text-blue-500" /> Método de Despacho
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DISPATCH_OPTIONS.map((opt) => {
                    const isSelected = editingSale.metodoDespacho === opt.label || (!editingSale.metodoDespacho && editingSale.tipoDespacho === opt.type && (opt.id === DispatchMethod.TRANSPORTE_PROPIO || opt.id === DispatchMethod.BLUEXPRESS || opt.id === DispatchMethod.RETIRO_LOCAL));
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          playSound('click');
                          let newDir = editingSale.direccion || '';
                          if (opt.id === DispatchMethod.RETIRO_LOCAL && (!newDir || newDir.trim() === '')) {
                            newDir = 'RETIRO EN LOCAL';
                          }
                          setEditingSale({
                            ...editingSale,
                            metodoDespacho: opt.label,
                            tipoDespacho: opt.type,
                            transportista: opt.carrier,
                            agencia: opt.agency,
                            direccion: newDir
                          });
                        }}
                        className={`p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400/30'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-600'}`}>
                            {opt.id === DispatchMethod.MERCADO_LIBRE && <ShoppingBag size={14} />}
                            {opt.id === DispatchMethod.TRANSPORTE_PROPIO && <Home size={14} />}
                            {opt.id === DispatchMethod.TAMARINDO && <Truck size={14} />}
                            {opt.id === DispatchMethod.BLUEXPRESS && <Building2 size={14} />}
                            {opt.id === DispatchMethod.RETIRO_LOCAL && <Store size={14} />}
                          </span>
                          <span className="font-black text-xs uppercase leading-tight">{opt.label}</span>
                        </div>
                        {isSelected && <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setEditingSale(null)} className="flex-1 py-4 border-2 border-slate-100 text-slate-400 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-xs">Cerrar</button>
                <button type="submit" className="flex-[2] py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 text-sm uppercase tracking-wider hover:bg-emerald-600 transition-all active:scale-95">
                  <Save size={18} /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
