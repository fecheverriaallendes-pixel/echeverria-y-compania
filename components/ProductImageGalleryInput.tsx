import React, { useState } from 'react';
import { 
  Camera, Plus, Trash2, Star, Eye, UploadCloud, 
  Link, AlertCircle, CheckCircle2, ShieldCheck, Sparkles 
} from 'lucide-react';
import { processAndUploadImage, calculateImagesWeightKB } from '../utils/imageCompressor';

interface ProductImageGalleryInputProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  productId?: string;
  onPreviewImage?: (url: string, index: number) => void;
}

export const ProductImageGalleryInput: React.FC<ProductImageGalleryInputProps> = ({
  images = [],
  onChange,
  maxImages = 6,
  productId = 'prod',
  onPreviewImage
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalKB = calculateImagesWeightKB(images);
  const isSafeSize = totalKB < 800; // Well below 1024KB limit

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const availableSlots = maxImages - images.length;
    if (availableSlots <= 0) {
      setErrorMessage(`Límite de ${maxImages} fotos por producto alcanzado.`);
      return;
    }

    const filesToProcess = Array.from(fileList).slice(0, availableSlots);
    setIsUploading(true);
    setErrorMessage(null);

    const newUrls: string[] = [];

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      setUploadProgressText(`Optimizando y subiendo foto ${i + 1} de ${filesToProcess.length}...`);
      try {
        const result = await processAndUploadImage(file, productId);
        newUrls.push(result.url);
      } catch (err: any) {
        console.error('Error subiendo imagen:', err);
        setErrorMessage(`No se pudo procesar la imagen "${file.name}".`);
      }
    }

    if (newUrls.length > 0) {
      onChange([...images, ...newUrls]);
    }

    setIsUploading(false);
    setUploadProgressText('');
  };

  const handleAddUrl = () => {
    const trimmed = urlInputValue.trim();
    if (!trimmed) return;
    if (images.length >= maxImages) {
      setErrorMessage(`Límite de ${maxImages} fotos por producto alcanzado.`);
      return;
    }
    onChange([...images, trimmed]);
    setUrlInputValue('');
    setShowUrlInput(false);
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const reordered = [...images];
    const [selected] = reordered.splice(index, 1);
    reordered.unshift(selected);
    onChange(reordered);
  };

  const handleRemoveImage = (index: number) => {
    const filtered = images.filter((_, i) => i !== index);
    onChange(filtered);
  };

  return (
    <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-[28px] border-2 border-dashed border-slate-200 hover:border-emerald-500/80 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Galería de Fotos del Producto
            </label>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-700">
              {images.length} / {maxImages} fotos
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Sube más de una foto para mostrar diferentes ángulos, empaque o detalles.
          </p>
        </div>

        {/* Database Health Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs self-start sm:self-auto">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span className="text-[10px] font-bold text-slate-600">
            Base de datos: <strong className="text-emerald-700">{totalKB} KB</strong> / 1000 KB (Optimizado)
          </span>
        </div>
      </div>

      {/* Grid of Current Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
          {images.map((imgUrl, index) => {
            const isPrimary = index === 0;
            return (
              <div 
                key={index} 
                className={`group relative aspect-square rounded-2xl overflow-hidden border-2 bg-slate-100 shadow-xs transition-all ${
                  isPrimary ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <img 
                  src={imgUrl} 
                  alt={`Producto foto ${index + 1}`} 
                  className="w-full h-full object-cover" 
                />

                {/* Primary Tag */}
                {isPrimary && (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black uppercase shadow-xs flex items-center gap-0.5">
                    <Star size={10} className="fill-white" /> Portada
                  </span>
                )}

                {/* Number Badge */}
                {!isPrimary && (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-bold">
                    #{index + 1}
                  </span>
                )}

                {/* Overlay Action Buttons */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
                  {onPreviewImage && (
                    <button
                      type="button"
                      onClick={() => onPreviewImage(imgUrl, index)}
                      title="Ver imagen completa"
                      className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 transition-transform active:scale-95 shadow-sm"
                    >
                      <Eye size={14} />
                    </button>
                  )}

                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(index)}
                      title="Hacer foto de portada (principal)"
                      className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-transform active:scale-95 shadow-sm"
                    >
                      <Star size={14} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    title="Eliminar esta foto"
                    className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-transform active:scale-95 shadow-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload & Add Controls */}
      {images.length < maxImages && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {/* File input (supports multiple) */}
          <input
            type="file"
            multiple
            accept="image/*"
            id={`multi-image-input-${productId}`}
            className="hidden"
            disabled={isUploading}
            onChange={(e) => {
              handleFilesSelected(e.target.files);
              e.target.value = ''; // Reset input to allow re-selection
            }}
          />

          <label
            htmlFor={`multi-image-input-${productId}`}
            className={`px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-sm ${
              isUploading ? 'opacity-50 cursor-wait' : 'hover:scale-[1.02] active:scale-95'
            }`}
          >
            <UploadCloud size={16} />
            <span>{images.length === 0 ? 'Cargar Fotos (Selección múltiple)' : 'Agregar Más Fotos'}</span>
          </label>

          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="px-3 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Link size={14} />
            <span>Pegar URL</span>
          </button>

          {isUploading && (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 animate-pulse">
              <Sparkles size={14} />
              <span>{uploadProgressText || 'Procesando imágenes...'}</span>
            </div>
          )}
        </div>
      )}

      {/* URL Input Dropdown */}
      {showUrlInput && (
        <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-150">
          <input
            type="url"
            placeholder="https://ejemplo.com/foto-producto.jpg"
            value={urlInputValue}
            onChange={(e) => setUrlInputValue(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
          >
            Añadir
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
          <AlertCircle size={15} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Informative Note About Database Safety */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-[11px] text-emerald-900">
        <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Protección de Base de Datos Activa:</strong> Cada foto se comprime automáticamente en el navegador a ~40KB con resolución de alta calidad antes de guardarse. Esto garantiza que subir varias fotos no sature la base de datos ni vuelva lenta la aplicación.
        </p>
      </div>
    </div>
  );
};
