import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { 
  Printer, 
  LayoutGrid, 
  List, 
  Search, 
  Package, 
  Tag, 
  ChevronLeft,
  Share2,
  FileDown,
  MessageCircle,
  QrCode,
  Check,
  ExternalLink,
  SlidersHorizontal,
  DollarSign,
  Boxes,
  Eye,
  X,
  Copy,
  Sparkles
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { StockItem, LOGO_URL, BRAND_NAME, COMPANY_NAME } from '../types';

type SortOption = 'alpha-asc' | 'alpha-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc';
type FilterCategory = 'TODOS' | 'FARDO' | 'LOTE' | 'MAYORISTA';

const TableHeader = () => (
  <thead>
    <tr className="border-b-2 border-slate-900 bg-slate-100 print:bg-slate-100 text-slate-800">
      <th className="px-3 py-2 text-[10px] font-black uppercase text-left w-16">Cód</th>
      <th className="px-3 py-2 text-[10px] font-black uppercase text-left">Producto / Tipo</th>
      <th className="px-3 py-2 text-[10px] font-black uppercase text-left w-24">Origen</th>
      <th className="px-3 py-2 text-[10px] font-black uppercase text-right w-28">Precio Detalle</th>
      <th className="px-3 py-2 text-[10px] font-black uppercase text-right w-28">Precio Mayorista</th>
      <th className="px-3 py-2 text-[10px] font-black uppercase text-center w-16">Stock</th>
    </tr>
  </thead>
);

const ProductRow: React.FC<{ item: StockItem }> = ({ item }) => (
  <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors print:border-slate-300">
    <td className="px-3 py-2 font-mono font-bold text-slate-500 text-xs">
      {item.codigo}
    </td>
    <td className="px-3 py-2">
      <div className="flex flex-col">
        <span className="font-black text-slate-900 uppercase text-xs leading-tight">
          {item.tipo}
        </span>
        {item.especificaciones && (
          <span className="text-[10px] text-slate-400 italic truncate max-w-md">
            {item.especificaciones}
          </span>
        )}
      </div>
    </td>
    <td className="px-3 py-2">
      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
        {item.proveedor || 'General'}
      </span>
    </td>
    <td className="px-3 py-2 text-right font-black text-slate-900 text-xs">
      ${(item.precioSugerido || 0).toLocaleString('es-CL')}
    </td>
    <td className="px-3 py-2 text-right font-bold text-amber-800 text-xs">
      {!!item.precioMayorista && item.precioMayorista > 0 ? (
        <div>
          <span>${item.precioMayorista.toLocaleString('es-CL')}</span>
          <span className="block text-[8px] text-amber-600 font-normal">
            (≥{item.minUnidadesMayorista || 5} uds)
          </span>
        </div>
      ) : (
        <span className="text-slate-300 text-[10px]">—</span>
      )}
    </td>
    <td className="px-3 py-2 text-center">
      <span className={`px-2 py-0.5 rounded-full font-black text-xs ${
        item.stockActual <= 2 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
      }`}>
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
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('TODOS');
  const [stockOnlyFilter, setStockOnlyFilter] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<SortOption>('alpha-asc');

  const searchParams = new URLSearchParams(location.search);
  const [viewMode, setViewMode] = useState<'digital' | 'print'>((searchParams.get('mode') as 'digital' | 'print') || 'digital');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  
  // QR Code Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const publicCatalogUrl = `${window.location.origin}${window.location.pathname}#/catalogo-publico`;

  // Generate QR code for the public catalog link
  useEffect(() => {
    if (showQrModal && !qrDataUrl) {
      QRCode.toDataURL(publicCatalogUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error("Error generating QR:", err));
    }
  }, [showQrModal, qrDataUrl, publicCatalogUrl]);

  // Providers list
  const uniqueProviders = useMemo(() => {
    const providers = stock.map(item => (item.proveedor || '').trim().toUpperCase()).filter(Boolean);
    return ['TODOS', ...Array.from(new Set(providers))].sort();
  }, [stock]);

  const normalizeText = (text: string) => 
    (text || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Stock summary KPIs
  const kpis = useMemo(() => {
    const totalItems = stock.length;
    const withStock = stock.filter(item => (item.stockActual || 0) > 0);
    const totalUnits = withStock.reduce((acc, item) => acc + (item.stockActual || 0), 0);
    const totalValue = withStock.reduce((acc, item) => acc + (item.precioSugerido * item.stockActual), 0);
    return {
      totalItems,
      withStockCount: withStock.length,
      totalUnits,
      totalValue
    };
  }, [stock]);

  // Filtered and sorted stock
  const sortedAndFilteredStock = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);

    let result = stock.filter(item => {
      // Stock availability filter
      if (stockOnlyFilter && (item.stockActual || 0) <= 0) return false;

      // Text Search
      if (normalizedSearch) {
        const matchesSearch = 
          normalizeText(item.tipo || '').includes(normalizedSearch) || 
          normalizeText(item.codigo || '').includes(normalizedSearch) ||
          normalizeText(item.proveedor || '').includes(normalizedSearch) ||
          normalizeText(item.especificaciones || '').includes(normalizedSearch);
        if (!matchesSearch) return false;
      }

      // Provider filter
      if (providerFilter !== 'TODOS' && (item.proveedor || '').toUpperCase() !== providerFilter) {
        return false;
      }
      
      // Category filter
      if (categoryFilter === 'FARDO') {
        const isFardo = item.unidad === 'FARDO' || item.categoria === 'FARDO' || (item.categoria !== 'LOTE' && item.unidad !== '25 KILOS');
        if (!isFardo) return false;
      } else if (categoryFilter === 'LOTE') {
        const isLote = item.categoria === 'LOTE' || item.unidad === '25 KILOS' || (item.tipo || '').toLowerCase().includes('25 kg');
        if (!isLote) return false;
      } else if (categoryFilter === 'MAYORISTA') {
        if (!item.precioMayorista || item.precioMayorista <= 0) return false;
      }

      return true;
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
  }, [stock, searchTerm, providerFilter, categoryFilter, stockOnlyFilter, sortOrder]);

  const handlePrint = () => {
    playSound('success');
    window.print();
  };

  const handleDownloadPDF = async () => {
    playSound('success');
    setIsDownloading(true);
    
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const todayStr = new Date().toLocaleDateString('es-CL');

      // Professional PDF Header
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, 210, 36, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(BRAND_NAME, 14, 18);
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${COMPANY_NAME} • LISTA OFICIAL DE PRECIOS Y STOCK`, 14, 26);
      
      pdf.setFontSize(8);
      pdf.text(`EMISIÓN: ${todayStr}`, 196, 18, { align: 'right' });
      pdf.text(`CATÁLOGO DIGITAL: ${window.location.origin}`, 196, 26, { align: 'right' });

      // Dual Column Layout for dense price list
      const onlyWithStock = sortedAndFilteredStock.filter(item => (item.stockActual || 0) > 0);
      
      const pairedRows = [];
      for (let i = 0; i < onlyWithStock.length; i += 2) {
        const left = onlyWithStock[i];
        const right = onlyWithStock[i+1];
        
        pairedRows.push([
          (left.codigo || '').replace('MDF-', ''),
          (left.tipo || '').toUpperCase().substring(0, 28),
          (left.stockActual || 0).toString(),
          `$ ${(left.precioSugerido || 0).toLocaleString('es-CL')}`,
          '',
          right ? (right.codigo || '').replace('MDF-', '') : '',
          right ? (right.tipo || '').toUpperCase().substring(0, 28) : '',
          right ? (right.stockActual || 0).toString() : '',
          right ? `$ ${(right.precioSugerido || 0).toLocaleString('es-CL')}` : ''
        ]);
      }

      autoTable(pdf, {
        startY: 42,
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
          cellPadding: 1.2,
          textColor: [30, 41, 59]
        },
        columnStyles: {
          0: { cellWidth: 10, fontStyle: 'bold' },
          1: { cellWidth: 55 },
          2: { cellWidth: 10, halign: 'center' },
          3: { cellWidth: 17, halign: 'right', fontStyle: 'bold' },
          4: { cellWidth: 4 },
          5: { cellWidth: 10, fontStyle: 'bold' },
          6: { cellWidth: 55 },
          7: { cellWidth: 10, halign: 'center' },
          8: { cellWidth: 17, halign: 'right', fontStyle: 'bold' }
        },
        margin: { top: 42, bottom: 15, left: 8, right: 8 },
        didDrawPage: () => {
          if (pdf.getNumberOfPages() > 1) {
            pdf.setFillColor(15, 23, 42);
            pdf.rect(0, 0, 210, 15, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(9);
            pdf.text(`${BRAND_NAME} (${COMPANY_NAME}) - LISTA OFICIAL DE PRECIOS`, 14, 10);
          }

          pdf.setFontSize(7);
          pdf.setTextColor(148, 163, 184);
          const pageNum = pdf.getNumberOfPages();
          pdf.text(`Página ${pageNum}`, 14, pdf.internal.pageSize.getHeight() - 8);
          pdf.text('Precios sujetos a cambio sin previo aviso • EL MUNDO TECH • WhatsApp: +56 9 8430 4335', 105, pdf.internal.pageSize.getHeight() - 8, { align: 'center' });
        }
      });

      pdf.save(`Lista_Precios_${BRAND_NAME.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Error al generar PDF. Puedes usar la función Imprimir de tu navegador.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareLink = () => {
    playSound('success');
    navigator.clipboard.writeText(publicCatalogUrl).then(() => {
      setShowCopyFeedback(true);
      setTimeout(() => setShowCopyFeedback(false), 2500);
    });
  };

  const handleShareViaWhatsApp = () => {
    playSound('success');
    const msg = `¡Hola! 👋 Te comparto nuestro catálogo oficial de *${BRAND_NAME}* (${COMPANY_NAME}) actualizado en tiempo real con stock y precios vigentes:\n\n🔗 ${publicCatalogUrl}\n\nPuedes revisar los fardos disponibles y cotizar directamente por este mismo chat.`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const today = new Date().toLocaleDateString('es-CL');

  return (
    <div className="space-y-6 max-w-[1300px] mx-auto animate-in fade-in duration-300 pb-20 font-sans">
      
      {/* Top Header & View Mode Controls */}
      <div className="no-print space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Catálogo de Productos</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                  Gestión y Difusión
                </span>
              </div>
              <p className="text-slate-500 text-xs font-medium mt-0.5">
                Visualización ejecutiva, exportación en PDF y enlace en tiempo real para clientes
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View switcher */}
            <div className="flex bg-slate-200 p-1 rounded-2xl">
              <button 
                onClick={() => { setViewMode('digital'); playSound('click'); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                  viewMode === 'digital' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid size={15} /> Tarjetas
              </button>
              <button 
                onClick={() => { setViewMode('print'); playSound('click'); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                  viewMode === 'print' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List size={15} /> Lista / Imprimir
              </button>
            </div>

            <button 
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <FileDown size={16} />
              <span>{isDownloading ? 'Generando...' : 'Descargar PDF'}</span>
            </button>

            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        </div>

        {/* CLIENT SHARING HUB BANNER */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-5 text-white shadow-xl border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                ENLACE PÚBLICO EN TIEMPO REAL
              </span>
            </div>
            <h3 className="text-base font-black text-white uppercase tracking-tight">
              Catálogo para Clientes (Vía Link & WhatsApp)
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Comparte este enlace directo con tus clientes para que coticen en tiempo real con stock actualizado y fotos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              id="btn-copy-client-link"
              onClick={handleShareLink}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 ${
                showCopyFeedback 
                  ? 'bg-emerald-500 text-slate-950 font-black' 
                  : 'bg-white text-slate-900 hover:bg-slate-100'
              }`}
            >
              {showCopyFeedback ? <Check size={16} /> : <Copy size={16} />}
              <span>{showCopyFeedback ? '¡Copiado!' : 'Copiar Link'}</span>
            </button>

            <button
              id="btn-whatsapp-share-catalog"
              onClick={handleShareViaWhatsApp}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
            >
              <MessageCircle size={16} />
              <span>Enviar WhatsApp</span>
            </button>

            <button
              id="btn-open-qr-modal"
              onClick={() => setShowQrModal(true)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl transition-all border border-slate-700"
              title="Mostrar Código QR"
            >
              <QrCode size={18} />
            </button>

            <a
              href="#/catalogo-publico"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl transition-all border border-slate-700"
              title="Abrir vista cliente en pestaña nueva"
            >
              <ExternalLink size={18} />
            </a>
          </div>
        </div>

        {/* INVENTORY SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Productos Registrados</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">{kpis.totalItems}</span>
            <span className="text-[10px] text-slate-500 font-medium">En base de datos</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Con Stock Activo</span>
            <span className="text-xl font-black text-emerald-600 mt-1 block">{kpis.withStockCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Disponibles para venta</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Bultos / Fardos Físicos</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">{kpis.totalUnits}</span>
            <span className="text-[10px] text-slate-500 font-medium">Unidades en bodega</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Valorización Catálogo</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">${kpis.totalValue.toLocaleString('es-CL')}</span>
            <span className="text-[10px] text-slate-500 font-medium">Precio sugerido total</span>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                id="search-internal-catalog"
                type="text" 
                placeholder="Buscar por código, tipo de fardo o especificaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Provider Filter */}
            <select 
              value={providerFilter}
              onChange={(e) => { setProviderFilter(e.target.value); playSound('click'); }}
              className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 uppercase outline-none focus:border-emerald-500 cursor-pointer"
            >
              {uniqueProviders.map(p => (
                <option key={p} value={p}>{p === 'TODOS' ? 'Proveedor: TODOS' : `Origen: ${p}`}</option>
              ))}
            </select>

            {/* Sort Order */}
            <select 
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value as SortOption); playSound('click'); }}
              className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 uppercase outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="alpha-asc">Nombre: A - Z</option>
              <option value="alpha-desc">Nombre: Z - A</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="stock-desc">Mayor Stock Primero</option>
              <option value="stock-asc">Menor Stock Primero</option>
            </select>
          </div>

          {/* Category Tabs + Stock Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['TODOS', 'FARDO', 'LOTE', 'MAYORISTA'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => { setCategoryFilter(cat); playSound('click'); }}
                  className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                    categoryFilter === cat 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'TODOS' ? 'Todos' : cat === 'FARDO' ? 'Fardos' : cat === 'LOTE' ? 'Lotes x Kilo' : 'Mayoristas'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={stockOnlyFilter}
                  onChange={(e) => setStockOnlyFilter(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Ocultar productos con stock 0</span>
              </label>

              <span className="text-xs text-slate-400 font-bold">
                ({sortedAndFilteredStock.length} items)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PRINTABLE / VISUAL CONTENT AREA */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm print:p-0 print:border-none print:shadow-none">
        
        {/* Printable Header (Visible in print/PDF) */}
        <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Logo" referrerPolicy="no-referrer" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight">{BRAND_NAME}</h1>
              <p className="text-[10px] font-bold text-slate-500">{COMPANY_NAME} • Lista Oficial de Precios</p>
            </div>
          </div>
          <div className="text-right text-[10px] font-bold text-slate-600">
            <p>FECHA: {today}</p>
          </div>
        </div>

        {viewMode === 'digital' ? (
          /* DIGITAL CARDS GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 print:grid-cols-2">
            {sortedAndFilteredStock.map(item => (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-emerald-400 hover:shadow-md transition-all group"
              >
                {/* Image */}
                <div className="relative w-full h-40 bg-slate-100 flex items-center justify-center overflow-hidden">
                  {item.imagenUrl ? (
                    <img src={item.imagenUrl} alt={item.tipo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Package size={28} />
                      <span className="text-[9px] font-black uppercase mt-1 tracking-wider text-slate-400">{item.unidad}</span>
                    </div>
                  )}
                  
                  <div className="absolute top-2.5 right-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shadow-sm ${
                      item.stockActual <= 2 ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      Stock: {item.stockActual}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded bg-slate-900/80 text-white text-[9px] font-black uppercase">
                      {item.proveedor || 'General'}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                      <span>{item.codigo}</span>
                      <span className="uppercase font-bold">{item.unidad}</span>
                    </div>

                    <h3 className="font-black text-slate-900 text-sm leading-tight uppercase italic line-clamp-2">
                      {item.tipo}
                    </h3>

                    {item.especificaciones && (
                      <p className="text-slate-400 text-xs italic line-clamp-1 mt-1">
                        {item.especificaciones}
                      </p>
                    )}
                  </div>

                  {/* Pricing Box */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Detalle:</span>
                      <span className="text-base font-black text-slate-900">
                        ${(item.precioSugerido || 0).toLocaleString('es-CL')}
                      </span>
                    </div>

                    {!!item.precioMayorista && item.precioMayorista > 0 && (
                      <div className="flex items-center justify-between text-[10px] text-amber-800 font-bold border-t border-slate-200/80 pt-1">
                        <span>Mayorista (≥{item.minUnidadesMayorista || 5}u):</span>
                        <span className="font-black">${item.precioMayorista.toLocaleString('es-CL')}</span>
                      </div>
                    )}
                  </div>

                  {/* Share button */}
                  <button
                    onClick={() => {
                      const msg = `Hola! Consulta por *${item.tipo}* (${item.codigo}). Precio detalle: $${item.precioSugerido?.toLocaleString('es-CL')}. Stock disponible: ${item.stockActual} uds.`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="w-full py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageCircle size={14} />
                    <span>Compartir por WhatsApp</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* TABLE LIST MODE */
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <TableHeader />
              <tbody>
                {sortedAndFilteredStock.map(item => (
                  <ProductRow key={item.id} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sortedAndFilteredStock.length === 0 && (
          <div className="py-20 text-center text-slate-400 italic">
            No se encontraron productos que coincidan con los filtros aplicados.
          </div>
        )}
      </div>

      {/* QR CODE MODAL FOR CLIENTS */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Código QR para Clientes</span>
              <button 
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-lg text-slate-900 uppercase">
                {BRAND_NAME}
              </h3>
              <p className="text-xs text-slate-500">
                Escanea con la cámara de tu celular para abrir el catálogo público actualizado
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Catálogo" className="w-56 h-56 mx-auto rounded-lg" />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                  Generando QR...
                </div>
              )}
            </div>

            <p className="text-[11px] font-mono text-slate-400 break-all px-2">
              {publicCatalogUrl}
            </p>

            <button
              onClick={handleShareLink}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {showCopyFeedback ? <Check size={16} /> : <Copy size={16} />}
              <span>{showCopyFeedback ? '¡Link Copiado!' : 'Copiar Enlace'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 1cm; }
          body, #root { height: auto !important; overflow: visible !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
