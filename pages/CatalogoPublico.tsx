import React, { useState, useMemo, useEffect } from 'react';
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
  Eye
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { StockItem, LOGO_URL, BRAND_NAME, COMPANY_NAME } from '../types';

interface CartItem {
  item: StockItem;
  quantity: number;
}

type CategoryTab = 'TODOS' | 'FARDOS' | 'LOTES' | 'MAYORISTA' | 'OFERTAS';
type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'stock-desc';

export default function CatalogoPublico() {
  const { stock, stockLoaded } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<CategoryTab>('TODOS');
  const [selectedProvider, setSelectedProvider] = useState<string>('TODOS');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Quotation Cart State
  const [cart, setCart] = useState<Record<string, CartItem>>(() => {
    try {
      const saved = localStorage.getItem('mdf_public_cart');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StockItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem('mdf_public_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Only items with stock > 0 are shown in the public catalog
  const availableStock = useMemo(() => {
    return stock.filter(item => (item.stockActual || 0) > 0);
  }, [stock]);

  // Providers list
  const providers = useMemo(() => {
    const set = new Set<string>();
    availableStock.forEach(item => {
      if (item.proveedor && item.proveedor.trim()) {
        set.add(item.proveedor.trim().toUpperCase());
      }
    });
    return ['TODOS', ...Array.from(set).sort()];
  }, [availableStock]);

  // Normalize string for accent-insensitive search
  const normalize = (str: string) => 
    (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Filter and sort items
  const filteredItems = useMemo(() => {
    const query = normalize(searchTerm.trim());

    return availableStock.filter(item => {
      // Search matches
      if (query) {
        const matchName = normalize(item.tipo).includes(query);
        const matchCode = normalize(item.codigo).includes(query);
        const matchProvider = normalize(item.proveedor).includes(query);
        const matchSpecs = normalize(item.especificaciones || '').includes(query);
        if (!matchName && !matchCode && !matchProvider && !matchSpecs) return false;
      }

      // Provider filter
      if (selectedProvider !== 'TODOS') {
        if ((item.proveedor || '').toUpperCase() !== selectedProvider) return false;
      }

      // Tab Category filter
      if (activeTab === 'FARDOS') {
        const isFardo = item.unidad === 'FARDO' || item.categoria === 'FARDO' || (item.categoria !== 'LOTE' && item.unidad !== '25 KILOS');
        if (!isFardo) return false;
      } else if (activeTab === 'LOTES') {
        const isLote = item.categoria === 'LOTE' || item.unidad === '25 KILOS' || (item.tipo || '').toLowerCase().includes('25 kg') || (item.tipo || '').toLowerCase().includes('lote');
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
  }, [availableStock, searchTerm, selectedProvider, activeTab, sortOption]);

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
    // If quantity qualifies for wholesale, use wholesale price
    const hasWholesale = !!c.item.precioMayorista && c.item.precioMayorista > 0;
    const minWholesale = c.item.minUnidadesMayorista || 5;
    const unitPrice = (hasWholesale && c.quantity >= minWholesale) 
      ? c.item.precioMayorista! 
      : c.item.precioSugerido;
    return acc + (unitPrice * c.quantity);
  }, 0);

  // Generate single product WhatsApp inquiry
  const handleSingleWhatsApp = (item: StockItem) => {
    let msg = `Hola El Mundo Tech! 👋\nMe interesa consultar por este producto de su catálogo en línea:\n\n`;
    msg += `📦 *${item.tipo}*\n`;
    msg += `🔖 Código: ${item.codigo}\n`;
    msg += `🏷️ Proveedor: ${item.proveedor || 'General'}\n`;
    msg += `💰 Precio Detalle: $${(item.precioSugerido || 0).toLocaleString('es-CL')}\n`;
    if (item.precioMayorista && item.precioMayorista > 0) {
      msg += `🔥 Precio Mayorista: $${item.precioMayorista.toLocaleString('es-CL')} (desde ${item.minUnidadesMayorista || 5} uds)\n`;
    }
    msg += `📊 Stock disponible en bodega: ${item.stockActual} unidades\n\n`;
    msg += `¿Tienen disponibilidad inmediata para despacho a regiones o retiro en bodega?`;

    const url = `https://wa.me/56984304335?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Generate multi-item WhatsApp quotation
  const handleSendCartWhatsApp = () => {
    if (cartList.length === 0) return;

    let msg = `Hola El Mundo Tech! 👋\nQuisiera cotizar los siguientes productos de su catálogo oficial:\n\n`;
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
    msg += `📦 *Total de bultos/unidades:* ${cartTotalItems}\n`;
    msg += `💰 *Total Estimado:* $${cartTotalPrice.toLocaleString('es-CL')} CLP\n\n`;
    msg += `¿Podrían confirmarme el stock y los métodos de envío o retiro? Mi nombre es: `;

    const url = `https://wa.me/56984304335?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Copy catalog public link
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  return (
    <div id="catalogo-publico-root" className="min-h-screen bg-slate-100/70 flex flex-col font-sans text-slate-800 antialiased selection:bg-emerald-200">
      
      {/* Top Banner / Announcement */}
      <div className="bg-slate-900 text-white text-[11px] font-bold py-2 px-4 text-center border-b border-slate-800 flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          EN VIVO
        </span>
        <span>Stock sincronizado en tiempo real con Bodega Central • Despacho a todo Chile</span>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <img 
              src={LOGO_URL} 
              alt={BRAND_NAME} 
              referrerPolicy="no-referrer"
              className="w-11 h-11 object-contain flex-shrink-0" 
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase truncate">
                  {BRAND_NAME}
                </span>
                <span className="hidden sm:inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  OFICIAL
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 truncate">
                {COMPANY_NAME} • Catálogo Mayorista y Detalle
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              id="btn-share-catalog"
              onClick={handleCopyLink}
              title="Copiar enlace del catálogo"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all"
            >
              {copiedLink ? <Check size={16} className="text-emerald-600" /> : <Share2 size={16} />}
              <span className="hidden md:inline">{copiedLink ? '¡Enlace copiado!' : 'Compartir'}</span>
            </button>

            <a
              id="btn-whatsapp-direct-header"
              href="https://wa.me/56984304335?text=Hola%20El%20Mundo%20Tech%2C%20quisiera%20hacer%20una%20consulta%20general%20sobre%20su%20cat%C3%A1logo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <MessageCircle size={16} />
              <span className="hidden sm:inline">Hablar por WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* Filter and Search Hero Section */}
      <section className="bg-white border-b border-slate-200 pt-5 pb-4 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-4">
          
          {/* Search Bar + Controls */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="input-catalog-search"
                type="text"
                placeholder="Buscar por tipo de fardo, producto, código o marca (ej. sweater, abrigo, buzo, canada)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all"
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
                  className="w-full py-3 px-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 uppercase outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 cursor-pointer appearance-none"
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
                  className="w-full py-3 px-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 uppercase outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 cursor-pointer appearance-none"
                >
                  <option value="default">Orden A - Z</option>
                  <option value="price-asc">Precio: Menor a Mayor</option>
                  <option value="price-desc">Precio: Mayor a Menor</option>
                  <option value="stock-desc">Mayor Disponibilidad</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
              </div>

              {/* View Mode Toggle (Grid / List) */}
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

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
            {[
              { id: 'TODOS', label: 'Todos los Fardos' },
              { id: 'FARDOS', label: 'Fardos Ropa Americana' },
              { id: 'LOTES', label: 'Lotes x Kilo (25kg)' },
              { id: 'MAYORISTA', label: '🔥 Precios Mayoristas' },
              { id: 'OFERTAS', label: '⭐ Destacados' }
            ].map(tab => (
              <button
                key={tab.id}
                id={`tab-${tab.id.toLowerCase()}`}
                onClick={() => setActiveTab(tab.id as CategoryTab)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
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
              Mostrando <strong className="text-slate-900 font-black">{filteredItems.length}</strong> productos disponibles con stock en bodega
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
        {!stockLoaded && availableStock.length === 0 ? (
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
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    {/* Image / Header Thumbnail */}
                    <div 
                      onClick={() => setSelectedProduct(item)}
                      className="relative w-full h-44 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden cursor-pointer"
                    >
                      {item.imagenUrl ? (
                        <img 
                          src={item.imagenUrl} 
                          alt={item.tipo} 
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center">
                          <div className="w-14 h-14 rounded-2xl bg-white/80 shadow-inner flex items-center justify-center text-slate-500 group-hover:text-emerald-600 transition-colors">
                            <Package size={28} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            {item.unidad || 'FARDO'}
                          </span>
                        </div>
                      )}

                      {/* Stock Badge */}
                      <div className="absolute top-3 right-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                          item.stockActual <= 2 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-emerald-600 text-white'
                        }`}>
                          {item.stockActual <= 2 ? `Últimas ${item.stockActual}` : `${item.stockActual} disponibles`}
                        </span>
                      </div>

                      {/* Origin Pill */}
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider">
                          {item.proveedor || 'General'}
                        </span>
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
                            {item.unidad || 'FARDO'} {item.peso ? `• ${item.peso}kg` : ''}
                          </span>
                        </div>

                        <h3 
                          onClick={() => setSelectedProduct(item)}
                          className="font-black text-slate-900 text-sm sm:text-base leading-snug uppercase italic hover:text-emerald-700 cursor-pointer line-clamp-2"
                        >
                          {item.tipo}
                        </h3>

                        {item.especificaciones && (
                          <p className="text-slate-500 text-xs line-clamp-2 mt-1 italic">
                            {item.especificaciones}
                          </p>
                        )}
                      </div>

                      {/* Prices Block */}
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1.5">
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
                          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl p-1">
                            <button
                              onClick={() => updateCartQty(item.id, -1)}
                              className="w-8 h-8 rounded-xl bg-white border border-emerald-200 text-emerald-800 flex items-center justify-center hover:bg-emerald-100 font-bold active:scale-95"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-xs font-black text-emerald-900">
                              {cartQty} en tu pedido
                            </span>
                            <button
                              onClick={() => updateCartQty(item.id, 1)}
                              disabled={cartQty >= (item.stockActual || 1)}
                              className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 font-bold active:scale-95 disabled:opacity-40"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            id={`btn-add-cart-${item.codigo}`}
                            onClick={() => addToCart(item)}
                            className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all"
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
                          <span className="text-[10px] font-mono font-bold text-slate-400">{item.codigo}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-black uppercase">
                            {item.proveedor}
                          </span>
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
                            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
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
              Prueba con otro término de búsqueda o restablece los filtros de origen y categoría.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedProvider('TODOS');
                setActiveTab('TODOS');
              }}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
            >
              Restablecer Filtros
            </button>
          </div>
        )}
      </main>

      {/* FLOATING QUOTATION BAR (When 1+ items selected) */}
      {cartTotalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-xl mx-auto animate-in slide-in-from-bottom duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-slate-900 flex items-center justify-center font-black text-base shadow-md flex-shrink-0">
                {cartTotalItems}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Tu Cotización ({cartList.length} productos)
                </span>
                <span className="text-lg font-black text-emerald-400 tracking-tight block truncate">
                  ${cartTotalPrice.toLocaleString('es-CL')} <span className="text-xs font-normal text-slate-300">CLP</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                id="btn-open-quote-modal"
                onClick={() => setIsCartOpen(true)}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
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
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500 text-slate-900">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase tracking-tight">Tu Cotización de Fardos</h3>
                  <p className="text-[11px] text-slate-400">{cartTotalItems} bultos seleccionados</p>
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
                        <span>•</span>
                        <span>{item.proveedor}</span>
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
                          className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs disabled:opacity-40"
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
                <span>Enviar Pedido por WhatsApp (+56 9 8430 4335)</span>
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
            
            {/* Modal Header Image */}
            <div className="relative w-full h-56 bg-slate-100 flex items-center justify-center overflow-hidden">
              {selectedProduct.imagenUrl ? (
                <img 
                  src={selectedProduct.imagenUrl} 
                  alt={selectedProduct.tipo} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Package size={48} />
                  <span className="text-xs font-black uppercase tracking-widest">{selectedProduct.unidad}</span>
                </div>
              )}

              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-slate-900 transition-all shadow-md"
              >
                <X size={18} />
              </button>

              <div className="absolute bottom-3 left-4">
                <span className="px-3 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md text-white text-xs font-black uppercase">
                  {selectedProduct.proveedor || 'General'}
                </span>
              </div>
            </div>

            {/* Modal Body Info */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400">
                  CÓDIGO: {selectedProduct.codigo}
                </span>
                <h2 className="text-xl font-black uppercase italic text-slate-900 leading-tight mt-0.5">
                  {selectedProduct.tipo}
                </h2>
              </div>

              {/* Status and Unit Pill */}
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black uppercase">
                  Stock: {selectedProduct.stockActual} unidades disponibles
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-black uppercase">
                  Unidad: {selectedProduct.unidad} {selectedProduct.peso ? `(${selectedProduct.peso} kg)` : ''}
                </span>
              </div>

              {/* Specifications */}
              {selectedProduct.especificaciones && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Detalles y Especificaciones:
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    {selectedProduct.especificaciones}
                  </p>
                </div>
              )}

              {/* Price Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">Precio Detalle:</span>
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    ${(selectedProduct.precioSugerido || 0).toLocaleString('es-CL')}
                  </span>
                </div>

                {!!selectedProduct.precioMayorista && selectedProduct.precioMayorista > 0 && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-amber-800 block">
                        Precio Mayorista
                      </span>
                      <span className="text-[10px] text-amber-700 font-semibold">
                        A partir de {selectedProduct.minUnidadesMayorista || 5} unidades
                      </span>
                    </div>
                    <span className="text-lg font-black text-amber-900">
                      ${selectedProduct.precioMayorista.toLocaleString('es-CL')} c/u
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer CTA */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <ShoppingBag size={16} />
                <span>+ Agregar a Cotización</span>
              </button>

              <button
                onClick={() => {
                  handleSingleWhatsApp(selectedProduct);
                  setSelectedProduct(null);
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} />
                <span>Consultar por WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 px-4 sm:px-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <AlertCircle size={15} />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Stock y valores sincronizados directamente con Bodega Central
            </span>
          </div>
          <p className="text-[11px] font-medium text-slate-400">
            © {new Date().getFullYear()} {BRAND_NAME} • {COMPANY_NAME} • Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* Custom Styles */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
