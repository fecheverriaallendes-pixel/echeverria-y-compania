import React from 'react';
import { X, Printer } from 'lucide-react';
import { Sale, CommissionType } from '../types';

interface ReportProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sales: Sale[];
  stats: any;
}

export const ReportModal = ({ isOpen, onClose, title, sales, stats }: ReportProps) => {
  if (!isOpen) return null;

  const totalVentas = sales.reduce((acc, s) => acc + (s.total || 0), 0);

  const vendedores: Record<string, { fardos: number; lotes: number; cantNormal: number; cantPromo: number; ventas: number }> = {};
  
  sales.forEach(s => {
    if (!vendedores[s.vendedor]) {
      vendedores[s.vendedor] = { fardos: 0, lotes: 0, cantNormal: 0, cantPromo: 0, ventas: 0 };
    }

    const processEntry = (tipo: CommissionType | undefined, qty: number, codigo: string, totalItem: number) => {
        // Categorización basada en tipo de comisión para total consistencia
        const finalTipo = tipo || (codigo.startsWith('L') ? CommissionType.LOTE : CommissionType.FARDO_NORMAL);
        
        const isLote = finalTipo === CommissionType.LOTE;
        const isPromo = finalTipo === CommissionType.FARDO_PROMO;
        
        if (isLote) {
          vendedores[s.vendedor].lotes += qty;
        } else {
          vendedores[s.vendedor].fardos += qty;
        }
        
        if (isPromo) {
          vendedores[s.vendedor].cantPromo += qty;
        } else {
          vendedores[s.vendedor].cantNormal += qty;
        }
        
        vendedores[s.vendedor].ventas += totalItem;
    };

    if (s.items && s.items.length > 0) {
        s.items.forEach(item => {
            processEntry(item.tipoComision, item.cantidad, item.codigoFardo, item.valorUnitario * item.cantidad);
        });
    } else {
        processEntry(s.tipoComision, s.cantidad || 1, s.codigoFardo || '', s.total || 0);
    }
  });

  const totalFardos = Object.values(vendedores).reduce((acc, v) => acc + v.fardos, 0);
  const totalLotes = Object.values(vendedores).reduce((acc, v) => acc + v.lotes, 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-8 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-black uppercase text-slate-900">{title}</h2>
          <div className="flex gap-4">
            <button onClick={() => window.print()} className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-all"><Printer /></button>
            <button onClick={onClose} className="bg-slate-100 text-slate-400 p-3 rounded-full hover:bg-slate-200 transition-all"><X /></button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Dinero</p>
              <p className="text-3xl font-black text-blue-600 leading-none">${totalVentas.toLocaleString('es-CL')}</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Resumen Unidades</p>
              <p className="text-xl font-black text-slate-900 uppercase">
                📦 Unidades: <span className="text-blue-600">{totalFardos}</span> | 🏷️ Lotes: <span className="text-amber-600">{totalLotes}</span>
              </p>
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-black">
                <th className="p-4">Vendedor</th>
                <th className="p-4">Unidades</th>
                <th className="p-4 text-blue-600">Normal</th>
                <th className="p-4 text-red-600">Promo</th>
                <th className="p-4">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(vendedores).map(([vend, data]) => (
                <tr key={vend} className="text-sm font-bold text-slate-700">
                  <td className="p-4 font-black">{vend}</td>
                  <td className="p-4">
                    {data.fardos + data.lotes}
                    <div className="text-[10px] text-slate-400">U:{data.fardos} L:{data.lotes}</div>
                  </td>
                  <td className="p-4 text-blue-700 bg-blue-50">{data.cantNormal}</td>
                  <td className="p-4 text-red-700 bg-red-50">{data.cantPromo}</td>
                  <td className="p-4">${data.ventas.toLocaleString('es-CL')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
