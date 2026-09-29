import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface CompressedImageResult {
  url: string;
  source: 'storage' | 'base64';
  sizeBytes: number;
}

/**
 * Comprime una imagen en el navegador usando Canvas.
 * Reduce la resolución a un máximo de 800px y aplica compresión JPEG de calidad 0.75.
 * Esto reduce una foto de 5MB a ~35KB-60KB, asegurando que múltiples fotos se guarden
 * sin sobrepasar el límite de 1MB de Firestore.
 */
export const compressImage = async (
  file: File,
  maxDimension = 800,
  quality = 0.75
): Promise<{ dataUrl: string; sizeBytes: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el contexto de imagen.'));
          return;
        }

        // Fondo blanco para imágenes transparentes que se conviertan a JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Generar JPEG comprimido
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const sizeBytes = Math.round((dataUrl.length * 3) / 4);

        resolve({ dataUrl, sizeBytes });
      };
      img.onerror = () => reject(new Error('No se pudo cargar la imagen para optimización.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.readAsDataURL(file);
  });
};

/**
 * Procesa y sube una foto. Intenta primero Firebase Storage; si falla o no está disponible,
 * usa la versión comprimida en base64 de manera segura y ligera.
 */
export const processAndUploadImage = async (
  file: File,
  productId = 'general'
): Promise<CompressedImageResult> => {
  // 1. Optimizar y comprimir en cliente
  const { dataUrl, sizeBytes } = await compressImage(file, 800, 0.75);

  // 2. Intentar subir a Firebase Storage (almacenamiento en la nube dedicado)
  try {
    if (storage) {
      const uploadPromise = (async () => {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const filename = `products/${productId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanName}`;
        const storageRef = ref(storage, filename);
        
        // Convertir dataUrl a Blob para subir
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        
        await uploadBytes(storageRef, blob, {
          contentType: 'image/jpeg',
          customMetadata: { productId, originalName: file.name }
        });
        
        const downloadUrl = await getDownloadURL(storageRef);
        return {
          url: downloadUrl,
          source: 'storage' as const,
          sizeBytes: blob.size
        };
      })();

      // Timeout preventivo de 3.5 segundos para no dejar congelada la interfaz
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout Firebase Storage')), 3500);
      });

      return await Promise.race([uploadPromise, timeoutPromise]);
    }
  } catch (storageErr) {
    console.info('Firebase Storage no disponible o expiró tiempo; guardando imagen optimizada en BD:', storageErr);
  }

  // Fallback: Retornar dataUrl comprimida (super ligera: ~40KB)
  return {
    url: dataUrl,
    source: 'base64',
    sizeBytes
  };
};

/**
 * Calcula el peso aproximado de una lista de imágenes en KB
 */
export const calculateImagesWeightKB = (images: string[]): number => {
  let totalBytes = 0;
  for (const img of images) {
    if (!img) continue;
    if (img.startsWith('data:image/')) {
      // Base64
      totalBytes += (img.length * 3) / 4;
    } else {
      // URL externa o de Firebase Storage: ocupa menos de 200 bytes en el documento
      totalBytes += img.length;
    }
  }
  return Math.round(totalBytes / 1024);
};
