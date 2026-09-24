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
  Sparkles,
  Cpu,
  Layers,
  RotateCcw
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { StockItem, LOGO_URL, BRAND_NAME, COMPANY_NAME, DEPARTAMENTOS, DepartamentoGiro, getItemDepartamento } from '../types';

type SortOption = 'alpha-asc' | 'alpha-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc';
type FilterCategory = 'TODOS' | 'INDIVIDUAL' | 'LOTE' | 'MAYORISTA';

const TableHeader = () => (
  <thead>
    <tr className="border-b-2 border-slate-900 bg-slate-100 print:bg-slate-100 text-slate-800">
      <th className="px-3 py-2 text-[10px] font-black uppercase text-left w-20">Giro</th>
      <th className="px-3 py-2 text-[10px] font-black uppercase text-left w-16">Cód</th>
      <th className="px-3 py-2 text-[10px] font-black uppercase text-left">Producto / Tipo</th>
      <th className="px-3 py-2 text-[10px] font-black uppercase text-left w-24">Origen</th>
      <th className="px-3 py-2 text-[10px] font-black uppercase text-right w-28">Precio Detalle</th>
      <th className="px-3 py-2 text-[10px] font-black uppercase text-right w-28">Precio Mayorista</th>
      <th className="px-3 py-2 text-[10px] font-black uppercase text-center w-16">Stock</th>
    </tr>
  </thead>
);

const ProductRow: React.FC<{ 
  item: StockItem;
  onSelectDepto?: (depto: DepartamentoGiro) => void;
  onSelectSubcategoria?: (sub: string) => void;
}> = ({ item, onSelectDepto, onSelectSubcategoria }) => {
  const depto = item.departamento || getItemDepartamento(item);
  const isBelleza = depto === 'BELLEZA';

  return (
    <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors print:border-slate-300">
      <td className="px-3 py-2">
        <button
          type="button"
          onClick={() => onSelectDepto?.(depto)}
          title={`Filtrar catálogo por ${isBelleza ? 'Belleza' : 'Tecnología'}`}
          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition-transform hover:scale-105 active:scale-95 cursor-pointer ${
            isBelleza ? 'bg-pink-100 text-pink-700 hover:bg-pink-200' : 'bg-sky-100 text-sky-700 hover:bg-sky-200'
          }`}
        >
          {isBelleza ? '💄 Belleza' : '💻 Tech'}
        </button>
      </td>
      <td className="px-3 py-2 font-mono font-bold text-slate-500 text-xs">
        {item.codigo}
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-black text-slate-900 uppercase text-xs leading-tight">
              {item.tipo}
            </span>
            {item.subcategoria && (
              <button
                type="button"
                onClick={() => {
                  onSelectDepto?.(depto);
                  onSelectSubcategoria?.(item.subcategoria!);
                }}
                title={`Filtrar por subcategoría: ${item.subcategoria}`}
                className="text-[9px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded transition-all cursor-pointer"
              >
                {item.subcategoria}
              </button>
            )}
          </div>
          {item.especificaciones && (
            <span className="text-[10px] text-slate-400 italic truncate max-w-md mt-0.5">
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
};

export default function Catalogo() {
  const { stock, playSound } = useStore();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('TODOS');
  const [departmentFilter, setDepartmentFilter] = useState<'TODOS' | 'TECNOLOGIA' | 'BELLEZA'>('TODOS');
  const [subcategoriaFilter, setSubcategoriaFilter] = useState<string>('TODAS');
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

  const techCount = useMemo(() => stock.filter(s => (s.departamento || getItemDepartamento(s)) === 'TECNOLOGIA').length, [stock]);
  const beautyCount = useMemo(() => stock.filter(s => (s.departamento || getItemDepartamento(s)) === 'BELLEZA').length, [stock]);

  const availableSubcategories = useMemo(() => {
    if (departmentFilter === 'TODOS') return [];
    const found = DEPARTAMENTOS.find(d => d.id === departmentFilter);
    return found ? found.subcategorias : [];
  }, [departmentFilter]);

  // Count items per subcategory
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    stock.forEach(item => {
      const depto = item.departamento || getItemDepartamento(item);
      if (departmentFilter === 'TODOS' || depto === departmentFilter) {
        if (item.subcategoria) {
          counts[item.subcategoria] = (counts[item.subcategoria] || 0) + 1;
        }
      }
    });
    return counts;
  }, [stock, departmentFilter]);

  // Vendor fast keyboard navigation (1: Todos, 2: Tecnología, 3: Belleza)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (e.key === '1') {
        setDepartmentFilter('TODOS');
        setSubcategoriaFilter('TODAS');
        playSound('click');
      } else if (e.key === '2') {
        setDepartmentFilter('TECNOLOGIA');
        setSubcategoriaFilter('TODAS');
        playSound('click');
      } else if (e.key === '3') {
        setDepartmentFilter('BELLEZA');
        setSubcategoriaFilter('TODAS');
        playSound('click');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playSound]);

  const publicCatalogUrl = useMemo(() => {
    const base = `${window.location.origin}${window.location.pathname}#/catalogo-publico`;
    return departmentFilter !== 'TODOS' ? `${base}?depto=${departmentFilter}` : base;
  }, [departmentFilter]);

  // Generate QR code for the public catalog link
  useEffect(() => {
    if (showQrModal) {
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
  }, [showQrModal, publicCatalogUrl]);

  // Providers list
  const uniqueProviders = useMemo(() => {
    const providers = stock.map(item => (item.proveedor || '').trim().toUpperCase()).filter(Boolean);
    return ['TODOS', ...Array.from(new Set(providers))].sort();
  }, [stock]);

  const normalizeText = (text: string) => 
    (text || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Stock summary KPIs
  const kpis = useMemo(() => {
    let targetStock = stock;
    if (departmentFilter !== 'TODOS') {
      targetStock = targetStock.filter(item => (item.departamento || getItemDepartamento(item)) === departmentFilter);
    }
    const totalItems = targetStock.length;
    const withStock = targetStock.filter(item => (item.stockActual || 0) > 0);
    const totalUnits = withStock.reduce((acc, item) => acc + (item.stockActual || 0), 0);
    const totalValue = withStock.reduce((acc, item) => acc + (item.precioSugerido * item.stockActual), 0);
    return {
      totalItems,
      withStockCount: withStock.length,
      totalUnits,
      totalValue
    };
  }, [stock, departmentFilter]);

  // Filtered and sorted stock
  const sortedAndFilteredStock = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);

    let result = stock.filter(item => {
      // Department filter
      if (departmentFilter !== 'TODOS') {
        const itemDepto = item.departamento || getItemDepartamento(item);
        if (itemDepto !== departmentFilter) return false;
      }

      // Subcategory filter
      if (subcategoriaFilter !== 'TODAS') {
        if ((item.subcategoria || '') !== subcategoriaFilter) return false;
      }

      // Stock availability filter
      if (stockOnlyFilter && (item.stockActual || 0) <= 0) return false;

      // Text Search
      if (normalizedSearch) {
        const matchesSearch = 
          normalizeText(item.tipo || '').includes(normalizedSearch) || 
          normalizeText(item.codigo || '').includes(normalizedSearch) ||
          normalizeText(item.proveedor || '').includes(normalizedSearch) ||
          normalizeText(item.subcategoria || '').includes(normalizedSearch) ||
          normalizeText(item.especificaciones || '').includes(normalizedSearch);
        if (!matchesSearch) return false;
      }

      // Provider filter
      if (providerFilter !== 'TODOS' && (item.proveedor || '').toUpperCase() !== providerFilter) {
        return false;
      }
      
      // Category filter
      if (categoryFilter === 'INDIVIDUAL') {
        const isIndividual = item.unidad === 'UNIDAD' || item.unidad === 'PIEZA' || item.categoria === 'ESTANDAR' || (item.categoria !== 'LOTE' && item.categoria !== 'MAYORISTA');
        if (!isIndividual) return false;
      } else if (categoryFilter === 'LOTE') {
        const isLote = item.categoria === 'LOTE' || item.unidad === 'PACK' || (item.tipo || '').toLowerCase().includes('pack');
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
  }, [stock, departmentFilter, subcategoriaFilter, searchTerm, providerFilter, categoryFilter, stockOnlyFilter, sortOrder]);

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
      
      let deptoLabel = 'LISTA OFICIAL DE PRECIOS Y STOCK';
      if (departmentFilter === 'TECNOLOGIA') {
        deptoLabel = 'CATÁLOGO ESPECIALIZADO: TECNOLOGÍA & GADGETS';
      } else if (departmentFilter === 'BELLEZA') {
        deptoLabel = 'CATÁLOGO ESPECIALIZADO: BELLEZA & CUIDADO PERSONAL';
      }
      if (subcategoriaFilter !== 'TODAS') {
        deptoLabel += ` • [${subcategoriaFilter.toUpperCase()}]`;
      }

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${COMPANY_NAME} • ${deptoLabel}`, 14, 26);
      
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

      const prefix = departmentFilter !== 'TODOS' ? `${departmentFilter}_` : '';
      pdf.save(`Lista_Precios_${BRAND_NAME.replace(/\s+/g, '_')}_${prefix}${new Date().toISOString().slice(0, 10)}.pdf`);
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
    let scopeText = 'nuestro catálogo oficial';
    if (departmentFilter === 'TECNOLOGIA') {
      scopeText = 'nuestro catálogo especializado de *Tecnología & Gadgets*';
    } else if (departmentFilter === 'BELLEZA') {
      scopeText = 'nuestro catálogo especializado de *Belleza, Maquillaje y Cuidado Personal*';
    }
    if (subcategoriaFilter !== 'TODAS') {
      scopeText += ` (Sección: *${subcategoriaFilter}*)`;
    }
    const msg = `¡Hola! 👋 Te comparto ${scopeText} de *${BRAND_NAME}* (${COMPANY_NAME}) actualizado en tiempo real con stock y precios vigentes:\n\n🔗 ${publicCatalogUrl}\n\nPuedes revisar los productos disponibles y cotizar directamente por este mismo chat.`;
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

        {/* TABS DEPARTAMENTO / GIRO & SEGMENTACION AUTOMATICA */}
        <div className="bg-white p-4 rounded-[28px] border border-slate-200 shadow-sm space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Segmentación por Giro Comercial
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                Atajos: [1] Todo • [2] Tech • [3] Belleza
              </span>
            </div>
            {departmentFilter !== 'TODOS' && (
              <button
                onClick={() => {
                  setDepartmentFilter('TODOS');
                  setSubcategoriaFilter('TODAS');
                  playSound('click');
                }}
                className="text-xs font-black text-slate-500 hover:text-slate-900 flex items-center gap-1.5 self-start sm:self-auto transition-colors"
              >
                <RotateCcw size={12} />
                <span>Restablecer Todo</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tab: Todo */}
            <button
              id="tab-catalog-todos"
              onClick={() => { setDepartmentFilter('TODOS'); setSubcategoriaFilter('TODAS'); playSound('click'); }}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                departmentFilter === 'TODOS'
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 ring-2 ring-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers size={16} />
              <span>Todo el Catálogo</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                departmentFilter === 'TODOS' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
              }`}>
                {stock.length}
              </span>
              <span className="text-[9px] opacity-60 hidden md:inline font-mono">[1]</span>
            </button>

            {/* Tab: Tecnología */}
            <button
              id="tab-catalog-tech"
              onClick={() => { setDepartmentFilter('TECNOLOGIA'); setSubcategoriaFilter('TODAS'); playSound('click'); }}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                departmentFilter === 'TECNOLOGIA'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-500'
                  : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
              }`}
            >
              <Cpu size={16} className={departmentFilter === 'TECNOLOGIA' ? 'text-white' : 'text-sky-600'} />
              <span>Tecnología & Gadgets</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                departmentFilter === 'TECNOLOGIA' ? 'bg-white/25 text-white' : 'bg-sky-200 text-sky-900'
              }`}>
                {techCount}
              </span>
              <span className="text-[9px] opacity-70 hidden md:inline font-mono">[2]</span>
            </button>

            {/* Tab: Belleza */}
            <button
              id="tab-catalog-belleza"
              onClick={() => { setDepartmentFilter('BELLEZA'); setSubcategoriaFilter('TODAS'); playSound('click'); }}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                departmentFilter === 'BELLEZA'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30 ring-2 ring-pink-500'
                  : 'bg-pink-50 text-pink-800 hover:bg-pink-100'
              }`}
            >
              <Sparkles size={16} className={departmentFilter === 'BELLEZA' ? 'text-white' : 'text-pink-600'} />
              <span>Belleza, Maquillaje & Cuidado</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                departmentFilter === 'BELLEZA' ? 'bg-white/25 text-white' : 'bg-pink-200 text-pink-900'
              }`}>
                {beautyCount}
              </span>
              <span className="text-[9px] opacity-70 hidden md:inline font-mono">[3]</span>
            </button>
          </div>

          {/* Subcategories Pills with counts */}
          {departmentFilter !== 'TODOS' && availableSubcategories.length > 0 && (
            <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1.5">
                Subcategorías {departmentFilter === 'BELLEZA' ? 'Belleza' : 'Tecnología'}:
              </span>
              <button
                type="button"
                onClick={() => setSubcategoriaFilter('TODAS')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                  subcategoriaFilter === 'TODAS'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas ({departmentFilter === 'TECNOLOGIA' ? techCount : beautyCount})
              </button>
              {availableSubcategories.map(sub => {
                const count = subcategoryCounts[sub] || 0;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubcategoriaFilter(sub)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                      subcategoriaFilter === sub
                        ? departmentFilter === 'BELLEZA' 
                          ? 'bg-pink-600 text-white shadow-xs' 
                          : 'bg-sky-600 text-white shadow-xs'
                        : count > 0 
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <span>{sub}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                      subcategoriaFilter === sub 
                        ? 'bg-white/25 text-white' 
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Segment Notification Banner */}
          {departmentFilter !== 'TODOS' && (
            <div className={`mt-2 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl border transition-all ${
              departmentFilter === 'BELLEZA'
                ? 'bg-pink-50/80 border-pink-200 text-pink-900'
                : 'bg-sky-50/80 border-sky-200 text-sky-900'
            }`}>
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    departmentFilter === 'BELLEZA' ? 'bg-pink-400' : 'bg-sky-400'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    departmentFilter === 'BELLEZA' ? 'bg-pink-600' : 'bg-sky-600'
                  }`}></span>
                </span>
                <p className="text-xs font-bold">
                  Catálogo Activo:{' '}
                  <span className="font-black uppercase">
                    {departmentFilter === 'BELLEZA' ? '💄 Belleza, Maquillaje & Cuidado' : '💻 Tecnología & Gadgets'}
                  </span>
                  {subcategoriaFilter !== 'TODAS' && (
                    <span className="ml-1 text-slate-700 font-medium">
                      » <strong className="font-black text-slate-900">{subcategoriaFilter}</strong>
                    </span>
                  )}
                  <span className="ml-2 font-black text-slate-900">
                    ({sortedAndFilteredStock.length} items encontrados)
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDepartmentFilter('TODOS');
                  setSubcategoriaFilter('TODAS');
                  playSound('click');
                }}
                className="text-[11px] font-black text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={11} />
                <span>Ver Todo (1)</span>
              </button>
            </div>
          )}
        </div>

        {/* CLIENT SHARING HUB BANNER */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-5 text-white shadow-xl border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                ENLACE PÚBLICO EN TIEMPO REAL
              </span>
              {departmentFilter !== 'TODOS' && (
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                  departmentFilter === 'BELLEZA' ? 'bg-pink-600 text-white' : 'bg-sky-600 text-white'
                }`}>
                  Filtro: {departmentFilter === 'BELLEZA' ? 'Belleza' : 'Tech'}
                </span>
              )}
            </div>
            <h3 className="text-base font-black text-white uppercase tracking-tight">
              Catálogo para Clientes (Vía Link & WhatsApp)
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Comparte este enlace directo con tus clientes para que coticen en tiempo real con stock actualizado y fotos{departmentFilter !== 'TODOS' ? ` (segmentado para ${departmentFilter === 'BELLEZA' ? 'Belleza' : 'Tecnología'})` : ''}.
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
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <MessageCircle size={16} />
              <span>
                {departmentFilter === 'BELLEZA' 
                  ? 'Enviar WhatsApp (Belleza)' 
                  : departmentFilter === 'TECNOLOGIA' 
                  ? 'Enviar WhatsApp (Tech)' 
                  : 'Enviar WhatsApp'}
              </span>
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
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Unidades en Bodega</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">{kpis.totalUnits}</span>
            <span className="text-[10px] text-slate-500 font-medium">Unidades físicas disponibles</span>
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
                placeholder="Buscar por código, producto o especificaciones..."
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
              {(['TODOS', 'INDIVIDUAL', 'LOTE', 'MAYORISTA'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => { setCategoryFilter(cat); playSound('click'); }}
                  className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                    categoryFilter === cat 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'TODOS' ? 'Todos' : cat === 'INDIVIDUAL' ? 'Individuales' : cat === 'LOTE' ? 'Packs / Lotes' : 'Mayoristas'}
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
            {sortedAndFilteredStock.map(item => {
              const itemDepto = item.departamento || getItemDepartamento(item);
              const isBelleza = itemDepto === 'BELLEZA';

              return (
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
                      {isBelleza ? <Sparkles size={28} className="text-pink-400" /> : <Package size={28} />}
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

                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDepartmentFilter(isBelleza ? 'BELLEZA' : 'TECNOLOGIA');
                        setSubcategoriaFilter('TODAS');
                        playSound('click');
                      }}
                      title={`Filtrar solo productos de ${isBelleza ? 'Belleza' : 'Tecnología'}`}
                      className={`px-2 py-0.5 rounded text-white text-[9px] font-black uppercase transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-xs ${
                        isBelleza ? 'bg-pink-600/95 hover:bg-pink-500' : 'bg-sky-600/95 hover:bg-sky-500'
                      }`}
                    >
                      {isBelleza ? '💄 Belleza' : '💻 Tech'}
                    </button>
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

                    {item.subcategoria && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDepartmentFilter(isBelleza ? 'BELLEZA' : 'TECNOLOGIA');
                          setSubcategoriaFilter(item.subcategoria!);
                          playSound('click');
                        }}
                        title={`Filtrar por subcategoría: ${item.subcategoria}`}
                        className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded transition-transform hover:scale-105 active:scale-95 cursor-pointer text-left ${
                          isBelleza ? 'bg-pink-50 text-pink-700 border border-pink-100 hover:bg-pink-100' : 'bg-sky-50 text-sky-700 border border-sky-100 hover:bg-sky-100'
                        }`}
                      >
                        {item.subcategoria}
                      </button>
                    )}

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
              );
            })}
          </div>
        ) : (
          /* TABLE LIST MODE */
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <TableHeader />
              <tbody>
                {sortedAndFilteredStock.map(item => (
                  <ProductRow 
                    key={item.id} 
                    item={item} 
                    onSelectDepto={(d) => {
                      setDepartmentFilter(d);
                      setSubcategoriaFilter('TODAS');
                      playSound('click');
                    }}
                    onSelectSubcategoria={(sub) => {
                      setSubcategoriaFilter(sub);
                      playSound('click');
                    }}
                  />
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
