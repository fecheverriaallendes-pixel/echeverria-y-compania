import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  Package, 
  Tag, 
  MessageCircle, 
  Hash, 
  AlertCircle,
  LayoutGrid,
  List as ListIcon,
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  Share2,
  Check,
  ChevronRight,
  ExternalLink,
  Sparkles,
  SlidersHorizontal,
  Flame,
  Clock,
  ArrowUpDown,
  Eye,
  Cpu,
  Layers,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Download,
  ArrowRight,
  Store,
  ShieldCheck,
  PhoneCall
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { 
  StockItem, 
  LOGO_URL, 
  BRAND_NAME, 
  COMPANY_NAME, 
  BEAUTY_BRAND_NAME, 
  BEAUTY_LOGO_URL, 
  PARENT_COMPANY_NAME,
  PARENT_COMPANY_LOGO_URL,
  DEPARTAMENTOS, 
  DepartamentoGiro, 
  getItemDepartamento, 
  getItemImages,
  GIRO_BRANDS,
  GiroType
} from '../types';
import { ProductImageViewerModal } from '../components/ProductImageViewerModal';

interface CartItem {
  item: StockItem;
  quantity: number;
}

type CategoryTab = 'TODOS' | 'PRODUCTOS' | 'LOTES' | 'MAYORISTA' | 'OFERTAS';
type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'stock-desc';

export default function CatalogoPublico() {
  const { stock, stockLoaded } = useStore();
  const { giroParam } = useParams<{ giroParam?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active giro from URL route param (/catalogo-publico/tecnologia or /catalogo-publico/belleza)
  // or query param (?giro=tecnologia or ?giro=belleza or ?depto=TECNOLOGIA)
  const currentGiroMode = useMemo<'TECNOLOGIA' | 'BELLEZA' | 'PORTAL'>(() => {
    const rawParam = (giroParam || '').toLowerCase();
    const search = location.search || location.hash.split('?')[1] || '';
    const params = new URLSearchParams(search);
    const queryGiro = (params.get('giro') || params.get('depto') || '').toLowerCase();

    const target = rawParam || queryGiro;
    if (target === 'tecnologia' || target === 'tech' || target === 'mundo-tech') {
      return 'TECNOLOGIA';
    }
    if (target === 'belleza' || target === 'cosmetics' || target === 'cosmeticos' || target === 'echeverria-cosmetics') {
      return 'BELLEZA';
    }
    return 'PORTAL';
  }, [giroParam, location]);

  const [activeGiro, setActiveGiro] = useState<'TECNOLOGIA' | 'BELLEZA'>(() => {
    if (currentGiroMode === 'BELLEZA') return 'BELLEZA';
    return 'TECNOLOGIA';
  });

  // Sync activeGiro if route/param changes
  useEffect(() => {
    if (currentGiroMode === 'TECNOLOGIA' || currentGiroMode === 'BELLEZA') {
      setActiveGiro(currentGiroMode);
    }
  }, [currentGiroMode]);

  const [searchTerm, setSearchTerm] = useState('');
  const [subcategoriaFilter, setSubcategoriaFilter] = useState<string>('TODAS');
  const [activeTab, setActiveTab] = useState<CategoryTab>('TODOS');
  const [selectedProvider, setSelectedProvider] = useState<string>('TODOS');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Independent Quotation Cart State per Giro
  const [cart, setCart] = useState<Record<string, CartItem>>(() => {
    try {
      const saved = localStorage.getItem(`mdf_public_cart_${activeGiro}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StockItem | null>(null);
  const [modalActiveImageIndex, setModalActiveImageIndex] = useState(0);
  const [modalFitMode, setModalFitMode] = useState<'contain' | 'cover'>('contain');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Switch cart storage when activeGiro switches
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`mdf_public_cart_${activeGiro}`);
      setCart(saved ? JSON.parse(saved) : {});
      setSubcategoriaFilter('TODAS');
      setSearchTerm('');
      setActiveTab('TODOS');
    } catch {}
  }, [activeGiro]);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem(`mdf_public_cart_${activeGiro}`, JSON.stringify(cart));
    } catch {}
  }, [cart, activeGiro]);

  // Only items with stock > 0 are shown in the public catalog
  const availableStock = useMemo(() => {
    return stock.filter(item => (item.stockActual || 0) > 0);
  }, [stock]);

  // STABLE SEPARATION: Filter inventory strictly by the active Giro
  const giroFilteredStock = useMemo(() => {
    return availableStock.filter(item => {
      const itemDepto = item.departamento || getItemDepartamento(item);
      return itemDepto === activeGiro;
    });
  }, [availableStock, activeGiro]);

  const techCount = useMemo(() => availableStock.filter(s => (s.departamento || getItemDepartamento(s)) === 'TECNOLOGIA').length, [availableStock]);
  const beautyCount = useMemo(() => availableStock.filter(s => (s.departamento || getItemDepartamento(s)) === 'BELLEZA').length, [availableStock]);

  const availableSubcategories = useMemo(() => {
    const found = DEPARTAMENTOS.find(d => d.id === activeGiro);
    return found ? found.subcategorias : [];
  }, [activeGiro]);

  // Count per subcategory in active Giro
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    giroFilteredStock.forEach(item => {
      if (item.subcategoria) {
        counts[item.subcategoria] = (counts[item.subcategoria] || 0) + 1;
      }
    });
    return counts;
  }, [giroFilteredStock]);

  // Providers list for active Giro
  const providers = useMemo(() => {
    const set = new Set<string>();
    giroFilteredStock.forEach(item => {
      if (item.proveedor && item.proveedor.trim()) {
        set.add(item.proveedor.trim().toUpperCase());
      }
    });
    return ['TODOS', ...Array.from(set).sort()];
  }, [giroFilteredStock]);

  // Normalize string for search
  const normalize = (str: string) => 
    (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Filter and sort items strictly inside the active Giro
  const filteredItems = useMemo(() => {
    const query = normalize(searchTerm.trim());

    return giroFilteredStock.filter(item => {
      // Subcategory filter
      if (subcategoriaFilter !== 'TODAS') {
        if ((item.subcategoria || '') !== subcategoriaFilter) return false;
      }

      // Search matches
      if (query) {
        const matchName = normalize(item.tipo).includes(query);
        const matchCode = normalize(item.codigo).includes(query);
        const matchProvider = normalize(item.proveedor).includes(query);
        const matchSubcat = normalize(item.subcategoria || '').includes(query);
        const matchSpecs = normalize(item.especificaciones || '').includes(query);
        if (!matchName && !matchCode && !matchProvider && !matchSubcat && !matchSpecs) return false;
      }

      // Provider filter
      if (selectedProvider !== 'TODOS') {
        if ((item.proveedor || '').toUpperCase() !== selectedProvider) return false;
      }

      // Tab Category filter
      if (activeTab === 'PRODUCTOS') {
        const isProd = item.unidad === 'UNIDAD' || item.unidad === 'PIEZA' || item.categoria === 'ESTANDAR' || (item.categoria !== 'LOTE' && item.categoria !== 'MAYORISTA');
        if (!isProd) return false;
      } else if (activeTab === 'LOTES') {
        const isLote = item.categoria === 'LOTE' || item.unidad === 'PACK' || (item.tipo || '').toLowerCase().includes('pack');
        if (!isLote) return false;
      } else if (activeTab === 'MAYORISTA') {
        if (!item.precioMayorista || item.precioMayorista <= 0) return false;
      } else if (activeTab === 'OFERTAS') {
        if (!item.promocion && (!item.precioMayorista || item.precioMayorista <= 0)) return false;
      }

      return true;
    }).sort((a, b) => {
      switch (sortOption) {
        case 'price-asc':
          return (a.precioSugerido || 0) - (b.precioSugerido || 0);
        case 'price-desc':
          return (b.precioSugerido || 0) - (a.precioSugerido || 0);
        case 'name-asc':
          return (a.tipo || '').localeCompare(b.tipo || '');
        case 'stock-desc':
          return (b.stockActual || 0) - (a.stockActual || 0);
        case 'default':
        default:
          return (a.tipo || '').localeCompare(b.tipo || '');
      }
    });
  }, [giroFilteredStock, subcategoriaFilter, searchTerm, selectedProvider, activeTab, sortOption]);

  // Cart operations
  const addToCart = (item: StockItem) => {
    setCart(prev => {
      const currentQty = prev[item.id]?.quantity || 0;
      const maxAvailable = item.stockActual || 1;
      const newQty = Math.min(currentQty + 1, maxAvailable);
      return {
        ...prev,
        [item.id]: { item, quantity: newQty }
      };
    });
  };

  const updateCartQty = (itemId: string, delta: number) => {
    setCart(prev => {
      const entry = prev[itemId];
      if (!entry) return prev;
      const newQty = entry.quantity + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      const maxAvailable = entry.item.stockActual || 1;
      return {
        ...prev,
        [itemId]: { ...entry, quantity: Math.min(newQty, maxAvailable) }
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const clearCart = () => setCart({});

  // Cart summary calculations
  const cartList: CartItem[] = Object.values(cart);
  const cartTotalItems: number = cartList.reduce((acc: number, c: CartItem) => acc + c.quantity, 0);
  const cartTotalPrice: number = cartList.reduce((acc: number, c: CartItem) => {
    const hasWholesale = !!c.item.precioMayorista && c.item.precioMayorista > 0;
    const minWholesale = c.item.minUnidadesMayorista || 5;
    const unitPrice = (hasWholesale && c.quantity >= minWholesale) 
      ? c.item.precioMayorista! 
      : c.item.precioSugerido;
    return acc + (unitPrice * c.quantity);
  }, 0);

  const isTech = activeGiro === 'TECNOLOGIA';
  const brandName = isTech ? BRAND_NAME : BEAUTY_BRAND_NAME;
  const logoUrl = isTech ? LOGO_URL : BEAUTY_LOGO_URL;
  const storeSubtitle = isTech 
    ? 'Tecnología, Gadgets & Periféricos • Echeverria & Compañía' 
    : 'Belleza, Maquillaje & Cuidado Personal • Echeverria & Compañía';
  const storePhone = '56984304335';

  // Construct absolute dedicated link for sharing this specific giro catalog
  const dedicatedCatalogUrl = useMemo(() => {
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const slug = isTech ? 'tecnologia' : 'belleza';
    return `${baseUrl}#/catalogo-publico/${slug}`;
  }, [isTech]);

  // Generate single product WhatsApp inquiry
  const handleSingleWhatsApp = (item: StockItem) => {
    let msg = isTech 
      ? `Hola El Mundo Tech! 👋\nMe interesa consultar por este producto de su catálogo de tecnología:\n\n`
      : `Hola Echeverria Cosmetics! ✨\nMe interesa consultar por este producto de belleza y cosméticos:\n\n`;
    
    msg += `📦 *${item.tipo}*\n`;
    msg += `🔖 Código: ${item.codigo}\n`;
    if (item.subcategoria) msg += `📂 Categoría: ${item.subcategoria}\n`;
    msg += `💰 Precio Detalle: $${(item.precioSugerido || 0).toLocaleString('es-CL')}\n`;
    if (item.precioMayorista && item.precioMayorista > 0) {
      msg += `🔥 Precio Mayorista: $${item.precioMayorista.toLocaleString('es-CL')} (desde ${item.minUnidadesMayorista || 5} uds)\n`;
    }
    msg += `📊 Stock disponible en bodega: ${item.stockActual} unidades\n\n`;
    msg += `¿Tienen disponibilidad para despacho a domicilio o retiro?`;

    const url = `https://wa.me/${storePhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Generate multi-item WhatsApp quotation
  const handleSendCartWhatsApp = () => {
    if (cartList.length === 0) return;

    let msg = isTech
      ? `Hola El Mundo Tech! 👋\nQuisiera cotizar los siguientes productos de su catálogo oficial de tecnología:\n\n`
      : `Hola Echeverria Cosmetics! ✨\nQuisiera encargar / cotizar los siguientes productos de su catálogo de belleza:\n\n`;

    cartList.forEach((entry, idx) => {
      const item = entry.item;
      const hasWholesale = !!item.precioMayorista && item.precioMayorista > 0 && entry.quantity >= (item.minUnidadesMayorista || 5);
      const unitPrice = hasWholesale ? item.precioMayorista! : item.precioSugerido;
      const subtotal = unitPrice * entry.quantity;

      msg += `${idx + 1}. *${item.tipo}* (${item.codigo})\n`;
      msg += `   • Cantidad: ${entry.quantity} ${item.unidad || 'unidades'}\n`;
      msg += `   • Valor: $${unitPrice.toLocaleString('es-CL')} c/u ${hasWholesale ? '(Precio Mayorista aplicado)' : ''}\n`;
      msg += `   • Subtotal: $${subtotal.toLocaleString('es-CL')}\n\n`;
    });

    msg += `------------------------------------\n`;
    msg += `📦 *Total de artículos:* ${cartTotalItems}\n`;
    msg += `💰 *Total Estimado:* $${cartTotalPrice.toLocaleString('es-CL')} CLP\n\n`;
    msg += `¿Podrían confirmarme el stock y los métodos de envío o retiro? Mi nombre es: `;

    const url = `https://wa.me/${storePhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Copy catalog public link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(dedicatedCatalogUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleSwitchGiro = (newGiro: 'TECNOLOGIA' | 'BELLEZA') => {
    setActiveGiro(newGiro);
    const slug = newGiro === 'TECNOLOGIA' ? 'tecnologia' : 'belleza';
    navigate(`/catalogo-publico/${slug}`, { replace: true });
  };

  // IF BARE PORTAL VIEW (Customer visits without selecting a division)
  if (currentGiroMode === 'PORTAL' && availableStock.length > 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-white font-sans antialiased">
        <div className="max-w-4xl w-full text-center space-y-8 animate-in fade-in duration-500">
          
          {/* Parent Company Crest */}
          <div className="inline-flex flex-col items-center gap-3">
            <img 
              src={PARENT_COMPANY_LOGO_URL} 
              alt={PARENT_COMPANY_NAME} 
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]" 
            />
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 block mb-1">
                GRUPO EMPRESARIAL OFICIAL
              </span>
              <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white">
                {PARENT_COMPANY_NAME}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg mx-auto">
                Selecciona la tienda o catálogo que deseas explorar con stock y precios en tiempo real
              </p>
            </div>
          </div>

          {/* TWO INDEPENDENT PORTALS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-left">
            
            {/* PORTAL 1: EL MUNDO TECH */}
            <div 
              onClick={() => handleSwitchGiro('TECNOLOGIA')}
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 border-2 border-slate-800 hover:border-sky-500 rounded-[32px] p-6 sm:p-8 flex flex-col justify-between shadow-2xl hover:shadow-sky-500/20 hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-sky-500/20 transition-all"></div>
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-lg flex items-center justify-center">
                    <img src={LOGO_URL} alt={BRAND_NAME} className="w-full h-full object-contain" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    {techCount} Productos
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 block">
                    Giro Tecnología
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1 group-hover:text-sky-300 transition-colors">
                    EL MUNDO TECH
                  </h2>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    Smartwatches, audífonos bluetooth, accesorios gaming, cables, aros LED y gadgets de última generación.
                  </p>
                </div>
              </div>

              <div className="pt-6 relative z-10 flex items-center justify-between border-t border-slate-800/80 mt-6">
                <span className="text-xs font-black uppercase tracking-wider text-sky-400 group-hover:underline flex items-center gap-2">
                  <span>Ver Catálogo Tech</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  Despacho a Regiones
                </span>
              </div>
            </div>

            {/* PORTAL 2: ECHEVERRIA COSMETICS */}
            <div 
              onClick={() => handleSwitchGiro('BELLEZA')}
              className="bg-gradient-to-br from-slate-900 via-rose-950/60 to-pink-950 border-2 border-slate-800 hover:border-pink-500 rounded-[32px] p-6 sm:p-8 flex flex-col justify-between shadow-2xl hover:shadow-pink-500/20 hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-pink-500/20 transition-all"></div>
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-lg flex items-center justify-center">
                    <img src={BEAUTY_LOGO_URL} alt={BEAUTY_BRAND_NAME} className="w-full h-full object-contain" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    {beautyCount} Productos
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-pink-400 block">
                    Giro Belleza & Cosméticos
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1 group-hover:text-pink-300 transition-colors">
                    {BEAUTY_BRAND_NAME}
                  </h2>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    Cosméticos, cuidado facial skincare, maquillaje, brochas, implementos estéticos y packs exclusivos.
                  </p>
                </div>
              </div>

              <div className="pt-6 relative z-10 flex items-center justify-between border-t border-slate-800/80 mt-6">
                <span className="text-xs font-black uppercase tracking-wider text-pink-400 group-hover:underline flex items-center gap-2">
                  <span>Ver Catálogo Belleza</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  Venta Detalle y Mayorista
                </span>
              </div>
            </div>

          </div>

          <div className="pt-4 text-xs text-slate-500 flex items-center justify-center gap-4">
            <span>WhatsApp Atención: +56 9 8430 4335</span>
            <span>•</span>
            <span>Bodega Central Santiago</span>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div 
      id="catalogo-publico-root" 
      className={`min-h-screen flex flex-col font-sans antialiased selection:bg-slate-800 selection:text-white ${
        isTech ? 'bg-slate-100/80 text-slate-800' : 'bg-rose-50/40 text-slate-800'
      }`}
    >
      
      {/* Top Banner / Announcement Bar (Stylized per Giro) */}
      <div className={`text-white text-[11px] font-bold py-2 px-4 text-center border-b flex items-center justify-between gap-3 ${
        isTech 
          ? 'bg-slate-950 border-slate-800 text-sky-200' 
          : 'bg-gradient-to-r from-rose-950 via-pink-900 to-rose-950 border-pink-900 text-pink-100'
      }`}>
        <div className="hidden sm:flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
            isTech ? 'bg-emerald-500/20 text-emerald-400' : 'bg-pink-400/20 text-pink-300'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-ping ${isTech ? 'bg-emerald-400' : 'bg-pink-300'}`}></span>
            CATÁLOGO OFICIAL
          </span>
          <span className="text-slate-300 font-normal">
            {isTech ? 'Stock de Tecnología sincronizado en tiempo real' : 'Colección de Belleza & Skincare en tiempo real'}
          </span>
        </div>

        {/* Cross-Link to the other giro */}
        <div className="flex items-center justify-center sm:justify-end gap-3 w-full sm:w-auto text-[11px]">
          <span className="opacity-80 hidden md:inline">¿Buscas otro giro?</span>
          <button
            onClick={() => handleSwitchGiro(isTech ? 'BELLEZA' : 'TECNOLOGIA')}
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              isTech 
                ? 'bg-pink-600/30 hover:bg-pink-600 text-pink-200 border border-pink-500/40' 
                : 'bg-sky-600/30 hover:bg-sky-600 text-sky-200 border border-sky-500/40'
            }`}
          >
            {isTech ? (
              <>
                <Sparkles size={12} />
                <span>Ir a Echeverria Cosmetics ({beautyCount}) →</span>
              </>
            ) : (
              <>
                <Cpu size={12} />
                <span>Ir a El Mundo Tech ({techCount}) →</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Header (Theme tuned: High-Tech Dark for Tech, Luxury Rose for Cosmetics) */}
      <header className={`sticky top-0 z-30 backdrop-blur-md border-b shadow-sm transition-all ${
        isTech 
          ? 'bg-slate-900/95 border-slate-800 text-white' 
          : 'bg-white/95 border-rose-200 text-slate-900'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center p-1.5 flex-shrink-0 shadow-md ${
              isTech ? 'bg-white border border-slate-700' : 'bg-white border-2 border-pink-200'
            }`}>
              <img 
                src={logoUrl} 
                alt={brandName} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain" 
              />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-base sm:text-xl font-black tracking-tight uppercase truncate ${
                  isTech ? 'text-white' : 'text-slate-900'
                }`}>
                  {brandName}
                </span>
                <span className={`hidden sm:inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                  isTech ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-pink-100 text-pink-800 border border-pink-200'
                }`}>
                  {isTech ? 'TECNOLOGÍA' : 'BELLEZA'}
                </span>
              </div>
              <p className={`text-[11px] font-medium truncate ${isTech ? 'text-slate-400' : 'text-slate-500'}`}>
                {storeSubtitle}
              </p>
            </div>
          </div>

          {/* Quick Actions (Share link & Direct WhatsApp) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              id="btn-share-catalog"
              onClick={handleCopyLink}
              title={`Copiar enlace directo de ${brandName}`}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all ${
                isTech 
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700' 
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              {copiedLink ? <Check size={16} className={isTech ? 'text-sky-400' : 'text-rose-600'} /> : <Share2 size={16} />}
              <span className="hidden md:inline">{copiedLink ? '¡Enlace copiado!' : 'Compartir Link'}</span>
            </button>

            <a
              id="btn-whatsapp-direct-header"
              href={`https://wa.me/${storePhone}?text=${encodeURIComponent(
                isTech 
                  ? 'Hola El Mundo Tech! 👋 Quisiera hacer una consulta general sobre su catálogo de tecnología.' 
                  : 'Hola Echeverria Cosmetics! ✨ Quisiera hacer una consulta general sobre su catálogo de belleza.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 px-3.5 py-2 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-all ${
                isTech 
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' 
                  : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 shadow-pink-600/20'
              }`}
            >
              <MessageCircle size={16} />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* Search Bar & Subcategory Filter Section */}
      <section className={`border-b pt-5 pb-4 px-4 sm:px-6 transition-colors ${
        isTech ? 'bg-white border-slate-200' : 'bg-white/90 border-rose-200/80'
      }`}>
        <div className="max-w-6xl mx-auto space-y-4">
          
          {/* Search + Selectors */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="input-catalog-search"
                type="text"
                placeholder={
                  isTech 
                    ? "Buscar tecnología: smartwatch, audífonos, accesorios, cables, cargadores..."
                    : "Buscar belleza: labiales, skincare, bases, sombras, brochas, hidratante..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-11 pr-10 py-3 rounded-2xl border text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                  isTech 
                    ? 'bg-slate-50 hover:bg-slate-100/80 focus:bg-white border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10'
                    : 'bg-rose-50/50 hover:bg-rose-50 focus:bg-white border-rose-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10'
                }`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-all"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Provider Dropdown */}
              <div className="relative flex-1 md:w-48">
                <select
                  id="select-provider"
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full py-3 px-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 uppercase outline-none focus:ring-2 cursor-pointer appearance-none"
                >
                  {providers.map(p => (
                    <option key={p} value={p}>
                      {p === 'TODOS' ? 'Todos los orígenes' : `Origen: ${p}`}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
              </div>

              {/* Sort Dropdown */}
              <div className="relative flex-1 md:w-44">
                <select
                  id="select-sort"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="w-full py-3 px-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 uppercase outline-none focus:ring-2 cursor-pointer appearance-none"
                >
                  <option value="default">Orden A - Z</option>
                  <option value="price-asc">Precio: Menor a Mayor</option>
                  <option value="price-desc">Precio: Mayor a Menor</option>
                  <option value="stock-desc">Mayor Disponibilidad</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  onClick={() => setViewMode('grid')}
                  title="Vista Cuadrícula"
                  className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  title="Vista Lista"
                  className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  <ListIcon size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Subcategories Strip */}
          {availableSubcategories.length > 0 && (
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">
                {isTech ? 'Familias Tech:' : 'Secciones Belleza:'}
              </span>
              <button
                onClick={() => setSubcategoriaFilter('TODAS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  subcategoriaFilter === 'TODAS'
                    ? isTech ? 'bg-slate-900 text-white shadow-sm' : 'bg-rose-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas ({giroFilteredStock.length})
              </button>
              {availableSubcategories.map(sub => {
                const count = subcategoryCounts[sub] || 0;
                return (
                  <button
                    key={sub}
                    onClick={() => setSubcategoriaFilter(sub)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      subcategoriaFilter === sub
                        ? isTech 
                          ? 'bg-sky-600 text-white shadow-sm' 
                          : 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-sm'
                        : count > 0
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <span>{sub}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                      subcategoriaFilter === sub ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
            {[
              { id: 'TODOS', label: isTech ? 'Todo Tecnología' : 'Toda la Belleza' },
              { id: 'PRODUCTOS', label: isTech ? 'Individuales / Gadgets' : 'Cosméticos Individuales' },
              { id: 'LOTES', label: isTech ? 'Packs & Sets' : 'Sets & Estuches' },
              { id: 'MAYORISTA', label: '🔥 Precios Mayoristas' },
              { id: 'OFERTAS', label: '⭐ Destacados' }
            ].map(tab => (
              <button
                key={tab.id}
                id={`tab-${tab.id.toLowerCase()}`}
                onClick={() => setActiveTab(tab.id as CategoryTab)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? isTech 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'bg-pink-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Counters and Info */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span className="font-semibold">
              Mostrando <strong className="text-slate-900 font-black">{filteredItems.length}</strong> productos disponibles en catálogo de {brandName}
            </span>
            {selectedProvider !== 'TODOS' && (
              <button
                onClick={() => setSelectedProvider('TODOS')}
                className="text-emerald-700 font-bold hover:underline"
              >
                Limpiar filtro de origen ({selectedProvider})
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Product List Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 pb-28">
        
        {/* Loading state skeleton if initial fetch is pending */}
        {!stockLoaded && giroFilteredStock.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm animate-pulse space-y-4">
                <div className="h-40 bg-slate-200 rounded-2xl"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                <div className="h-8 bg-slate-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          
          /* GRID VIEW */
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredItems.map(item => {
                const inCart = !!cart[item.id];
                const cartQty = cart[item.id]?.quantity || 0;
                const hasWholesale = !!item.precioMayorista && item.precioMayorista > 0;

                return (
                  <div
                    key={item.id}
                    id={`product-card-${item.codigo}`}
                    className={`bg-white rounded-3xl border shadow-sm transition-all flex flex-col justify-between overflow-hidden group ${
                      isTech 
                        ? 'border-slate-200/90 hover:shadow-lg hover:border-sky-500/50' 
                        : 'border-rose-100 hover:shadow-lg hover:border-pink-400'
                    }`}
                  >
                    {/* Image / Header Thumbnail */}
                    <div 
                      onClick={() => {
                        setSelectedProduct(item);
                        setModalActiveImageIndex(0);
                        setModalFitMode('contain');
                      }}
                      className="relative w-full h-44 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden cursor-pointer"
                    >
                      {(() => {
                        const itemImgs = getItemImages(item);
                        const mainImg = itemImgs[0] || item.imagenUrl;
                        return mainImg ? (
                          <>
                            <img 
                              src={mainImg} 
                              alt={item.tipo} 
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                            {itemImgs.length > 1 && (
                              <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-900/80 text-amber-300 backdrop-blur-xs shadow-xs z-10">
                                📸 {itemImgs.length} fotos
                              </span>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-white/80 shadow-inner flex items-center justify-center text-slate-500 group-hover:text-emerald-600 transition-colors">
                              {isTech ? <Cpu size={28} /> : <Sparkles size={28} className="text-pink-500" />}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              {item.unidad || 'UNIDAD'}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Stock Badge */}
                      <div className="absolute top-3 right-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                          item.stockActual <= 2 
                            ? 'bg-amber-500 text-white' 
                            : isTech ? 'bg-sky-600 text-white' : 'bg-pink-600 text-white'
                        }`}>
                          {item.stockActual <= 2 ? `Últimas ${item.stockActual}` : `${item.stockActual} disponibles`}
                        </span>
                      </div>

                      {/* Origin Pill */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1">
                        <span className={`px-2.5 py-0.5 rounded-lg text-white text-[9px] font-black uppercase tracking-wider ${
                          isTech ? 'bg-sky-700/90' : 'bg-pink-700/90'
                        }`}>
                          {isTech ? '💻 Tech' : '💄 Belleza'}
                        </span>
                        {item.proveedor && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider">
                            {item.proveedor}
                          </span>
                        )}
                      </div>

                      {/* View details overlay hint */}
                      <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5">
                          <Eye size={14} /> Ver Ficha
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            {item.codigo}
                          </span>
                          <span className="text-[9px] font-black uppercase text-slate-400">
                            {item.unidad || 'UNIDAD'} {item.peso ? `• ${item.peso}kg` : ''}
                          </span>
                        </div>

                        <h3 
                          onClick={() => setSelectedProduct(item)}
                          className={`font-black text-sm sm:text-base leading-snug uppercase italic cursor-pointer line-clamp-2 transition-colors ${
                            isTech ? 'text-slate-900 hover:text-sky-600' : 'text-slate-900 hover:text-pink-700'
                          }`}
                        >
                          {item.tipo}
                        </h3>

                        {item.subcategoria && (
                          <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded ${
                            isTech 
                              ? 'bg-sky-50 text-sky-700 border border-sky-100' 
                              : 'bg-pink-50 text-pink-700 border border-pink-100'
                          }`}>
                            {item.subcategoria}
                          </span>
                        )}

                        {item.especificaciones && (
                          <p className="text-slate-500 text-xs line-clamp-2 mt-1 italic">
                            {item.especificaciones}
                          </p>
                        )}
                      </div>

                      {/* Prices Block */}
                      <div className={`rounded-2xl p-3 border space-y-1.5 ${
                        isTech ? 'bg-slate-50 border-slate-100' : 'bg-rose-50/50 border-rose-100'
                      }`}>
                        <div className="flex items-baseline justify-between">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Precio Detalle:</span>
                          <span className="text-lg font-black text-slate-900 tracking-tight">
                            ${(item.precioSugerido || 0).toLocaleString('es-CL')}
                          </span>
                        </div>

                        {hasWholesale && (
                          <div className="pt-1 border-t border-slate-200/80 flex items-center justify-between text-amber-800">
                            <span className="text-[9px] font-black uppercase">
                              Mayorista (≥{item.minUnidadesMayorista || 5} uds):
                            </span>
                            <span className="text-xs font-black text-amber-900">
                              ${item.precioMayorista!.toLocaleString('es-CL')} c/u
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-1">
                        {inCart ? (
                          <div className={`flex items-center justify-between border rounded-2xl p-1 ${
                            isTech ? 'bg-sky-50 border-sky-200' : 'bg-pink-50 border-pink-200'
                          }`}>
                            <button
                              onClick={() => updateCartQty(item.id, -1)}
                              className="w-8 h-8 rounded-xl bg-white border text-slate-800 flex items-center justify-center hover:bg-slate-50 font-bold active:scale-95"
                            >
                              <Minus size={14} />
                            </button>
                            <span className={`text-xs font-black ${isTech ? 'text-sky-900' : 'text-pink-900'}`}>
                              {cartQty} en tu pedido
                            </span>
                            <button
                              onClick={() => updateCartQty(item.id, 1)}
                              disabled={cartQty >= (item.stockActual || 1)}
                              className={`w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold active:scale-95 disabled:opacity-40 ${
                                isTech ? 'bg-sky-600 hover:bg-sky-700' : 'bg-pink-600 hover:bg-pink-700'
                              }`}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            id={`btn-add-cart-${item.codigo}`}
                            onClick={() => addToCart(item)}
                            className={`w-full py-2.5 px-3 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all ${
                              isTech 
                                ? 'bg-slate-900 hover:bg-slate-800' 
                                : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700'
                            }`}
                          >
                            <ShoppingBag size={14} />
                            <span>+ Agregar a Cotización</span>
                          </button>
                        )}

                        <button
                          id={`btn-whatsapp-item-${item.codigo}`}
                          onClick={() => handleSingleWhatsApp(item)}
                          className="w-full py-2 px-3 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 hover:border-emerald-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <MessageCircle size={14} />
                          <span>Consultar directo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            
            /* LIST VIEW */
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
              {filteredItems.map(item => {
                const inCart = !!cart[item.id];
                const cartQty = cart[item.id]?.quantity || 0;
                const hasWholesale = !!item.precioMayorista && item.precioMayorista > 0;

                return (
                  <div 
                    key={item.id} 
                    className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div 
                        onClick={() => setSelectedProduct(item)}
                        className="w-16 h-16 rounded-2xl bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200 cursor-pointer"
                      >
                        {item.imagenUrl ? (
                          <img src={item.imagenUrl} alt={item.tipo} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={22} className="text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-white text-[9px] font-black uppercase ${
                            isTech ? 'bg-sky-600' : 'bg-pink-600'
                          }`}>
                            {isTech ? '💻 Tech' : '💄 Belleza'}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400">{item.codigo}</span>
                          {item.subcategoria && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-bold">
                              {item.subcategoria}
                            </span>
                          )}
                          <span className="text-[10px] font-black text-emerald-600 uppercase">
                            Stock: {item.stockActual}
                          </span>
                        </div>
                        <h3 
                          onClick={() => setSelectedProduct(item)}
                          className="font-black text-slate-900 text-sm sm:text-base leading-snug uppercase italic hover:text-emerald-700 cursor-pointer truncate"
                        >
                          {item.tipo}
                        </h3>
                        {item.especificaciones && (
                          <p className="text-xs text-slate-400 truncate italic">{item.especificaciones}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <div className="text-right">
                        <div className="text-base sm:text-lg font-black text-slate-900">
                          ${(item.precioSugerido || 0).toLocaleString('es-CL')}
                        </div>
                        {hasWholesale && (
                          <div className="text-[10px] font-bold text-amber-700">
                            May: ${item.precioMayorista!.toLocaleString('es-CL')} (≥{item.minUnidadesMayorista || 5}u)
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {inCart ? (
                          <div className="flex items-center bg-emerald-50 border border-emerald-200 rounded-xl p-1 gap-1">
                            <button
                              onClick={() => updateCartQty(item.id, -1)}
                              className="w-7 h-7 rounded-lg bg-white text-emerald-800 flex items-center justify-center font-bold"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="px-2 text-xs font-black text-emerald-900">{cartQty}</span>
                            <button
                              onClick={() => updateCartQty(item.id, 1)}
                              disabled={cartQty >= (item.stockActual || 1)}
                              className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold disabled:opacity-40"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className={`px-3 py-2 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                              isTech ? 'bg-slate-900 hover:bg-slate-800' : 'bg-pink-600 hover:bg-pink-700'
                            }`}
                          >
                            <ShoppingBag size={14} /> + Agregar
                          </button>
                        )}

                        <button
                          onClick={() => handleSingleWhatsApp(item)}
                          className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl"
                          title="Consultar por WhatsApp"
                        >
                          <MessageCircle size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          
          /* EMPTY SEARCH RESULTS */
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm my-8">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
              <Package size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase italic mb-1">
              No encontramos productos con ese criterio
            </h3>
            <p className="text-slate-500 text-xs mb-6">
              Prueba con otro término de búsqueda o restablece los filtros para {brandName}.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedProvider('TODOS');
                setSubcategoriaFilter('TODAS');
                setActiveTab('TODOS');
              }}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
            >
              Restablecer Filtros
            </button>
          </div>
        )}
      </main>

      {/* FLOATING QUOTATION BAR */}
      {cartTotalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-xl mx-auto animate-in slide-in-from-bottom duration-300">
          <div className={`text-white p-4 rounded-3xl shadow-2xl border flex items-center justify-between gap-4 backdrop-blur-md ${
            isTech 
              ? 'bg-slate-950/95 border-slate-800' 
              : 'bg-rose-950/95 border-pink-900'
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shadow-md flex-shrink-0 ${
                isTech ? 'bg-sky-400 text-slate-950' : 'bg-pink-400 text-rose-950'
              }`}>
                {cartTotalItems}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Tu Cotización {brandName} ({cartList.length} ítems)
                </span>
                <span className={`text-lg font-black tracking-tight block truncate ${
                  isTech ? 'text-sky-400' : 'text-pink-300'
                }`}>
                  ${cartTotalPrice.toLocaleString('es-CL')} <span className="text-xs font-normal text-slate-400">CLP</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                id="btn-open-quote-modal"
                onClick={() => setIsCartOpen(true)}
                className={`px-4 py-2.5 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center gap-1.5 shadow-lg active:scale-95 transition-all ${
                  isTech 
                    ? 'bg-sky-500 hover:bg-sky-400 text-slate-950' 
                    : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white'
                }`}
              >
                <MessageCircle size={16} />
                <span>Ver Pedido</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUOTATION MODAL / DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className={`p-5 text-white flex items-center justify-between border-b ${
              isTech ? 'bg-slate-950 border-slate-800' : 'bg-rose-950 border-pink-900'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isTech ? 'bg-sky-500 text-slate-950' : 'bg-pink-500 text-white'}`}>
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase tracking-tight">Tu Cotización • {brandName}</h3>
                  <p className="text-[11px] text-slate-400">{cartTotalItems} unidades seleccionadas</p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Items List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3 divide-y divide-slate-100">
              {cartList.map(entry => {
                const item = entry.item;
                const hasWholesale = !!item.precioMayorista && item.precioMayorista > 0 && entry.quantity >= (item.minUnidadesMayorista || 5);
                const unitPrice = hasWholesale ? item.precioMayorista! : item.precioSugerido;
                const subtotal = unitPrice * entry.quantity;

                return (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase">
                        <span>{item.codigo}</span>
                        {item.subcategoria && (
                          <>
                            <span>•</span>
                            <span>{item.subcategoria}</span>
                          </>
                        )}
                      </div>
                      <h4 className="font-black text-xs text-slate-900 uppercase italic truncate">
                        {item.tipo}
                      </h4>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ${unitPrice.toLocaleString('es-CL')} c/u 
                        {hasWholesale && <span className="text-amber-700 font-bold ml-1">(Mayorista)</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-slate-100 rounded-xl p-1">
                        <button
                          onClick={() => updateCartQty(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold text-xs"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-2 text-xs font-black text-slate-900">{entry.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.id, 1)}
                          disabled={entry.quantity >= (item.stockActual || 1)}
                          className={`w-6 h-6 rounded-lg text-white flex items-center justify-center font-bold text-xs disabled:opacity-40 ${
                            isTech ? 'bg-sky-600' : 'bg-pink-600'
                          }`}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <span className="font-black text-xs text-slate-900 block">
                          ${subtotal.toLocaleString('es-CL')}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-[10px] text-red-500 hover:text-red-700 font-semibold"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Summary & WhatsApp CTA */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-500 uppercase text-xs">Total Estimado ({cartTotalItems} uds):</span>
                <span className="font-black text-2xl text-slate-900 tracking-tight">
                  ${cartTotalPrice.toLocaleString('es-CL')} <span className="text-xs font-bold text-slate-400">CLP</span>
                </span>
              </div>

              <button
                id="btn-submit-cart-whatsapp"
                onClick={handleSendCartWhatsApp}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-600/30 active:scale-98 transition-all"
              >
                <MessageCircle size={18} />
                <span>Enviar Pedido a WhatsApp (+56 9 8430 4335)</span>
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <button
                  onClick={clearCart}
                  className="hover:text-red-600 transition-colors"
                >
                  Vaciar lista
                </button>
                <span>Stock sujeto a confirmación de bodega</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header Image Gallery */}
            {(() => {
              const modalImages = getItemImages(selectedProduct);
              const currentModalImg = modalImages[modalActiveImageIndex] || selectedProduct.imagenUrl;
              const hasMultiple = modalImages.length > 1;

              return (
                <div className="flex flex-col bg-slate-900 border-b border-slate-800">
                  <div className="relative w-full h-64 sm:h-72 bg-slate-950 flex items-center justify-center overflow-hidden">
                    {currentModalImg ? (
                      <img 
                        src={currentModalImg} 
                        alt={selectedProduct.tipo} 
                        className={`w-full h-full transition-all duration-300 ${
                          modalFitMode === 'contain' ? 'object-contain' : 'object-cover'
                        }`}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500 gap-2">
                        <Package size={48} />
                        <span className="text-xs font-black uppercase tracking-widest">{selectedProduct.unidad}</span>
                      </div>
                    )}

                    {/* Top Controls: Close, Fit Toggle, Fullscreen Lightbox */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                      {currentModalImg && (
                        <button
                          type="button"
                          onClick={() => setModalFitMode(prev => prev === 'contain' ? 'cover' : 'contain')}
                          title={modalFitMode === 'contain' ? 'Llenar pantalla' : 'Ver imagen completa'}
                          className="px-2.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] font-bold backdrop-blur-md flex items-center gap-1 shadow-md transition-all cursor-pointer"
                        >
                          {modalFitMode === 'contain' ? (
                            <>
                              <Maximize2 size={13} />
                              <span className="hidden sm:inline">Completa</span>
                            </>
                          ) : (
                            <>
                              <Minimize2 size={13} />
                              <span className="hidden sm:inline">Llenar</span>
                            </>
                          )}
                        </button>
                      )}

                      {currentModalImg && (
                        <button
                          type="button"
                          onClick={() => setIsLightboxOpen(true)}
                          title="Abrir visor a pantalla completa"
                          className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md shadow-md transition-all cursor-pointer"
                        >
                          <Maximize2 size={15} />
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedProduct(null)}
                        className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md shadow-md transition-all cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Navigation arrows for multiple images */}
                    {hasMultiple && (
                      <>
                        <button
                          type="button"
                          onClick={() => setModalActiveImageIndex(prev => (prev - 1 + modalImages.length) % modalImages.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white flex items-center justify-center transition-all z-20"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalActiveImageIndex(prev => (prev + 1) % modalImages.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white flex items-center justify-center transition-all z-20"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnails strip */}
                  {hasMultiple && (
                    <div className="flex items-center gap-2 p-2.5 overflow-x-auto bg-slate-900">
                      {modalImages.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setModalActiveImageIndex(idx)}
                          className={`relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                            idx === modalActiveImageIndex 
                              ? isTech ? 'border-sky-400 scale-105' : 'border-pink-400 scale-105'
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt={`Foto ${idx+1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    SKU: {selectedProduct.codigo}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    selectedProduct.stockActual <= 2 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {selectedProduct.stockActual} en bodega
                  </span>
                </div>

                <h3 className="font-black text-xl text-slate-900 uppercase italic">
                  {selectedProduct.tipo}
                </h3>

                {selectedProduct.subcategoria && (
                  <span className={`inline-block mt-1 text-xs font-bold px-2.5 py-0.5 rounded ${
                    isTech ? 'bg-sky-50 text-sky-700' : 'bg-pink-50 text-pink-700'
                  }`}>
                    {selectedProduct.subcategoria}
                  </span>
                )}
              </div>

              {selectedProduct.especificaciones && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Descripción / Ficha:</p>
                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {selectedProduct.especificaciones}
                  </p>
                </div>
              )}

              {/* Pricing breakdown */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">Precio Unitario:</span>
                  <span className="text-2xl font-black text-slate-900">
                    ${(selectedProduct.precioSugerido || 0).toLocaleString('es-CL')}
                  </span>
                </div>

                {!!selectedProduct.precioMayorista && selectedProduct.precioMayorista > 0 && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-amber-800">
                    <span className="text-xs font-black uppercase">
                      Precio Mayorista (≥{selectedProduct.minUnidadesMayorista || 5} uds):
                    </span>
                    <span className="text-base font-black text-amber-900">
                      ${selectedProduct.precioMayorista.toLocaleString('es-CL')}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className={`w-full py-3.5 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all ${
                    isTech ? 'bg-slate-900 hover:bg-slate-800' : 'bg-pink-600 hover:bg-pink-700'
                  }`}
                >
                  <ShoppingBag size={18} />
                  <span>Agregar a Cotización</span>
                </button>

                <button
                  onClick={() => handleSingleWhatsApp(selectedProduct)}
                  className="w-full py-3 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <MessageCircle size={18} />
                  <span>Consultar disponibilidad inmediata por WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isLightboxOpen && selectedProduct && (
        <ProductImageViewerModal
          item={selectedProduct}
          initialIndex={modalActiveImageIndex}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}

    </div>
  );
}
