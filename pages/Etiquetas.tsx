
import React, { useState, useEffect, useRef } from 'react';
import { Printer, ArrowLeft, CheckCircle2, AlertCircle, User, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/GlobalContext';
import { Sale, SaleType, SaleStatus, CommissionType, StaffRole } from '../types';

const LOGO_URL = "https://i.ibb.co/ymf3nYWv/Chat-GPT-Image-10-jun-2026-18-30-56.png";

// Update Etiqueta.tsx to handle loop over items if present, otherwise single item.

// I will re-implement the Label rendering in a more flexible way to handle multiple items.
// Actually, it's better to create a new component or simply update the existing one.
// Let's update Etiquetas.tsx.

import { Label } from '../components/Label';

export default function Etiquetas() {
  const { sales, stock, currentUser, updateSale, playSound } = useStore();
  const [salesToPrint, setSalesToPrint] = useState<Sale[]>([]);
  // Use a ref to store sales currently in the queue so the print callback can access them safely
  const printingSalesRef = useRef<Sale[]>([]);
  const [showDemo, setShowDemo] = useState(false);
  const [showPrinted, setShowPrinted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEtiquetadorModal, setShowEtiquetadorModal] = useState(false);
  const [etiquetadorName, setEtiquetadorName] = useState('');
  const [pendingSaleId, setPendingSaleId] = useState<string | null>(null); // 'all' for print all
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
      console.log(`Sale ${s.numeroVenta}: datosCompletos=${s.datosCompletos}`);
      return false;
    }
    if (!showPrinted && s.impresa) return false;
    if (isAdmin) return true;
    return s.vendedor === currentUser?.nombre;
  }).sort((a, b) => b.numeroVenta - a.numeroVenta);

  // Fix: Added missing tipoComision property to satisfy the Sale interface
  const demoSale: Sale = {
    id: 'demo', numeroVenta: 9999, tipoVenta: SaleType.NORMAL, cliente: 'CLIENTE DE PRUEBA',
    telefono: '+569 1234 5678', rut: '12.345.678-9', codigoFardo: 'F-DEMO',
    direccion: 'AVENIDA CENTRAL 123, SANTIAGO', variante: 'FARDO PREMIUM',
    total: 150000, datosCompletos: true, enviado: false, status: SaleStatus.PENDIENTE,
    fecha: new Date().toLocaleDateString(), hora: '12:00', vendedor: 'ADMIN',
    valorUnitario: 150000, cantidad: 1, estadoPago: 'Pagado', observaciones: '',
    tipoComision: CommissionType.FARDO_NORMAL
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      if (printingSalesRef.current.length > 0) {
        printingSalesRef.current.forEach(s => {
          updateSale(s.id, { impresa: true, etiquetador: s.etiquetador });
        });
        printingSalesRef.current = [];
      }
      setSalesToPrint([]);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [updateSale]);

  useEffect(() => {
    if (salesToPrint.length > 0) {
      printingSalesRef.current = salesToPrint;
      
      const timer = setTimeout(() => {
        window.print();
        
        // Fallback for environments where afterprint might not trigger or we want immediate sync
        const activePrintingSales = printingSalesRef.current;
        if (activePrintingSales.length > 0) {
          activePrintingSales.forEach(s => {
            updateSale(s.id, { impresa: true, etiquetador: s.etiquetador });
          });
          printingSalesRef.current = [];
          setSalesToPrint([]);
        }
      }, 250);
      
      return () => clearTimeout(timer);
    }
  }, [salesToPrint, updateSale]);

  const handlePrintAll = () => {
    if (!etiquetadorName) {
      setPendingSaleId('all');
      setShowEtiquetadorModal(true);
      return;
    }
    const updatedSales = readyToPrint.map(s => ({ ...s, impresa: true, etiquetador: etiquetadorName }));
    setSalesToPrint(updatedSales);
    setShowEtiquetadorModal(false);
  };

  const handlePrintSingle = (sale: Sale) => {
    if (!etiquetadorName) {
      setPendingSaleId(sale.id);
      setShowEtiquetadorModal(true);
      return;
    }
    const updated = { ...sale, impresa: true, etiquetador: etiquetadorName };
    setSalesToPrint([updated]);
    setShowEtiquetadorModal(false);
  };

  const confirmPrint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!etiquetadorName.trim()) return;
    
    if (pendingSaleId === 'all') {
      const updatedSales = readyToPrint.map(s => ({ ...s, impresa: true, etiquetador: etiquetadorName }));
      setSalesToPrint(updatedSales);
    } else if (pendingSaleId) {
      const sale = sales.find(s => s.id === pendingSaleId);
      if (sale) {
        const updated = { ...sale, impresa: true, etiquetador: etiquetadorName };
        setSalesToPrint([updated]);
      }
    }
    
    setShowEtiquetadorModal(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between no-print gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Centro de Etiquetado</h2>
          <p className="text-slate-500 font-medium italic">Cola de impresión térmica (100x150mm)</p>
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
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center no-print pb-20">
        {showDemo && (
          <div className="relative group w-full flex flex-col items-center">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-amber-500 text-white text-[10px] font-black px-4 py-1 rounded-full shadow-lg">ETIQUETA DE MUESTRA</div>
            <div className="relative bg-white p-4 border-4 border-amber-200 rounded-[32px] shadow-lg scale-[0.5] origin-top overflow-hidden"><Label sale={demoSale} stock={stock} /></div>
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
              <Label sale={sale} stock={stock} />
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
          <div key={sale.id} className="label-container">
            <Label sale={sale} stock={stock} />
          </div>
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
          @page { size: 100mm 150mm portrait; margin: 0; }
          body { margin: 0; padding: 0; background: white !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .label-container { width: 100mm; height: 150mm; box-sizing: border-box; page-break-after: always; display: flex; align-items: center; justify-content: center; overflow: hidden; }
          .label-container:last-child { page-break-after: auto; }
        }
      `}</style>
    </div>
  );
}
