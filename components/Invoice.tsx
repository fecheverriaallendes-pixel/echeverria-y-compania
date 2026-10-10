import React from 'react';
import { Sale, SaleType, LOGO_URL, BRAND_NAME, COMPANY_NAME } from '../types';

interface InvoiceProps {
  sale: Sale;
  stock: any[];
}

export const Invoice = React.forwardRef<HTMLDivElement, InvoiceProps>(({ sale, stock }, ref) => {
  const isNotaVenta = sale.tipoVenta === SaleType.NOTA_VENTA || (Array.isArray(sale.items) && sale.items.length > 0);
  const itemsList = (sale.items && sale.items.length > 0)
    ? sale.items
    : [{
        codigoFardo: sale.codigoFardo || 'S/C',
        cantidad: sale.cantidad || 1,
        valorUnitario: sale.valorUnitario || (sale.total ? Math.round(sale.total / (sale.cantidad || 1)) : 0)
      }];

  const totalCalculado = itemsList.reduce((acc, item) => acc + (item.cantidad * item.valorUnitario), 0) || sale.total || 0;
  const montoAbonado = sale.montoAbonado !== undefined ? sale.montoAbonado : (sale.estadoPago === 'Pagado' ? totalCalculado : 0);
  const saldoPendiente = Math.max(0, totalCalculado - montoAbonado);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div 
      ref={ref} 
      className="p-8 sm:p-12 bg-white text-slate-900 font-sans print:p-0 print:border-0 print:w-full print:max-w-none text-sm leading-relaxed"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      {/* HEADER DE LA NOTA DE VENTA / FACTURA */}
      <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900 gap-6">
        <div className="flex items-center gap-4">
          <img 
            src={LOGO_URL} 
            alt={BRAND_NAME} 
            referrerPolicy="no-referrer" 
            className="w-16 h-16 object-contain rounded-xl border border-slate-200 p-1 bg-white"
          />
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-none">
              {BRAND_NAME}
            </h1>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mt-1">
              {COMPANY_NAME}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 bg-slate-900 text-white rounded text-[10px] font-black uppercase tracking-widest">
                {isNotaVenta ? 'NOTA DE VENTA OFICIAL' : 'COMPROBANTE DE VENTA'}
              </span>
              <span className="text-[11px] font-bold text-slate-500 uppercase">
                {sale.tipoVenta || 'Venta General'}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right flex flex-col items-end">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Documento N°</span>
          <span className="text-3xl font-mono font-black text-slate-900 tracking-tight leading-none mt-0.5">
            #{sale.numeroVenta}
          </span>
          <div className="mt-2 text-xs font-semibold text-slate-600 space-y-0.5">
            <p><span className="text-slate-400 font-bold uppercase text-[10px]">Fecha:</span> {formatDate(sale.fecha)}</p>
            {sale.hora && <p><span className="text-slate-400 font-bold uppercase text-[10px]">Hora:</span> {sale.hora} hrs</p>}
          </div>
        </div>
      </div>

      {/* DETALLES DE CLIENTE Y DESPACHO */}
      <div className="grid grid-cols-2 gap-6 my-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
            Datos del Cliente
          </span>
          <p className="text-base font-black text-slate-900 uppercase leading-snug">
            {sale.cliente || 'CLIENTE NO ESPECIFICADO'}
          </p>
          <p className="text-xs font-semibold text-slate-700">
            <span className="font-bold text-slate-500">R.U.T.:</span> {sale.rut || 'Sin registrar'}
          </p>
          <p className="text-xs font-semibold text-slate-700">
            <span className="font-bold text-slate-500">Teléfono:</span> {sale.telefono || 'Sin registrar'}
          </p>
          <p className="text-xs font-semibold text-slate-700">
            <span className="font-bold text-slate-500">Dirección:</span> {sale.direccion || 'Retiro en Local / Por Coordinar'}
          </p>
        </div>

        <div className="space-y-1.5 border-l border-slate-200 pl-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
            Información Logística y Venta
          </span>
          <p className="text-xs font-semibold text-slate-700">
            <span className="font-bold text-slate-500">Vendedor:</span> <strong className="text-slate-900 uppercase">{sale.vendedor || 'Administración'}</strong>
          </p>
          <p className="text-xs font-semibold text-slate-700">
            <span className="font-bold text-slate-500">Método de Envío:</span> {sale.metodoDespacho || sale.tipoDespacho || 'Transporte Propio'}
          </p>
          {(sale.agencia || sale.transportista) && (
            <p className="text-xs font-semibold text-slate-700">
              <span className="font-bold text-slate-500">Transporte/Agencia:</span> {sale.agencia || sale.transportista}
            </p>
          )}
          <p className="text-xs font-semibold text-slate-700">
            <span className="font-bold text-slate-500">Prioridad:</span> <strong className="text-slate-800 uppercase">{sale.juntaCompra || 'DESPACHO INMEDIATO'}</strong>
          </p>
        </div>
      </div>

      {/* TABLA DE PRODUCTOS DE LA NOTA DE VENTA */}
      <div className="mb-6 rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4 w-28">Código</th>
              <th className="py-3 px-4">Descripción del Producto</th>
              <th className="py-3 px-4 text-center w-20">Cant.</th>
              <th className="py-3 px-4 text-right w-28">P. Unitario</th>
              <th className="py-3 px-4 text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {itemsList.map((item, index) => {
              const stockItem = stock.find(s => s.codigo?.trim().toUpperCase() === item.codigoFardo?.trim().toUpperCase());
              const productName = stockItem ? stockItem.tipo : (sale.variante || item.codigoFardo || 'Producto');
              const subtotal = item.cantidad * item.valorUnitario;

              return (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="py-3 px-4 text-center font-bold text-slate-400">{index + 1}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.codigoFardo}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {productName}
                    {stockItem?.subcategoria && (
                      <span className="block text-[10px] text-slate-400 font-normal">{stockItem.subcategoria}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-black text-slate-900">{item.cantidad}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">
                    ${item.valorUnitario.toLocaleString('es-CL')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                    ${subtotal.toLocaleString('es-CL')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* RESUMEN FINANCIERO Y FORMA DE PAGO */}
      <div className="grid grid-cols-2 gap-6 items-start pt-2">
        {/* Observaciones e indicaciones */}
        <div className="space-y-3">
          {sale.observaciones ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                Observaciones del Pedido:
              </span>
              <p className="text-xs font-semibold text-slate-800 whitespace-pre-line">
                {sale.observaciones}
              </p>
            </div>
          ) : (
            <div className="p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 italic">
              Sin observaciones especiales registradas.
            </div>
          )}

          <div className="text-[11px] text-slate-500 space-y-1">
            <p>• Los despachos se entregan en días hábiles según la ruta coordinada.</p>
            <p>• Revisar mercadería y bultos al momento de la recepción.</p>
          </div>
        </div>

        {/* Totales y Estado de Pago */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-600 uppercase">Subtotal Neto:</span>
            <span className="font-mono font-bold text-slate-900">${totalCalculado.toLocaleString('es-CL')}</span>
          </div>

          <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-2">
            <span className="font-bold text-slate-600 uppercase">Monto Abonado / Pagado:</span>
            <span className="font-mono font-bold text-emerald-700">${montoAbonado.toLocaleString('es-CL')}</span>
          </div>

          {saldoPendiente > 0 && (
            <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-2 text-rose-600 font-black">
              <span className="uppercase">Saldo Pendiente:</span>
              <span className="font-mono">${saldoPendiente.toLocaleString('es-CL')}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-base border-t-2 border-slate-900 pt-3">
            <span className="font-black text-slate-900 uppercase">TOTAL GENERAL:</span>
            <span className="font-mono font-black text-xl text-slate-900">${totalCalculado.toLocaleString('es-CL')}</span>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500 uppercase">Medio de Pago:</span>
            <span className="font-bold text-slate-800 uppercase">{sale.medioPago || 'Efectivo'}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500 uppercase">Estado:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
              sale.estadoPago === 'Pagado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {sale.estadoPago || 'Pendiente'}
            </span>
          </div>
        </div>
      </div>

      {/* PIE DE PÁGINA Y FIRMAS */}
      <div className="grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-slate-200">
        <div className="text-center">
          <div className="w-48 mx-auto border-b border-slate-400 mb-2"></div>
          <p className="text-xs font-black text-slate-900 uppercase">{COMPANY_NAME}</p>
          <p className="text-[10px] text-slate-500 uppercase">Firma Autorizada / Despacho</p>
        </div>

        <div className="text-center">
          <div className="w-48 mx-auto border-b border-slate-400 mb-2"></div>
          <p className="text-xs font-black text-slate-900 uppercase">{sale.cliente || 'Cliente'}</p>
          <p className="text-[10px] text-slate-500 uppercase">Recibido Conforme (Nombre / Firma / RUT)</p>
        </div>
      </div>
    </div>
  );
});

Invoice.displayName = 'Invoice';
