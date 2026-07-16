
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PackagePlus, Search, Package, FileUp, X, Download, Tag, Boxes, Edit3, Trash2, Save, AlertTriangle, Layers, Square, Filter, History, Calendar, User, ArrowUpRight, ArrowDownLeft, TrendingUp, Camera, Upload } from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { StaffRole, StockItem } from '../types';

function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  const slashParts = dateStr.split('/');
  if (slashParts.length === 3) {
    if (slashParts[0].length === 4) {
      return new Date(parseInt(slashParts[0], 10), parseInt(slashParts[1], 10) - 1, parseInt(slashParts[2], 10));
    } else {
      return new Date(parseInt(slashParts[2], 10), parseInt(slashParts[1], 10) - 1, parseInt(slashParts[0], 10));
    }
  }
  return new Date(dateStr);
}

export default function Stock() {
  const { stock, addStockItem, updateStockItem, togglePromocion, removeStockItem, bulkAddStock, currentUser, playSound, stockHistory, sales } = useStore();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('TODOS');
  const [categoryFilter, setCategoryFilter] = useState<'TODOS' | 'UNIDAD' | 'CAJA' | 'NEGATIVO'>('TODOS');
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<StockItem | null>(null);
  const [historyTab, setHistoryTab] = useState<'TODOS' | 'INGRESOS' | 'SALIDAS'>('TODOS');
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 5000);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    if (action === 'add') {
      setIsAdding(true);
    }
  }, [location]);
  
  const [newBale, setNewBale] = useState({ 
    codigo: '', 
    tipo: '', 
    proveedor: '', 
    precioCosto: 0, 
    precioSugerido: 0, 
    stockActual: 1,
    unidad: 'UNIDAD' as any,
    categoria: 'ESTANDAR' as any,
    peso: 0,
    imagenUrl: '',
    especificaciones: '',
    comision: undefined as number | undefined
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (file: File, isEdit: boolean) => {
    setIsUploading(true);
    try {
      // 1. Compress image to max 320px width/height and quality 0.6 for optimal storage and performance
      const compressedDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new window.Image();
          // Set onload and onerror BEFORE setting src to avoid synchronous load race condition in some environments
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 320; // Keeps base64 extremely small (approx 5-10 KB), perfect for direct Firestore saves
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.6));
          };
          img.onerror = (err) => reject(err);
          img.src = e.target?.result as string;
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      // 2. Try to upload to Firebase Storage with a strict 2.5s timeout.
      // If Storage is not active, unconfigured, or blocked by rules, it will instantly fallback to Base64.
      let finalUrl = compressedDataUrl;
      try {
        const uploadPromise = (async () => {
          const res = await fetch(compressedDataUrl);
          const blob = await res.blob();
          
          const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
          const { storage } = await import('../firebase');
          
          if (!storage) {
            throw new Error("El servicio de Firebase Storage no está disponible.");
          }
          
          const storageRef = ref(storage, `products/${filename}`);
          await uploadBytes(storageRef, blob);
          return await getDownloadURL(storageRef);
        })();

        // Set a 2.5 second timeout for the upload process to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Timeout: Firebase Storage upload took too long")), 2500);
        });

        finalUrl = await Promise.race([uploadPromise, timeoutPromise]);
        showFeedback("Imagen subida y optimizada con éxito", "success");
      } catch (storageError) {
        console.warn("Firebase Storage failed/timed out, falling back to database embedded storage:", storageError);
        // This is a normal and valid fallback. We save the lightweight base64 string directly to the Firestore document.
        showFeedback("Imagen procesada y optimizada para catálogo", "success");
      }

      // 3. Update correct state
      if (isEdit && editingItem) {
        setEditingItem({ ...editingItem, imagenUrl: finalUrl });
      } else {
        setNewBale(prev => ({ ...prev, imagenUrl: finalUrl }));
      }
      playSound('success');
    } catch (err) {
      console.error("Error processing image:", err);
      showFeedback("Error al procesar la imagen seleccionada.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const canModify = currentUser?.rol === StaffRole.ADMIN || currentUser?.rol === StaffRole.BODEGA;

  // --- HISTORIAL MOVIMIENTOS DYNAMIC TIMELINE ---
  const itemTimeline = useMemo(() => {
    if (!selectedHistoryItem) return [];
    const code = selectedHistoryItem.codigo.trim().toUpperCase();

    // 1. Manual/system transactions in stock_history
    const manualEvents = (stockHistory || [])
      .filter(h => h.productId?.trim().toUpperCase() === code)
      .map(h => ({
        id: h.id,
        tipo: h.tipo,
        cantidad: h.cantidad,
        fecha: h.fecha,
        vendedor: h.vendedor || 'SISTEMA',
        observaciones: h.observaciones || 'Movimiento de inventario'
      }));

    // 2. Sales events
    const salesEvents = (sales || []).flatMap(sale => {
      if (sale.tipoVenta === 'NOTA_VENTA') {
        return (sale.items || [])
          .filter(it => !it.esManual && it.codigoFardo?.trim().toUpperCase() === code)
          .map(it => ({
            id: `${sale.id}-${it.codigoFardo}`,
            tipo: 'VENTA' as const,
            cantidad: -it.cantidad,
            fecha: sale.timestamp || parseLocalDate(sale.fecha).toISOString(),
            vendedor: sale.vendedor || 'VENDEDOR',
            observaciones: `Nota de Venta #${sale.numeroVenta} - Cliente: ${sale.cliente || 'Otros'}`
          }));
      } else if (sale.codigoFardo?.trim().toUpperCase() === code && !sale.esManual) {
        return [{
          id: sale.id,
          tipo: 'VENTA' as const,
          cantidad: -(sale.cantidad || 0),
          fecha: sale.timestamp || parseLocalDate(sale.fecha).toISOString(),
          vendedor: sale.vendedor || 'VENDEDOR',
          observaciones: `Venta #${sale.numeroVenta} - Cliente: ${sale.cliente || 'Consumidor'} (${sale.tipoVenta})`
        }];
      }
      return [];
    });

    // 3. Merge and sort
    return [...manualEvents, ...salesEvents].sort((a, b) => {
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }, [selectedHistoryItem, stockHistory, sales]);

  const filteredTimeline = useMemo(() => {
    if (historyTab === 'INGRESOS') {
      return itemTimeline.filter(e => e.tipo !== 'VENTA');
    }
    if (historyTab === 'SALIDAS') {
      return itemTimeline.filter(e => e.tipo === 'VENTA');
    }
    return itemTimeline;
  }, [itemTimeline, historyTab]);

  const historyStats = useMemo(() => {
    let inputs = 0;
    let outputs = 0;

    itemTimeline.forEach(e => {
      if (e.tipo === 'VENTA') {
        outputs += Math.abs(e.cantidad);
      } else {
        if (e.cantidad > 0) {
          inputs += e.cantidad;
        } else {
          outputs += Math.abs(e.cantidad);
        }
      }
    });

    return { inputs, outputs };
  }, [itemTimeline]);

  // Obtener lista única de proveedores para el filtro
  const uniqueProviders = useMemo(() => {
    const providers = stock.map(item => (item.proveedor || '').trim().toUpperCase()).filter(Boolean);
    return ['TODOS', ...Array.from(new Set(providers))].sort();
  }, [stock]);

  const normalizeText = (text: string) => 
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredStock = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);
    return stock.filter(item => {
      const matchesSearch = normalizeText(item.codigo || '').includes(normalizedSearch) || 
                           normalizeText(item.tipo || '').includes(normalizedSearch);
      const matchesProvider = providerFilter === 'TODOS' || (item.proveedor || '').toUpperCase() === providerFilter;
      
      let matchesCategory = true;
      if (categoryFilter === 'NEGATIVO') {
        matchesCategory = item.stockActual < 0;
      } else if (categoryFilter === 'UNIDAD') {
        matchesCategory = item.unidad === 'UNIDAD' || item.unidad === 'PIEZA' || item.categoria === 'ESTANDAR' || item.categoria === 'FARDO';
      } else if (categoryFilter === 'CAJA') {
        matchesCategory = item.unidad === 'CAJA' || item.unidad === 'PACK' || item.unidad === 'SET' || item.categoria === 'MAYORISTA' || item.categoria === 'LOTE';
      }

      return matchesSearch && matchesProvider && matchesCategory;
    });
  }, [stock, searchTerm, providerFilter, categoryFilter]);

  const downloadFormat = () => {
    const csvContent = "codigo,tipo,proveedor,precioCosto,precioSugerido,stockActual,unidad\nF-101,Polerones Premium,Bale Center,100000,150000,10,FARDO\nU-102,Jeans Unitario,USA Direct,8000,15000,50,PIEZA";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formato_carga_echeverria.csv';
    a.click();
    playSound('success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const items: any[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [codigo, tipo, proveedor, costo, precio, stockCant, unidad] = line.split(',');
        if (codigo && tipo && !isNaN(Number(precio))) {
          items.push({
            codigo: codigo.trim().toUpperCase(),
            tipo: tipo.trim(),
            proveedor: proveedor?.trim().toUpperCase() || 'GENERAL',
            precioCosto: Number(costo) || 0,
            precioSugerido: Number(precio),
            stockActual: Number(stockCant) || 1,
            unidad: (unidad?.trim().toUpperCase() === 'PIEZA' ? 'PIEZA' : 'FARDO')
          });
        }
      }
      if (items.length > 0) bulkAddStock(items);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModify) return;
    
    let finalCodigo = newBale.codigo;
    if (!finalCodigo) {
        const existingCodes = stock.map(s => s.codigo).filter(c => c.startsWith('MDF-'));
        let nextNum = 1;
        if(existingCodes.length > 0) {
            const numbers = existingCodes.map(c => parseInt(c.split('-')[1]) || 0);
            nextNum = Math.max(...numbers) + 1;
        }
        finalCodigo = `MDF-${String(nextNum).padStart(3, '0')}`;
    }

    const codeExists = stock.some(s => s.codigo.toUpperCase() === finalCodigo.toUpperCase());
    if (codeExists) {
        showFeedback(`ERROR: El código ${finalCodigo} ya está en uso. Por favor ingresa uno diferente.`, "error");
        playSound('error');
        return;
    }

    addStockItem({ ...newBale, codigo: finalCodigo, proveedor: (newBale.proveedor || '').toUpperCase() });
    setNewBale({ codigo: '', tipo: '', proveedor: '', precioCosto: 0, precioSugerido: 0, stockActual: 1, unidad: 'UNIDAD' as any, categoria: 'ESTANDAR' as any, peso: 0, imagenUrl: '', especificaciones: '', comision: undefined });
    setIsAdding(false);
    playSound('success');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !canModify) return;
    
    const conflict = stock.find(s => s.id !== editingItem.id && (s.codigo || '').toUpperCase() === (editingItem.codigo || '').toUpperCase());
    if (conflict) {
      showFeedback(`ERROR: No puedes usar el código ${editingItem.codigo} porque ya pertenece a otro producto (${conflict.tipo}).`, "error");
      playSound('error');
      return;
    }

    updateStockItem(editingItem.id, { ...editingItem, proveedor: (editingItem.proveedor || '').toUpperCase() });
    setEditingItem(null);
    playSound('success');
  };

  const handleDelete = () => {
    if (!deletingId || !canModify) return;
    removeStockItem(deletingId);
    setDeletingId(null);
    playSound('click');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-20">
      {/* Toast Notification Container */}
      {feedbackMessage && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-4 duration-300 max-w-md">
          <div className={`p-5 rounded-[24px] shadow-2xl flex items-center gap-4 border-2 ${
            feedbackMessage.type === 'success' 
              ? 'bg-emerald-600 text-white border-emerald-500' 
              : feedbackMessage.type === 'error'
              ? 'bg-red-600 text-white border-red-500'
              : 'bg-slate-900 text-white border-slate-800'
          }`}>
            <span className="font-black text-xs uppercase tracking-wider">{feedbackMessage.text}</span>
            <button 
              onClick={() => setFeedbackMessage(null)}
              className="ml-auto text-white/70 hover:text-white font-black hover:scale-115 transition-transform"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tight uppercase">Inventario Central</h2>
          <p className="text-slate-500 font-medium italic mt-2">Control maestro de Productos y Piezas Unitarias</p>
        </div>
        {canModify && (
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={downloadFormat}
              className="flex items-center gap-2 px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-[24px] font-black text-xs uppercase hover:bg-slate-50 transition-all shadow-sm"
            >
              <Download size={18} /> CSV Pro
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white rounded-[24px] font-black text-xs uppercase hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20"
            >
              <FileUp size={18} /> Carga Masiva
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv" />
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase shadow-2xl hover:bg-black transition-all active:scale-95"
            >
              <PackagePlus size={24} /> Registrar Entrada
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between w-full">
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex bg-slate-100 p-2 rounded-[32px] shadow-sm">
            {(['TODOS', 'UNIDAD', 'CAJA', 'NEGATIVO'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => { setCategoryFilter(cat); playSound('transition'); }}
                className={`px-6 md:px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all ${
                  categoryFilter === cat ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {cat === 'TODOS' ? 'Todos' : cat === 'UNIDAD' ? 'Unidades' : cat === 'CAJA' ? 'Cajas/Packs' : '⚠️ Negativos'}
              </button>
            ))}
          </div>

          {categoryFilter === 'NEGATIVO' && filteredStock.length > 0 && canModify && (
            <button
              type="button"
              onClick={async () => {
                const confirmReset = window.confirm(`⚠️ ¿Estás seguro de que deseas reajustar los ${filteredStock.length} productos con stock negativo a 0?\n\nEsta acción modificará su stock actual directamente en la base de datos.`);
                if (confirmReset) {
                  try {
                    for (const item of filteredStock) {
                      await updateStockItem(item.id, { stockActual: 0 });
                    }
                    playSound('success');
                    showFeedback("✅ Corrección masiva exitosa: Todos los productos con stock negativo han sido reajustados a 0.", "success");
                  } catch (err) {
                    console.error("Error updating negative stocks:", err);
                    showFeedback("Error al corregir algunos artículos. Revisa la consola.", "error");
                  }
                }
              }}
              className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-[24px] shadow-md shadow-red-600/20 flex items-center gap-2 transition-all active:scale-95 animate-pulse"
            >
              <AlertTriangle size={16} /> Corregir Negativos a 0
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 flex-1 w-full">
          <div className="relative group flex-1">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={24} />
            <input 
              type="text" 
              placeholder="Buscar por código o producto..."
              className="w-full pl-20 pr-10 py-6 rounded-[32px] border-2 border-slate-100 focus:border-blue-400 outline-none transition-all shadow-sm text-xl font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative min-w-[280px]">
            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <select 
              className="w-full pl-16 pr-8 py-6 rounded-[32px] border-2 border-slate-100 bg-white font-black text-sm uppercase tracking-widest outline-none focus:border-blue-400 appearance-none shadow-sm cursor-pointer"
              value={providerFilter}
              onChange={(e) => { setProviderFilter(e.target.value); playSound('click'); }}
            >
              {uniqueProviders.map(p => (
                <option key={`${p}-option`} value={p}>{p === 'TODOS' ? 'Filtrar: TODOS LOS PROVEEDORES' : `Proveedor: ${p}`}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cat.</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidad</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción Producto</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Precio Venta</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cant.</th>
                <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Promoción</th>
                {canModify && <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Gestión</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStock.map((item) => (
                <tr key={`${item.id}-${item.codigo}`} className={`group hover:bg-slate-50 transition-colors ${item.stockActual < 3 && item.stockActual > 0 ? 'bg-red-50/30' : ''}`}>
                  <td className="px-8 py-6">
                    <span className={`p-2 rounded-xl flex items-center justify-center w-10 h-10 ${(item.categoria === 'MAYORISTA' || item.categoria === 'LOTE') ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`} title={item.categoria === 'MAYORISTA' ? 'Mayorista' : 'Estándar'}>
                      {(item.categoria === 'MAYORISTA' || item.categoria === 'LOTE') ? <Boxes size={18} /> : <Layers size={18} />}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${(item.unidad === 'UNIDAD' || item.unidad === 'PIEZA' || item.unidad === 'FARDO') ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.unidad === 'FARDO' ? 'UNIDAD' : item.unidad}
                      </span>
                      {item.peso && (item.categoria === 'MAYORISTA' || item.categoria === 'LOTE') && (
                        <span className="text-[10px] font-black text-amber-600 mt-1 ml-1">{item.peso} KG</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 font-mono font-black text-slate-400 uppercase text-xs tracking-widest">{item.codigo}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      {item.imagenUrl ? (
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-200 group-hover:scale-110 transition-transform flex-shrink-0">
                          <img src={item.imagenUrl} alt={item.tipo} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0 ${item.stockActual < 3 ? 'bg-red-100 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                          <Package size={22} />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 uppercase text-sm tracking-tighter leading-none">{item.tipo}</span>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">{item.proveedor}</span>
                          {item.especificaciones && (
                            <>
                              <span className="text-slate-300 text-[10px]">•</span>
                              <span className="text-[10px] text-slate-500 italic max-w-sm truncate" title={item.especificaciones}>{item.especificaciones}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-slate-900 text-xl tracking-tighter">
                    ${item.precioSugerido.toLocaleString()}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className={`inline-flex flex-col items-center justify-center w-14 h-14 rounded-2xl ${item.stockActual > 3 ? 'bg-emerald-50 text-emerald-600' : item.stockActual > 0 ? 'bg-amber-50 text-amber-600 animate-pulse border border-amber-200' : 'bg-red-50 text-red-600'}`}>
                      <span className="text-xl font-black leading-none">{item.stockActual}</span>
                      <span className="text-[8px] font-black uppercase mt-1">
                        {item.unidad === 'CAJA' ? 'Cajas' : item.unidad === 'PACK' ? 'Packs' : item.unidad === 'SET' ? 'Sets' : 'Uds'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button 
                      onClick={() => canModify && togglePromocion(item.id)} 
                      disabled={!canModify}
                      className={`p-3 rounded-xl transition-all ${item.promocion ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'} ${!canModify ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                      title={!canModify ? "No tienes permisos para modificar promociones" : "Alternar Promoción"}
                    >
                        <Tag size={20} />
                    </button>
                  </td>
                  {canModify && (
                    <td className="px-8 py-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {currentUser?.rol === StaffRole.ADMIN && (
                          <button 
                            onClick={() => { setSelectedHistoryItem(item); setHistoryTab('TODOS'); playSound('click'); }} 
                            className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                            title="Ver Historial de Movimientos"
                          >
                            <History size={16} />
                          </button>
                        )}
                        <button onClick={() => setEditingItem(item)} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Edit3 size={16} /></button>
                        <button onClick={() => setDeletingId(item.id)} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agregar */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[56px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-12 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Registro de Inventario</p>
                <h3 className="text-4xl font-black uppercase tracking-tighter italic">Entrada de Mercancía</h3>
              </div>
              <button onClick={() => setIsAdding(false)} className="p-4 hover:bg-white/10 rounded-full transition-colors"><X size={36} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-12 space-y-8 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Categoría de Venta</label>
                  <div className="flex bg-slate-100 p-2 rounded-[28px] shadow-inner">
                    <button 
                      type="button"
                      onClick={() => setNewBale({...newBale, categoria: 'ESTANDAR', unidad: 'UNIDAD'})}
                      className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all ${newBale.categoria === 'ESTANDAR' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      <Layers size={20} /> Individual
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewBale({...newBale, categoria: 'MAYORISTA', unidad: 'PACK'})}
                      className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all ${newBale.categoria === 'MAYORISTA' ? 'bg-amber-500 text-white shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      <Boxes size={20} /> Mayorista
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Tipo de Unidad</label>
                  <select 
                    className="w-full px-7 py-5 bg-slate-100 rounded-[28px] font-black text-xs uppercase tracking-widest outline-none border-2 border-transparent"
                    value={newBale.unidad}
                    onChange={(e) => setNewBale({...newBale, unidad: e.target.value as any})}
                  >
                    <option value="UNIDAD">UNIDAD</option>
                    <option value="PIEZA">PIEZA</option>
                    <option value="CAJA">CAJA</option>
                    <option value="PACK">PACK</option>
                    <option value="SET">SET</option>
                  </select>
                </div>
              </div>

              {newBale.categoria === 'MAYORISTA' && (
                <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Peso del Bulto (Kgs - Opcional)</label>
                  <div className="flex gap-4">
                    {[5, 10, 20].map(w => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setNewBale({...newBale, peso: w})}
                        className={`flex-1 py-5 rounded-[24px] font-black text-xl transition-all ${newBale.peso === w ? 'bg-amber-500 text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-400'}`}
                      >
                        {w} KG
                      </button>
                    ))}
                    <input 
                      type="number" 
                      placeholder="Otro..." 
                      className="flex-1 px-8 py-5 bg-slate-50 rounded-[28px] border-2 border-transparent focus:border-amber-500 outline-none font-black text-xl"
                      value={newBale.peso || ''}
                      onChange={(e) => setNewBale({...newBale, peso: Number(e.target.value)})}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Código Identificador (Opcional)</label>
                  <input className="w-full px-7 py-5 bg-slate-50 rounded-[28px] border-2 border-transparent focus:border-indigo-500 outline-none font-black text-xl uppercase" placeholder="EC-XXXX" value={newBale.codigo} onChange={(e) => setNewBale({...newBale, codigo: e.target.value.toUpperCase()})}/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Cant. Inicial ({newBale.unidad})</label>
                  <input required type="number" onWheel={(e) => e.currentTarget.blur()} className="w-full px-7 py-5 bg-slate-50 rounded-[28px] border-2 border-transparent focus:border-indigo-500 outline-none font-black text-xl" value={newBale.stockActual} onChange={(e) => setNewBale({...newBale, stockActual: Number(e.target.value)})}/>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Descripción del Producto</label>
                <input required className="w-full px-7 py-5 bg-slate-50 rounded-[28px] border-2 border-transparent focus:border-emerald-500 outline-none font-bold text-lg" placeholder="Ej: Abrigo Lana Hombre..." value={newBale.tipo} onChange={(e) => setNewBale({...newBale, tipo: e.target.value})}/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Proveedor (IM, CANADA...)</label>
                  <input required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold uppercase focus:border-emerald-500 outline-none" value={newBale.proveedor} onChange={(e) => setNewBale({...newBale, proveedor: e.target.value.toUpperCase()})}/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Costo ($)</label>
                  <input type="number" className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-black text-slate-500 outline-none focus:border-emerald-500 border-2 border-transparent transition-all" value={newBale.precioCosto || ''} onChange={(e) => setNewBale({...newBale, precioCosto: Number(e.target.value)})}/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Precio Venta ($)</label>
                  <input required type="number" className="w-full px-6 py-4 bg-emerald-500 text-white rounded-2xl font-black" value={newBale.precioSugerido || ''} onChange={(e) => setNewBale({...newBale, precioSugerido: Number(e.target.value)})}/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Comisión Fija ($) - Opcional</label>
                  <input type="number" placeholder="Automática" className="w-full px-6 py-4 bg-amber-500/10 text-amber-900 border-2 border-amber-500/20 rounded-2xl font-black outline-none focus:border-amber-500 transition-all" value={newBale.comision || ''} onChange={(e) => setNewBale({...newBale, comision: Number(e.target.value) || undefined})}/>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Características y Especificaciones</label>
                <textarea 
                  className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold outline-none focus:border-emerald-500 min-h-[90px] text-sm" 
                  placeholder="Ej: Material: 100% Algodón, Color: Negro, Talla: M, Conectividad: Bluetooth 5.2, Resistencia al agua..." 
                  value={newBale.especificaciones || ''} 
                  onChange={(e) => setNewBale({...newBale, especificaciones: e.target.value})}
                />
              </div>

              {/* Foto del Producto (Opcional) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Foto del Producto (Opcional)</label>
                <div className="flex gap-6 items-center bg-slate-50 p-6 rounded-[28px] border-2 border-dashed border-slate-200 hover:border-emerald-500 transition-all">
                  {newBale.imagenUrl ? (
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 flex-shrink-0">
                      <img src={newBale.imagenUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setNewBale({ ...newBale, imagenUrl: '' })} 
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0 border border-slate-200/50">
                      <Camera size={32} />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-700">Adjuntar Foto del Producto</p>
                    <p className="text-xs text-slate-400 mt-1">Sube una imagen desde tu cámara o galería para que se visualice en el catálogo que compartes con los clientes.</p>
                    <div className="mt-4 flex gap-2 items-center">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        id="product-image-upload" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, false);
                        }}
                        disabled={isUploading}
                      />
                      <label 
                        htmlFor="product-image-upload" 
                        className={`px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-black transition-all ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        {isUploading ? 'Subiendo...' : 'Seleccionar Archivo'}
                      </label>
                      {isUploading && (
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">
                          Procesando Imagen...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-7 bg-slate-900 text-white rounded-[32px] font-black text-2xl shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 active:scale-95">
                <Boxes size={32} /> CONFIRMAR EN BODEGA
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[56px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-12 bg-blue-600 text-white flex items-center justify-between">
              <div>
                <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Control de Inventario</p>
                <h3 className="text-4xl font-black uppercase tracking-tighter italic">Editar Producto</h3>
              </div>
              <button onClick={() => setEditingItem(null)} className="p-4 hover:bg-white/10 rounded-full transition-colors"><X size={36} /></button>
            </div>
            <form onSubmit={handleUpdate} className="p-12 space-y-8 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Categoría de Venta</label>
                  <div className="flex bg-slate-100 p-2 rounded-[28px] shadow-inner">
                    <button 
                      type="button"
                      onClick={() => setEditingItem({...editingItem, categoria: 'ESTANDAR'})}
                      className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all ${(editingItem.categoria === 'ESTANDAR' || editingItem.categoria === 'FARDO') ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500'}`}
                    >
                      <Layers size={20} /> Individual
                    </button>
                    <button 
                      type="button"
                      onClick={() => setEditingItem({...editingItem, categoria: 'MAYORISTA'})}
                      className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all ${(editingItem.categoria === 'MAYORISTA' || editingItem.categoria === 'LOTE') ? 'bg-amber-500 text-white shadow-xl' : 'text-slate-500'}`}
                    >
                      <Boxes size={20} /> Mayorista
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Tipo de Unidad</label>
                  <select 
                    className="w-full px-7 py-5 bg-slate-100 rounded-[28px] font-black text-xs uppercase tracking-widest outline-none border-2 border-transparent"
                    value={editingItem.unidad === 'FARDO' ? 'UNIDAD' : editingItem.unidad === 'LOTE' ? 'PACK' : editingItem.unidad}
                    onChange={(e) => setEditingItem({...editingItem, unidad: e.target.value as any})}
                  >
                    <option value="UNIDAD">UNIDAD</option>
                    <option value="PIEZA">PIEZA</option>
                    <option value="CAJA">CAJA</option>
                    <option value="PACK">PACK</option>
                    <option value="SET">SET</option>
                  </select>
                </div>
              </div>

              {(editingItem.categoria === 'MAYORISTA' || editingItem.categoria === 'LOTE') && (
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Peso del Bulto (Kgs - Opcional)</label>
                  <div className="flex gap-4">
                    {[5, 10, 20].map(w => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setEditingItem({...editingItem, peso: w})}
                        className={`flex-1 py-5 rounded-[24px] font-black text-xl transition-all ${editingItem.peso === w ? 'bg-amber-500 text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-400'}`}
                      >
                        {w} KG
                      </button>
                    ))}
                    <input 
                      type="number" 
                      placeholder="Otro..." 
                      className="flex-1 px-8 py-5 bg-slate-50 rounded-[28px] border-2 border-transparent focus:border-amber-500 outline-none font-black text-xl"
                      value={editingItem.peso || ''}
                      onChange={(e) => setEditingItem({...editingItem, peso: Number(e.target.value)})}
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Código Identificador</label>
                  <input required className="w-full px-7 py-5 bg-slate-50 rounded-[28px] font-black text-xl uppercase outline-none focus:border-blue-500 border-2 border-transparent" value={editingItem.codigo} onChange={(e) => setEditingItem({...editingItem, codigo: e.target.value.toUpperCase()})}/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Stock Físico Actual</label>
                  <input required type="number" className="w-full px-7 py-5 bg-slate-50 rounded-[28px] font-black text-xl outline-none focus:border-blue-500 border-2 border-transparent" value={editingItem.stockActual} onChange={(e) => setEditingItem({...editingItem, stockActual: Number(e.target.value)})}/>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Proveedor de Origen</label>
                <input required className="w-full px-7 py-5 bg-slate-50 rounded-[28px] font-black text-xl uppercase outline-none focus:border-blue-500 border-2 border-transparent" placeholder="IM, BETA, CANADA..." value={editingItem.proveedor} onChange={(e) => setEditingItem({...editingItem, proveedor: e.target.value.toUpperCase()})}/>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Costo ($)</label>
                  <input type="number" className="w-full px-7 py-5 bg-slate-50 rounded-[28px] font-bold outline-none focus:border-blue-500 border-2 border-transparent" value={editingItem.precioCosto || ''} onChange={(e) => setEditingItem({...editingItem, precioCosto: Number(e.target.value)})}/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Venta Sugerida ($)</label>
                  <input required type="number" className="w-full px-7 py-5 bg-slate-50 rounded-[28px] font-black text-blue-600 outline-none focus:border-blue-500 border-2 border-transparent" value={editingItem.precioSugerido} onChange={(e) => setEditingItem({...editingItem, precioSugerido: Number(e.target.value)})}/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Comisión Fija ($) - Opcional</label>
                  <input type="number" placeholder="Automática" className="w-full px-7 py-5 bg-amber-500/10 text-amber-900 rounded-[28px] font-black outline-none focus:border-amber-500 border-2 border-transparent transition-all" value={editingItem.comision || ''} onChange={(e) => setEditingItem({...editingItem, comision: Number(e.target.value) || undefined})}/>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Características y Especificaciones</label>
                <textarea 
                  className="w-full px-7 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold outline-none focus:border-blue-500 min-h-[90px] text-sm" 
                  placeholder="Ej: Material: 100% Algodón, Color: Negro, Talla: M, Conectividad: Bluetooth 5.2, Resistencia al agua..." 
                  value={editingItem.especificaciones || ''} 
                  onChange={(e) => setEditingItem({...editingItem, especificaciones: e.target.value})}
                />
              </div>

              {/* Foto del Producto */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Foto del Producto (Opcional)</label>
                <div className="flex gap-6 items-center bg-slate-50 p-6 rounded-[28px] border-2 border-dashed border-slate-200 hover:border-blue-500 transition-all">
                  {editingItem.imagenUrl ? (
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 flex-shrink-0">
                      <img src={editingItem.imagenUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setEditingItem({ ...editingItem, imagenUrl: '' })} 
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0 border border-slate-200/50">
                      <Camera size={32} />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-700">Actualizar Foto del Producto</p>
                    <p className="text-xs text-slate-400 mt-1">Sube una nueva foto para actualizar o reemplazar la imagen actual del producto en el catálogo.</p>
                    <div className="mt-4 flex gap-2 items-center">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        id="product-image-edit" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, true);
                        }}
                        disabled={isUploading}
                      />
                      <label 
                        htmlFor="product-image-edit" 
                        className={`px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-blue-700 transition-all ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        {isUploading ? 'Subiendo...' : 'Seleccionar Archivo'}
                      </label>
                      {isUploading && (
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest animate-pulse">
                          Procesando Imagen...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-7 bg-blue-600 text-white rounded-[32px] font-black text-2xl shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95">
                <Save size={32} /> ACTUALIZAR REGISTRO
              </button>
            </form>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white p-12 rounded-[56px] shadow-2xl w-full max-md text-center animate-in zoom-in">
            <div className="w-28 h-28 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <AlertTriangle size={56} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter">¿Eliminar Item?</h3>
            <p className="text-slate-500 font-medium mb-10 leading-relaxed italic">Esta operación purgará el artículo/pieza de la base de datos centralizada. <br/>¿Estás seguro de continuar?</p>
            <div className="flex gap-4">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-5 bg-slate-100 text-slate-900 rounded-[24px] font-black uppercase text-xs tracking-widest">Abortar</button>
              <button onClick={handleDelete} className="flex-1 py-5 bg-red-600 text-white rounded-[24px] font-black shadow-2xl shadow-red-600/30 uppercase text-xs tracking-widest">Confirmar Purga</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historial Movimientos */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] w-full max-w-4xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-10 bg-slate-950 text-white flex items-center justify-between col-span-3">
              <div>
                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Auditoría / Kárdex del Producto</p>
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">Historial de Movimientos</h3>
                <p className="text-slate-400 text-xs font-bold mt-1 uppercase">
                  {selectedHistoryItem.codigo} — {selectedHistoryItem.tipo} (P. Sugerido: ${selectedHistoryItem.precioSugerido?.toLocaleString()})
                </p>
              </div>
              <button onClick={() => setSelectedHistoryItem(null)} className="p-3 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                <X size={28} />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-10 flex-grow overflow-y-auto space-y-8 bg-slate-50/50">
              {/* Metrics Summary Rows */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <ArrowDownLeft size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Ingresos</span>
                    <h4 className="text-2xl font-black text-slate-950 mt-0.5">+{historyStats.inputs} <span className="text-xs font-normal text-slate-500">unids</span></h4>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <ArrowUpRight size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Salidas</span>
                    <h4 className="text-2xl font-black text-slate-950 mt-0.5">-{historyStats.outputs} <span className="text-xs font-normal text-slate-500">unids</span></h4>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm flex items-center gap-4 ring-2 ring-indigo-50">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Package size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Suelto en Bodega</span>
                    <h4 className="text-3xl font-black text-indigo-600 mt-0.5">{selectedHistoryItem.stockActual}</h4>
                  </div>
                </div>
              </div>

              {/* Tabs selector */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200/30">
                {(['TODOS', 'INGRESOS', 'SALIDAS'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setHistoryTab(tab); playSound('click'); }}
                    className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                      historyTab === tab 
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'TODOS' ? 'Todos' : tab === 'INGRESOS' ? 'Ingresos / Ajustes' : 'Ventas (Salidas)'}
                  </button>
                ))}
              </div>

              {/* Movements Timeline List */}
              <div className="space-y-4">
                {filteredTimeline.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8">
                    <History size={48} className="mx-auto text-slate-300 mb-4 animate-spin-slow" />
                    <h4 className="font-bold text-slate-900 text-lg uppercase">Sin datos para mostrar</h4>
                    <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto italic">No hemos detectado movimientos que coincidan con este filtro de búsqueda de inventario.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm divide-y divide-slate-100">
                    {filteredTimeline.map((item) => {
                      const isVenta = item.tipo === 'VENTA';
                      const isAnulacion = item.tipo === 'ANULACION';
                      const isIngreso = item.tipo === 'INGRESO';
                      const isAjuste = item.tipo === 'AJUSTE';
                      const isCargaMasiva = item.tipo === 'CARGA_MASIVA';

                      let badgeColor = '';
                      let icon = null;
                      let typeLabel = '';

                      if (isVenta) {
                        badgeColor = 'bg-rose-100 text-rose-700';
                        icon = <ArrowUpRight size={14} />;
                        typeLabel = 'SALIDA (VENTA)';
                      } else if (isAnulacion) {
                        badgeColor = 'bg-emerald-100 text-emerald-700 border border-emerald-200';
                        icon = <ArrowDownLeft size={14} />;
                        typeLabel = 'RETORNO (ANULACIÓN)';
                      } else if (isIngreso) {
                        badgeColor = 'bg-emerald-50 text-emerald-700';
                        icon = <ArrowDownLeft size={14} />;
                        typeLabel = 'INGRESO INICIAL';
                      } else if (isCargaMasiva) {
                        badgeColor = 'bg-indigo-100 text-indigo-700';
                        icon = <Download size={14} />;
                        typeLabel = 'CARGA MASIVA CSV';
                      } else {
                        badgeColor = item.cantidad >= 0 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';
                        icon = <TrendingUp size={14} />;
                        typeLabel = 'AJUSTE MANUAL';
                      }

                      const dateObj = new Date(item.fecha);
                      const displayDate = isNaN(dateObj.getTime()) ? item.fecha : dateObj.toLocaleDateString([], {
                        day: '2-digit', month: 'short', year: 'numeric'
                      }) + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div key={item.id} className="p-6 flex items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`p-3 rounded-2xl flex items-center justify-center h-11 w-11 ${
                              isVenta ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {isVenta ? <ArrowUpRight size={18} /> : isAnulacion ? <ArrowDownLeft size={18} className="text-emerald-600" /> : <TrendingUp size={18} />}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${badgeColor} flex items-center gap-1`}>
                                  {icon} {typeLabel}
                                </span>
                              </div>
                              <p className="text-slate-800 font-bold uppercase text-sm leading-none">{item.observaciones}</p>
                              
                              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 mt-1 uppercase">
                                <span className="flex items-center gap-1"><Calendar size={12} /> {displayDate}</span>
                                <span className="flex items-center gap-1"><User size={12} /> Responsable: {item.vendedor}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`font-mono text-xl font-black tracking-tight ${
                              item.cantidad > 0 ? 'text-emerald-600' : item.cantidad < 0 ? 'text-red-500' : 'text-slate-500'
                            }`}>
                              {item.cantidad > 0 ? `+${item.cantidad}` : item.cantidad}
                            </span>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">UDS</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 bg-slate-100 border-t border-slate-200/60 flex items-center justify-end">
              <button 
                onClick={() => setSelectedHistoryItem(null)} 
                className="px-8 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
