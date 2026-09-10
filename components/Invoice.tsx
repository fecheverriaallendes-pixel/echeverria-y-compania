
import React from 'react';
import { Sale, LOGO_URL, BRAND_NAME, COMPANY_NAME } from '../types';

export const Invoice = React.forwardRef<HTMLDivElement, { sale: Sale, stock: any[] }>(({ sale, stock }, ref) => {
  return (
    <div ref={ref} className="p-4 sm:p-8 bg-white print:p-0 print:border-0 print:w-full font-sans">
      <div className="flex justify-between items-start mb-6 border-b-2 border-slate-900 pb-4">
        <div className="flex items-center gap-4">
          <img 
            src={LOGO_URL} 
            alt="Logo" 
            referrerPolicy="no-referrer" 
            className="w-16 h-16 object-contain rounded-xl border border-slate-200 p-1"
          />
          <div>
            <h1 className="text-2xl font-black uppercase text-slate-900 leading-tight">{BRAND_NAME}</h1>
            <p className="text-xs font-bold text-slate-500 uppercase">{COMPANY_NAME}</p>
            <p className="text-[11px] font-black text-emerald-600 uppercase tracking-wider mt-0.5">Nota de Venta Oficial</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-mono font-black text-slate-900 leading-tight">N° #{sale.numeroVenta}</p>
          <p className="font-bold text-xs text-slate-600 mt-1">{new Date(sale.fecha).toLocaleDateString('es-CL')}</p>
          <p className="font-bold text-xs text-slate-500">{sale.hora}</p>
        </div>
      </div>
      <div className="mb-8 border-b border-slate-200 pb-4">
        <p className="font-black text-slate-700">Cliente: {sale.cliente}</p>
        <p className="text-sm font-bold text-slate-600">Rut: {sale.rut}</p>
        <p className="text-sm font-bold text-slate-600">Dirección: {sale.direccion}</p>
      </div>
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2">Producto</th>
            <th className="text-right py-2">Cantidad</th>
            <th className="text-right py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {(sale.items && sale.items.length > 0 ? sale.items : [{ codigoFardo: sale.codigoFardo || 'N/A', cantidad: sale.cantidad || 0, valorUnitario: sale.valorUnitario || 0 }]).map((item, index) => (
            <tr key={index} className="border-b border-slate-100">
              <td className="py-2">{stock.find(s => s.codigo === item.codigoFardo)?.tipo || item.codigoFardo}</td>
              <td className="text-right py-2">{item.cantidad}</td>
              <td className="text-right py-2">${(item.cantidad * item.valorUnitario).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-right">
        <p className="text-2xl font-black uppercase">Total: ${sale.total.toLocaleString()}</p>
      </div>
    </div>
  );
});
