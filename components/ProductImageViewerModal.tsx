import React, { useState, useEffect } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Maximize2, Minimize2, 
  Download, MessageCircle, ExternalLink, Sparkles, Package,
  Share2, Check, ZoomIn, ZoomOut
} from 'lucide-react';
import { StockItem, getItemImages, getItemDepartamento } from '../types';

interface ProductImageViewerModalProps {
  item: StockItem | null;
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductImageViewerModal: React.FC<ProductImageViewerModalProps> = ({
  item,
  initialIndex = 0,
  isOpen,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain'); // Default contain so image is seen FULL without cuts
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [copied, setCopied] = useState(false);

  const images = item ? getItemImages(item) : [];

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.min(initialIndex, Math.max(0, images.length - 1)));
      setFitMode('contain');
      setZoomLevel(1);
    }
  }, [isOpen, initialIndex, images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && images.length > 1) {
        setCurrentIndex(prev => (prev + 1) % images.length);
        setZoomLevel(1);
      } else if (e.key === 'ArrowLeft' && images.length > 1) {
        setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
        setZoomLevel(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length, onClose]);

  if (!isOpen || !item) return null;

  const currentImage = images[currentIndex] || item.imagenUrl;
  const isBelleza = (item.departamento || getItemDepartamento(item)) === 'BELLEZA';

  const handleDownload = () => {
    if (!currentImage) return;
    const a = document.createElement('a');
    a.href = currentImage;
    a.download = `${item.codigo}_foto_${currentIndex + 1}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareWhatsApp = () => {
    const msg = `Hola! Consulta por *${item.tipo}* (Código: ${item.codigo}).\n` +
      `• Precio Detalle: $${(item.precioSugerido || 0).toLocaleString('es-CL')}\n` +
      (item.precioMayorista ? `• Precio Mayorista (≥${item.minUnidadesMayorista || 5}u): $${item.precioMayorista.toLocaleString('es-CL')}\n` : '') +
      `• Stock disponible: ${item.stockActual} ${item.unidad || 'uds'}.\n` +
      `Foto: ${currentImage && !currentImage.startsWith('data:') ? currentImage : window.location.origin + '/catalogo-publico?q=' + encodeURIComponent(item.codigo)}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/catalogo-publico?q=${encodeURIComponent(item.codigo)}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between animate-in fade-in duration-200 select-none">
      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-white z-10">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
            isBelleza ? 'bg-pink-600 text-white' : 'bg-sky-600 text-white'
          }`}>
            {isBelleza ? '💄 Belleza' : '💻 Tecnología'}
          </span>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-black truncate uppercase tracking-tight text-white">
              {item.tipo}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span className="font-bold text-slate-300">{item.codigo}</span>
              <span>•</span>
              <span>Stock: <strong className="text-emerald-400">{item.stockActual}</strong> {item.unidad}</span>
              {images.length > 1 && (
                <>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">Foto {currentIndex + 1} de {images.length}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Fit Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              setFitMode(prev => prev === 'contain' ? 'cover' : 'contain');
              setZoomLevel(1);
            }}
            title={fitMode === 'contain' ? 'Ver recortada / Llenar espacio' : 'Ver imagen completa sin cortes (Ajustar a pantalla)'}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            {fitMode === 'contain' ? (
              <>
                <Maximize2 size={16} />
                <span className="hidden sm:inline">Ver Completa</span>
              </>
            ) : (
              <>
                <Minimize2 size={16} />
                <span className="hidden sm:inline">Llenar</span>
              </>
            )}
          </button>

          {/* Zoom In / Out */}
          <button
            type="button"
            onClick={() => setZoomLevel(prev => prev === 1 ? 1.75 : 1)}
            title={zoomLevel > 1 ? 'Alejar zoom normal' : 'Acercar zoom detalle'}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            {zoomLevel > 1 ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
          </button>

          {/* Download Photo */}
          {currentImage && (
            <button
              type="button"
              onClick={handleDownload}
              title="Descargar foto"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <Download size={16} />
            </button>
          )}

          {/* WhatsApp Share */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            title="Compartir por WhatsApp"
            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <MessageCircle size={15} />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          {/* Close Modal */}
          <button
            type="button"
            onClick={onClose}
            title="Cerrar visor (Esc)"
            className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition-colors ml-1"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Image Display Area */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
        {currentImage ? (
          <div className="relative max-w-full max-h-full flex items-center justify-center overflow-auto rounded-2xl">
            <img
              src={currentImage}
              alt={`${item.tipo} - foto ${currentIndex + 1}`}
              style={{
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.25s ease-out'
              }}
              className={`max-w-full max-h-[72vh] rounded-xl shadow-2xl transition-all ${
                fitMode === 'contain' ? 'object-contain' : 'object-cover w-full h-[72vh]'
              }`}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500 gap-3 p-8">
            <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              {isBelleza ? <Sparkles size={40} className="text-pink-400" /> : <Package size={40} />}
            </div>
            <p className="text-sm font-bold text-slate-400">Este producto aún no tiene fotos cargadas</p>
          </div>
        )}

        {/* Previous Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
              setZoomLevel(1);
            }}
            title="Foto anterior (←)"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700/80 shadow-2xl flex items-center justify-center backdrop-blur-md transition-all hover:scale-105 active:scale-95"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {/* Next Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(prev => (prev + 1) % images.length);
              setZoomLevel(1);
            }}
            title="Siguiente foto (→)"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700/80 shadow-2xl flex items-center justify-center backdrop-blur-md transition-all hover:scale-105 active:scale-95"
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>

      {/* Bottom Bar: Thumbnail Strip & Pricing Details */}
      <div className="px-4 py-3 bg-slate-900/95 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 z-10">
        {/* Thumbnails */}
        {images.length > 1 ? (
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-thin">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  setZoomLevel(1);
                }}
                className={`relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                  currentIndex === idx 
                    ? 'border-emerald-400 ring-2 ring-emerald-500/40 scale-105 shadow-lg' 
                    : 'border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-500'
                }`}
              >
                <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 right-0 px-1 text-[8px] font-black bg-black/80 text-white rounded-tl">
                  {idx + 1}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 font-medium">
            Mostrando foto principal en alta definición
          </div>
        )}

        {/* Pricing Summary */}
        <div className="flex items-center gap-4 text-white">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Precio Detalle</span>
            <span className="text-lg font-black text-emerald-400">
              ${(item.precioSugerido || 0).toLocaleString('es-CL')}
            </span>
          </div>

          {!!item.precioMayorista && item.precioMayorista > 0 && (
            <div className="text-right border-l border-slate-800 pl-4">
              <span className="text-[10px] text-amber-400 uppercase font-black tracking-widest block">
                Mayorista (≥{item.minUnidadesMayorista || 5}u)
              </span>
              <span className="text-lg font-black text-amber-300">
                ${item.precioMayorista.toLocaleString('es-CL')}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
            <span>{copied ? 'Copiado' : 'Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
