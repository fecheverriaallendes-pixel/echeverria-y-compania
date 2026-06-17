
import React, { useState } from 'react';
import { 
  Database, RefreshCw, Settings, ShieldAlert, AlertTriangle, 
  Zap, Activity, CheckCircle2, ShieldCheck, ZapOff, Ghost,
  Users, Lock, Volume2, VolumeX, Plus, Trash2, Key, Globe, Copy,
  Table as TableIcon, Server, HardDrive, UserPlus, Shield,
  SearchCode, Eye, UploadCloud,
  FileText, Package, Wallet, 
  Boxes, Truck, Layers, Edit3, Music
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { StaffRole } from '../types';

export default function Configuracion() {
  const { 
    settings, updateSettings, playSound, syncWithCloud, pushToCloud,
    isSyncing, lastSync, staff, addStaff, updateStaff, removeStaff, sales, stock, purchases,
    clearAllSales, resetToMasterStock, addCarrier, carriers, removeCarrier,
    fixDuplicateStock, fixDuplicateStockByName, purgeUnusedStock, deleteAllSales
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<'RED' | 'STAFF' | 'DB' | 'SISTEMA' | 'CARRIERS'>('RED');
  const [apiUrl, setApiUrl] = useState(settings.cloudUrl);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  
  const [newStaff, setNewStaff] = useState({
    nombre: '',
    rol: StaffRole.VENDEDOR,
    pin: ''
  });

  const handleForceActivate = async () => {
    playSound('success');
    updateSettings({ dbConnected: true, cloudUrl: apiUrl, lastError: null });
    await syncWithCloud();
    alert("🚀 VINCULACIÓN V17.3: Sincronización completa.");
  };

  const handleEmergencyRestore = async () => {
    if (confirm("⚠️ ¿FORZAR RESCATE? Se subirán todos los datos que ves en el 'Inspector Local' a la nube. Esto sobrescribirá lo que haya en el Excel con tus datos de este PC.")) {
      try {
        await pushToCloud(sales, stock, staff, purchases);
        alert("✅ ÉXITO: Los datos locales han sido inyectados en la nube.");
        playSound('success');
      } catch (e) {
        alert("❌ Error en el rescate: " + (e as Error).message);
      }
    }
  };

  const handleMasterStockReset = () => {
    if (confirm("🚨 ADVERTENCIA MÁXIMA: Esta acción es IRREVERSIBLE. Se ELIMINARÁ todo tu inventario actual de la base de datos y se reemplazará por la lista maestra oficial (solo productos con stock inicial). ¿Estás ABSOLUTAMENTE seguro?")) {
      const pin = prompt("Por seguridad, ingresa el PIN Maestro:");
      if (pin === "2024") {
        resetToMasterStock();
        playSound('success');
        alert("✅ ÉXITO: El inventario ha sido reiniciado a la base maestra filtrada.");
      } else {
        alert("PIN Incorrecto.");
      }
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(apiUrl);
    alert("URL Copiada.");
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.nombre || !newStaff.pin) {
      alert("Por favor completa nombre y PIN");
      return;
    }
    if (editingStaffId) {
      await updateStaff(editingStaffId, {
        nombre: newStaff.nombre.toUpperCase(),
        rol: newStaff.rol,
        pin: newStaff.pin
      });
      setEditingStaffId(null);
      alert("✅ ÉXITO: Usuario modificado correctamente.");
    } else {
      addStaff(newStaff);
    }
    setNewStaff({ nombre: '', rol: StaffRole.VENDEDOR, pin: '' });
    playSound('success');
  };

  const handleClearSales = async () => {
    if (confirm("⚠️ ADVERTENCIA: ¿Estás seguro de eliminar TODAS las ventas del sistema?")) {
      const pin = prompt("Ingresa PIN Maestro:");
      if (pin === "2024") {
        await deleteAllSales();
        playSound('success');
        alert("Ventas eliminadas.");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
            <Settings className="text-slate-400" size={32} /> Panel Maestro V17.3
          </h2>
          <p className="text-slate-500 italic font-medium">Gestión de Nube, Personal y Seguridad</p>
        </div>
        
        <div className="flex bg-slate-200 p-1.5 rounded-[24px] shadow-inner overflow-x-auto">
          {[
            { id: 'RED', label: 'Red', icon: Globe },
            { id: 'STAFF', label: 'Personal', icon: Users },
            { id: 'DB', label: 'Rescate DB', icon: Server },
            { id: 'CARRIERS', label: 'Transportistas', icon: Truck },
            { id: 'SISTEMA', label: 'Sistema', icon: Activity }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); playSound('click'); }}
              className={`px-6 py-3 rounded-[20px] font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500'}`}
            >
              <tab.icon size={14} className="inline mr-2" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* PESTAÑA RED */}
        {activeTab === 'RED' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-left duration-500">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-slate-900 p-10 rounded-[48px] border-2 border-slate-800 shadow-2xl">
                <div className="space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[30px] flex items-center justify-center transition-all bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                      <Globe size={40} className="text-white" />
                    </div>
                    <div>
                      <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Estado del Sistema</p>
                      <h3 className="text-3xl font-black text-white uppercase tracking-tighter">
                        FIREBASE CONECTADO
                      </h3>
                      <p className="text-slate-400 text-[10px] font-bold uppercase mt-2">
                        Sincronización en tiempo real activa.
                      </p>
                    </div>
                  </div>

                  <div className="bg-emerald-600/10 border-2 border-emerald-500/30 p-8 rounded-[40px] space-y-4">
                    <h4 className="text-white font-black text-sm uppercase italic">Sincronización en Vivo</h4>
                    <p className="text-slate-400 text-[11px] font-medium leading-relaxed">
                      La base de datos se encuentra operando con Google Firebase Firestore. Todos los cambios realizados por cualquier usuario se reflejarán instantáneamente en todos los dispositivos conectados.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-xl text-center space-y-6 h-fit">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <ShieldAlert size={32} />
              </div>
              <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Seguridad Nube</h4>
              <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">
                Al estar en modo local, es importante no borrar los datos de navegación (caché/cookies) de este navegador, ya que aquí reside la base de datos temporal.
              </p>
              <div className="space-y-3">
                 <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Personal</span>
                    <span className="font-black text-slate-900">{staff.length}</span>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Compras</span>
                    <span className="font-black text-slate-900">{purchases.length}</span>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA PERSONAL */}
        {activeTab === 'STAFF' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right duration-500">
            <div className="lg:col-span-1 bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl h-fit">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><UserPlus size={24} /></div>
                <h3 className="text-xl font-black uppercase tracking-tighter">{editingStaffId ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              </div>
              <form onSubmit={handleAddStaff} className="space-y-6">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Nombre</label>
                  <input required type="text" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold uppercase outline-none" value={newStaff.nombre} onChange={e => setNewStaff({...newStaff, nombre: e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Rol del Usuario</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold uppercase outline-none appearance-none" 
                    value={newStaff.rol} 
                    onChange={e => setNewStaff({...newStaff, rol: e.target.value as StaffRole})}
                  >
                    {Object.values(StaffRole).map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">PIN (4 dígitos)</label>
                  <input required type="password" maxLength={4} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-2xl font-black outline-none" value={newStaff.pin} onChange={e => setNewStaff({...newStaff, pin: e.target.value})} />
                </div>
                <button type="submit" className={`w-full py-5 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl transition-all ${editingStaffId ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-slate-900 hover:bg-black'}`}>
                  {editingStaffId ? 'GUARDAR CAMBIOS' : 'CREAR USUARIO'}
                </button>
                {editingStaffId && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditingStaffId(null);
                      setNewStaff({ nombre: '', rol: StaffRole.VENDEDOR, pin: '' });
                      playSound('click');
                    }}
                    className="w-full py-4 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
                  >
                    CANCELAR EDICIÓN
                  </button>
                )}
              </form>
            </div>
 
            <div className="lg:col-span-2 bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl">
              <h3 className="text-xl font-black uppercase tracking-tighter mb-8">Personal en Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staff.map(member => (
                  <div key={member.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400"><Shield size={20} /></div>
                      <div>
                        <p className="font-black text-slate-900 uppercase text-xs">{member.nombre}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[9px] font-bold text-emerald-500 uppercase">{member.rol}</p>
                          <span className="text-[9px] text-slate-300 font-bold">•</span>
                          <p className="text-[9px] font-black text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded-md">PIN: {member.pin}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => {
                          setEditingStaffId(member.id);
                          setNewStaff({
                            nombre: member.nombre,
                            rol: member.rol,
                            pin: member.pin
                          });
                          playSound('click');
                        }}
                        className="p-3 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Editar Usuario"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`¿Estás seguro de eliminar al usuario "${member.nombre}"?`)) {
                            removeStaff(member.id);
                            playSound('click');
                          }
                        }} 
                        className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                        title="Eliminar Usuario"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA TRANSPORTISTAS */}
        {activeTab === 'CARRIERS' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right duration-500">
            <div className="lg:col-span-1 bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl h-fit">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><Truck size={24} /></div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Nuevo Transportista</h3>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const input = form.elements.namedItem('carrierName') as HTMLInputElement;
                if (input.value.trim()) {
                  addCarrier(input.value.trim());
                  input.value = '';
                  playSound('success');
                }
              }} className="space-y-6">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Nombre / Empresa</label>
                  <input required name="carrierName" type="text" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold uppercase outline-none" placeholder="EJ: JUAN PEREZ" />
                </div>
                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-black shadow-xl">AGREGAR A LA LISTA</button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl">
              <h3 className="text-xl font-black uppercase tracking-tighter mb-8">Transportistas Habilitados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {carriers.map(carrier => (
                  <div key={carrier} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400"><Truck size={20} /></div>
                      <div>
                        <p className="font-black text-slate-900 uppercase text-xs">{carrier}</p>
                        <p className="text-[9px] font-bold text-emerald-500 uppercase">ACTIVO</p>
                      </div>
                    </div>
                    <button onClick={() => removeCarrier(carrier)} className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA DB SQL - RESCATE */}
        {activeTab === 'DB' && (
          <div className="max-w-4xl mx-auto w-full space-y-10 animate-in zoom-in duration-500">
            {/* INYECTOR MAESTRO */}
            <div className="bg-emerald-600 p-10 rounded-[48px] border border-emerald-500 shadow-2xl relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 p-8 opacity-10 text-white"><Boxes size={120} /></div>
              <div className="relative z-10 space-y-6">
                <h3 className="text-3xl font-black uppercase tracking-tighter">Inyector de Base de Datos Maestra</h3>
                <p className="text-emerald-100 text-xs font-bold leading-relaxed max-w-xl">
                  Si solo ves 2 productos, presiona este botón para sobreescribir el inventario actual con los 315 productos precargados (Abrigos, Blusas, Buzos, etc.).
                </p>
                <button 
                  onClick={handleMasterStockReset}
                  className="w-full py-6 bg-white text-emerald-600 rounded-[32px] font-black text-lg uppercase tracking-widest shadow-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-4"
                >
                  <Database size={24} /> RESTAURAR BASE MAESTRA (315 PRODUCTOS)
                </button>
              </div>
            </div>

            {/* Inspector de Memoria */}
            <div className="bg-slate-900 p-10 rounded-[48px] border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 text-white"><SearchCode size={120} /></div>
              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/30">
                    <Eye size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Inspector de Memoria Local</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Lo que este PC tiene guardado actualmente</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Ventas', count: sales.length, icon: FileText, color: 'blue' },
                    { label: 'Fardos', count: stock.length, icon: Package, color: 'emerald' },
                    { label: 'Personal', count: staff.length, icon: Users, color: 'purple' },
                    { label: 'Compras', count: purchases.length, icon: Wallet, color: 'amber' }
                  ].map(stat => (
                    <div key={stat.label} className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center">
                      <stat.icon size={20} className={`mx-auto mb-3 text-${stat.color}-400`} />
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-1">{stat.label}</p>
                      <p className="text-3xl font-black text-white">{stat.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-16 h-16 bg-red-600 text-white rounded-[24px] flex items-center justify-center shadow-xl">
                  <ShieldAlert size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-red-600">Protocolo de Rescate V17.3</h3>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Usa esto si perdiste datos tras sincronizar</p>
                </div>
              </div>

              <div className="p-10 bg-red-50 rounded-[40px] border-2 border-red-100 space-y-6">
                <div className="flex items-center gap-3">
                   <AlertTriangle className="text-red-600" size={24} />
                   <h4 className="text-red-900 font-black text-sm uppercase italic">¿Ves datos arriba pero no en la App?</h4>
                </div>
                <p className="text-red-800/70 text-[11px] font-medium leading-relaxed">
                  Si el Inspector de Memoria muestra que tienes <b>"Compras"</b> anotadas, pero tu lista de proveedores está vacía, presiona el botón de abajo. Esto forzará a la nube a recibir tus datos locales.
                </p>
                <button 
                  onClick={handleEmergencyRestore}
                  className="w-full py-6 bg-red-600 hover:bg-red-700 text-white rounded-[28px] font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                   <UploadCloud size={24} /> FORZAR SUBIDA MANUAL A LA NUBE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA SISTEMA / PREFERENCIAS */}
        {activeTab === 'SISTEMA' && (
          <div className="max-w-4xl mx-auto w-full space-y-8 animate-in zoom-in duration-500">
            <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-[24px] flex items-center justify-center shadow-xl">
                  <Activity size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Preferencias del Sistema</h3>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Feedback y Limpieza de Datos</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Control de Sonido */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${settings.soundEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                        {settings.soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 uppercase text-xs">Efectos Sonoros</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Activar/Desactivar avisos de audio</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const nextEnabled = !settings.soundEnabled;
                        updateSettings({ soundEnabled: nextEnabled });
                        if (nextEnabled) {
                          setTimeout(() => playSound('click'), 100);
                        }
                      }}
                      className={`w-20 h-10 rounded-full p-1 transition-all ${settings.soundEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`w-8 h-8 bg-white rounded-full shadow-md transition-all transform ${settings.soundEnabled ? 'translate-x-10' : 'translate-x-0'}`}></div>
                    </button>
                  </div>

                  {settings.soundEnabled && (
                    <div className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="flex items-center gap-3">
                        <Music className="text-emerald-500" size={20} />
                        <div>
                          <h4 className="font-black text-slate-900 text-xs uppercase">Estilo de Sonido</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Selecciona un perfil y haz click para previsualizar</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { id: 'classic', label: 'Clásico / Senoidal', desc: 'Tonos nítidos y puros de feedback tradicional' },
                          { id: 'retro', label: 'Retro / Arcade', desc: 'Efectos rápidos de ondas cuadradas de 8 bits' },
                          { id: 'melodic', label: 'Eco Melódico', desc: 'Arpegios armoniosos con ataque suave y notas puras' },
                          { id: 'sci-fi', label: 'Futurista / Láser', desc: 'Barridos dinámicos estilo comando cibernético' }
                        ].map((style) => (
                          <div
                            key={style.id}
                            onClick={() => {
                              updateSettings({ soundType: style.id });
                              setTimeout(() => {
                                playSound('success');
                              }, 150);
                            }}
                            className={`p-5 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between cursor-pointer ${
                              (settings.soundType || 'classic') === style.id
                                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-sm ring-1 ring-emerald-300'
                                : 'bg-white border-slate-200/60 hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <div className="w-full">
                              <p className="font-extrabold text-[11px] uppercase tracking-wide mb-1 flex items-center justify-between">
                                {style.label}
                                {(settings.soundType || 'classic') === style.id && (
                                  <span className="bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-normal">Activo</span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase">{style.desc}</p>
                            </div>
                            <div className="mt-4 flex gap-2 w-full">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateSettings({ soundType: style.id });
                                  setTimeout(() => playSound('click'), 100);
                                }}
                                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-black uppercase text-slate-600 transition-colors flex-1 text-center"
                              >
                                Test Click
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateSettings({ soundType: style.id });
                                  setTimeout(() => playSound('success'), 100);
                                }}
                                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-black uppercase text-slate-600 transition-colors flex-1 text-center"
                              >
                                Test Éxito
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Zona de Peligro: Limpieza */}
                <div className="p-8 border-2 border-dashed border-red-100 rounded-[32px] space-y-6">
                   <div className="flex items-center gap-4">
                      <AlertTriangle className="text-red-500" size={24} />
                      <h4 className="text-red-600 font-black text-sm uppercase">Mantenimiento de Temporada</h4>
                   </div>
                   <p className="text-slate-500 text-[11px] font-medium leading-relaxed italic">
                     Utiliza esta opción al iniciar una nueva temporada o año fiscal.
                   </p>
                  <button 
                    onClick={handleClearSales}
                    className="w-full py-5 bg-red-50 text-red-600 border-2 border-red-200 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3"
                   >
                     <Trash2 size={18} /> PURGAR HISTORIAL DE VENTAS (RESET)
                   </button>
                </div>

                {/* Mantenimiento y Unificación */}
                <div className="p-8 border-2 border-dashed border-emerald-100 rounded-[32px] space-y-6">
                   <div className="flex items-center gap-4">
                      <ShieldCheck className="text-emerald-500" size={24} />
                      <h4 className="text-emerald-600 font-black text-sm uppercase">Mantenimiento y Unificación</h4>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <button 
                       onClick={() => {
                           if(confirm("¿UNIFICAR POR CÓDIGO? Se sumará el stock de los productos duplicados con el mismo código oficial.")) {
                               fixDuplicateStock();
                           }
                       }}
                       disabled={isSyncing}
                       className="w-full py-5 bg-blue-50 text-blue-600 border-2 border-blue-100 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                     >
                       <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} /> 
                       {isSyncing ? 'PROCESANDO...' : '1.- UNIFICAR POR CÓDIGO'}
                     </button>

                     <button 
                       onClick={() => {
                           if(confirm("¿UNIFICAR POR NOMBRE? Se sumará el stock de productos con el mismo nombre exacto.")) {
                               fixDuplicateStockByName();
                           }
                       }}
                       disabled={isSyncing}
                       className="w-full py-5 bg-amber-50 text-amber-600 border-2 border-amber-100 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                     >
                       <Layers size={18} className={isSyncing ? 'animate-spin' : ''} /> 
                       {isSyncing ? 'PROCESANDO...' : '2.- UNIFICAR POR NOMBRE'}
                     </button>
                   </div>

                   <div className="pt-4 border-t border-slate-100 space-y-4">
                     <p className="text-slate-500 text-[11px] font-medium leading-relaxed italic">
                        <b>Limpieza Agresiva:</b> Elimina productos con stock 0 que nunca han tenido ventas para mantener el catálogo limpio.
                     </p>
                     <button 
                       onClick={() => purgeUnusedStock()}
                       disabled={isSyncing}
                       className="w-full py-5 bg-red-50 text-red-600 border-2 border-red-100 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                     >
                       <Trash2 size={18} /> 
                       {isSyncing ? 'PURGANDO...' : '3.- PURGA STOCK'}
                     </button>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
