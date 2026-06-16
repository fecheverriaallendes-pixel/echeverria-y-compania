import React, { useState } from 'react';
import { useStore } from '../store/GlobalContext';
import { StaffRole } from '../types';
import { Factory, TrendingUp, Calendar, AlertCircle, Trash2 } from 'lucide-react';

export default function Produccion() {
  const { productionRecords, addProductionRecord, deleteProductionRecord, currentUser } = useStore();
  const isAdmin = currentUser?.rol === StaffRole.ADMIN;
  const [cantidad, setCantidad] = useState('');

  const handleSave = () => {
    const cant = parseInt(cantidad);
    if (isNaN(cant) || cant <= 0) {
      alert('Ingresa una cantidad válida');
      return;
    }
    addProductionRecord(cant);
    setCantidad('');
    alert(`Guardado: ${cant} fardos.`);
  };

  // Weekly stats
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const weeklyRecords = productionRecords.filter(r => {
    const d = new Date(r.fecha);
    return d >= startOfWeek && d <= endOfWeek;
  });

  const totalFardos = weeklyRecords.reduce((acc, r) => acc + r.cantidad, 0);
  const totalPagar = totalFardos * 4000;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-black text-slate-800 mb-8 uppercase flex items-center gap-3">
        <Factory className="text-amber-500" /> Producción (Reenfardado)
      </h1>

      <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 mb-8">
        <h2 className="text-xl font-bold mb-4">Ingreso Producción Hoy</h2>
        <div className="flex gap-4 items-center">
            <input 
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="Cantidad de Fardos"
                className="px-6 py-4 rounded-2xl border-2 border-slate-200 outline-none focus:border-amber-500 w-64 text-xl font-bold"
            />
            <button 
                onClick={handleSave}
                className="bg-amber-500 text-white px-8 py-4 rounded-2xl font-black text-xl hover:bg-amber-600 transition"
            >
                Guardar Producción
            </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Reporte Pago Semanal</h2>
            <div className="flex items-center gap-2 text-slate-500">
                <Calendar size={18} />
                <span className="font-semibold">{startOfWeek.toLocaleDateString()} - {endOfWeek.toLocaleDateString()}</span>
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-slate-50 p-6 rounded-2xl">
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Total Fardos</p>
                <p className="text-4xl font-black text-slate-800">{totalFardos}</p>
            </div>
            <div className="bg-emerald-50 p-6 rounded-2xl">
                <p className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest">Total a Pagar</p>
                <p className="text-4xl font-black text-emerald-800">${totalPagar.toLocaleString('es-CL')}</p>
            </div>
        </div>

        <table className="w-full">
            <thead>
                <tr className="border-b border-slate-200">
                    <th className="px-4 py-2 text-left text-slate-400 uppercase text-[10px] font-bold">Fecha</th>
                    <th className="px-4 py-2 text-right text-slate-400 uppercase text-[10px] font-bold">Cantidad</th>
                    <th className="px-4 py-2 text-right text-slate-400 uppercase text-[10px] font-bold">Monto</th>
                    {isAdmin && <th className="px-4 py-2 text-center text-slate-400 uppercase text-[10px] font-bold">Acción</th>}
                </tr>
            </thead>
            <tbody>
                {weeklyRecords.reverse().map(r => (
                    <tr key={r.id} className="border-b border-slate-100">
                        <td className="px-4 py-4">{new Date(r.fecha).toLocaleDateString()}</td>
                        <td className="px-4 py-4 text-right font-bold">{r.cantidad}</td>
                        <td className="px-4 py-4 text-right font-bold text-emerald-600">${r.totalPagar.toLocaleString('es-CL')}</td>
                        {isAdmin && (
                          <td className="px-4 py-4 text-center">
                            <button onClick={() => { if(confirm('¿Borrar registro de producción?')) deleteProductionRecord(r.id); }} className="text-red-500 hover:text-red-700">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}
