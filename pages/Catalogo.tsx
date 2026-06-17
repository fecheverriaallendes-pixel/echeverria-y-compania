
import React, { useState, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { 
  Printer, 
  LayoutGrid, 
  List, 
  Search, 
  Package, 
  Tag, 
  Clock,
  ChevronLeft,
  ArrowUpDown,
  Layers,
  Square,
  Filter,
  FileDown,
  MessageCircle,
  Share2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/GlobalContext';
import { StockItem } from '../types';

// Extend jsPDF interface for autotable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

const LOGO_URL = "https://i.ibb.co/ymf3nYWv/Chat-GPT-Image-10-jun-2026-18-30-56.png";

type SortOption = 'alpha-asc' | 'alpha-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc';

const TableHeader = () => (
  <thead>
    <tr className="border-b-2 border-slate-900 bg-slate-50 print:bg-slate-100">
      <th className="px-2 py-2 text-[10px] font-black uppercase text-left w-12">Cód</th>
      <th className="px-2 py-2 text-[10px] font-black uppercase text-left">Producto</th>
      <th className="px-2 py-2 text-[10px] font-black uppercase text-right w-20">Valor</th>
      <th className="px-2 py-2 text-[10px] font-black uppercase text-center w-8">Stk</th>
    </tr>
  </thead>
);

const ProductRow: React.FC<{ item: StockItem }> = ({ item }) => (
  <tr className="border-b border-slate-100 print:border-slate-200">
    <td className="px-2 py-1.5 font-mono font-bold text-slate-400 text-[10px] uppercase">
      {item.codigo.replace('MDF-','')}
    </td>
    <td className="px-2 py-1.5 product-detail-cell">
      <div className="flex flex-col">
        <span className="font-black text-slate-900 uppercase text-[11px] leading-tight italic line-clamp-2">
          {item.tipo}
        </span>
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
          ({item.proveedor})
        </span>
      </div>
    </td>
    <td className="px-2 py-1.5 text-right font-black text-slate-900 text-xs">
      ${item.precioSugerido.toLocaleString('es-CL')}
    </td>
    <td className="px-2 py-1.5 text-center">
      <span className={`font-black text-[10px] ${item.stockActual < 5 ? 'text-red-600' : 'text-slate-900'}`}>
        {item.stockActual}
      </span>
    </td>
  </tr>
);

export default function Catalogo() {
  const { stock, playSound } = useStore();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('TODOS');
  const [categoryFilter, setCategoryFilter] = useState<'TODOS' | 'FARDO' | 'LOTE'>('TODOS');
  const [sortOrder, setSortOrder] = useState<SortOption>('alpha-asc');

  const searchParams = new URLSearchParams(location.search);
  const [viewMode, setViewMode] = useState<'digital' | 'print'>((searchParams.get('mode') as 'digital' | 'print') || 'digital');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);

  const uniqueProviders = useMemo(() => {
    const providers = stock.map(item => (item.proveedor || '').trim().toUpperCase()).filter(Boolean);
    return ['TODOS', ...Array.from(new Set(providers))].sort();
  }, [stock]);

  const normalizeText = (text: string) => 
    (text || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const sortedAndFilteredStock = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);
    let result = stock.filter(item => {
      // Ocultar productos con stock 0
      if (item.stockActual <= 0) return false;

      const matchesSearch = normalizeText(item.tipo || '').includes(normalizedSearch) || 
                           normalizeText(item.codigo || '').includes(normalizedSearch);
      const matchesProvider = providerFilter === 'TODOS' || (item.proveedor || '').toUpperCase() === providerFilter;
      
      const itemCategory = item.categoria || 'FARDO';
      const matchesCategory = categoryFilter === 'TODOS' || itemCategory === categoryFilter;

      return matchesSearch && matchesProvider && matchesCategory;
    });

    return result.sort((a, b) => {
      const tipoA = a.tipo || '';
      const tipoB = b.tipo || '';
      switch (sortOrder) {
        case 'alpha-asc': return tipoA.localeCompare(tipoB);
        case 'alpha-desc': return tipoB.localeCompare(tipoA);
        case 'price-asc': return (a.precioSugerido || 0) - (b.precioSugerido || 0);
        case 'price-desc': return (b.precioSugerido || 0) - (a.precioSugerido || 0);
        case 'stock-asc': return (a.stockActual || 0) - (b.stockActual || 0);
        case 'stock-desc': return (b.stockActual || 0) - (a.stockActual || 0);
        default: return 0;
      }
    });
  }, [stock, searchTerm, providerFilter, sortOrder]);

  const handlePrint = () => {
    playSound('success');
    window.print();
  };

  const contentRef = useRef<HTMLDivElement>(null);
  
  const handleDownloadPDF = async () => {
    playSound('success');
    setIsDownloading(true);
    
    // Brief delay to allow UI to update
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const todayStr = new Date().toLocaleDateString('es-CL');

        if (viewMode === 'print') {
          // --- NUEVO ENCABEZADO PROFESIONAL ---
          pdf.setFillColor(15, 23, 42); // Dark slate
          pdf.rect(0, 0, 210, 35, 'F');
          
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(20);
          pdf.setFont('helvetica', 'bold');
          pdf.text('ECHEVERRIA & CO.', 14, 18);
          
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.text('LISTA OFICIAL DE PRECIOS', 14, 26);
          
          pdf.setFontSize(8);
          pdf.text(`FECHA DE EMISIÓN: ${todayStr}`, 196, 18, { align: 'right' });

          // --- OPTIMIZACIÓN DE DATOS (Doble Columna con Stock y Filtro > 0) ---
          const onlyWithStock = sortedAndFilteredStock.filter(item => item.stockActual > 0);
          
          const pairedRows = [];
          for (let i = 0; i < onlyWithStock.length; i += 2) {
            const left = onlyWithStock[i];
            const right = onlyWithStock[i+1];
            
            pairedRows.push([
              (left.codigo || '').replace('MDF-', ''),
              (left.tipo || '').toUpperCase().substring(0, 28),
              (left.stockActual || 0).toString(),
              `$ ${(left.precioSugerido || 0).toLocaleString('es-CL')}`,
              '', // Espaciador
              right ? (right.codigo || '').replace('MDF-', '') : '',
              right ? (right.tipo || '').toUpperCase().substring(0, 28) : '',
              right ? (right.stockActual || 0).toString() : '',
              right ? `$ ${(right.precioSugerido || 0).toLocaleString('es-CL')}` : ''
            ]);
          }

          autoTable(pdf, {
            startY: 40,
            head: [['CÓD', 'PRODUCTO', 'STK', 'VALOR', '', 'CÓD', 'PRODUCTO', 'STK', 'VALOR']],
            body: pairedRows,
            theme: 'striped',
            headStyles: { 
              fillColor: [51, 65, 85], 
              textColor: [255, 255, 255], 
              fontSize: 7, 
              fontStyle: 'bold',
              cellPadding: 1.5
            },
            bodyStyles: { 
              fontSize: 6.5,
              cellPadding: 1,
              textColor: [30, 41, 59]
            },
            columnStyles: {
              0: { cellWidth: 10, fontStyle: 'bold' },
              1: { cellWidth: 55 },
              2: { cellWidth: 10, halign: 'center' },
              3: { cellWidth: 17, halign: 'right', fontStyle: 'bold' },
              4: { cellWidth: 4 }, // Spacer
              5: { cellWidth: 10, fontStyle: 'bold' },
              6: { cellWidth: 55 },
              7: { cellWidth: 10, halign: 'center' },
              8: { cellWidth: 17, halign: 'right', fontStyle: 'bold' }
            },
            margin: { top: 40, bottom: 15, left: 8, right: 8 },
            didDrawPage: () => {
              // Dibujar encabezado en cada página (opcional, el rectangulo oscuro solo en la 1)
              if (pdf.getNumberOfPages() > 1) {
                pdf.setFillColor(15, 23, 42);
                pdf.rect(0, 0, 210, 15, 'F');
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(10);
                pdf.text('ECHEVERRIA & CO. - LISTA DE PRECIOS', 14, 10);
              }

              // Footer info
              pdf.setFontSize(7);
              pdf.setTextColor(148, 163, 184);
              const pageNum = pdf.getNumberOfPages();
              pdf.text(`Página ${pageNum}`, 14, pdf.internal.pageSize.getHeight() - 8);
              pdf.text('Precios sujetos a cambio sin previo aviso • ECHEVERRIA & CO.', 105, pdf.internal.pageSize.getHeight() - 8, { align: 'center' });
            }
          });

          pdf.save(`Lista_Precios_Echeverria_${new Date().toISOString().slice(0, 10)}.pdf`);
        } else {
          // MODE: DIGITAL (Canvas screenshot)
          const input = contentRef.current;
          if (!input) return;

          const canvas = await html2canvas(input, { 
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
          
          const imgData = canvas.toDataURL('image/jpeg', 0.9);
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          const pageHeight = pdf.internal.pageSize.getHeight();
          let heightLeft = pdfHeight;
          let position = 0;
          
          // First page
          pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
          
          // Subsequent pages
          while (heightLeft > 0) {
            position = heightLeft - pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;
          }
          
          pdf.save(`catalogo_mdf_${new Date().toISOString().slice(0, 10)}.pdf`);
        }
    } catch (err) {
        console.error('PDF Generation Error:', err);
        alert('Hubo un error al generar el PDF. Por favor intenta usando el botón de imprimir y selecciona "Guardar como PDF".');
    } finally {
        setIsDownloading(false);
    }
  };

  const handleShareLink = () => {
    playSound('success');
    const catalogUrl = `${window.location.origin}${window.location.pathname}#/catalogo-publico`;
    navigator.clipboard.writeText(catalogUrl).then(() => {
      setShowCopyFeedback(true);
      setTimeout(() => setShowCopyFeedback(false), 3000);
    });
  };

  const today = new Date().toLocaleDateString('es-CL');

  return (
    <div className={`space-y-8 max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-20 ${viewMode === 'digital' ? 'view-is-digital' : 'view-is-list'}`}>
      {/* Header Controles - No Imprimibles */}
      <div className="no-print space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
              <ChevronLeft size={24} />
            </Link>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Generador de Catálogo</h2>
              <p className="text-slate-500 italic font-medium">Visualización y Exportación</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-slate-200 p-1.5 rounded-[24px] shadow-inner">
              <button 
                onClick={() => { setViewMode('digital'); playSound('click'); }}
                className={`flex items-center gap-2 px-6 py-3 rounded-[18px] font-black text-[10px] uppercase tracking-widest transition-all ${viewMode === 'digital' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500'}`}
              >
                <LayoutGrid size={18} /> Digital
              </button>
              <button 
                onClick={() => { setViewMode('print'); playSound('click'); }}
                className={`flex items-center gap-2 px-6 py-3 rounded-[18px] font-black text-[10px] uppercase tracking-widest transition-all ${viewMode === 'print' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500'}`}
              >
                <List size={18} /> Impreso
              </button>
            </div>
            <button 
              onClick={handleDownloadPDF}
              className={`flex items-center gap-3 px-8 py-4 text-white rounded-[24px] font-black text-xs uppercase tracking-widest transition-all shadow-2xl active:scale-95 ${viewMode === 'digital' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              <FileDown size={18} />
              Guardar PDF
            </button>
            <button 
              onClick={handleShareLink}
              className={`flex items-center gap-3 px-8 py-4 text-white rounded-[24px] font-black text-xs uppercase tracking-widest transition-all shadow-2xl active:scale-95 ${showCopyFeedback ? 'bg-slate-900 animate-bounce' : 'bg-emerald-500 hover:bg-emerald-600'}`}
            >
              <Share2 size={18} />
              {showCopyFeedback ? '¡Link Copiado!' : 'Compartir Link'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex bg-slate-100 p-1.5 rounded-[24px] shadow-inner">
            {(['TODOS', 'FARDO', 'LOTE'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategoryFilter(cat); playSound('click'); }}
                className={`flex-1 py-3 rounded-[18px] font-black text-[9px] uppercase tracking-widest transition-all ${
                  categoryFilter === cat ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                {cat === 'TODOS' ? 'Todos' : cat === 'FARDO' ? 'Unidades' : 'Lotes'}
              </button>
            ))}
          </div>
          <input 
            type="text" 
            placeholder="Buscar producto..."
            className="w-full px-8 py-5 rounded-[28px] border-2 border-slate-100 focus:border-emerald-500 outline-none transition-all shadow-sm text-lg font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="w-full px-8 py-5 rounded-[28px] border-2 border-slate-100 bg-white font-black text-[10px] uppercase outline-none focus:border-emerald-500 shadow-sm cursor-pointer"
            value={providerFilter}
            onChange={(e) => { setProviderFilter(e.target.value); playSound('click'); }}
          >
            {uniqueProviders.map(p => (
              <option key={p} value={p}>{p === 'TODOS' ? 'PROVEEDORES: TODOS' : `ORIGEN: ${p}`}</option>
            ))}
          </select>
          <select 
            className="w-full px-8 py-5 rounded-[28px] border-2 border-slate-100 bg-white font-black text-[10px] uppercase outline-none focus:border-emerald-500 shadow-sm cursor-pointer"
            value={sortOrder}
            onChange={(e) => { setSortOrder(e.target.value as SortOption); playSound('click'); }}
          >
            <option value="alpha-asc">Orden: A - Z</option>
            <option value="alpha-desc">Orden: Z - A</option>
            <option value="price-asc">Precio: Menor a Mayor</option>
            <option value="price-desc">Precio: Mayor a Menor</option>
            <option value="stock-asc">Stock: Menor a Mayor</option>
            <option value="stock-desc">Stock: Mayor a Menor</option>
          </select>
        </div>
      </div>

      {/* ÁREA DE CONTENIDO */}
      <div ref={contentRef} className={`catalogo-content bg-white p-8 ${isDownloading ? 'px-4' : 'p-4'}`}>
        
        {/* Header Impresión - visible siempre para captura */}
        <div className="flex items-center justify-between border-b-4 border-slate-900 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <img src={LOGO_URL} alt="Logo" className="w-12 h-12 grayscale contrast-150" />
            <div>
                <h1 className="text-xl font-black uppercase tracking-tighter">ECHEVERRIA & CO.</h1>
                <p className="text-xs font-bold text-slate-500">{viewMode === 'digital' ? 'Catálogo Maestro' : 'Lista Oficial de Precios'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase">Fecha: {today}</p>
          </div>
        </div>

        {viewMode === 'digital' ? (
          /* MODO DIGITAL: TARJETAS (Grilla en pantalla, Grilla optimizada en impresión) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:grid-cols-2 print:gap-4">
            {sortedAndFilteredStock.map(item => (
              <div key={item.id} className="digital-card bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden flex flex-col group hover:border-emerald-400 transition-all print:break-inside-avoid print:shadow-none print:border-2 print:rounded-2xl print:mb-4 print:w-full print:inline-block">
                <div className="p-6 bg-slate-900 text-white text-center relative print:bg-white print:text-slate-900 print:border-b print:p-3">
                  <div className="absolute top-2 right-4 flex items-center gap-1.5 px-2 py-0.5 bg-white/10 rounded-full text-[8px] font-black uppercase tracking-widest print:bg-slate-100 print:text-slate-500">
                    {item.unidad}
                  </div>
                  <h3 className="font-black uppercase tracking-tight text-lg leading-tight line-clamp-2 min-h-[3rem] flex items-center justify-center italic print:text-xs print:min-h-0">
                    {item.tipo}
                  </h3>
                </div>
                <div className="p-8 flex flex-col items-center text-center flex-1 print:p-4">
                   <div className="px-4 py-1.5 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 print:mb-2 print:text-[8px] print:py-0.5">
                     {item.proveedor}
                   </div>
                   <div className="text-5xl font-black text-slate-900 tracking-tighter mb-6 print:text-2xl print:mb-2">
                     ${item.precioSugerido.toLocaleString('es-CL')}
                   </div>
                   <div className="w-full pt-6 border-t border-slate-50 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest print:pt-2 print:text-[7px]">
                      <div className="flex items-center gap-2">
                         <Tag size={12} className="print:hidden" /> {item.codigo}
                      </div>
                      <div className="flex items-center gap-2 text-emerald-500">
                         <Package size={12} className="print:hidden" /> STOCK: {item.stockActual}
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* MODO LISTADO (Tabla simple para mejor paginación) */
          <div className="print-columns-container overflow-visible h-auto">
              <table className="w-full border-collapse table-auto">
                <TableHeader />
                <tbody>
                  {sortedAndFilteredStock.map(item => <ProductRow key={item.id} item={item} />)}
                </tbody>
              </table>
          </div>
        )}

        {sortedAndFilteredStock.length === 0 && (
          <div className="py-40 text-center opacity-30 italic font-black uppercase tracking-widest">
             No hay productos disponibles para mostrar
          </div>
        )}

        <div className="mt-12 text-center border-t border-slate-100 pt-8 print:mt-6 print:border-slate-900">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] print:text-[8px] print:text-slate-900">
             SISTEMA DE INTELIGENCIA OPERATIVA • ECHEVERRIA & CO.
           </p>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 1cm; }
          
          /* Ensure everything is visible and not clipped */
          body, #root, .catalogo-content { height: auto !important; overflow: visible !important; }
          
          /* Hide UI elements */
          .no-print { display: none !important; }

          /* Layout: Linearize everything */
          .grid { display: block !important; }
          
          /* Cards: Allow natural flow */
          .digital-card { 
            display: inline-block !important; 
            width: 31% !important;
            margin: 1% !important;
            break-inside: avoid !important;
            border: 1px solid #ddd !important;
          }

          /* Tables: ensure simple layout */
          table { width: 100% !important; border-collapse: collapse !important; table-layout: fixed !important; }
          td, th { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .product-detail-cell { white-space: normal !important; }
          tr { break-inside: avoid !important; }
          thead { display: table-header-group; }
        }
      `}</style>
    </div>
  );
}
