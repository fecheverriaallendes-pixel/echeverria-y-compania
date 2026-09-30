import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { 
  Printer, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  X,
  LayoutGrid,
  Truck,
  FileText,
  SlidersHorizontal,
  Edit3,
  Eye,
  Check,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  RefreshCw,
  Sparkles,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/GlobalContext';
import { Sale, SaleType, SaleStatus, CommissionType, StaffRole, LOGO_URL, LabelFormat, DispatchType } from '../types';
import { Label } from '../components/Label';

export default function Etiquetas() {
  const { sales, stock, currentUser, updateSale, playSound } = useStore();
  const [salesToPrint, setSalesToPrint] = useState<Sale[]>([]);
  const printingSalesRef = useRef<Sale[]>([]);
  const isPrintingRef = useRef(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [showPrinted, setShowPrinted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEtiquetadorModal, setShowEtiquetadorModal] = useState(false);
  const [etiquetadorName, setEtiquetadorName] = useState(() => {
    return localStorage.getItem('mdf_last_etiquetador') || currentUser?.nombre || '';
  });
  const [pendingSaleId, setPendingSaleId] = useState<string | null>(null); // 'all' | 'selected' | saleId
  const [labelFormat, setLabelFormat] = useState<LabelFormat>(() => {
    return (localStorage.getItem('preferred_label_format') as LabelFormat) || 'logistica';
  });

  // Batch selection state
  const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);

  // Queue Preview Modal State
  const [showQueuePreviewModal, setShowQueuePreviewModal] = useState(false);
  const [previewModalIndex, setPreviewModalIndex] = useState(0);

  // Success / Feedback notification banner
  const [printSuccessBanner, setPrintSuccessBanner] = useState<string | null>(null);

  const handleFormatChange = (fmt: LabelFormat) => {
    setLabelFormat(fmt);
    localStorage.setItem('preferred_label_format', fmt);
  };

  const isPrivileged = currentUser?.rol === StaffRole.ADMIN || 
                       currentUser?.rol === StaffRole.BODEGA || 
                       currentUser?.rol === StaffRole.DESPACHO;

  // Filter queue of sales ready to print
  const readyToPrint = sales.filter(s => {
    if (!s) return false;
    const matchesSearch = searchTerm === '' || 
                          (s.cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.numeroVenta || '').toString().includes(searchTerm) ||
                          (s.codigoFardo && s.codigoFardo.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (s.metodoDespacho && s.metodoDespacho.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    // Venta lista para rotular si tiene datos completos o es normal/nota de venta o tiene datos mínimos de envío
    const isSellerReady = s.datosCompletos || 
                          s.tipoVenta === SaleType.NORMAL || 
                          s.tipoVenta === SaleType.NOTA_VENTA || 
                          !!(s.cliente && (s.direccion || s.telefono));
    if (!isSellerReady) {
      return false;
    }
    if (!showPrinted && s.impresa) return false;
    if (isPrivileged) return true;
    return s.vendedor === currentUser?.nombre;
  }).sort((a, b) => b.numeroVenta - a.numeroVenta);

  // Auto-sync selected IDs when readyToPrint changes
  useEffect(() => {
    setSelectedSaleIds(prev => {
      // Keep only IDs that are still in readyToPrint
      const valid = prev.filter(id => readyToPrint.some(s => s.id === id));
      return valid;
    });
  }, [readyToPrint]);

  const allReadyIds = readyToPrint.map(s => s.id);
  const isAllSelected = allReadyIds.length > 0 && allReadyIds.every(id => selectedSaleIds.includes(id));
  
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedSaleIds([]);
    } else {
      setSelectedSaleIds(allReadyIds);
    }
  };

  const toggleSelectSale = (id: string) => {
    setSelectedSaleIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Determine effective target sales for batch actions
  const effectiveSalesToPrint = selectedSaleIds.length > 0 
    ? readyToPrint.filter(s => selectedSaleIds.includes(s.id))
    : readyToPrint;

  const demoSale: Sale = {
    id: 'demo', 
    numeroVenta: 1042, 
    tipoVenta: SaleType.NORMAL, 
    cliente: 'JUAN IGNACIO PÉREZ GONZÁLEZ',
    telefono: '+56987654321', 
    rut: '18.452.319-K', 
    codigoFardo: 'TEC-001',
    direccion: 'AV. PROVIDENCIA 1234, DEPTO 502, PROVIDENCIA, SANTIAGO', 
    variante: 'SMARTWATCH ULTRA HD 49MM TITANIO',
    metodoDespacho: 'STARKEN EXPRESS',
    tipoDespacho: DispatchType.DOMICILIO,
    total: 185000, 
    datosCompletos: true, 
    enviado: false, 
    status: SaleStatus.PENDIENTE,
    fecha: new Date().toLocaleDateString(), 
    hora: '14:30', 
    vendedor: 'ADMINISTRACIÓN',
    valorUnitario: 185000, 
    cantidad: 1, 
    estadoPago: 'Pagado', 
    observaciones: 'Conserjería 24 hrs. Llamar antes de entregar.',
    tipoComision: CommissionType.FARDO_NORMAL
  };

  const finalizePrint = () => {
    const active = printingSalesRef.current;
    if (active.length > 0) {
      active.forEach(s => {
        updateSale(s.id, { impresa: true, etiquetador: s.etiquetador });
      });
      playSound('success');
      setPrintSuccessBanner(`Se enviaron ${active.length} etiquetas a impresión.`);
      printingSalesRef.current = [];
    }
    // Retener las etiquetas en el DOM durante un tiempo prudente para asegurar que el spooler del navegador las procese
    setTimeout(() => {
      setSalesToPrint([]);
      setIsPrinting(false);
      isPrintingRef.current = false;
    }, 1200);
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      finalizePrint();
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [updateSale, playSound]);

  // Ejecución segura de impresión térmica múltiple
  const executePrint = (salesList: Sale[], currentEtiquetador: string) => {
    if (salesList.length === 0) return;
    isPrintingRef.current = true;
    setIsPrinting(true);

    if (currentEtiquetador.trim()) {
      localStorage.setItem('mdf_last_etiquetador', currentEtiquetador.trim());
    }

    const preparedSales = salesList.map(s => ({
      ...s,
      impresa: true,
      etiquetador: currentEtiquetador.trim() || 'OPERARIO'
    }));

    printingSalesRef.current = preparedSales;

    // 1. Sincronizar DOM de inmediato con las etiquetas a imprimir
    flushSync(() => {
      setSalesToPrint(preparedSales);
    });

    // 2. Dar 150ms al navegador para calcular estilos, imágenes y fuentes antes de abrir el cuadro de impresión
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error('Error al invocar window.print():', err);
      }
    }, 150);
  };

  const handlePrintAll = () => {
    if (!etiquetadorName.trim()) {
      setPendingSaleId('all');
      setShowEtiquetadorModal(true);
      return;
    }
    executePrint(readyToPrint, etiquetadorName);
  };

  const handlePrintSelected = () => {
    if (effectiveSalesToPrint.length === 0) return;
    if (!etiquetadorName.trim()) {
      setPendingSaleId('selected');
      setShowEtiquetadorModal(true);
      return;
    }
    executePrint(effectiveSalesToPrint, etiquetadorName);
  };

  const handlePrintSingle = (sale: Sale) => {
    if (!etiquetadorName.trim()) {
      setPendingSaleId(sale.id);
      setShowEtiquetadorModal(true);
      return;
    }
    executePrint([sale], etiquetadorName);
  };

  const confirmPrint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!etiquetadorName.trim()) return;
    
    setShowEtiquetadorModal(false);

    if (pendingSaleId === 'all') {
      executePrint(readyToPrint, etiquetadorName);
    } else if (pendingSaleId === 'selected') {
      executePrint(effectiveSalesToPrint, etiquetadorName);
    } else if (pendingSaleId) {
      const sale = sales.find(s => s.id === pendingSaleId);
      if (sale) {
        executePrint([sale], etiquetadorName);
      }
    }
    setPendingSaleId(null);
  };

  const openQueuePreview = (startIndex = 0) => {
    setPreviewModalIndex(Math.max(0, Math.min(startIndex, readyToPrint.length - 1)));
    setShowQueuePreviewModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between no-print gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Centro de Etiquetado</h2>
            {etiquetadorName.trim() && (
              <button
                type="button"
                onClick={() => setShowEtiquetadorModal(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold transition-all border border-slate-200 group cursor-pointer"
                title="Cambiar persona a cargo del etiquetado"
              >
                <User size={12} className="text-emerald-500" />
                <span>Etiquetador: <strong className="text-slate-900">{etiquetadorName}</strong></span>
                <Edit3 size={11} className="text-slate-400 group-hover:text-slate-600" />
              </button>
            )}
          </div>
          <p className="text-slate-500 font-medium italic">
            Cola de impresión térmica directa (100x150 mm) para despacho
          </p>
        </div>

        {/* Top actions & filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Buscar por cliente, N° o código..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-56"
          />

          <label className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors">
            <input 
              type="checkbox" 
              checked={showPrinted} 
              onChange={e => setShowPrinted(e.target.checked)} 
              className="accent-emerald-600 rounded"
            />
            <span className="text-xs font-bold text-slate-700">Incluir impresos</span>
          </label>

          <button 
            type="button"
            onClick={() => setShowDemo(!showDemo)} 
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              showDemo ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {showDemo ? 'Ocultar Demo' : 'Ver Guía'}
          </button>

          {/* Primary Print Queue Button */}
          <button 
            type="button"
            onClick={handlePrintAll} 
            disabled={readyToPrint.length === 0} 
            className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Printer size={18} />
            <span>Imprimir Toda la Cola ({readyToPrint.length})</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner if print was triggered */}
      {printSuccessBanner && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-900 animate-in fade-in duration-200 no-print">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={20} />
            <span className="text-xs font-bold">{printSuccessBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setPrintSuccessBanner(null)}
            className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Batch Control Toolbar & Queue Summary */}
      {readyToPrint.length > 0 && (
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-800 transition-colors cursor-pointer"
            >
              {isAllSelected ? (
                <>
                  <CheckSquare size={16} className="text-emerald-600" />
                  <span>Deseleccionar Todas</span>
                </>
              ) : (
                <>
                  <Square size={16} className="text-slate-400" />
                  <span>Seleccionar Todas ({readyToPrint.length})</span>
                </>
              )}
            </button>

            <span className="text-xs font-bold text-slate-500">
              {selectedSaleIds.length > 0 ? (
                <span className="text-emerald-700 font-black">
                  {selectedSaleIds.length} de {readyToPrint.length} seleccionadas
                </span>
              ) : (
                <span>{readyToPrint.length} etiquetas listas para imprimir</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Open Interactive Queue Preview Modal */}
            <button
              type="button"
              onClick={() => openQueuePreview(0)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border border-indigo-200"
            >
              <Eye size={16} />
              <span>Previsualizar Cola Completa</span>
            </button>

            {/* Print Selected or All */}
            <button
              type="button"
              onClick={selectedSaleIds.length > 0 ? handlePrintSelected : handlePrintAll}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Printer size={16} />
              <span>
                {selectedSaleIds.length > 0
                  ? `Imprimir Seleccionadas (${selectedSaleIds.length})`
                  : `Imprimir Cola (${readyToPrint.length})`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Selector de Formato de Etiqueta */}
      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 no-print shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
              Formato de Etiqueta Térmica (100x150 mm)
            </h4>
            <p className="text-[11px] font-medium text-slate-500">
              Personaliza el diseño para tu impresora de rollo continuo
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => handleFormatChange('logistica')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border cursor-pointer ${
              labelFormat === 'logistica'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500/30'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <LayoutGrid size={14} className={labelFormat === 'logistica' ? 'text-emerald-400' : 'text-slate-500'} />
            <span>Cuadrícula Logística</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
              labelFormat === 'logistica' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              Recomendado
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFormatChange('industrial')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border cursor-pointer ${
              labelFormat === 'industrial'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500/30'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Truck size={14} className={labelFormat === 'industrial' ? 'text-amber-400' : 'text-slate-500'} />
            <span>Industrial / Alto Contraste</span>
          </button>

          <button
            type="button"
            onClick={() => handleFormatChange('clasica')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border cursor-pointer ${
              labelFormat === 'clasica'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500/30'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <FileText size={14} className={labelFormat === 'clasica' ? 'text-blue-400' : 'text-slate-500'} />
            <span>Clásica Mejorada</span>
          </button>
        </div>
      </div>

      {/* Grid of Queued Labels with Fixed Dimensions (No overlapping hacks) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center no-print pb-20">
        {showDemo && (
          <div className="flex flex-col items-center gap-2 w-full max-w-[210px]">
            <span className="bg-amber-500 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-xs uppercase tracking-wider">
              Etiqueta de Muestra
            </span>
            <div className="relative w-[210px] h-[315px] rounded-2xl overflow-hidden border-2 border-amber-300 bg-white shadow-md">
              <div 
                style={{ 
                  transform: 'scale(0.555)', 
                  transformOrigin: 'top left', 
                  width: '100mm', 
                  height: '150mm' 
                }}
                className="pointer-events-none select-none"
              >
                <Label sale={demoSale} stock={stock} format={labelFormat} />
              </div>
            </div>
            <p className="text-[10px] font-mono text-slate-400">Guía visual de prueba</p>
          </div>
        )}

        {readyToPrint.map((sale, idx) => {
          const isSelected = selectedSaleIds.includes(sale.id);

          return (
            <div 
              key={sale.id} 
              className="flex flex-col items-center gap-2 w-full max-w-[210px] animate-in fade-in duration-300"
            >
              {/* Card Container with exact proportional 100mm:150mm scale */}
              <div 
                className={`relative w-[210px] h-[315px] rounded-2xl overflow-hidden border-2 bg-white shadow-md hover:shadow-xl transition-all group ${
                  isSelected 
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30' 
                    : sale.impresa 
                      ? 'border-emerald-200' 
                      : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                {/* Scaled Label */}
                <div 
                  style={{ 
                    transform: 'scale(0.555)', 
                    transformOrigin: 'top left', 
                    width: '100mm', 
                    height: '150mm' 
                  }}
                  className="pointer-events-none select-none"
                >
                  <Label sale={sale} stock={stock} format={labelFormat} />
                </div>

                {/* Top Overlay Badge & Selection Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectSale(sale.id);
                    }}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shadow-md cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-white/90 text-slate-600 hover:bg-white border border-slate-300'
                    }`}
                  >
                    {isSelected ? <Check size={14} className="stroke-[3]" /> : <Square size={14} />}
                  </button>
                </div>

                {/* Print Status Badge */}
                {sale.impresa && (
                  <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
                    <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs">
                      IMPRESO
                    </span>
                    {sale.etiquetador && (
                      <span className="bg-white/90 backdrop-blur-xs text-slate-800 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs flex items-center gap-1">
                        <User size={8} /> {sale.etiquetador}
                      </span>
                    )}
                  </div>
                )}

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3 backdrop-blur-xs z-20">
                  <button 
                    type="button"
                    onClick={() => openQueuePreview(idx)} 
                    className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Eye size={15} /> Ver Grande
                  </button>
                  <button 
                    type="button"
                    onClick={() => handlePrintSingle(sale)} 
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Printer size={15} /> Imprimir Esta
                  </button>
                </div>
              </div>

              {/* Card Footer Info */}
              <div className="text-center w-full">
                <p className="text-[11px] font-black uppercase text-slate-800 truncate">
                  #{sale.numeroVenta} • {sale.cliente}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase truncate">
                  {sale.metodoDespacho || 'Despacho'}
                </p>
              </div>
            </div>
          );
        })}

        {readyToPrint.length === 0 && !showDemo && (
          <div className="col-span-full py-28 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 mb-4 shadow-inner">
              <Printer size={36} />
            </div>
            <h3 className="text-xl font-black text-slate-700">No hay etiquetas pendientes en la cola</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Las ventas completadas y pendientes de despacho aparecerán automáticamente aquí para ser rotuladas.
            </p>
            <button 
              type="button"
              onClick={() => setShowDemo(true)} 
              className="mt-5 text-emerald-600 hover:text-emerald-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer underline"
            >
              <AlertCircle size={15} /> Ver muestra de etiqueta térmica
            </button>
          </div>
        )}
      </div>

      {/* PRINT CONTAINER FOR THERMAL PRINTER (100x150 mm multiple pages) */}
      <div id="thermal-labels-print-area" className="hidden print-only">
        {salesToPrint.map((sale) => (
          (sale.items && sale.items.length > 0 
            ? sale.items 
            : [{ codigoFardo: sale.codigoFardo || 'N/A', cantidad: sale.cantidad || 1 }]
          ).map((item, idx) => (
            <div key={`${sale.id}-${idx}`} className="label-container">
              <Label sale={sale} stock={stock} item={item} format={labelFormat} />
            </div>
          ))
        ))}
      </div>

      {/* QUEUE PREVIEW MODAL (INTERACTIVE FULL RESOLUTION VIEWER) */}
      {showQueuePreviewModal && readyToPrint.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-between animate-in fade-in duration-200 no-print select-none">
          {/* Modal Header */}
          <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Printer size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-black uppercase tracking-tight truncate">
                  Previsualización de Cola Térmica (100x150 mm)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Etiqueta <strong className="text-amber-400">{previewModalIndex + 1}</strong> de <strong className="text-slate-200">{readyToPrint.length}</strong> • Venta #{readyToPrint[previewModalIndex]?.numeroVenta}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const currentSale = readyToPrint[previewModalIndex];
                  if (currentSale) handlePrintSingle(currentSale);
                }}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer size={14} />
                <span>Imprimir Esta</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowQueuePreviewModal(false);
                  handlePrintAll();
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
              >
                <Printer size={14} />
                <span>Imprimir Todas ({readyToPrint.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQueuePreviewModal(false)}
                className="p-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition-colors cursor-pointer ml-2"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Modal Central Label Area */}
          <div className="relative flex-1 flex items-center justify-center p-4 sm:p-6 overflow-auto">
            {readyToPrint[previewModalIndex] && (
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden p-1 border-4 border-slate-700/60 max-w-full">
                <Label 
                  sale={readyToPrint[previewModalIndex]} 
                  stock={stock} 
                  format={labelFormat} 
                />
              </div>
            )}

            {/* Prev Button */}
            {readyToPrint.length > 1 && (
              <button
                type="button"
                onClick={() => setPreviewModalIndex(prev => (prev - 1 + readyToPrint.length) % readyToPrint.length)}
                className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700 shadow-2xl flex items-center justify-center backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer z-20"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {/* Next Button */}
            {readyToPrint.length > 1 && (
              <button
                type="button"
                onClick={() => setPreviewModalIndex(prev => (prev + 1) % readyToPrint.length)}
                className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700 shadow-2xl flex items-center justify-center backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer z-20"
              >
                <ChevronRight size={28} />
              </button>
            )}
          </div>

          {/* Modal Footer Pager Strip */}
          <div className="px-6 py-3 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between gap-4 z-10">
            <div className="text-xs text-slate-400 font-mono">
              Cliente: <strong className="text-white">{readyToPrint[previewModalIndex]?.cliente}</strong> • Destino: <strong className="text-white">{readyToPrint[previewModalIndex]?.direccion || 'Retiro'}</strong>
            </div>

            {/* Quick switcher dots/counter */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-xs sm:max-w-md py-1">
              {readyToPrint.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setPreviewModalIndex(idx)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    previewModalIndex === idx
                      ? 'bg-emerald-500 text-white scale-110 shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  #{s.numeroVenta}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Etiquetador Modal */}
      {showEtiquetadorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 no-print">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in slide-in-from-bottom-8 duration-500">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase">¿Quién etiqueta?</h3>
                <p className="text-slate-500 text-sm font-medium">Ingresa el nombre de la persona a cargo</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowEtiquetadorModal(false)} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={confirmPrint} className="space-y-6">
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Nombre del etiquetador..."
                  value={etiquetadorName}
                  onChange={(e) => setEtiquetadorName(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-xl text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowEtiquetadorModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={!etiquetadorName.trim()}
                  className="flex-[2] py-4 bg-emerald-500 disabled:bg-slate-200 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  Iniciar Impresión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT STYLES SPECIFICATION FOR 100x150MM THERMAL MULTI-PAGE PRINTING */}
      <style>{`
        @media print {
          @page { 
            size: 100mm 150mm portrait; 
            margin: 0; 
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
            width: 100mm !important;
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

          /* Garantizar que los bloques oscuros conserven su fondo negro y texto blanco */
          .bg-black, [class*="bg-black"], [style*="background-color: #000"], [style*="background-color: rgb(0, 0, 0)"] {
            background-color: #000000 !important;
            color: #ffffff !important;
            box-shadow: inset 0 0 0 1000px #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .bg-black *, [class*="bg-black"] * {
            color: #ffffff !important;
          }
          /* Excepciones para elementos claros dentro de bloques oscuros */
          .bg-black .bg-white, [class*="bg-black"] .bg-white,
          .bg-black [class*="bg-white"], [class*="bg-black"] [class*="bg-white"] {
            background-color: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
          }
          .bg-black .bg-white *, [class*="bg-black"] .bg-white *,
          .bg-black [class*="bg-white"] *, [class*="bg-black"] [class*="bg-white"] * {
            color: #000000 !important;
          }
        }
      `}</style>
    </div>
  );
}
