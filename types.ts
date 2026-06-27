
export interface Customer {
  id: string;
  nombre: string;
  telefono: string;
  rut?: string;
  email?: string;
  direccion?: string;
  notas: string[]; // History/interaction notes
  lastContacted: string; // ISO date
}

export enum SaleStatus {
  PENDIENTE = 'Pendiente',
  ENVIADO = 'Enviado'
}

export enum DispatchType {
  AGENCIA = 'Agencia',
  DOMICILIO = 'Domicilio',
  RETIRO = 'Retiro en Bodega'
}

export enum DispatchStatus {
  PREPARACION = 'En Preparación',
  LISTO_PARA_RETIRO = 'Listo para Retiro',
  EN_RUTA = 'En Ruta',
  ENTREGADO = 'Entregado',
  CLIENTE_AUSENTE = 'Cliente ausente',
  DIRECCION_NO_ENCONTRADA = 'Dirección no encontrada',
  CLIENTE_NO_RECIBIO = 'Cliente no recibió',
  AGENCIA_MAL_ASIGNADA = 'Agencia Mal Asignada',
  ERROR_ETIQUETADO = 'Error de Etiquetado'
}

export enum SaleType {
  NORMAL = 'Normal',
  LIVE = 'Live TikTok',
  NOTA_VENTA = 'Nota de Venta'
}

export interface SaleItem {
  codigoFardo: string;
  cantidad: number;
  valorUnitario: number;
  tipoComision?: CommissionType;
  esManual?: boolean;
}

export enum CommissionType {
  FARDO_NORMAL = 'Comisión Estándar ($3.000)',
  FARDO_PROMO = 'Comisión Promoción ($1.500)',
  MEDIO_FARDO = 'Comisión Especial ($1.500)',
  LOTE = 'Comisión Mayorista ($1.000)'
}

export const COMMISSION_VALUES: Record<CommissionType, number> = {
  [CommissionType.FARDO_NORMAL]: 3000,
  [CommissionType.FARDO_PROMO]: 1500,
  [CommissionType.MEDIO_FARDO]: 1500,
  [CommissionType.LOTE]: 1000
};

export enum StaffRole {
  VENDEDOR = 'Vendedor',
  BODEGA = 'Jefe de Bodega',
  DESPACHO = 'Encargado de Despacho',
  ADMIN = 'Administrador',
  TRANSPORTISTA = 'Transportista',
  POST_VENTA = 'Post-Venta'
}

export enum PurchaseType {
  NOTA_VENTA = 'Nota de Venta',
  CONTENEDOR = 'Contenedor Cerrado'
}

export interface Abono {
  id: string;
  fecha: string;
  monto: number;
  metodo: string;
  observacion: string;
}

export interface Purchase {
  id: string;
  proveedor: string;
  fecha: string;
  tipo: PurchaseType;
  descripcion: string;
  montoTotal: number;
  saldoPendiente: number;
  abonos: Abono[];
  estado: 'PAGADO' | 'PENDIENTE';
}

export interface StaffMember {
  id: string;
  nombre: string;
  rol: StaffRole;
  pin: string;
  activo: boolean;
}

export interface StockItem {
  id: string;
  codigo: string;
  tipo: string;
  proveedor: string; 
  precioCosto: number;
  precioSugerido: number;
  stockActual: number; 
  disponible: boolean;
  unidad: 'UNIDAD' | 'PIEZA' | 'CAJA' | 'PACK' | 'SET' | string;
  categoria?: 'ESTANDAR' | 'MAYORISTA' | string;
  peso?: number; // Para bultos pesados o lotes (Opcional)
  promocion?: boolean;
  imagenUrl?: string;
  especificaciones?: string;
}

export interface Sale {
  id: string;
  numeroVenta: number;
  tipoVenta: SaleType;
  fecha: string;
  hora: string;
  vendedor: string;
  cliente: string;
  telefono: string;
  rut?: string;
  codigoFardo?: string; 
  variante?: string;
  valorUnitario?: number;
  cantidad?: number;
  items?: SaleItem[];
  total: number;
  direccion?: string;
  estadoPago: string;
  enviado: boolean;
  conductorFecha?: string;
  comprobante?: string;
  tipoComision: CommissionType;
  juntaCompra?: string;
  status: SaleStatus;
  observaciones: string;
  fechaDespacho?: string;
  datosCompletos: boolean;
  
  // Nuevos campos para gestión logística
  tipoDespacho?: DispatchType;
  estadoDespacho?: DispatchStatus;
  itemsDespachados?: number; // Cantidad verificada/escaneada
  agencia?: string; // Starken, Chilexpress, BlueExpress, etc.
  transportista?: string; // Nombre del transportista para despacho a domicilio
  timestamp?: string; // ISO date
  impresa?: boolean;
  etiquetador?: string;
  esManual?: boolean;
}

export interface CommissionAdjustment {
  id: string;
  fecha: string;
  vendedor: string;
  monto: number; // Negative for deductions, positive for bonuses
  motivo: string;
}

export interface Coupon {
  id: string;
  code: string;
  value: number;
  validUntil: string;
  used: boolean;
  createdAt: string;
  customerName?: string;
  saleId?: string;
  authorizedBy?: string;
  authorizedAt?: string;
}

export interface Cheque {
  id: string;
  fecha: string;
  numeroCheque: string;
  monto: number;
  nombre: string;
  tipo: 'Abierto' | 'Cruzado';
  pagado: boolean;
}

export interface ProductionRecord {
  id: string;
  fecha: string; // ISO date
  cantidad: number;
  totalPagar: number;
}

export interface StockHistoryEvent {
  id: string;
  productId: string;
  tipo: 'INGRESO' | 'AJUSTE' | 'VENTA' | 'ANULACION' | 'CARGA_MASIVA';
  cantidad: number;
  balanceAntes?: number;
  balanceDespues?: number;
  fecha: string; // ISO timestamp
  vendedor: string;
  observaciones: string;
}

