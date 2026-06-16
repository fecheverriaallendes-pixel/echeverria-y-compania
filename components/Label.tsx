import React from 'react';
import { Sale } from '../types';

const LOGO_URL = "https://i.ibb.co/qMyZQHYg/logo-sin-fondo-1.png";

export const Label = ({ sale, stock, item }: { sale: Sale, stock: any[], item?: {codigoFardo: string, cantidad: number} }) => {
  const displayItem = item || { codigoFardo: sale.codigoFardo || 'N/A', cantidad: sale.cantidad || 1 };
  
  return (
    <div className="w-[100mm] h-[150mm] box-border bg-white border-3 border-black p-3.5 flex flex-col items-stretch overflow-hidden print:m-0 print:w-[100mm] print:h-[150mm] select-none">
      <div className="flex flex-row border-b-2 border-dashed border-black pb-1.5 mb-1.5 justify-between items-center">
        <div className="flex flex-row items-center gap-2">
          <img src={LOGO_URL} alt="Logo" className="w-[18mm] object-contain grayscale" />
          <div className="font-mono text-2xl font-black tracking-tighter">#{sale.numeroVenta}</div>
        </div>
        <div className="text-center border-l-2 border-dashed border-black pl-2 flex flex-col justify-between h-full py-0.5">
          <div className="flex flex-col gap-0.5">
            <p className="text-[8px] font-black uppercase tracking-tighter text-slate-600">Origen</p>
            <p className="text-[10px] font-black uppercase text-black bg-slate-100 px-1.5 py-0.2 rounded border border-slate-300">{sale.tipoVenta}</p>
          </div>
          <div className="border-t border-dashed border-black pt-1 mt-1">
            <p className="text-[8px] font-black uppercase tracking-tighter text-slate-600">Contacto</p>
            <p className="text-xl font-black leading-none tracking-tight break-all">{sale.telefono}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between py-0.5">
        <div>
          {/* Destinatario */}
          <div className="mb-1.5">
            <p className="text-[9px] font-black uppercase text-slate-500 mb-0.5">Destinatario</p>
            <p className="text-[16px] font-black uppercase leading-tight text-black">{sale.cliente}</p>
            <p className="text-xs font-black text-slate-700 mt-0.5">RUT: {sale.rut || 'PENDIENTE'}</p>
          </div>

          {/* Dirección de Entrega */}
          <div className="mb-2">
            <p className="text-[9px] font-black uppercase text-slate-500 mb-0.5">Dirección de Entrega</p>
            <div className="bg-white p-2 rounded-md border-2 border-black">
              <p className={`font-black uppercase leading-snug break-words ${
                !sale.direccion ? 'text-[13px]' :
                sale.direccion.length > 90 ? 'text-[11px]' :
                sale.direccion.length > 50 ? 'text-[13px]' : 
                'text-[15px]'
              }`}>
                {sale.direccion || 'SIN DIRECCIÓN REGISTRADA'}
              </p>
            </div>
          </div>

          {/* Agencia y Detalles */}
          <div className="mb-2">
            <div className="flex justify-between items-start gap-2 mb-1.5">
              <div className="flex-1">
                <p className="text-[9px] font-black uppercase text-slate-500 mb-0.5">Agencia / Destino</p>
                <p className="text-[14px] font-black uppercase leading-tight bg-slate-100 px-1.5 py-0.5 rounded border border-slate-350 inline-block">{sale.agencia || 'DOMICILIO'}</p>
              </div>
              {(() => {
                const stockItem = stock.find(i => i.codigo === displayItem.codigoFardo);
                if (stockItem?.categoria === 'LOTE' && stockItem?.peso) {
                  return (
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase text-amber-600 mb-0.5">Peso</p>
                      <p className="text-lg font-black text-amber-600 leading-none">{stockItem.peso} KG</p>
                    </div>
                  )
                }
                return null;
              })()}
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-dashed border-slate-350 pt-1.5">
              <div>
                <p className="text-[9px] font-black uppercase text-slate-500 mb-0.5">Producto / SKU</p>
                <p className="text-[14px] font-black uppercase leading-tight text-black">
                  { (() => {
                    const stockItem = stock.find(i => i.codigo === displayItem.codigoFardo);
                    return stockItem ? stockItem.tipo : (displayItem.codigoFardo || 'SIN CÓDIGO');
                  })()}
                </p>
                <p className="text-[10px] font-black text-rose-600 mt-1 uppercase leading-none bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded inline-block">{displayItem.codigoFardo || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase text-slate-500 mb-0.5 text-right">Cantidad x Var.</p>
                <p className="text-[18px] font-black leading-none uppercase text-black">x{displayItem.cantidad || 1} {sale.variante || 'N/A'}</p>
              </div>
            </div>

            {/* Advertencia Obligatoria */}
            <div className="mt-3.5 p-2 bg-slate-100 border-l-4 border-slate-900 rounded-r-md">
              <p className="text-[10px] font-bold leading-tight uppercase text-black">🔄 VIDEO OBLIGATORIO PARA CAMBIOS</p>
              <p className="text-[8px] text-slate-700 mt-1 leading-normal font-bold">Grabe la apertura de su paquete de inicio a fin sin cortes ni ediciones.</p>
            </div>

            {/* Meta */}
            <div className="mt-3 text-center border-t border-dashed border-slate-200 pt-2 pb-0.5">
              <p className="text-[9px] text-slate-700 uppercase font-black leading-none">Vendedor: {sale.vendedor || 'SISTEMA'}</p>
              {sale.etiquetador && (
                <p className="text-[8px] text-slate-500 uppercase font-bold mt-1 leading-none">Etiquetado por: {sale.etiquetador}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      {sale.tipoVenta === 'Live TikTok' && (
        <p className="text-[8px] font-black text-slate-300 absolute bottom-3 left-1/2 -translate-x-1/2 uppercase tracking-[0.3em] pointer-events-none">
          TikTok Live Session
        </p>
      )}
    </div>
  );
};
