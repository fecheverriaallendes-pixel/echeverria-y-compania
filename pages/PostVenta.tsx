import React, { useState, useMemo } from 'react';
import { useStore } from '../store/GlobalContext';
import { jsPDF } from 'jspdf';
import { 
  Ticket, 
  Download, 
  Plus, 
  AlertCircle, 
  Search, 
  ArrowUpDown, 
  Calendar, 
  Eye, 
  ShieldCheck, 
  ShieldAlert, 
  X, 
  Check, 
  Clipboard, 
  CheckCircle2 
} from 'lucide-react';
import { StaffRole, Coupon } from '../types';

const LOGO_URL = "https://i.ibb.co/ymf3nYWv/Chat-GPT-Image-10-jun-2026-18-30-56.png";

export default function PostVenta() {
  const { 
    coupons, 
    addCoupon, 
    redeemCoupon, 
    redeemCouponByCode, 
    deleteCoupon, 
    currentUser, 
    staff 
  } = useStore();

  const [amount, setAmount] = useState('');
  const [validDays, setValidDays] = useState('30');
  const [customerName, setCustomerName] = useState('');
  const [redeemCode, setRedeemCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Interactive Coupon States
  const [selectedPreviewCoupon, setSelectedPreviewCoupon] = useState<Coupon | null>(null);
  const [copiedCodeCode, setCopiedCodeCode] = useState<string | null>(null);

  // Admin PIN Authorization Modal State
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    couponId?: string;
    couponCode?: string;
    actionType: 'redeem' | 'redeemByCode';
    selectedAdminId: string;
    pin: string;
    error: string;
  }>({
    isOpen: false,
    actionType: 'redeem',
    selectedAdminId: 'master',
    pin: '',
    error: ''
  });

  const isAdmin = currentUser?.rol === StaffRole.ADMIN;

  // Active admins for PIN override
  const admins = useMemo(() => {
    return [
      { id: 'master', nombre: 'ADMINISTRADOR MAESTRO', pin: '2024', rol: StaffRole.ADMIN },
      ...(staff || []).filter(u => u.rol === StaffRole.ADMIN && u.activo)
    ];
  }, [staff]);

  const normalizeText = (text: string) => 
    (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredAndSortedCoupons = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);
    
    let result = coupons.filter(c => 
      normalizeText(c.customerName || "").includes(normalizedSearch) || 
      normalizeText(c.code).includes(normalizedSearch)
    );

    return result.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [coupons, searchTerm, sortOrder]);

  const isExpired = (coupon: Coupon) => {
    return new Date(coupon.validUntil) < new Date();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeCode(code);
    setTimeout(() => setCopiedCodeCode(null), 2000);
  };

  // Open appropriate redemption flow
  const handleRedeem = (coupon: Coupon) => {
    const expired = isExpired(coupon);
    if (expired) {
      if (isAdmin) {
        if (confirm(`El cupón ha expirado el ${new Date(coupon.validUntil).toLocaleDateString('es-CL')}. Como tienes rol de Administrador, ¿deseas autorizar su canje directamente?`)) {
          try {
            redeemCoupon(coupon.id, currentUser?.nombre || "Administrador");
            alert("Cupón canjeado exitosamente con autorización de administrador.");
            // If preview was open, update it
            if (selectedPreviewCoupon?.id === coupon.id) {
              setSelectedPreviewCoupon(prev => prev ? { ...prev, used: true, authorizedBy: currentUser?.nombre || "Administrador" } : null);
            }
          } catch (e: any) {
            alert(e.message);
          }
        }
      } else {
        // Show PIN override modal for non-admins
        setAuthModal({
          isOpen: true,
          couponId: coupon.id,
          couponCode: coupon.code,
          actionType: 'redeem',
          selectedAdminId: admins[0]?.id || 'master',
          pin: '',
          error: ''
        });
      }
    } else {
      if (confirm(`¿Estás seguro de canjear el cupón ${coupon.code} por $${coupon.value.toLocaleString('es-CL')}?`)) {
        try {
          redeemCoupon(coupon.id);
          alert("Cupón canjeado exitosamente.");
          // If preview was open, update it
          if (selectedPreviewCoupon?.id === coupon.id) {
            setSelectedPreviewCoupon(prev => prev ? { ...prev, used: true } : null);
          }
        } catch (e: any) {
          alert(e.message);
        }
      }
    }
  };

  const handleRedeemByCode = () => {
    const targetCode = redeemCode.trim().toUpperCase();
    if (!targetCode) return;

    const coupon = coupons.find(c => c.code.toUpperCase() === targetCode);
    if (!coupon) {
      alert("⚠️ Cupón no encontrado");
      return;
    }

    if (coupon.used) {
      alert("⚠️ Este cupón ya ha sido utilizado");
      return;
    }

    const expired = isExpired(coupon);
    if (expired) {
      if (isAdmin) {
        if (confirm(`El cupón ${coupon.code} ha expirado. Como tienes rol de Administrador, ¿deseas autorizar su canje directamente?`)) {
          try {
            redeemCouponByCode(coupon.code, currentUser?.nombre || "Administrador");
            alert("Cupón canjeado exitosamente con autorización de administrador.");
            setRedeemCode('');
          } catch (e: any) {
            alert(e.message);
          }
        }
      } else {
        // Requires PIN authentication
        setAuthModal({
          isOpen: true,
          couponId: coupon.id,
          couponCode: coupon.code,
          actionType: 'redeemByCode',
          selectedAdminId: admins[0]?.id || 'master',
          pin: '',
          error: ''
        });
      }
    } else {
      try {
        redeemCouponByCode(coupon.code);
        alert("Cupón canjeado exitosamente");
        setRedeemCode('');
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const admin = admins.find(a => a.id === authModal.selectedAdminId);
    if (!admin) {
      setAuthModal(prev => ({ ...prev, error: "Administrador no válido" }));
      return;
    }

    if (admin.pin !== authModal.pin) {
      setAuthModal(prev => ({ ...prev, error: "Código PIN de seguridad incorrecto" }));
      return;
    }

    // Success! Proceed with redemption with Admin name as override signature
    try {
      if (authModal.actionType === 'redeem' && authModal.couponId) {
        redeemCoupon(authModal.couponId, admin.nombre);
        alert(`✅ Cupón expirado canjeado de forma segura con la firma de autorización de: ${admin.nombre}`);
      } else if (authModal.actionType === 'redeemByCode' && authModal.couponCode) {
        redeemCouponByCode(authModal.couponCode, admin.nombre);
        alert(`✅ Cupón expirado canjeado de forma segura con la firma de autorización de: ${admin.nombre}`);
        setRedeemCode('');
      }
      
      // Update preview if it's currently showing
      if (selectedPreviewCoupon && selectedPreviewCoupon.id === authModal.couponId) {
        setSelectedPreviewCoupon(prev => prev ? { ...prev, used: true, authorizedBy: admin.nombre } : null);
      }

      // Reset Modal State
      setAuthModal({
        isOpen: false,
        actionType: 'redeem',
        selectedAdminId: 'master',
        pin: '',
        error: ''
      });
    } catch (err: any) {
      setAuthModal(prev => ({ ...prev, error: err.message }));
    }
  };

  const handleGenerate = () => {
    if (!amount || !customerName) return;
    addCoupon({
      code: 'CP-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      value: parseInt(amount),
      validUntil: new Date(Date.now() + parseInt(validDays) * 24 * 60 * 60 * 1000).toISOString(),
      used: false,
      customerName: customerName
    });
    setAmount('');
    setCustomerName('');
  };

  // High-fidelity elegant coupon design PDF builder
  const downloadPDFEnhanced = (coupon: Coupon) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      buildPDF(coupon, img);
    };
    img.onerror = () => {
      buildPDF(coupon, null); // Graceful vector fallback if offline or CORS error
    };
    img.src = LOGO_URL;
  };

  const buildPDF = (coupon: Coupon, img: HTMLImageElement | null) => {
    const doc = new jsPDF('p', 'mm', [100, 150]);

    // 1. Sleek Background (slate-50 look)
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 100, 150, 'F');

    // 2. Coupon Card Container White Box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(6, 6, 88, 138, 4, 4, 'F');

    // Draw card outlines
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.roundedRect(6, 6, 88, 138, 4, 4, 'D');

    // Draw visual ticket notch cut-outs (white circles cutting side borders)
    doc.setFillColor(248, 250, 252);
    doc.circle(6, 110, 4, 'F'); // left notch
    doc.circle(94, 110, 4, 'F'); // right notch

    // 3. Header Logo & Title
    if (img) {
      doc.addImage(img, 'PNG', 38, 12, 24, 15);
    } else {
      // Elegant typographic fallback logo
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129);
      doc.text("E&C", 50, 20, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("ECHEVERRIA & CO.", 50, 25, { align: 'center' });
    }

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("CUPÓN DE COMPENSACIÓN", 50, 34, { align: 'center' });

    // Decorative divider line
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(1);
    doc.line(15, 38, 85, 38);

    // 4. Details
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("CÓDIGO DEL CUPÓN", 50, 44, { align: 'center' });

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(220, 38, 38); // Brand Red
    doc.text(coupon.code, 50, 51, { align: 'center' });

    // Customer
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("CLIENTE:", 15, 60);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(coupon.customerName || "Cliente General", 35, 60);

    // Dates
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("EMISIÓN:", 15, 67);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(new Date(coupon.createdAt || Date.now()).toLocaleDateString('es-CL'), 35, 67);

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("VALIDEZ:", 15, 74);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    const validStr = new Date(coupon.validUntil).toLocaleDateString('es-CL');
    doc.text(validStr, 35, 74);

    // 5. Value container (Pristine rounded emerald badge)
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.roundedRect(15, 80, 70, 18, 2, 2, 'F');

    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "normal");
    doc.text("VALOR DE COMPENSACIÓN", 50, 85, { align: 'center' });

    doc.setFontSize(15);
    doc.setFont("Helvetica", "bold");
    doc.text(`CLP $${coupon.value.toLocaleString('es-CL')}`, 50, 93, { align: 'center' });

    // Admin authorization indicator
    if (coupon.authorizedBy) {
      doc.setFontSize(7.5);
      doc.setTextColor(13, 148, 136); // teal-600
      doc.setFont("Helvetica", "bold");
      doc.text(`Canje Autorizado por Admin: ${coupon.authorizedBy}`, 50, 103, { align: 'center' });
    } else {
      // Dotted Perforated Line
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.line(10, 110, 90, 110);
      doc.setLineDashPattern([], 0); // Reset dash
    }

    // 6. Realistic Barcode inside ticket stub
    doc.setFillColor(15, 23, 42); // slate-900
    const startX = 22;
    const barcodeY = 116;
    const barcodeHeight = 12;
    const barcodeLines = [1, 2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 1, 3, 1, 2, 2, 4, 1, 1, 3, 1, 2];
    let currentX = startX;
    barcodeLines.forEach((width) => {
      doc.rect(currentX, barcodeY, width * 0.8, barcodeHeight, 'F');
      currentX += width * 0.8 + 0.9;
    });

    doc.setFont("Helvetica", "bolditalic");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`¡Gracias por preferir Echeverria & Co.!`, 50, 135, { align: 'center' });

    doc.save(`cupon_${coupon.code}.pdf`);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-wider text-slate-900 flex items-center gap-3">
            <Ticket className="text-emerald-500" size={32} />
            Post-Venta y Cupones
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gestión de compensaciones de clientes y canje de cupones con niveles de autorización.</p>
        </div>
      </div>
      
      {/* Form and Quick Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Generar Compensación Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
            <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
              <Plus size={20} />
            </div>
            <h2 className="font-bold text-lg text-slate-800">Nueva Compensación</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre del Cliente</label>
              <input 
                type="text" 
                placeholder="Ej. María González" 
                value={customerName} 
                onChange={e => setCustomerName(e.target.value)} 
                className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monto CLP ($)</label>
              <input 
                type="number" 
                placeholder="Ej. 15000" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Días de Validez</label>
              <input 
                type="number" 
                placeholder="Por defecto 30" 
                value={validDays} 
                onChange={e => setValidDays(e.target.value)} 
                className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              onClick={handleGenerate} 
              disabled={!amount || !customerName}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all"
            >
              <Plus size={18} /> Generar Cupón
            </button>
          </div>
        </div>

        {/* Canje Rápido de Cupón */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
              <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
                <Ticket size={20} />
              </div>
              <h2 className="font-bold text-lg text-slate-800">Canje Rápido de Cupón</h2>
            </div>
            <p className="text-xs text-slate-500 mt-2">Ingrese el código único impreso en el cupón para verificarlo y cambiar su estado.</p>
          </div>

          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Ej. CP-K6HJ2S" 
              value={redeemCode} 
              onChange={e => setRedeemCode(e.target.value)} 
              className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm text-center font-mono font-bold tracking-widest focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all uppercase placeholder:normal-case placeholder:font-sans placeholder:tracking-normal"
            />
            
            <button 
              onClick={handleRedeemByCode} 
              disabled={!redeemCode}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 active:scale-[0.98] transition-all"
            >
              Canjear Cupón
            </button>
          </div>
        </div>
      </div>
      
      {/* List of Coupon History */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* List Header and Controls */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="font-bold text-lg text-slate-800">Historial de Cupones Emitidos</h2>
            <p className="text-xs text-slate-500">Visualiza, descarga y administra las compensaciones activas y canjeadas.</p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar cliente o código..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-transparent rounded-2xl text-sm w-full md:w-64 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none"
              />
            </div>
            
            <div className="relative min-w-[160px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <select 
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as any)}
                className="pl-9 pr-8 py-2 bg-slate-50 border border-transparent rounded-2xl text-sm w-full appearance-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none cursor-pointer font-medium"
              >
                <option value="newest">Más recientes</option>
                <option value="oldest">Más antiguos</option>
              </select>
              <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
            </div>
          </div>
        </div>

        {/* Coupon Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 uppercase text-[10px] font-bold text-slate-400 tracking-wider">Fecha</th>
                <th className="p-4 uppercase text-[10px] font-bold text-slate-400 tracking-wider">Código</th>
                <th className="p-4 uppercase text-[10px] font-bold text-slate-400 tracking-wider">Cliente</th>
                <th className="p-4 uppercase text-[10px] font-bold text-slate-400 tracking-wider">Valor</th>
                <th className="p-4 uppercase text-[10px] font-bold text-slate-400 tracking-wider">Vence el</th>
                <th className="p-4 uppercase text-[10px] font-bold text-slate-400 tracking-wider">Estado</th>
                <th className="p-4 uppercase text-[10px] font-bold text-slate-400 tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedCoupons.length > 0 ? (
                filteredAndSortedCoupons.map(c => {
                  const expired = isExpired(c);
                  return (
                    <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 text-xs text-slate-500 font-medium">
                        {new Date(c.createdAt || "").toLocaleDateString('es-CL')}
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-700 tracking-wider">{c.code}</td>
                      <td className="p-4 text-slate-600 font-medium">{c.customerName || "Cliente General"}</td>
                      <td className="p-4 font-black text-emerald-600">
                        ${c.value?.toLocaleString('es-CL')}
                      </td>
                      <td className="p-4 text-xs font-medium">
                        <span className={expired && !c.used ? 'text-red-500 font-bold' : 'text-slate-500'}>
                          {new Date(c.validUntil).toLocaleDateString('es-CL')}
                        </span>
                      </td>
                      <td className="p-4">
                        {c.used ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-400 w-fit">
                              Canjeado
                            </span>
                            {c.authorizedBy && (
                              <span className="text-[9px] text-teal-600 font-medium mt-0.5">
                                Autorizado por: {c.authorizedBy}
                              </span>
                            )}
                          </div>
                        ) : expired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-600 w-fit">
                            <ShieldAlert size={10} /> Expirado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-600 w-fit">
                            Disponible
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-1 justify-end items-center">
                          <button 
                            onClick={() => setSelectedPreviewCoupon(c)} 
                            title="Previsualizar cupón"
                            className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition-colors"
                          >
                            <Eye size={16}/>
                          </button>
                          
                          <button 
                            onClick={() => downloadPDFEnhanced(c)} 
                            title="Descargar PDF"
                            className="p-2 hover:bg-emerald-50 text-emerald-500 rounded-xl transition-colors"
                          >
                            <Download size={16}/>
                          </button>
                          
                          {!c.used && (
                            <button 
                              onClick={() => handleRedeem(c)} 
                              className={`ml-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                expired 
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 hover:border-amber-300' 
                                  : 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent'
                              }`}
                            >
                              Canjear
                            </button>
                          )}
                          
                          {isAdmin && (
                            <button 
                              onClick={() => {
                                if(confirm("¿Estás seguro de eliminar permanentemente este cupón del registro?")) deleteCoupon(c.id);
                              }} 
                              className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-colors ml-1"
                              title="Eliminar"
                            >
                              <AlertCircle size={16}/>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Constantemente auditando cupones... No se encontraron registros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STUNNING INTERACTIVE VISUAL COUPON MODAL PREVIEW */}
      {selectedPreviewCoupon && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-3 border border-slate-100 max-w-2xl w-full animate-in fade-in duration-200">
            
            {/* Notch Left */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 rounded-full bg-slate-950 z-10 hidden md:block"></div>
            {/* Notch Right */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 w-6 h-6 rounded-full bg-slate-950 z-10 hidden md:block"></div>

            {/* Main ticket body (Col 2) */}
            <div className="md:col-span-2 p-8 space-y-6 flex flex-col justify-between">
              
              {/* Close Button top corner */}
              <button 
                onClick={() => setSelectedPreviewCoupon(null)}
                className="absolute top-4 left-4 p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="space-y-4 pt-4">
                {/* Brand Header */}
                <div className="flex items-center gap-3">
                  <img 
                    src={LOGO_URL} 
                    alt="Logo" 
                    referrerPolicy="no-referrer"
                    className="h-10 object-contain"
                    onError={(e) => {
                      (e.target as any).style.display = 'none';
                    }}
                  />
                  <div>
                    <h3 className="font-black text-slate-800 tracking-tight text-sm">ECHEVERRIA & CO.</h3>
                    <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Post-Venta Compensaciones</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Cupón de Compensación</p>
                  
                  {/* Coupon Code copy trigger */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xl font-black text-slate-800 tracking-wider">
                      {selectedPreviewCoupon.code}
                    </span>
                    <button 
                      onClick={() => handleCopyCode(selectedPreviewCoupon.code)}
                      className="p-1 px-2 text-slate-400 hover:text-emerald-500 bg-slate-50 hover:bg-emerald-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                      title="Copiar código"
                    >
                      {copiedCodeCode === selectedPreviewCoupon.code ? <Check size={12} className="text-emerald-500" /> : <Clipboard size={12} />}
                      {copiedCodeCode === selectedPreviewCoupon.code ? '¡Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>

                {/* Cliente / Datos */}
                <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Cliente</p>
                    <p className="font-bold text-slate-700 mt-0.5">{selectedPreviewCoupon.customerName || "Cliente General"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Emisión</p>
                    <p className="font-bold text-slate-700 mt-0.5">{new Date(selectedPreviewCoupon.createdAt || Date.now()).toLocaleDateString('es-CL')}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons inside footer */}
              <div className="flex gap-2 pt-4">
                <button 
                  onClick={() => downloadPDFEnhanced(selectedPreviewCoupon)}
                  className="flex-1 py-2.5 px-4 bg-slate-900 border border-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-xs shadow hover:bg-slate-800 active:scale-95 transition-all"
                >
                  <Download size={14} /> Descargar PDF
                </button>
                
                {!selectedPreviewCoupon.used && (
                  <button 
                    onClick={() => handleRedeem(selectedPreviewCoupon)}
                    className="flex-1 py-2.5 px-4 bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-xs shadow shadow-emerald-500/10 hover:bg-emerald-600 active:scale-95 transition-all"
                  >
                    Canjear Ahora
                  </button>
                )}
              </div>
            </div>

            {/* Ticket stub (Col 1) */}
            <div className="md:col-span-1 p-8 bg-slate-50 flex flex-col justify-between items-center text-center relative border-t md:border-t-0 md:border-l border-dashed border-slate-200">
              
              <div className="space-y-4 w-full">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">Valor Cupón</p>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-600">CLP</p>
                  <p className="text-xl font-black text-emerald-700">${selectedPreviewCoupon.value.toLocaleString('es-CL')}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Vencimiento</p>
                  <p className="text-xs font-bold text-slate-700">{new Date(selectedPreviewCoupon.validUntil).toLocaleDateString('es-CL')}</p>
                </div>

                <div className="pt-2">
                  {selectedPreviewCoupon.used ? (
                    <div className="flex flex-col items-center justify-center">
                      <CheckCircle2 className="text-slate-400 mb-1" size={20} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Canjeado</span>
                      {selectedPreviewCoupon.authorizedBy && (
                        <p className="text-[9px] text-teal-600 font-bold mt-1 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                          Autorizado por:<br />{selectedPreviewCoupon.authorizedBy}
                        </p>
                      )}
                    </div>
                  ) : isExpired(selectedPreviewCoupon) ? (
                    <div className="flex flex-col items-center justify-center bg-red-50 p-2.5 rounded-2xl border border-red-100">
                      <ShieldAlert className="text-red-500 mb-1 animate-pulse" size={20} />
                      <span className="text-[10px] font-bold text-red-600 uppercase">Expirado</span>
                      <p className="text-[8px] text-red-500/80 mt-1 leading-normal">Requiere firma de administrador para ser canjeado.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center bg-emerald-50/50 p-2.5 rounded-2xl border border-emerald-100/30">
                      <CheckCircle2 className="text-emerald-500 mb-1" size={20} />
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">Firma Válida</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Realistic CSS Barcode in visual ticket */}
              <div className="w-full mt-4 space-y-1">
                <div className="flex gap-[1.5px] justify-center items-center h-10 w-full bg-white p-1.5 rounded border border-slate-200">
                  {[1, 2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 1, 3, 1, 2, 2, 4, 1, 1, 3, 1, 2].map((width, idx) => (
                    <div 
                      key={idx} 
                      className="bg-slate-900 h-7" 
                      style={{ width: `${width * 1.5}px` }}
                    />
                  ))}
                </div>
                <p className="text-[8px] font-mono text-slate-400 tracking-wider font-semibold uppercase">{selectedPreviewCoupon.code}</p>
              </div>

              {/* Bottom circle notch for mobile only */}
              <div className="absolute left-1/2 -bottom-3 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-950 z-10 block md:hidden"></div>
            </div>

          </div>
        </div>
      )}

      {/* SECURITY ACCESS CONTROL: ADMIN OVERRIDE PIN PASSWORD MODAL */}
      {authModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <form 
            onSubmit={handleAuthSubmit}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl max-w-sm w-full space-y-6 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
              <div className="p-2.5 bg-amber-50 text-amber-500 rounded-2xl">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Autorización Requerida</h3>
                <p className="text-xs text-slate-400 font-medium">El cupón {authModal.couponCode} ha expirado.</p>
              </div>
            </div>

            {authModal.error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs font-bold leading-relaxed rounded-2xl border border-red-100 flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{authModal.error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Perfil de Administrador</label>
                <select 
                  value={authModal.selectedAdminId}
                  onChange={e => setAuthModal(prev => ({ ...prev, selectedAdminId: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none cursor-pointer font-bold text-slate-700"
                >
                  {admins.map(admin => (
                    <option key={admin.id} value={admin.id}>
                      {admin.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">PIN de Autorización</label>
                <input 
                  type="password" 
                  placeholder="••••" 
                  maxLength={4}
                  value={authModal.pin}
                  onChange={e => setAuthModal(prev => ({ ...prev, pin: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-center tracking-[1em] focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setAuthModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-2xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              
              <button 
                type="submit"
                disabled={authModal.pin.length < 4}
                className="flex-1 py-3 bg-emerald-500 shadow-md shadow-emerald-500/10 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <ShieldCheck size={14} /> Autorizar
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
