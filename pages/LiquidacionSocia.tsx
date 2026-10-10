import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Printer, 
  Receipt, 
  Clock, 
  Search, 
  AlertTriangle, 
  Edit3, 
  Save, 
  X, 
  ArrowUpRight, 
  History, 
  FileText, 
  User, 
  Trash2,
  ExternalLink,
  ShieldCheck,
  Package
} from 'lucide-react';
import { useStore } from '../store/GlobalContext';
import { StockItem, Sale, PartnerSettlement, getItemDepartamento, BRAND_NAME, COMPANY_NAME, LOGO_URL } from '../types';

// Helper to safely parse any date string format (YYYY-MM-DD or DD/MM/YYYY)
function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const datePart = dateStr.split('T')[0].split(' ')[0];
  const parts = datePart.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  const slashParts = datePart.split('/');
  if (slashParts.length === 3) {
    if (slashParts[0].length === 4) {
      return new Date(parseInt(slashParts[0], 10), parseInt(slashParts[1], 10) - 1, parseInt(slashParts[2], 10));
    } else {
      return new Date(parseInt(slashParts[2], 10), parseInt(slashParts[1], 10) - 1, parseInt(slashParts[0], 10));
    }
  }
  return new Date(dateStr);
}

function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

// Get the Saturday that closes the week for a given date
function getSaturdayOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 is Sunday, 6 is Saturday
  const diff = day === 6 ? 0 : 6 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

// Generate the last 12 Saturday cutoff cycles
interface WeekOption {
  id: string;
  label: string;
  startDate: string; // YYYY-MM-DD (Sunday or Monday)
  endDate: string; // YYYY-MM-DD (Saturday)
  saturdayDate: Date;
  isCurrent: boolean;
}

function generateSaturdayCycles(referenceDate: Date = new Date()): WeekOption[] {
  const options: WeekOption[] = [];
  const currentSaturday = getSaturdayOfWeek(referenceDate);

  for (let i = 0; i < 12; i++) {
    const sat = new Date(currentSaturday);
    sat.setDate(sat.getDate() - (i * 7));

    // The cycle starts on the previous Sunday (6 days before Saturday) or Monday
    const start = new Date(sat);
    start.setDate(start.getDate() - 6);

    const startISO = formatDateISO(start);
    const endISO = formatDateISO(sat);

    const isCurrent = i === 0;
    const label = isCurrent 
      ? `Semana Actual (Corte: Sáb ${sat.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })})`
      : `Semana: ${start.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })} – Sáb ${sat.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}`;

    options.push({
      id: `${startISO}_${endISO}`,
      label,
      startDate: startISO,
      endDate: endISO,
      saturdayDate: sat,
      isCurrent
    });
  }

  return options;
}

export default function LiquidacionSocia() {
  const { 
    sales, 
    stock, 
    currentUser, 
    updateStockItem, 
    partnerSettlements, 
    addPartnerSettlement, 
    deletePartnerSettlement, 
    playSound 
  } = useStore();

  const saturdayCycles = useMemo(() => generateSaturdayCycles(), []);
  
  // Selection state
  const [selectedCycleId, setSelectedCycleId] = useState<string>(saturdayCycles[0]?.id || 'custom');
  const [customRange, setCustomRange] = useState({
    startDate: saturdayCycles[0]?.startDate || formatDateISO(new Date()),
    endDate: saturdayCycles[0]?.endDate || formatDateISO(new Date())
  });
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Active dates
  const activeStartDate = isCustomMode ? customRange.startDate : (saturdayCycles.find(c => c.id === selectedCycleId)?.startDate || customRange.startDate);
  const activeEndDate = isCustomMode ? customRange.endDate : (saturdayCycles.find(c => c.id === selectedCycleId)?.endDate || customRange.endDate);

  // Tabs
  const [activeTab, setActiveTab] = useState<'RESUMEN_PRODUCTOS' | 'DETALLE_VENTAS' | 'HISTORIAL_PAGOS'>('RESUMEN_PRODUCTOS');
  const [searchTerm, setSearchTerm] = useState('');

  // Cost editing modal / state
  const [editingCostItem, setEditingCostItem] = useState<{ id: string; codigo: string; nombre: string; precioCosto: number } | null>(null);
  const [newCostValue, setNewCostValue] = useState<number>(0);
  const [isSavingCost, setIsSavingCost] = useState(false);

  // Payment registration modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    sociaNombre: 'Socia Compras Belleza',
    metodoPago: 'Transferencia Bancaria',
    comprobanteReferencia: '',
    observaciones: '',
    fechaPago: formatDateISO(new Date())
  });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Print voucher modal
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printSettlementData, setPrintSettlementData] = useState<any>(null);

  // Identify beauty and makeup items accurately
  const checkIsBeautyItem = (code: string, desc: string = '') => {
    const cleanCode = (code || '').trim().toUpperCase();
    const stockItem = stock.find(s => s.codigo.trim().toUpperCase() === cleanCode);
    
    if (stockItem) {
      const isBeauty = stockItem.departamento === 'BELLEZA' || getItemDepartamento(stockItem) === 'BELLEZA';
      return {
        isBeauty,
        stockItem,
        costo: Number(stockItem.precioCosto) || 0,
        nombre: stockItem.tipo || cleanCode
      };
    }

    const isBeautyByHeuristic = getItemDepartamento({
      codigo: cleanCode,
      tipo: desc
    }) === 'BELLEZA';

    return {
      isBeauty: isBeautyByHeuristic,
      stockItem: undefined,
      costo: 0,
      nombre: desc || cleanCode
    };
  };

  // Filter sales and extract beauty line items in the active period
  const processedData = useMemo(() => {
    const start = parseLocalDate(activeStartDate);
    start.setHours(0, 0, 0, 0);
    const end = parseLocalDate(activeEndDate);
    end.setHours(23, 59, 59, 999);

    let totalVentasBeauty = 0;
    let totalCostoSocia = 0;
    let totalUnidadesBeauty = 0;
    let salesCount = 0;

    // Line items detail
    interface BeautySaleRecord {
      saleId: string;
      numeroVenta: number;
      fecha: string;
      hora: string;
      cliente: string;
      telefono: string;
      vendedor: string;
      estadoPago: string;
      codigo: string;
      nombre: string;
      cantidad: number;
      costoUnitario: number;
      subtotalCosto: number;
      precioVenta: number;
      subtotalVenta: number;
      utilidad: number;
      stockItem?: StockItem;
    }

    const lineItems: BeautySaleRecord[] = [];
    const productAggregation: Record<string, {
      codigo: string;
      nombre: string;
      proveedor: string;
      subcategoria: string;
      cantidad: number;
      costoUnitario: number;
      totalCosto: number;
      precioVentaPromedio: number;
      totalVenta: number;
      utilidad: number;
      stockItem?: StockItem;
    }> = {};

    sales.forEach(sale => {
      // Exclude annulled sales
      if (sale.anulada) return;

      const saleDate = parseLocalDate(sale.fecha || sale.timestamp || '');
      if (isNaN(saleDate.getTime())) return;
      if (saleDate < start || saleDate > end) return;

      let saleHasBeauty = false;

      // Check if sale has items array or top-level item
      if (Array.isArray(sale.items) && sale.items.length > 0) {
        sale.items.forEach(item => {
          const itemCode = (item.codigoFardo || '').trim();
          const info = checkIsBeautyItem(itemCode, '');
          if (info.isBeauty) {
            saleHasBeauty = true;
            const cant = Number(item.cantidad) || 1;
            const costoUnit = info.costo;
            const precioVenta = Number(item.valorUnitario) || 0;
            const subtotalCosto = cant * costoUnit;
            const subtotalVenta = cant * precioVenta;
            const utilidad = subtotalVenta - subtotalCosto;

            totalVentasBeauty += subtotalVenta;
            totalCostoSocia += subtotalCosto;
            totalUnidadesBeauty += cant;

            lineItems.push({
              saleId: sale.id,
              numeroVenta: sale.numeroVenta,
              fecha: sale.fecha,
              hora: sale.hora || '',
              cliente: sale.cliente,
              telefono: sale.telefono,
              vendedor: sale.vendedor,
              estadoPago: sale.estadoPago,
              codigo: itemCode,
              nombre: info.nombre,
              cantidad: cant,
              costoUnitario: costoUnit,
              subtotalCosto,
              precioVenta,
              subtotalVenta,
              utilidad,
              stockItem: info.stockItem
            });

            // Aggregate by product
            const key = itemCode.toUpperCase();
            if (!productAggregation[key]) {
              productAggregation[key] = {
                codigo: itemCode,
                nombre: info.nombre,
                proveedor: info.stockItem?.proveedor || 'No especificado',
                subcategoria: info.stockItem?.subcategoria || 'Belleza',
                cantidad: 0,
                costoUnitario: costoUnit,
                totalCosto: 0,
                precioVentaPromedio: precioVenta,
                totalVenta: 0,
                utilidad: 0,
                stockItem: info.stockItem
              };
            }
            productAggregation[key].cantidad += cant;
            productAggregation[key].totalCosto += subtotalCosto;
            productAggregation[key].totalVenta += subtotalVenta;
            productAggregation[key].utilidad += utilidad;
          }
        });
      } else if (sale.codigoFardo) {
        const itemCode = (sale.codigoFardo || '').trim();
        const info = checkIsBeautyItem(itemCode, sale.variante || '');
        if (info.isBeauty) {
          saleHasBeauty = true;
          const cant = Number(sale.cantidad) || 1;
          const costoUnit = info.costo;
          const precioVenta = Number(sale.valorUnitario) || (Number(sale.total) / cant) || 0;
          const subtotalCosto = cant * costoUnit;
          const subtotalVenta = Number(sale.total) || (cant * precioVenta);
          const utilidad = subtotalVenta - subtotalCosto;

          totalVentasBeauty += subtotalVenta;
          totalCostoSocia += subtotalCosto;
          totalUnidadesBeauty += cant;

          lineItems.push({
            saleId: sale.id,
            numeroVenta: sale.numeroVenta,
            fecha: sale.fecha,
            hora: sale.hora || '',
            cliente: sale.cliente,
            telefono: sale.telefono,
            vendedor: sale.vendedor,
            estadoPago: sale.estadoPago,
            codigo: itemCode,
            nombre: info.nombre,
            cantidad: cant,
            costoUnitario: costoUnit,
            subtotalCosto,
            precioVenta,
            subtotalVenta,
            utilidad,
            stockItem: info.stockItem
          });

          const key = itemCode.toUpperCase();
          if (!productAggregation[key]) {
            productAggregation[key] = {
              codigo: itemCode,
              nombre: info.nombre,
              proveedor: info.stockItem?.proveedor || 'No especificado',
              subcategoria: info.stockItem?.subcategoria || 'Belleza',
              cantidad: 0,
              costoUnitario: costoUnit,
              totalCosto: 0,
              precioVentaPromedio: precioVenta,
              totalVenta: 0,
              utilidad: 0,
              stockItem: info.stockItem
            };
          }
          productAggregation[key].cantidad += cant;
          productAggregation[key].totalCosto += subtotalCosto;
          productAggregation[key].totalVenta += subtotalVenta;
          productAggregation[key].utilidad += utilidad;
        }
      }

      if (saleHasBeauty) {
        salesCount++;
      }
    });

    const utilidadNeta = totalVentasBeauty - totalCostoSocia;
    const margenPct = totalVentasBeauty > 0 ? (utilidadNeta / totalVentasBeauty) * 100 : 0;
    const productsList = Object.values(productAggregation).sort((a, b) => b.totalVenta - a.totalVenta);

    // Products with 0 cost that need attention
    const zeroCostProducts = productsList.filter(p => p.costoUnitario === 0);

    return {
      totalVentasBeauty,
      totalCostoSocia,
      utilidadNeta,
      margenPct,
      totalUnidadesBeauty,
      salesCount,
      lineItems,
      productsList,
      zeroCostProducts
    };
  }, [sales, stock, activeStartDate, activeEndDate]);

  // Check if current cycle was already marked as paid
  const existingSettlement = useMemo(() => {
    return partnerSettlements.find(s => s.fechaInicio === activeStartDate && s.fechaFin === activeEndDate);
  }, [partnerSettlements, activeStartDate, activeEndDate]);

  // Handle saving cost directly in inventory
  const handleSaveCost = async () => {
    if (!editingCostItem) return;
    setIsSavingCost(true);
    try {
      await updateStockItem(editingCostItem.id, {
        precioCosto: Number(newCostValue) || 0
      });
      playSound('success');
      setEditingCostItem(null);
    } catch (e: any) {
      alert("Error al actualizar precio de costo: " + (e.message || e));
    } finally {
      setIsSavingCost(false);
    }
  };

  // Handle register payment to partner
  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (processedData.totalCostoSocia <= 0) {
      alert("⚠️ El monto total a pagar a la socia es $0. No hay costo que liquidar en este periodo.");
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const periodoLabel = `Semana del ${formatDisplayDate(activeStartDate)} al ${formatDisplayDate(activeEndDate)}`;
      await addPartnerSettlement({
        fechaPago: paymentForm.fechaPago,
        periodo: periodoLabel,
        fechaInicio: activeStartDate,
        fechaFin: activeEndDate,
        totalCosto: processedData.totalCostoSocia,
        totalVentas: processedData.totalVentasBeauty,
        utilidad: processedData.utilidadNeta,
        cantidadUnidades: processedData.totalUnidadesBeauty,
        cantidadVentas: processedData.salesCount,
        metodoPago: paymentForm.metodoPago,
        comprobanteReferencia: paymentForm.comprobanteReferencia,
        observaciones: paymentForm.observaciones,
        sociaNombre: paymentForm.sociaNombre,
        estado: 'PAGADO',
        creadoPor: currentUser?.nombre || 'Administrador',
        creadoEn: new Date().toISOString(),
        itemsResumen: processedData.productsList.map(p => ({
          codigo: p.codigo,
          nombre: p.nombre,
          cantidad: p.cantidad,
          costoUnitario: p.costoUnitario,
          totalCosto: p.totalCosto,
          precioVentaUnitario: p.precioVentaPromedio,
          totalVenta: p.totalVenta,
          utilidad: p.utilidad
        }))
      });

      setShowPaymentModal(false);
      setActiveTab('HISTORIAL_PAGOS');
    } catch (e: any) {
      alert("Error al guardar la liquidación: " + (e.message || e));
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleDeleteSettlement = async (id: string) => {
    if (confirm("⚠️ ¿Estás seguro de eliminar este registro de liquidación? Podrás volver a generarlo cuando lo necesites.")) {
      await deletePartnerSettlement(id);
    }
  };

  const handleOpenPrintCurrent = () => {
    setPrintSettlementData({
      fechaPago: activeEndDate,
      periodo: `Semana del ${formatDisplayDate(activeStartDate)} al ${formatDisplayDate(activeEndDate)}`,
      fechaInicio: activeStartDate,
      fechaFin: activeEndDate,
      totalCosto: processedData.totalCostoSocia,
      totalVentas: processedData.totalVentasBeauty,
      utilidad: processedData.utilidadNeta,
      cantidadUnidades: processedData.totalUnidadesBeauty,
      cantidadVentas: processedData.salesCount,
      metodoPago: existingSettlement?.metodoPago || 'Transferencia Bancaria',
      sociaNombre: existingSettlement?.sociaNombre || 'Socia Compras Belleza',
      itemsResumen: processedData.productsList
    });
    setShowPrintModal(true);
  };

  const handleOpenPrintHistory = (settlement: PartnerSettlement) => {
    setPrintSettlementData(settlement);
    setShowPrintModal(true);
  };

  // Filtered products list by search
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return processedData.productsList;
    const term = searchTerm.toLowerCase();
    return processedData.productsList.filter(p => 
      p.codigo.toLowerCase().includes(term) ||
      p.nombre.toLowerCase().includes(term) ||
      p.proveedor.toLowerCase().includes(term)
    );
  }, [processedData.productsList, searchTerm]);

  // Filtered sales items list by search
  const filteredLineItems = useMemo(() => {
    if (!searchTerm) return processedData.lineItems;
    const term = searchTerm.toLowerCase();
    return processedData.lineItems.filter(item => 
      item.codigo.toLowerCase().includes(term) ||
      item.nombre.toLowerCase().includes(term) ||
      item.cliente.toLowerCase().includes(term) ||
      item.numeroVenta.toString().includes(term) ||
      item.vendedor.toLowerCase().includes(term)
    );
  }, [processedData.lineItems, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Top Banner / Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-rose-200">
              <Sparkles size={12} className="text-rose-500" />
              Módulo Exclusivo: Belleza y Maquillaje
            </span>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black uppercase tracking-wider">
              Liquidación Semanal (Cortes Sábados)
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase">
            Liquidación Semanal Socia
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Calcula el total a pagar según <span className="font-bold text-slate-700">precio de costo</span> por las ventas de la semana y obtén tu <span className="font-bold text-emerald-600">utilidad neta</span> generada.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenPrintCurrent}
            className="flex items-center gap-2 px-5 py-3 bg-white text-slate-700 hover:text-slate-900 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            title="Imprimir o exportar comprobante de la liquidación semanal para tu socia"
          >
            <Printer size={16} className="text-slate-500" />
            Imprimir Liquidación
          </button>

          <button
            onClick={() => {
              playSound('click');
              setShowPaymentModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <CheckCircle2 size={16} />
            {existingSettlement ? 'Registrar Otro Pago' : 'Registrar Pago a Socia'}
          </button>
        </div>
      </div>

      {/* Week Selector / Cutoff Controls */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-emerald-600 flex-shrink-0" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Periodo de Liquidación:
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              {formatDisplayDate(activeStartDate)} — {formatDisplayDate(activeEndDate)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCustomMode(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                !isCustomMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cortes de Sábado
            </button>
            <button
              onClick={() => setIsCustomMode(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                isCustomMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Rango Personalizado
            </button>
          </div>
        </div>

        {!isCustomMode ? (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            {saturdayCycles.slice(0, 6).map((cycle) => {
              const isSelected = selectedCycleId === cycle.id;
              const hasSettlement = partnerSettlements.some(s => s.fechaInicio === cycle.startDate && s.fechaFin === cycle.endDate);

              return (
                <button
                  key={cycle.id}
                  onClick={() => {
                    playSound('click');
                    setSelectedCycleId(cycle.id);
                  }}
                  className={`relative px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                    isSelected 
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{cycle.label}</span>
                  {hasSettlement && (
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} title="Semana ya liquidada / pagada" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Desde:</label>
              <input
                type="date"
                value={customRange.startDate}
                onChange={(e) => setCustomRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Hasta (Sábado):</label>
              <input
                type="date"
                value={customRange.endDate}
                onChange={(e) => setCustomRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
            </div>
          </div>
        )}

        {/* Existing Settlement Banner */}
        {existingSettlement && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2 font-bold">
              <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0" />
              <span>Esta semana ya fue liquidada el {formatDisplayDate(existingSettlement.fechaPago)} por ${existingSettlement.totalCosto.toLocaleString('es-CL')} ({existingSettlement.metodoPago}).</span>
            </div>
            <button
              onClick={() => handleOpenPrintHistory(existingSettlement)}
              className="text-emerald-700 hover:text-emerald-900 underline font-black uppercase text-[11px]"
            >
              Ver Comprobante
            </button>
          </div>
        )}
      </div>

      {/* Warning for 0 cost products */}
      {processedData.zeroCostProducts.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">
                Atención: Hay {processedData.zeroCostProducts.length} producto(s) de belleza vendidos con Costo $0 en inventario
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Para que el cálculo de pago a tu socia y tu ganancia sean 100% exactos, asigna el precio de costo a: {processedData.zeroCostProducts.map(p => p.codigo).join(', ')}.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const first = processedData.zeroCostProducts[0];
              if (first && first.stockItem) {
                setEditingCostItem({
                  id: first.stockItem.id,
                  codigo: first.codigo,
                  nombre: first.nombre,
                  precioCosto: first.costoUnitario
                });
                setNewCostValue(first.costoUnitario);
              }
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all self-start md:self-auto flex-shrink-0 shadow-sm"
          >
            Asignar Costos Ahora
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Cost to Pay Partner */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              A Pagar a Socia (Costo)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center">
              <Wallet size={20} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black tracking-tight text-white">
              ${processedData.totalCostoSocia.toLocaleString('es-CL')}
            </h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase">
              Reposición según precio costo
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-rose-300">
            <span>Transferir este Sábado</span>
            <span>{processedData.totalUnidadesBeauty} un. vendidas</span>
          </div>
        </div>

        {/* Total Beauty Sales (Revenue) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Ventas Totales Belleza
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black tracking-tight text-slate-900">
              ${processedData.totalVentasBeauty.toLocaleString('es-CL')}
            </h3>
            <p className="text-[11px] font-bold text-slate-500 uppercase">
              Ingresos brutos por cosmética
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
            <span>En {processedData.salesCount} boletas/ventas</span>
            <span className="text-indigo-600">Periodo activo</span>
          </div>
        </div>

        {/* User Profit (Utility) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Tu Utilidad Neta
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className={`text-3xl font-black tracking-tight ${processedData.utilidadNeta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              ${processedData.utilidadNeta.toLocaleString('es-CL')}
            </h3>
            <p className="text-[11px] font-bold text-slate-500 uppercase">
              Ventas menos costo a socia
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
            <span className="text-slate-500">Margen Semanal</span>
            <span className="font-extrabold text-emerald-600">{processedData.margenPct.toFixed(1)}%</span>
          </div>
        </div>

        {/* Units & Volume */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Unidades de Belleza
            </span>
            <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <Package size={20} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black tracking-tight text-slate-900">
              {processedData.totalUnidadesBeauty}
            </h3>
            <p className="text-[11px] font-bold text-slate-500 uppercase">
              Artículos despachados
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
            <span>{processedData.productsList.length} productos distintos</span>
            <span className="text-pink-600 font-extrabold">Cosmética</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('RESUMEN_PRODUCTOS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'RESUMEN_PRODUCTOS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Package size={14} />
            Por Producto ({processedData.productsList.length})
          </button>
          <button
            onClick={() => setActiveTab('DETALLE_VENTAS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'DETALLE_VENTAS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText size={14} />
            Detalle por Venta ({processedData.lineItems.length})
          </button>
          <button
            onClick={() => setActiveTab('HISTORIAL_PAGOS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'HISTORIAL_PAGOS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <History size={14} />
            Historial Liquidaciones ({partnerSettlements.length})
          </button>
        </div>

        {activeTab !== 'HISTORIAL_PAGOS' && (
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código, producto o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold placeholder:text-slate-400 text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}
      </div>

      {/* TAB 1: Por Producto Consolidado */}
      {activeTab === 'RESUMEN_PRODUCTOS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <th className="py-4 px-6">Código</th>
                  <th className="py-4 px-6">Producto</th>
                  <th className="py-4 px-6">Marca / Proveedor</th>
                  <th className="py-4 px-6 text-center">Unidades</th>
                  <th className="py-4 px-6 text-right">Costo Unitario</th>
                  <th className="py-4 px-6 text-right text-rose-700 bg-rose-50/50">Total Costo (Socia)</th>
                  <th className="py-4 px-6 text-right">Precio Venta Prom.</th>
                  <th className="py-4 px-6 text-right">Total Venta</th>
                  <th className="py-4 px-6 text-right text-emerald-700 bg-emerald-50/50">Tu Utilidad</th>
                  <th className="py-4 px-6 text-center">Margen</th>
                  <th className="py-4 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Package size={32} className="text-slate-300" />
                        <p className="font-bold text-sm">No se encontraron ventas de belleza en este periodo</p>
                        <p className="text-xs">Selecciona otra semana o registra una venta con productos de cosmética/belleza.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const itemMargin = p.totalVenta > 0 ? (p.utilidad / p.totalVenta) * 100 : 0;
                    const isZeroCost = p.costoUnitario === 0;

                    return (
                      <tr key={p.codigo} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-mono font-black text-slate-900">{p.codigo}</td>
                        <td className="py-4 px-6">
                          <p className="font-bold text-slate-900 leading-snug">{p.nombre}</p>
                          <span className="text-[10px] text-slate-400 font-semibold">{p.subcategoria}</span>
                        </td>
                        <td className="py-4 px-6 text-slate-600 font-semibold">{p.proveedor}</td>
                        <td className="py-4 px-6 text-center font-black text-slate-900">{p.cantidad}</td>
                        <td className="py-4 px-6 text-right font-mono font-bold">
                          {isZeroCost ? (
                            <span className="text-amber-600 font-black flex items-center justify-end gap-1">
                              <AlertTriangle size={12} /> $0
                            </span>
                          ) : (
                            `$${p.costoUnitario.toLocaleString('es-CL')}`
                          )}
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-black text-rose-700 bg-rose-50/30">
                          ${p.totalCosto.toLocaleString('es-CL')}
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-slate-600">
                          ${Math.round(p.totalVenta / (p.cantidad || 1)).toLocaleString('es-CL')}
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-slate-900">
                          ${p.totalVenta.toLocaleString('es-CL')}
                        </td>
                        <td className={`py-4 px-6 text-right font-mono font-black bg-emerald-50/30 ${p.utilidad >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          ${p.utilidad.toLocaleString('es-CL')}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${itemMargin >= 30 ? 'bg-emerald-100 text-emerald-800' : itemMargin > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                            {itemMargin.toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {p.stockItem && (
                            <button
                              onClick={() => {
                                setEditingCostItem({
                                  id: p.stockItem!.id,
                                  codigo: p.codigo,
                                  nombre: p.nombre,
                                  precioCosto: p.costoUnitario
                                });
                                setNewCostValue(p.costoUnitario);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                              title="Editar precio de costo de este producto en inventario"
                            >
                              <Edit3 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredProducts.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-900 text-white font-black text-xs uppercase tracking-wider">
                    <td colSpan={3} className="py-4 px-6">TOTALES SEMANA</td>
                    <td className="py-4 px-6 text-center">{processedData.totalUnidadesBeauty} un.</td>
                    <td className="py-4 px-6 text-right">—</td>
                    <td className="py-4 px-6 text-right font-mono text-rose-300">
                      ${processedData.totalCostoSocia.toLocaleString('es-CL')}
                    </td>
                    <td className="py-4 px-6 text-right">—</td>
                    <td className="py-4 px-6 text-right font-mono">
                      ${processedData.totalVentasBeauty.toLocaleString('es-CL')}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-emerald-300">
                      ${processedData.utilidadNeta.toLocaleString('es-CL')}
                    </td>
                    <td className="py-4 px-6 text-center text-emerald-300">
                      {processedData.margenPct.toFixed(1)}%
                    </td>
                    <td className="py-4 px-6"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Detalle Venta por Venta */}
      {activeTab === 'DETALLE_VENTAS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <th className="py-4 px-6"># Venta</th>
                  <th className="py-4 px-6">Fecha</th>
                  <th className="py-4 px-6">Cliente</th>
                  <th className="py-4 px-6">Vendedor</th>
                  <th className="py-4 px-6">Producto Vendido</th>
                  <th className="py-4 px-6 text-center">Cant.</th>
                  <th className="py-4 px-6 text-right">Costo Unit.</th>
                  <th className="py-4 px-6 text-right text-rose-700 bg-rose-50/50">Costo Socia</th>
                  <th className="py-4 px-6 text-right">Precio Venta</th>
                  <th className="py-4 px-6 text-right">Total Venta</th>
                  <th className="py-4 px-6 text-right text-emerald-700 bg-emerald-50/50">Utilidad</th>
                  <th className="py-4 px-6 text-center">Estado Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredLineItems.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FileText size={32} className="text-slate-300" />
                        <p className="font-bold text-sm">No hay transacciones registradas</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLineItems.map((item, idx) => (
                    <tr key={`${item.saleId}_${item.codigo}_${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-mono font-black text-slate-900">#{item.numeroVenta}</td>
                      <td className="py-4 px-6 text-slate-600 font-semibold">{formatDisplayDate(item.fecha)}</td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-900 leading-tight">{item.cliente}</p>
                        {item.telefono && <p className="text-[10px] text-slate-400">{item.telefono}</p>}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-semibold">{item.vendedor}</td>
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-slate-900">{item.codigo}</span>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{item.nombre}</p>
                      </td>
                      <td className="py-4 px-6 text-center font-black text-slate-900">{item.cantidad}</td>
                      <td className="py-4 px-6 text-right font-mono">${item.costoUnitario.toLocaleString('es-CL')}</td>
                      <td className="py-4 px-6 text-right font-mono font-black text-rose-700 bg-rose-50/30">
                        ${item.subtotalCosto.toLocaleString('es-CL')}
                      </td>
                      <td className="py-4 px-6 text-right font-mono">${item.precioVenta.toLocaleString('es-CL')}</td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-slate-900">
                        ${item.subtotalVenta.toLocaleString('es-CL')}
                      </td>
                      <td className={`py-4 px-6 text-right font-mono font-black bg-emerald-50/30 ${item.utilidad >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        ${item.utilidad.toLocaleString('es-CL')}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                          item.estadoPago === 'Pagado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.estadoPago}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Historial de Liquidaciones Registradas */}
      {activeTab === 'HISTORIAL_PAGOS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Historial de Liquidaciones y Pagos Realizados
              </h3>
              <p className="text-xs text-slate-500">
                Registro de pagos semanales transferidos a la socia por compras de belleza y maquillaje.
              </p>
            </div>
          </div>

          {partnerSettlements.length === 0 ? (
            <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              <History size={36} className="text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-sm">Aún no se han registrado pagos en el sistema</p>
              <p className="text-xs mt-1">
                Cuando hagas una transferencia este sábado, presiona "Registrar Pago a Socia" para guardar el comprobante.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {partnerSettlements.map((s) => (
                <div key={s.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[9px] font-black uppercase tracking-wider">
                        {s.estado || 'PAGADO'}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 mt-2">{s.periodo}</h4>
                      <p className="text-[11px] text-slate-500">Pagado el: {formatDisplayDate(s.fechaPago)}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteSettlement(s.id)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-lg"
                      title="Eliminar registro"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Monto Transferido (Costo):</span>
                      <span className="text-base font-black text-rose-600 font-mono">
                        ${s.totalCosto.toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Ventas Totales:</span>
                      <span className="text-xs font-bold text-slate-800 font-mono">
                        ${s.totalVentas.toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline border-t border-slate-100 pt-1.5">
                      <span className="text-[10px] font-black text-emerald-700 uppercase">Utilidad Obtenida:</span>
                      <span className="text-xs font-black text-emerald-700 font-mono">
                        ${s.utilidad.toLocaleString('es-CL')}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1">
                    <p><span className="font-bold">Método:</span> {s.metodoPago}</p>
                    {s.comprobanteReferencia && <p><span className="font-bold">N° Comprobante:</span> {s.comprobanteReferencia}</p>}
                    {s.observaciones && <p className="italic text-slate-500">"{s.observaciones}"</p>}
                    <p className="text-[10px] text-slate-400 pt-1">Registrado por: {s.creadoPor}</p>
                  </div>

                  <button
                    onClick={() => handleOpenPrintHistory(s)}
                    className="w-full py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                  >
                    <Printer size={14} />
                    Imprimir Comprobante
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Editar Costo en Inventario */}
      {editingCostItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase">Actualizar Precio de Costo</h3>
              </div>
              <button onClick={() => setEditingCostItem(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-mono font-bold text-slate-500">{editingCostItem.codigo}</p>
                <p className="text-sm font-black text-slate-900">{editingCostItem.nombre}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Nuevo Precio de Costo ($CLP):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={newCostValue}
                    onChange={(e) => setNewCostValue(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Este costo se guardará permanentemente en el inventario y recalculará la liquidación en tiempo real.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingCostItem(null)}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSavingCost}
                onClick={handleSaveCost}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-600/20"
              >
                <Save size={16} />
                {isSavingCost ? 'Guardando...' : 'Guardar Costo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Registrar Pago a Socia */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wallet size={20} className="text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 uppercase">Registrar Liquidación Semanal a Socia</h3>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRegisterPayment} className="space-y-4">
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400">Total a Transferir a tu Socia:</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black font-mono text-emerald-400">
                    ${processedData.totalCostoSocia.toLocaleString('es-CL')}
                  </span>
                  <span className="text-xs text-slate-300 font-bold">
                    {processedData.totalUnidadesBeauty} un. vendidas
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between pt-2 border-t border-slate-800">
                  <span>Ventas Totales: ${processedData.totalVentasBeauty.toLocaleString('es-CL')}</span>
                  <span className="text-emerald-300 font-bold">Tu Utilidad: ${processedData.utilidadNeta.toLocaleString('es-CL')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Fecha del Pago (Sábado):</label>
                  <input
                    type="date"
                    required
                    value={paymentForm.fechaPago}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, fechaPago: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Nombre de la Socia:</label>
                  <input
                    type="text"
                    required
                    value={paymentForm.sociaNombre}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, sociaNombre: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Método de Pago:</label>
                <select
                  value={paymentForm.metodoPago}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, metodoPago: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cuenta Rut / Banco Estado">Cuenta Rut / Banco Estado</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">N° Comprobante o Referencia Transferencia (Opcional):</label>
                <input
                  type="text"
                  placeholder="Ej: Transf #849302 Banco de Chile"
                  value={paymentForm.comprobanteReferencia}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, comprobanteReferencia: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Notas u Observaciones (Opcional):</label>
                <textarea
                  rows={2}
                  placeholder="Detalles adicionales del pago..."
                  value={paymentForm.observaciones}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, observaciones: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-600/20"
                >
                  {isSubmittingPayment ? 'Registrando...' : 'Confirmar y Guardar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Imprimir / Exportar Comprobante para Socia */}
      {showPrintModal && printSettlementData && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95">
            {/* Header modal controls (hidden on print) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                Vista Previa de Liquidación
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md"
                >
                  <Printer size={16} />
                  Imprimir Documento
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* PRINTABLE CONTENT */}
            <div className="p-4 bg-white space-y-6 print:p-0">
              {/* Business Header */}
              <div className="flex items-center justify-between pb-6 border-b-2 border-slate-900">
                <div className="flex items-center gap-4">
                  <img
                    src={LOGO_URL}
                    alt={BRAND_NAME}
                    className="w-14 h-14 object-contain rounded-2xl bg-white border border-slate-200 p-1"
                  />
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{BRAND_NAME}</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase">{COMPANY_NAME}</p>
                    <p className="text-[10px] text-slate-400">RUT: 76.XXX.XXX-X · Santiago, Chile</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-1">
                    LIQUIDACIÓN SEMANAL
                  </span>
                  <p className="text-xs font-black text-slate-900">DEPARTAMENTO BELLEZA & MAQUILLAJE</p>
                  <p className="text-xs text-slate-500 font-semibold">{printSettlementData.periodo}</p>
                </div>
              </div>

              {/* Beneficiary & Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl text-xs">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Beneficiaria (Socia Compras):</p>
                  <p className="font-black text-slate-900 uppercase">{printSettlementData.sociaNombre || 'Socia Inversora'}</p>
                  <p className="text-[11px] text-slate-600 mt-1">Concepto: Reembolso / Pago por Costo de Ventas</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-slate-400">Fecha de Liquidación:</p>
                  <p className="font-black text-slate-900">{formatDisplayDate(printSettlementData.fechaPago)}</p>
                  <p className="text-[11px] text-slate-600 mt-1">Método: {printSettlementData.metodoPago || 'Transferencia'}</p>
                </div>
              </div>

              {/* Summary highlight */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400">Total a Transferir a la Socia (Costo):</span>
                  <h3 className="text-2xl font-black font-mono text-emerald-400">
                    ${printSettlementData.totalCosto.toLocaleString('es-CL')} CLP
                  </h3>
                </div>
                <div className="text-right text-xs text-slate-300">
                  <p>Ventas Generadas: <span className="font-bold text-white">${printSettlementData.totalVentas.toLocaleString('es-CL')}</span></p>
                  <p>Utilidad Echeverria & Cía: <span className="font-bold text-emerald-400">${printSettlementData.utilidad.toLocaleString('es-CL')}</span></p>
                  <p className="text-[10px] text-slate-400">Unidades Vendidas: {printSettlementData.cantidadUnidades} un.</p>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-[9px] font-black uppercase text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Producto / Cosmética</th>
                      <th className="py-2.5 px-3 text-center">Cant.</th>
                      <th className="py-2.5 px-3 text-right">Costo Unit.</th>
                      <th className="py-2.5 px-3 text-right font-black text-slate-900">Total a Pagar</th>
                      <th className="py-2.5 px-3 text-right">Precio Venta</th>
                      <th className="py-2.5 px-3 text-right">Total Venta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(printSettlementData.itemsResumen || []).map((it: any) => (
                      <tr key={it.codigo}>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{it.codigo}</td>
                        <td className="py-2 px-3 text-slate-800">{it.nombre}</td>
                        <td className="py-2 px-3 text-center font-bold">{it.cantidad}</td>
                        <td className="py-2 px-3 text-right font-mono">${it.costoUnitario.toLocaleString('es-CL')}</td>
                        <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                          ${it.totalCosto.toLocaleString('es-CL')}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">${(it.precioVentaUnitario || 0).toLocaleString('es-CL')}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">${it.totalVenta.toLocaleString('es-CL')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-black text-[11px] border-t border-slate-200">
                    <tr>
                      <td colSpan={2} className="py-3 px-3 uppercase">TOTAL LIQUIDADO</td>
                      <td className="py-3 px-3 text-center">{printSettlementData.cantidadUnidades} un.</td>
                      <td className="py-3 px-3 text-right">—</td>
                      <td className="py-3 px-3 text-right font-mono font-black text-rose-700">
                        ${printSettlementData.totalCosto.toLocaleString('es-CL')}
                      </td>
                      <td className="py-3 px-3 text-right">—</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-900">
                        ${printSettlementData.totalVentas.toLocaleString('es-CL')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-12 pt-12 pb-4">
                <div className="text-center border-t border-slate-300 pt-3">
                  <p className="text-xs font-black text-slate-900 uppercase">
                    {currentUser?.nombre || 'Administración'}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase">{COMPANY_NAME}</p>
                  <p className="text-[9px] text-slate-400 mt-1">Emitido conforme</p>
                </div>
                <div className="text-center border-t border-slate-300 pt-3">
                  <p className="text-xs font-black text-slate-900 uppercase">
                    {printSettlementData.sociaNombre || 'Socia Inversora'}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase">Compras Belleza & Maquillaje</p>
                  <p className="text-[9px] text-slate-400 mt-1">Recibido conforme</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
