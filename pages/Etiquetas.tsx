
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
  Edit3
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
  const [showDemo, setShowDemo] = useState(false);
  const [showPrinted, setShowPrinted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEtiquetadorModal, setShowEtiquetadorModal] = useState(false);
  const [etiquetadorName, setEtiquetadorName] = useState(() => {
    return localStorage.getItem('mdf_last_etiquetador') || currentUser?.nombre || '';
  });
  const [pendingSaleId, setPendingSaleId] = useState<string | null>(null); // 'all' for print all
  const [labelFormat, setLabelFormat] = useState<LabelFormat>(() => {
    return (localStorage.getItem('preferred_label_format') as LabelFormat) || 'logistica';
  });

  const handleFormatChange = (fmt: LabelFormat) => {
    setLabelFormat(fmt);
    localStorage.setItem('preferred_label_format', fmt);
  };

  const isAdmin = currentUser?.rol === StaffRole.ADMIN;
  const readyToPrint = sales.filter(s => {
    if (!s) return false;
    const matchesSearch = searchTerm === '' || 
                          s.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.numeroVenta.toString().includes(searchTerm) ||
                          (s.codigoFardo && s.codigoFardo.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    const isSellerReady = s.datosCompletos;
    if (!isSellerReady) {
      return false;
    }
    if (!showPrinted && s.impresa) return false;
    if (isAdmin) return true;
    return s.vendedor === currentUser?.nombre;
  }).sort((a, b) => b.numeroVenta - a.numeroVenta);

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
      printingSalesRef.current = [];
      playSound('success');
    }
    setTimeout(() => {
      setSalesToPrint([]);
      isPrintingRef.current = false;
    }, 500);
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      finalizePrint();
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [updateSale]);

  // Ejecución directa de impresión sin timeouts asíncronos que cancelen el gesto de usuario
  const executePrint = (salesList: Sale[], currentEtiquetador: string) => {
    if (salesList.length === 0) return;
    isPrintingRef.current = true;

    // Persistir el etiquetador
    if (currentEtiquetador.trim()) {
      localStorage.setItem('mdf_last_etiquetador', currentEtiquetador.trim());
    }

    const preparedSales = salesList.map(s => ({
      ...s,
      impresa: true,
      etiquetador: currentEtiquetador.trim() || 'OPERARIO'
    }));

    printingSalesRef.current = preparedSales;

    // Renderizar síncronamente las etiquetas en el DOM antes de invocar print()
    flushSync(() => {
      setSalesToPrint(preparedSales);
    });

    // Invocación directa inmediata (0 ms) en el hilo del evento del usuario
    try {
      window.print();
    } catch (err) {
      console.error('Error al invocar window.print():', err);
    }

    // Respaldo para navegadores donde window.print() es síncrono o afterprint tarda
    setTimeout(() => {
      finalizePrint();
    }, 400);
  };

  const handlePrintAll = () => {
    if (!etiquetadorName.trim()) {
      setPendingSaleId('all');
      setShowEtiquetadorModal(true);
      return;
    }
    executePrint(readyToPrint, etiquetadorName);
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
    } else if (pendingSaleId) {
      const sale = sales.find(s => s.id === pendingSaleId);
      if (sale) {
        executePrint([sale], etiquetadorName);
      }
    }
    setPendingSaleId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between no-print gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Centro de Etiquetado</h2>
            {etiquetadorName.trim() && (
              <button
                onClick={() => setShowEtiquetadorModal(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold transition-all border border-slate-200 group"
                title="Cambiar persona a cargo del etiquetado"
              >
                <User size={12} className="text-emerald-500" />
                <span>Etiquetador: <strong className="text-slate-900">{etiquetadorName}</strong></span>
                <Edit3 size={11} className="text-slate-400 group-hover:text-slate-600" />
              </button>
            )}
          </div>
          <p className="text-slate-500 font-medium italic">Cola de impresión térmica directa (100x150mm)</p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Buscar..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-40"
          />
          <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl cursor-pointer">
            <input type="checkbox" checked={showPrinted} onChange={e => setShowPrinted(e.target.checked)} />
            <span className="text-xs font-bold text-slate-700">Incluir impresos</span>
          </label>
          <button onClick={() => setShowDemo(!showDemo)} className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${showDemo ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
            {showDemo ? 'Ocultar Demo' : 'Ver Guía Visual'}
          </button>
          <button onClick={handlePrintAll} disabled={readyToPrint.length === 0} className="flex-[2] sm:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed">
            <Printer size={24} /> Imprimir Cola ({readyToPrint.length})
          </button>
        </div>
      </div>

      {/* Selector de Formato de Etiqueta */}
      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 no-print shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
              Formato de Etiqueta (100x150 mm)
            </h4>
            <p className="text-[11px] font-medium text-slate-500">
              Personaliza el diseño, tamaño de tipografía y recuadros divisorios
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => handleFormatChange('logistica')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
              labelFormat === 'logistica'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500/30'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <LayoutGrid size={14} className={labelFormat === 'logistica' ? 'text-emerald-400' : 'text-slate-500'} />
            <span>Cuadrícula Logística</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
              labelFormat === 'logistica' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              Recomendado
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFormatChange('industrial')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
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
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
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

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center no-print pb-20">
        {showDemo && (
          <div className="relative group w-full flex flex-col items-center">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-amber-500 text-white text-[10px] font-black px-4 py-1 rounded-full shadow-lg">ETIQUETA DE MUESTRA</div>
            <div className="relative bg-white p-4 border-4 border-amber-200 rounded-[32px] shadow-lg scale-[0.5] origin-top overflow-hidden">
              <Label sale={demoSale} stock={stock} format={labelFormat} />
            </div>
          </div>
        )}
        {readyToPrint.map((sale) => (
          <div key={sale.id} className="relative group animate-in fade-in slide-in-from-bottom duration-500 w-full flex flex-col items-center">
            <div className={`relative bg-white p-2 border-2 border-dashed ${sale.impresa ? 'border-emerald-300' : 'border-slate-200'} rounded-2xl hover:border-emerald-400 transition-all shadow-lg scale-[0.4] origin-top -mb-[90mm] overflow-hidden`}>
              {sale.impresa && (
                <div className="absolute top-4 right-4 flex flex-col items-end gap-1 z-10">
                  <div className="bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg">IMPRESO</div>
                  {sale.etiquetador && (
                    <div className="bg-white/90 text-slate-900 text-[8px] font-black px-2 py-1 rounded-full border border-emerald-200 shadow-sm flex items-center gap-1">
                      <User size={8} /> {sale.etiquetador}
                    </div>
                  )}
                </div>
              )}
              <Label sale={sale} stock={stock} format={labelFormat} />
              <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                <button onClick={() => handlePrintSingle(sale)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-2xl transition-all">
                  <Printer size={20} /> IMPRIMIR {sale.impresa ? 'OTRA VEZ' : 'AHORA'}
                </button>
              </div>
            </div>
            <p className="mt-1 text-[10px] font-black uppercase text-slate-400">Previsualización #{sale.numeroVenta}</p>
          </div>
        ))}
        {readyToPrint.length === 0 && !showDemo && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6"><Printer size={48} /></div>
            <h3 className="text-2xl font-black text-slate-400">No hay etiquetas pendientes</h3>
            <button onClick={() => setShowDemo(true)} className="mt-6 text-emerald-500 font-bold flex items-center gap-2 hover:underline"><AlertCircle size={16} /> Ver cómo se verá una etiqueta</button>
          </div>
        )}
      </div>
      <div className="hidden print-only">
        {salesToPrint.map((sale) => (
          (sale.items && sale.items.length > 0 ? sale.items : [{ codigoFardo: sale.codigoFardo || 'N/A', cantidad: sale.cantidad || 1 }]).map((item, idx) => (
            <div key={`${sale.id}-${idx}`} className="label-container">
              <Label sale={sale} stock={stock} item={item} format={labelFormat} />
            </div>
          ))
        ))}
      </div>

      {/* Etiquetador Modal */}
      {showEtiquetadorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 no-print">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in slide-in-from-bottom-8 duration-500">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase">¿Quién etiqueta?</h3>
                <p className="text-slate-500 text-sm font-medium">Ingresa el nombre de la persona a cargo</p>
              </div>
              <button onClick={() => setShowEtiquetadorModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
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
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={!etiquetadorName.trim()}
                  className="flex-[2] py-4 bg-emerald-500 disabled:bg-slate-200 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Iniciar Impresión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { 
            display: none !important; 
          }
          .print-only { 
            display: block !important; 
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100mm !important;
          }
          .label-container { 
            width: 100mm !important; 
            height: 150mm !important; 
            box-sizing: border-box !important; 
            page-break-after: always !important; 
            break-after: page !important;
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
