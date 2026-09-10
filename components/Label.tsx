import React from 'react';
import { Sale, LOGO_URL, BRAND_NAME, COMPANY_NAME, LabelFormat } from '../types';

interface LabelProps {
  sale: Sale;
  stock: any[];
  item?: { codigoFardo: string; cantidad: number };
  format?: LabelFormat;
}

// Formateador limpio de teléfono para máxima legibilidad de transportistas
const cleanPhone = (phone?: string) => {
  if (!phone) return 'SIN TELÉFONO';
  const clean = phone.replace(/[^\d+]/g, '');
  if (clean.length === 9 && clean.startsWith('9')) {
    return `+56 9 ${clean.slice(1, 5)} ${clean.slice(5)}`;
  }
  if (clean.length === 11 && clean.startsWith('569')) {
    return `+56 9 ${clean.slice(3, 7)} ${clean.slice(7)}`;
  }
  if (clean.length === 12 && clean.startsWith('+569')) {
    return `+56 9 ${clean.slice(4, 8)} ${clean.slice(8)}`;
  }
  return phone;
};

// Formateador limpio de RUT chileno
const cleanRut = (rut?: string) => {
  if (!rut) return 'SIN RUT REGISTRADO';
  const trimmed = rut.trim().toUpperCase();
  return trimmed;
};

// Componente de código de barras simulado de alta definición para impresoras térmicas
const BarcodePattern = ({ code }: { code: string }) => {
  // Patrón alternado de anchos de barra para simulación visual fidedigna Code-128
  const widths = [2, 1, 3, 1, 4, 2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 3, 2, 4, 1, 2];
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex items-center justify-center gap-[2px] h-6 overflow-hidden">
        {widths.map((w, i) => (
          <div 
            key={i} 
            className="bg-black h-full" 
            style={{ width: `${w}px` }} 
          />
        ))}
      </div>
      <span className="font-mono text-[9px] font-black tracking-[0.25em] text-black uppercase mt-0.5">
        *{code}*
      </span>
    </div>
  );
};

export const Label = ({ sale, stock, item, format }: LabelProps) => {
  const activeFormat: LabelFormat = format || (typeof window !== 'undefined' ? (localStorage.getItem('preferred_label_format') as LabelFormat) : null) || 'logistica';
  const displayItem = item || { codigoFardo: sale.codigoFardo || 'N/A', cantidad: sale.cantidad || 1 };
  const stockItem = stock.find(i => i.codigo === displayItem.codigoFardo);
  const productName = stockItem ? stockItem.tipo : (sale.variante || displayItem.codigoFardo || 'SIN ESPECIFICAR');
  const productCode = displayItem.codigoFardo || sale.codigoFardo || 'S/C';
  const quantity = displayItem.cantidad || 1;
  const dispatchMethod = sale.metodoDespacho || sale.agencia || sale.transportista || 'DESPACHO A DOMICILIO';
  const dispatchType = sale.tipoDespacho ? sale.tipoDespacho.toUpperCase() : 'DOMICILIO';
  const formattedRut = cleanRut(sale.rut);
  const formattedPhone = cleanPhone(sale.telefono);

  // FORMATO 1: CUADRÍCULA LOGÍSTICA PRO (Máxima legibilidad, recuadros marcados, RUT y Teléfono gigantes)
  if (activeFormat === 'logistica') {
    return (
      <div className="w-[100mm] h-[150mm] min-h-[150mm] max-h-[150mm] box-border bg-white border-[3px] border-black p-2 flex flex-col justify-between overflow-hidden print:m-0 print:w-[100mm] print:h-[150mm] select-none text-black font-sans leading-tight">
        
        {/* FILA 1: CABECERA Y FOLIO DE VENTA */}
        <div className="flex flex-row items-center justify-between border-b-[2.5px] border-black pb-2">
          <div className="flex items-center gap-2">
            <img 
              src={LOGO_URL} 
              alt="Logo" 
              referrerPolicy="no-referrer" 
              className="w-12 h-12 object-contain border-[1.5px] border-black p-0.5 rounded bg-white" 
            />
            <div>
              <h2 className="text-sm font-black tracking-tight text-black uppercase leading-tight">
                {BRAND_NAME}
              </h2>
              <p className="text-[9px] font-black text-slate-700 uppercase tracking-wide">
                {COMPANY_NAME}
              </p>
              <span className="text-[8px] font-black uppercase text-black bg-slate-200 border border-black px-1.5 py-0.5 rounded inline-block mt-0.5">
                GUÍA DE TRANSPORTE
              </span>
            </div>
          </div>

          <div className="text-right border-l-[2px] border-black pl-2 py-0.5 flex flex-col items-end">
            <span className="text-[8px] font-black uppercase tracking-wider text-slate-600">
              N° DE ORDEN
            </span>
            <span className="font-mono text-3xl font-black tracking-tight text-black leading-none">
              #{sale.numeroVenta}
            </span>
            <span className="text-[9px] font-black uppercase bg-black text-white px-2 py-0.5 rounded mt-1">
              {sale.tipoVenta || 'NORMAL'}
            </span>
          </div>
        </div>

        {/* FILA 2: BANNER DE TRANSPORTE Y AGENCIA */}
        <div className="bg-black text-white px-2.5 py-1.5 flex items-center justify-between border-b-[2.5px] border-black">
          <div className="flex-1 pr-2">
            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-300 block leading-none">
              EMPRESA / MÉTODO DE ENVÍO
            </span>
            <span className="text-sm sm:text-base font-black uppercase tracking-wide leading-tight line-clamp-1">
              {dispatchMethod}
            </span>
          </div>
          <div className="bg-white text-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border border-white">
            {dispatchType}
          </div>
        </div>

        {/* FILA 3: RECUADRO DESTINATARIO */}
        <div className="border-b-[2.5px] border-black p-1.5 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-black bg-slate-200 border border-black px-1.5 py-0.5 rounded-sm">
              1. DESTINATARIO (RECEPTOR)
            </span>
            <span className="text-[8px] font-black uppercase text-slate-500">
              ENTREGA OFICIAL
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black uppercase text-black leading-tight tracking-tight mt-1 line-clamp-2">
            {sale.cliente || 'CLIENTE NO IDENTIFICADO'}
          </p>
        </div>

        {/* FILA 4: RECUADRO CRÍTICO - R.U.T. Y TELÉFONO DE ALTA VISIBILIDAD */}
        <div className="grid grid-cols-2 border-b-[2.5px] border-black">
          {/* COLUMNA RUT */}
          <div className="border-r-[2.5px] border-black p-1.5 flex flex-col justify-between bg-slate-50">
            <div className="flex items-center justify-between border-b border-black pb-0.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-black">
                🪪 R.U.T. / CÉDULA
              </span>
              <span className="text-[8px] font-bold text-slate-600 uppercase">IDENTIDAD</span>
            </div>
            <div className="py-2 px-1 text-center">
              <span className="text-xl sm:text-2xl font-mono font-black text-black tracking-wider block leading-none">
                {formattedRut}
              </span>
            </div>
            <span className="text-[7.5px] font-black text-center text-slate-700 uppercase border-t border-slate-300 pt-0.5 leading-none">
              Exigir RUT al entregar
            </span>
          </div>

          {/* COLUMNA TELÉFONO */}
          <div className="p-1.5 flex flex-col justify-between bg-amber-50/50">
            <div className="flex items-center justify-between border-b border-black pb-0.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-black">
                📞 TELÉFONO / WHATSAPP
              </span>
              <span className="text-[8px] font-black text-amber-800 uppercase animate-pulse">URGENTE</span>
            </div>
            <div className="py-2 px-1 text-center">
              <span className="text-xl sm:text-2xl font-mono font-black text-black tracking-tight block leading-none">
                {formattedPhone}
              </span>
            </div>
            <span className="text-[7.5px] font-black text-center text-amber-900 uppercase border-t border-slate-300 pt-0.5 leading-none">
              Llamar antes de entregar
            </span>
          </div>
        </div>

        {/* FILA 5: DIRECCIÓN DE ENTREGA Y COMUNA */}
        <div className="border-b-[2.5px] border-black p-2 bg-white flex-1 min-h-[22mm] flex flex-col justify-start">
          <span className="text-[9px] font-black uppercase tracking-wider text-black bg-slate-200 border border-black px-1.5 py-0.5 rounded-sm inline-block self-start">
            2. DIRECCIÓN DE ENTREGA / DESTINO FINAL
          </span>
          <div className="mt-1">
            <p className="text-base sm:text-lg font-black uppercase text-black leading-snug break-words">
              {sale.direccion || 'SIN DIRECCIÓN REGISTRADA - CONSULTAR O RETIRO'}
            </p>
            {sale.observaciones && (
              <div className="mt-1.5 p-1 bg-slate-100 border border-black text-[9.5px] font-bold uppercase text-black leading-tight">
                <span className="font-black bg-black text-white px-1 py-0.2 rounded-sm mr-1">INDICACIÓN:</span>
                {sale.observaciones}
              </div>
            )}
          </div>
        </div>

        {/* FILA 6: PRODUCTO, SKU Y BULTOS */}
        <div className="grid grid-cols-3 border-b-[2.5px] border-black">
          <div className="col-span-2 border-r-[2.5px] border-black p-1.5 bg-white">
            <span className="text-[8px] font-black uppercase tracking-wider text-slate-600 block mb-0.5">
              CONTENIDO / ARTÍCULO
            </span>
            <p className="text-xs sm:text-sm font-black uppercase text-black leading-tight line-clamp-2">
              {productName}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[9px] font-mono font-black text-black bg-slate-100 border border-black px-1.5 py-0.5 rounded">
                SKU: {productCode}
              </span>
              {sale.variante && (
                <span className="text-[8.5px] font-bold text-slate-700 uppercase">
                  ({sale.variante})
                </span>
              )}
            </div>
          </div>

          <div className="p-1.5 text-center flex flex-col items-center justify-center bg-slate-50">
            <span className="text-[8px] font-black uppercase tracking-wider text-slate-600 leading-none">
              CANTIDAD
            </span>
            <span className="text-2xl font-mono font-black text-black leading-none mt-1">
              x{quantity}
            </span>
            <span className="text-[9px] font-black uppercase text-slate-800 mt-0.5">
              {quantity > 1 ? 'BULTOS' : 'BULTO'}
            </span>
            {stockItem?.peso && (
              <span className="text-[8px] font-black text-white bg-black px-1.5 py-0.2 rounded mt-0.5">
                {stockItem.peso} KG
              </span>
            )}
          </div>
        </div>

        {/* FILA 7: ALERTA DE SEGURIDAD - VIDEO OBLIGATORIO */}
        <div className="border-b-[2.5px] border-black p-1.5 bg-slate-100 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-black text-white font-black text-xs flex items-center justify-center flex-shrink-0">
            📹
          </div>
          <div className="leading-none">
            <p className="text-[9px] font-black uppercase text-black leading-tight">
              VIDEO CONTINUO OBLIGATORIO PARA CUALQUIER RECLAMO O CAMBIO
            </p>
            <p className="text-[7.5px] font-bold text-slate-700 leading-tight mt-0.5">
              Grabe la apertura del paquete desde el primer corte sin pausas ni ediciones.
            </p>
          </div>
        </div>

        {/* FILA 8: CÓDIGO DE BARRAS Y PIE DE PÁGINA */}
        <div className="p-1 flex items-center justify-between">
          <div className="flex-1">
            <BarcodePattern code={`VNT${sale.numeroVenta}-${productCode}`} />
          </div>
          <div className="text-right pl-2 border-l border-black text-[8px] font-black text-slate-700 uppercase leading-tight">
            <p>VENDEDOR: {sale.vendedor || 'SISTEMA'}</p>
            {sale.etiquetador && <p>ETIQUETADO POR: {sale.etiquetador}</p>}
            <p className="text-slate-500 font-bold mt-0.5">{sale.fecha} {sale.hora || ''}</p>
          </div>
        </div>

      </div>
    );
  }

  // FORMATO 2: INDUSTRIAL TRANSPORTE PESADO (Bordes extra gruesos, contrastes extremos, tipografía gigante)
  if (activeFormat === 'industrial') {
    return (
      <div className="w-[100mm] h-[150mm] min-h-[150mm] max-h-[150mm] box-border bg-white border-[4px] border-black p-2 flex flex-col justify-between overflow-hidden print:m-0 print:w-[100mm] print:h-[150mm] select-none text-black font-sans leading-tight">
        
        {/* Cabecera Industrial */}
        <div className="flex items-center justify-between border-b-[3px] border-black pb-2">
          <div className="flex items-center gap-2">
            <img 
              src={LOGO_URL} 
              alt="Logo" 
              referrerPolicy="no-referrer" 
              className="w-11 h-11 object-contain border-2 border-black p-0.5 bg-white" 
            />
            <div>
              <h2 className="text-base font-black tracking-tight text-black uppercase leading-none">
                {BRAND_NAME}
              </h2>
              <p className="text-[9px] font-bold text-slate-800 uppercase tracking-widest mt-0.5">
                DESPACHO INDUSTRIAL
              </p>
            </div>
          </div>
          <div className="bg-black text-white px-3 py-1 text-center rounded">
            <span className="text-[8px] font-bold uppercase tracking-widest block text-slate-300">ORDEN</span>
            <span className="font-mono text-2xl font-black leading-none">#{sale.numeroVenta}</span>
          </div>
        </div>

        {/* Agencia Banner */}
        <div className="border-b-[3px] border-black py-1.5 px-2 bg-slate-100 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase text-black">TRANSPORTE:</span>
          <span className="text-base font-black uppercase tracking-wider text-black">{dispatchMethod}</span>
          <span className="bg-black text-white px-1.5 py-0.5 text-[9px] font-black uppercase">{dispatchType}</span>
        </div>

        {/* Destinatario Principal */}
        <div className="border-b-[3px] border-black p-2 bg-white">
          <span className="text-[9px] font-black uppercase bg-black text-white px-2 py-0.5 inline-block">
            DESTINATARIO
          </span>
          <p className="text-2xl font-black uppercase tracking-tight text-black mt-1 leading-tight">
            {sale.cliente || 'CLIENTE NO IDENTIFICADO'}
          </p>
        </div>

        {/* Recuadro Crítico: RUT y Teléfono */}
        <div className="grid grid-cols-2 border-b-[3px] border-black">
          <div className="border-r-[3px] border-black p-2 bg-slate-50 text-center">
            <span className="text-[9px] font-black uppercase tracking-wider block bg-black text-white py-0.5">
              R.U.T. DESTINATARIO
            </span>
            <p className="text-2xl font-mono font-black text-black tracking-wider mt-1.5">
              {formattedRut}
            </p>
          </div>
          <div className="p-2 bg-slate-50 text-center">
            <span className="text-[9px] font-black uppercase tracking-wider block bg-black text-white py-0.5">
              TELÉFONO CONTACTO
            </span>
            <p className="text-2xl font-mono font-black text-black tracking-tight mt-1.5">
              {formattedPhone}
            </p>
          </div>
        </div>

        {/* Dirección de Entrega */}
        <div className="border-b-[3px] border-black p-2 flex-1 min-h-[26mm] bg-white">
          <span className="text-[9px] font-black uppercase bg-black text-white px-2 py-0.5 inline-block">
            DIRECCIÓN DE DESPACHO
          </span>
          <p className="text-lg font-black uppercase text-black leading-snug mt-1.5 break-words">
            {sale.direccion || 'SIN DIRECCIÓN REGISTRADA - CONSULTAR'}
          </p>
          {sale.observaciones && (
            <p className="mt-1 text-[10px] font-black uppercase bg-slate-100 p-1 border border-black">
              REF: {sale.observaciones}
            </p>
          )}
        </div>

        {/* Bulto y SKU */}
        <div className="grid grid-cols-3 border-b-[3px] border-black">
          <div className="col-span-2 border-r-[3px] border-black p-2">
            <span className="text-[8px] font-black uppercase text-slate-600">PRODUCTO / CÓDIGO</span>
            <p className="text-sm font-black uppercase text-black">{productName}</p>
            <p className="text-[10px] font-mono font-black text-black mt-0.5">SKU: {productCode}</p>
          </div>
          <div className="p-2 text-center bg-slate-100 flex flex-col justify-center">
            <span className="text-[8px] font-black uppercase text-slate-600">CANTIDAD</span>
            <p className="text-3xl font-mono font-black text-black leading-none">x{quantity}</p>
            <span className="text-[8px] font-black uppercase text-slate-700">BULTO(S)</span>
          </div>
        </div>

        {/* Video Advertencia */}
        <div className="border-b-[3px] border-black p-1 bg-black text-white text-center">
          <p className="text-[9px] font-black uppercase tracking-wider">
            ⚠️ OBLIGATORIO: GRABAR VIDEO AL ABRIR EL PAQUETE PARA GARANTÍA
          </p>
        </div>

        {/* Pie */}
        <div className="p-1 flex items-center justify-between">
          <BarcodePattern code={`IND-${sale.numeroVenta}-${productCode}`} />
          <div className="text-right text-[8px] font-black text-slate-700 uppercase">
            <p>VENDEDOR: {sale.vendedor || 'SISTEMA'}</p>
            <p>{sale.fecha} {sale.hora || ''}</p>
          </div>
        </div>

      </div>
    );
  }

  // FORMATO 3: CLÁSICA MEJORADA (Estructura compacta con datos agrandados y recuadros limpios)
  return (
    <div className="w-[100mm] h-[150mm] min-h-[150mm] max-h-[150mm] box-border bg-white border-2 border-black p-3 flex flex-col justify-between overflow-hidden print:m-0 print:w-[100mm] print:h-[150mm] select-none text-black font-sans leading-tight">
      
      {/* Cabecera */}
      <div className="flex items-center justify-between border-b-2 border-black pb-2">
        <div className="flex items-center gap-2">
          <img src={LOGO_URL} alt="Logo" referrerPolicy="no-referrer" className="w-10 h-10 object-contain rounded" />
          <div>
            <h2 className="text-sm font-black text-black uppercase leading-none">{BRAND_NAME}</h2>
            <p className="text-[8px] font-bold text-slate-600 uppercase">{COMPANY_NAME}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono text-2xl font-black text-black leading-none">#{sale.numeroVenta}</span>
          <p className="text-[9px] font-bold text-slate-600 uppercase">{sale.tipoVenta || 'NORMAL'}</p>
        </div>
      </div>

      {/* Transporte */}
      <div className="border-2 border-black p-1.5 bg-slate-100 flex items-center justify-between my-1">
        <span className="text-[9px] font-black uppercase text-slate-700">MÉTODO:</span>
        <span className="text-sm font-black uppercase text-black">{dispatchMethod}</span>
        <span className="text-[9px] font-bold uppercase bg-white px-1 border border-black">{dispatchType}</span>
      </div>

      {/* Destinatario */}
      <div className="border-2 border-black p-2 bg-white mb-1">
        <span className="text-[8px] font-black uppercase text-slate-500 block mb-0.5">DESTINATARIO</span>
        <p className="text-xl font-black uppercase text-black leading-tight">{sale.cliente}</p>
      </div>

      {/* RUT y Teléfono */}
      <div className="grid grid-cols-2 gap-1 mb-1">
        <div className="border-2 border-black p-1.5 text-center bg-slate-50">
          <span className="text-[8px] font-black uppercase text-slate-600 block">RUT DESTINATARIO</span>
          <span className="text-xl font-mono font-black text-black block mt-0.5">{formattedRut}</span>
        </div>
        <div className="border-2 border-black p-1.5 text-center bg-slate-50">
          <span className="text-[8px] font-black uppercase text-slate-600 block">TELÉFONO</span>
          <span className="text-xl font-mono font-black text-black block mt-0.5">{formattedPhone}</span>
        </div>
      </div>

      {/* Dirección */}
      <div className="border-2 border-black p-2 flex-1 min-h-[22mm] mb-1">
        <span className="text-[8px] font-black uppercase text-slate-500 block mb-0.5">DIRECCIÓN DE ENTREGA</span>
        <p className="text-base font-black uppercase text-black leading-snug">{sale.direccion || 'SIN DIRECCIÓN'}</p>
        {sale.observaciones && (
          <p className="mt-1 text-[9px] font-bold uppercase text-slate-700">Obs: {sale.observaciones}</p>
        )}
      </div>

      {/* Producto */}
      <div className="border-2 border-black p-1.5 flex items-center justify-between mb-1">
        <div>
          <span className="text-[8px] font-black uppercase text-slate-500 block">PRODUCTO</span>
          <p className="text-xs font-black uppercase text-black">{productName}</p>
          <span className="text-[9px] font-mono font-bold text-slate-700">SKU: {productCode}</span>
        </div>
        <div className="text-right">
          <span className="text-[8px] font-black uppercase text-slate-500 block">CANTIDAD</span>
          <span className="text-xl font-black text-black">x{quantity}</span>
        </div>
      </div>

      {/* Advertencia */}
      <div className="border border-black p-1 bg-slate-100 text-center mb-1">
        <p className="text-[8.5px] font-black uppercase text-black">🔄 VIDEO OBLIGATORIO PARA CUALQUIER CAMBIO</p>
      </div>

      {/* Pie */}
      <div className="flex items-center justify-between pt-1 border-t border-black">
        <span className="font-mono text-[9px] font-black text-black">*VNT{sale.numeroVenta}*</span>
        <span className="text-[8px] font-bold text-slate-600 uppercase">Vendedor: {sale.vendedor || 'SISTEMA'} | {sale.fecha}</span>
      </div>

    </div>
  );
};
