import React, { useState } from 'react';
import { useStore } from '../store/GlobalContext';
import { Customer } from '../types';
import { Phone, Search, Plus, Trash2, Edit2, MessageSquare, Clock } from 'lucide-react';

export default function CRM() {
  const { customers, addCustomer, updateCustomer, removeCustomer } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newNote, setNewNote] = useState('');

  const normalizeText = (text: string) => 
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredCustomers = customers.filter(c => {
    const normalizedSearch = normalizeText(searchTerm);
    return normalizeText(c.nombre).includes(normalizedSearch) ||
           c.telefono.includes(searchTerm);
  });

  const handleWhatsApp = (telefono: string) => {
    const formattedPhone = telefono.replace(/\D/g, ''); 
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  const addNota = (customer: Customer) => {
    if (!newNote) return;
    updateCustomer({
      ...customer,
      notas: [...customer.notas, `${new Date().toLocaleDateString()}: ${newNote}`],
      lastContacted: new Date().toISOString()
    });
    setNewNote('');
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-slate-900">CRM de Clientes</h1>
        <button onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }} className="px-4 py-2 bg-slate-900 text-white rounded-xl flex items-center gap-2 font-bold text-sm">
          <Plus size={16} /> Nuevo Cliente
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-slate-200 outline-none focus:border-amber-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form 
            className="bg-white p-6 rounded-2xl w-full max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                nombre: formData.get('nombre') as string,
                telefono: formData.get('telefono') as string,
                rut: formData.get('rut') as string || '',
                email: formData.get('email') as string || '',
                direccion: formData.get('direccion') as string || '',
              };
              if (editingCustomer) {
                updateCustomer({ ...editingCustomer, ...data });
              } else {
                addCustomer(data);
              }
              setIsModalOpen(false);
            }}
          >
            <h2 className="text-lg font-black mb-4">{editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            <input name="nombre" defaultValue={editingCustomer?.nombre} placeholder="Nombre" className="w-full p-2 mb-2 border rounded" required />
            <input name="telefono" defaultValue={editingCustomer?.telefono} placeholder="Teléfono" className="w-full p-2 mb-2 border rounded" required />
            <input name="rut" defaultValue={editingCustomer?.rut} placeholder="RUT" className="w-full p-2 mb-2 border rounded" />
            <input name="email" defaultValue={editingCustomer?.email} placeholder="Email" className="w-full p-2 mb-2 border rounded" />
            <textarea name="direccion" defaultValue={editingCustomer?.direccion} placeholder="Dirección Completa" className="w-full p-2 mb-4 border rounded h-24 resize-none" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold">Guardar</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-black text-lg text-slate-900">{c.nombre}</h3>
            <p className="text-sm font-bold text-slate-500 mb-2">{c.telefono}</p>
            
            <div className="mt-4 border-t pt-4">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Historial</p>
                <div className="max-h-32 overflow-y-auto mb-2 space-y-1">
                    {c.notas.map((n, i) => <p key={i} className="text-xs text-slate-600 bg-slate-50 p-2 rounded">{n}</p>)}
                </div>
                <div className="flex gap-1">
                    <input value={newNote} onChange={e => setNewNote(e.target.value)} className="text-xs p-2 flex-grow border rounded" placeholder="Nueva nota..." />
                    <button onClick={() => addNota(c)} className="bg-amber-500 text-white p-2 rounded"><Plus size={14} /></button>
                </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => handleWhatsApp(c.telefono)} className="px-3 py-2 bg-green-500 text-white rounded-lg"><MessageSquare size={16} /></button>
              <button onClick={() => { setEditingCustomer(c); setIsModalOpen(true); }} className="px-3 py-2 bg-amber-100 rounded-lg"><Edit2 size={16} /></button>
              <button onClick={() => removeCustomer(c.id)} className="px-3 py-2 bg-red-100 rounded-lg"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
