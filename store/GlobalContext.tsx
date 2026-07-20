import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Sale, SaleItem, StockItem, SaleStatus, SaleType, StaffMember, StaffRole, Purchase, PurchaseType, Abono, DispatchType, DispatchStatus, CommissionAdjustment, Customer, Coupon, Cheque, ProductionRecord, CommissionType, COMMISSION_VALUES, StockHistoryEvent, RatesConfig } from '../types';
import { db, storage } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch, getDocs, addDoc, query, where, orderBy, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const INITIAL_MASTER_STOCK: Omit<StockItem, 'id' | 'disponible'>[] = [
  { codigo: 'MDF-001', tipo: 'Abrigo Corto Mujer CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO', categoria: 'FARDO' },
  { codigo: 'MDF-002', tipo: 'Abrigo Lana Hombre Corto IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 90000, stockActual: 6, unidad: 'FARDO', categoria: 'FARDO' },
  { codigo: 'MDF-003', tipo: 'Abrigo Lana Mujer Corto IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 90000, stockActual: 1, unidad: 'FARDO', categoria: 'FARDO' },
  { codigo: 'MDF-004', tipo: 'Abrigo largo CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 130000, stockActual: 0, unidad: 'FARDO', categoria: 'FARDO' },
  { codigo: 'MDF-005', tipo: 'Abrigo Moderno BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO', categoria: 'FARDO' },
  { codigo: 'MDF-006', tipo: 'Abrigo mujer JK', proveedor: 'JK', precioCosto: 0, precioSugerido: 90000, stockActual: 3, unidad: 'FARDO', categoria: 'FARDO' },
  { codigo: 'MDF-007', tipo: 'Accesorios Navidad IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 140000, stockActual: 3, unidad: 'FARDO', categoria: 'FARDO' },
  { codigo: 'MDF-008', tipo: 'Artes Marciales CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 80000, stockActual: 1, unidad: 'FARDO', categoria: 'FARDO' },
  { codigo: 'MDF-009', tipo: 'Baby Platinium IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO', categoria: 'FARDO' },
  { codigo: 'MDF-010', tipo: 'Banana Republic IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: 'FARDO', categoria: 'FARDO' },
  { codigo: 'MDF-011', tipo: 'Blazer Invierno CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-012', tipo: 'Blazer Juvenil IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-013', tipo: 'Blazer verano', proveedor: 'General', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-014', tipo: 'Blusa Fancy BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-015', tipo: 'Blusa Fanella BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 100000, stockActual: 10, unidad: 'FARDO' },
  { codigo: 'MDF-016', tipo: 'Blusa Invierno IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-017', tipo: 'Blusa m/l FE', proveedor: 'FE', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-018', tipo: 'Blusa Media Estación FE', proveedor: 'FE', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-019', tipo: 'Blusa Media Temporada MDF', proveedor: 'MDF', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-020', tipo: 'Blusa poly BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-021', tipo: 'Blusa Poly IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-022', tipo: 'Blusa verano canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-023', tipo: 'Blusa Verano Plus Size CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-024', tipo: 'Blusas BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-025', tipo: 'Buzo A CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-026', tipo: 'Buzo algodon  TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-027', tipo: 'BUZO ALGODON CANADA 2.0', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-028', tipo: 'BUZO ALGODON CANADA 2.0 1RA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-029', tipo: 'Buzo Algodon Im', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-030', tipo: 'Buzo algodon O/S Tom y jerry', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-031', tipo: 'Buzo Canada SPL', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-032', tipo: 'Buzo JK', proveedor: 'JK', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-033', tipo: 'Buzo Juvenil BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-034', tipo: 'Buzo Marca 25 KG ALGODON TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 240000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-035', tipo: 'Buzo Marca nylon 25 kg TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 260000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-036', tipo: 'Buzo Niño', proveedor: 'General', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-037', tipo: 'Buzo Nylon TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-038', tipo: 'Buzo Old Navy', proveedor: 'OLD NAVY', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-039', tipo: 'Buzo Poly', proveedor: 'General', precioCosto: 0, precioSugerido: 260000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-040', tipo: 'Buzo polyester BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 260000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-041', tipo: 'Buzo y chaqueta de nylon prem beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-042', tipo: 'Buzo y Chaqueta Entrenamiento', proveedor: 'General', precioCosto: 0, precioSugerido: 220000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-043', tipo: 'Buzo y Chaqueta Poliester Premium BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-044', tipo: 'Calcetin  ZT', proveedor: 'ZT', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-045', tipo: 'Calcetin Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-046', tipo: 'Calcetin Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-047', tipo: 'Calvin Klein y algo de Guess invierno  25KG', proveedor: 'General', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: '25 KILOS' },
  { codigo: 'MDF-048', tipo: 'Calza 3/4 CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 250000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-049', tipo: 'Calza Corta Deportiva CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 330000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-050', tipo: 'Calza deportiva', proveedor: 'RT', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-051', tipo: 'Calza Deportiva BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-052', tipo: 'Calza deportiva CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-053', tipo: 'Calza Deportiva IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-054', tipo: 'Calza Deportiva Marca 25 kg TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-055', tipo: 'Calza Invierno CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-056', tipo: 'Calza Moderna Leggins', proveedor: 'General', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-057', tipo: 'Calzon', proveedor: 'General', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-058', tipo: 'Camisa De Hombre M/C CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-059', tipo: 'Camisa De Hombre TIGRE.', proveedor: 'TIGRE', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-060', tipo: 'Camisa Franella BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 160000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-061', tipo: 'Camisa Mezclilla CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-062', tipo: 'Camisa ML Hombre Premiun BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-063', tipo: 'Camisas Hombre M/L y M/C', proveedor: 'General', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-064', tipo: 'Capri BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-065', tipo: 'Capri CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 70000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-066', tipo: 'Chamarra BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 250000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-067', tipo: 'Chamarra Niño BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-068', tipo: 'Chaqueta Atletica (Poleron Deportivo) BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 250000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-069', tipo: 'Chaqueta De Cuero 1RA IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-070', tipo: 'Chaqueta De Cuero 2DA IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-071', tipo: 'Chaqueta De Entrenamiento CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-072', tipo: 'Chaqueta Fashion CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-073', tipo: 'Chaqueta Gamuza 20 kg IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-074', tipo: 'Chaqueta Invierno CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-075', tipo: 'Chaqueta Jeans  B CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-076', tipo: 'Chaqueta Jeans 1 Y 2 TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 80000, stockActual: 93, unidad: 'FARDO' },
  { codigo: 'MDF-077', tipo: 'Chaqueta Jeans BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 210000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-078', tipo: 'Chaqueta Liviana CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-079', tipo: 'CHAQUETA LIVIANA CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-080', tipo: 'Chaqueta Moderna BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-081', tipo: 'Chaqueta moderna IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-082', tipo: 'Chaqueta Mujer Marca 25 kg TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-083', tipo: 'Chaqueta Polar BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 5, unidad: 'FARDO' },
  { codigo: 'MDF-084', tipo: 'Chic Pant ( jogger mujer) CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-085', tipo: 'CK/ GUESS 25 KILOS', proveedor: 'General', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-086', tipo: 'Clinico CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-087', tipo: 'Clinico im', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-088', tipo: 'Cobertor CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-089', tipo: 'Cojin CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-090', tipo: 'Colcha Lana CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 130000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-091', tipo: 'Columbia  25 KG Media Temporada Verano', proveedor: 'General', precioCosto: 0, precioSugerido: 260000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-092', tipo: 'Columbia 50 PRENDAS', proveedor: 'General', precioCosto: 0, precioSugerido: 320000, stockActual: 0, unidad: '20 KILOS' },
  { codigo: 'MDF-093', tipo: 'Columbia Jacket 25 KG TOMY JERRY', proveedor: 'General', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-094', tipo: 'Conjunto Zara 25 unidades RETORNO', proveedor: 'ZARA', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-095', tipo: 'Corderito Polar  TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-096', tipo: 'Cortaviento', proveedor: 'RT', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-097', tipo: 'Cortaviento  A CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-098', tipo: 'CORTAVIENTO 1RA  CNADA 2.0', proveedor: 'RT', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-099', tipo: 'CORTAVIENTO 2DA CANADA 2.0', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-100', tipo: 'Cortaviento B', proveedor: 'RT', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-101', tipo: 'Cortaviento Marca  25 KLS', proveedor: 'RT', precioCosto: 0, precioSugerido: 400000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-102', tipo: 'Cortaviento TOM Y JERRY  40 KG', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-103', tipo: 'Cortaviento Vintage  POMS 25 KILOS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-104', tipo: 'Cortavientos beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-105', tipo: 'COTELE DE HOMBRE CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-106', tipo: 'Cotsco Hombre', proveedor: 'General', precioCosto: 0, precioSugerido: 6000, stockActual: 0, unidad: 'PIEZA' },
  { codigo: 'MDF-107', tipo: 'Crip Crop Top CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 9, unidad: 'FARDO' },
  { codigo: 'MDF-108', tipo: 'Crop Top  Invierno IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 140000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-109', tipo: 'Cubre colchon #1 IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 13, unidad: 'FARDO' },
  { codigo: 'MDF-110', tipo: 'Deportivo 1RA IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-111', tipo: 'Deportivo A', proveedor: 'RT', precioCosto: 0, precioSugerido: 330000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-112', tipo: 'Deportivo Adulto BETA 1RA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-113', tipo: 'Deportivo B', proveedor: 'RT', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-114', tipo: 'Deportivo Crema F', proveedor: 'RT', precioCosto: 0, precioSugerido: 400000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-115', tipo: 'Deportivo Economico Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-116', tipo: 'Deportivo Invierno Nylon  TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 180000, stockActual: 23, unidad: 'FARDO' },
  { codigo: 'MDF-117', tipo: 'Deportivo Niño BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-118', tipo: 'Deportivo O/S', proveedor: 'RT', precioCosto: 0, precioSugerido: 100000, stockActual: 5, unidad: 'FARDO' },
  { codigo: 'MDF-119', tipo: 'Deportivo Plus Size Crema IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 200000, stockActual: 25, unidad: 'FARDO' },
  { codigo: 'MDF-120', tipo: 'Deportivo Plus SIze Track Suite IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-121', tipo: 'Deportivo Premium Im', proveedor: 'IM', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-122', tipo: 'Deportivo Verano', proveedor: 'RT', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-123', tipo: 'Disfraz 2da', proveedor: 'General', precioCosto: 0, precioSugerido: 80000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-124', tipo: 'Disfraz adulto im', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-125', tipo: 'Disfraz Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-126', tipo: 'Disfraz niño im', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-127', tipo: 'Disfraz niño im p1', proveedor: 'IM', precioCosto: 0, precioSugerido: 140000, stockActual: 5, unidad: 'FARDO' },
  { codigo: 'MDF-128', tipo: 'Enterito Bebe Pijama Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 0, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-129', tipo: 'Enterito canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-130', tipo: 'enterito fe', proveedor: 'FE', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-131', tipo: 'Enterito mameluco niño JK', proveedor: 'JK', precioCosto: 0, precioSugerido: 140000, stockActual: 10, unidad: 'FARDO' },
  { codigo: 'MDF-132', tipo: 'Falda de Cuero IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 160000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-133', tipo: 'Falda Invierno CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-134', tipo: 'Falda Verano CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-135', tipo: 'Fashion Brand Exotico IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-136', tipo: 'Fashion Brand IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 210000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-137', tipo: 'FF Exotico IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 140000, stockActual: 12, unidad: 'FARDO' },
  { codigo: 'MDF-138', tipo: 'Frazada BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-139', tipo: 'Frazada CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-140', tipo: 'GAP 25 KLS', proveedor: 'General', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-141', tipo: 'Gorro Y Bufanda CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 80000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-142', tipo: 'Halloween', proveedor: 'General', precioCosto: 0, precioSugerido: 100000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-143', tipo: 'Halloween disfraz nuevo', proveedor: 'General', precioCosto: 0, precioSugerido: 2800, stockActual: 0, unidad: 'PIEZA' },
  { codigo: 'MDF-144', tipo: 'Jardinera Mezclilla beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-145', tipo: 'Jardinera short IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 80000, stockActual: 10, unidad: 'FARDO' },
  { codigo: 'MDF-146', tipo: 'Jean levis mujer', proveedor: 'General', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-147', tipo: 'Jeans Fashion 50 PIEZAS', proveedor: 'General', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-148', tipo: 'Jeans Hombre BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-149', tipo: 'Jeans hombre canada b', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-150', tipo: 'Jeans Loco TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 360000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-151', tipo: 'Jeans Mujer  CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-152', tipo: 'Jeans Mujer BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 160000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-153', tipo: 'Jeans Mujer O/S CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-154', tipo: 'Jordan y And One  25 KG', proveedor: 'General', precioCosto: 0, precioSugerido: 240000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-155', tipo: 'Jumper Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-156', tipo: 'Jumper Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-157', tipo: 'Ladies Fashion Sweater CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-158', tipo: 'lenceria beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 400000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-159', tipo: 'Lenceria CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-160', tipo: 'Leñadora CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-161', tipo: 'Lino BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-162', tipo: 'Mamemluco bebé TIGRE', proveedor: 'TIGRE', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-163', tipo: 'Mantel BETA.', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-164', tipo: 'Marca #2 CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 280000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-165', tipo: 'Marca Invierno Talla Grande TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-166', tipo: 'Mix Chaqueta MDF', proveedor: 'MDF', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-167', tipo: 'Mix Mujer Verano Premium BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 280000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-168', tipo: 'Mixta Hombre invierno Premiun BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 330000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-169', tipo: 'Mixta mujer invierno premiun beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 250000, stockActual: 5, unidad: 'FARDO' },
  { codigo: 'MDF-170', tipo: 'Mixta Mujer Invierno Talla Grande TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 260000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-171', tipo: 'Mixta mujer verano premiun poms', proveedor: 'POMS', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-172', tipo: 'Mixta Verano IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 250000, stockActual: 16, unidad: 'FARDO' },
  { codigo: 'MDF-173', tipo: 'Mixto Invierno 1RA BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 120000, stockActual: 17, unidad: 'FARDO' },
  { codigo: 'MDF-174', tipo: 'Musculosa Mujer CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 120000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-175', tipo: 'New Brand #1 IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-176', tipo: 'New brand exotico', proveedor: 'General', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-177', tipo: 'New Brand STD IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-178', tipo: 'Niño Frio Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-179', tipo: 'niño inv 0/14 1y2 beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 110000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-180', tipo: 'Niño INV 1RA CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-181', tipo: 'Niño invierno B CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 150000, stockActual: 15, unidad: 'FARDO' },
  { codigo: 'MDF-182', tipo: 'Niño Invierno Premiun BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 280000, stockActual: 9, unidad: 'FARDO' },
  { codigo: 'MDF-183', tipo: 'Niño verano B CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-184', tipo: 'Niño Verano IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 160000, stockActual: 36, unidad: 'FARDO' },
  { codigo: 'MDF-185', tipo: 'niño verano p1', proveedor: 'General', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-186', tipo: 'Niño Verano Premiu BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 350000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-187', tipo: 'North Face  Columbia A STD IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 380000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-188', tipo: 'North Face Jacket 25 KG', proveedor: 'RT', precioCosto: 0, precioSugerido: 320000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-189', tipo: 'Old Navi Niño', proveedor: 'General', precioCosto: 0, precioSugerido: 2800, stockActual: 0, unidad: 'PIEZA' },
  { codigo: 'MDF-190', tipo: 'Original Short POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-191', tipo: 'Oversize  Premium Verano POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-192', tipo: 'Oversize Mixta Invierno Premium IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 130000, stockActual: 5, unidad: 'FARDO' },
  { codigo: 'MDF-193', tipo: 'Oversize Mixta Verano  Premium IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 17, unidad: 'FARDO' },
  { codigo: 'MDF-194', tipo: 'Palazo BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-195', tipo: 'Pantalon Cargo 1 Y 2 CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-196', tipo: 'Pantalon Cotele BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 130000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-197', tipo: 'Pantalon Cotele Mujer CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-198', tipo: 'Pantalon de trabajo', proveedor: 'General', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-199', tipo: 'Pantalon de Vestir Hombre CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 120000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-200', tipo: 'Pantalon Deportivo BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-201', tipo: 'Pantalon Deportivo Marca POMS 25 KILOS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 260000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-202', tipo: 'Pantalon deportivo TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-203', tipo: 'Pantalon Eco - Cuero IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-204', tipo: 'Pantalon Palazo IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 240000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-205', tipo: 'Pantalon Rayon Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 300000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-206', tipo: 'Pantalón Rayon CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 280000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-207', tipo: 'Pantalon Rayon IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 240000, stockActual: 6, unidad: 'FARDO' },
  { codigo: 'MDF-208', tipo: 'Pantalon Secado Rapido IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-209', tipo: 'Pantalon Skinny CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 150000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-210', tipo: 'Pantalon Vestir CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 120000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-211', tipo: 'Parka A', proveedor: 'General', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-212', tipo: 'Parka Adulto Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-213', tipo: 'Parka Adulto MDF', proveedor: 'MDF', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-214', tipo: 'Parka Adulto Primera IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-215', tipo: 'Parka B', proveedor: 'General', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-216', tipo: 'Parka coreana corta', proveedor: 'RT', precioCosto: 0, precioSugerido: 150000, stockActual: 23, unidad: '20 KILOS' },
  { codigo: 'MDF-217', tipo: 'Parka coreana corta y larga', proveedor: 'RT', precioCosto: 0, precioSugerido: 230000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-218', tipo: 'Parka COREANA larga', proveedor: 'General', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-219', tipo: 'Parka DE NIÑO 2DA', proveedor: 'General', precioCosto: 0, precioSugerido: 50000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-220', tipo: 'Parka Italiana 40 kg', proveedor: 'General', precioCosto: 0, precioSugerido: 200000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-221', tipo: 'Parka Larga IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-222', tipo: 'Parka Niño 1ra IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 70000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-223', tipo: 'Parka Niño BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-224', tipo: 'Parka Niño COREANA', proveedor: 'General', precioCosto: 0, precioSugerido: 200000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-225', tipo: 'Parka STD IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-226', tipo: 'ParkaSin Manga CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 240000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-227', tipo: 'Peto deportivo beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-228', tipo: 'Peto Deportivo CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 350000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-229', tipo: 'Pijama Invierno CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-230', tipo: 'Pijama Invierno Premium BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-231', tipo: 'Pijama Polar', proveedor: 'General', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-232', tipo: 'Pijama Polar CANADA 2.0', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-233', tipo: 'Pijama Polar IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 50000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-234', tipo: 'Pijama Polar zt', proveedor: 'ZT', precioCosto: 0, precioSugerido: 90000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-235', tipo: 'Pink  POMS 25 KG', proveedor: 'POMS', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: '20 KILOS' },
  { codigo: 'MDF-236', tipo: 'Pink  TOM Y JERRY 25 KG', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 260000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-237', tipo: 'Plus size  Hombre Invierno P1 IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 200000, stockActual: 14, unidad: 'FARDO' },
  { codigo: 'MDF-238', tipo: 'Plus Size  Mujer Invierno Crema IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 220000, stockActual: 9, unidad: 'FARDO' },
  { codigo: 'MDF-239', tipo: 'Plus Size Blusa beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-240', tipo: 'Plus Size Blusa IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 160000, stockActual: 10, unidad: 'FARDO' },
  { codigo: 'MDF-241', tipo: 'Plus Size Hombre Verano Crema IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 200000, stockActual: 17, unidad: 'FARDO' },
  { codigo: 'MDF-242', tipo: 'Plus Size Invierno Premium BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-243', tipo: 'Plus Size Mixto POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-244', tipo: 'Plus Size Mujer Verano P1 IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 220000, stockActual: 19, unidad: 'FARDO' },
  { codigo: 'MDF-245', tipo: 'Plus Size Polera Mujer Manga Corta Verano Premium', proveedor: 'RT', precioCosto: 0, precioSugerido: 100000, stockActual: 82, unidad: 'FARDO' },
  { codigo: 'MDF-246', tipo: 'Plus Size Polera Musculosa Mujer  IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-247', tipo: 'Plus Size Sumer Brand (Marca Verano ) IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 250000, stockActual: 37, unidad: 'FARDO' },
  { codigo: 'MDF-248', tipo: 'Plus Size Traje De Baño TARGET', proveedor: 'TARGET', precioCosto: 0, precioSugerido: 250000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-249', tipo: 'Plus size Vestido BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-250', tipo: 'Plus Size Vestido Media Estacion IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 13, unidad: 'FARDO' },
  { codigo: 'MDF-251', tipo: 'Plus Size Vestido Verano CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-252', tipo: 'Plus Size Vestido Verano IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-253', tipo: 'Plus Size Winter Brand IM (Marca invierno)', proveedor: 'IM', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-254', tipo: 'polar canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 130000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-255', tipo: 'Polar Corderito IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-256', tipo: 'polar dubai', proveedor: 'General', precioCosto: 0, precioSugerido: 100000, stockActual: 8, unidad: 'FARDO' },
  { codigo: 'MDF-257', tipo: 'Polar IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 130000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-258', tipo: 'Polar Marca 25 Kg', proveedor: 'General', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-259', tipo: 'Polar Moderno Premium BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 260000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-260', tipo: 'Polar POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-261', tipo: 'Polar S.A', proveedor: 'S.A', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-262', tipo: 'Polar TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 80000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-263', tipo: 'Polar Top IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 60000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-264', tipo: 'POLERA ATLETICA BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 220000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-265', tipo: 'Polera Atletica primeras y segunda capa BETA', proveedor: 'IM', precioCosto: 0, precioSugerido: 250000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-266', tipo: 'Polera Cuello De Tortuga CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 120000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-267', tipo: 'Polera Deportiva B CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-268', tipo: 'Polera Deportiva Manga Corta IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-269', tipo: 'Polera Deportiva Premium', proveedor: 'RT', precioCosto: 0, precioSugerido: 330000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-270', tipo: 'Polera Hombre M/C BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 210000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-271', tipo: 'Polera Hombre M/C Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 210000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-272', tipo: 'Polera Hombre M/C IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 200000, stockActual: 13, unidad: 'FARDO' },
  { codigo: 'MDF-273', tipo: 'Polera Hombre M/C POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-274', tipo: 'Polera Hombre m/l', proveedor: 'General', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-275', tipo: 'Polera Hombre M/L CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-276', tipo: 'Polera Hombre m/l IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-277', tipo: 'Polera Hombre M/L TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 130000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-278', tipo: 'Polera Hombre Plus Size CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-279', tipo: 'Polera M/C Hombre Plus Size  FE', proveedor: 'FE', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-280', tipo: 'Polera M/C Mujer Plus Size POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-281', tipo: 'Polera m/l mujer JK', proveedor: 'JK', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-282', tipo: 'Polera Manga Corta Mujer IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 30, unidad: 'FARDO' },
  { codigo: 'MDF-283', tipo: 'Polera Manga Corta Mujer IM P1', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 16, unidad: 'FARDO' },
  { codigo: 'MDF-284', tipo: 'Polera Marca m/c 25 KG TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 240000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-285', tipo: 'Polera Mujer  M/L Premium', proveedor: 'General', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-286', tipo: 'Polera Mujer M/C Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-287', tipo: 'Polera Mujer M/L / S.A', proveedor: 'S.A', precioCosto: 0, precioSugerido: 70000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-288', tipo: 'Polera Mujer M/L BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 100000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-289', tipo: 'Polera Mujer m/l ZT', proveedor: 'ZT', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-290', tipo: 'Polera Mujer Manga Corta B', proveedor: 'RT', precioCosto: 0, precioSugerido: 90000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-291', tipo: 'Polera Mujer Manga corta FE', proveedor: 'FE', precioCosto: 0, precioSugerido: 100000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-292', tipo: 'Polera Niño M/L TIGRE', proveedor: 'TIGRE', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-293', tipo: 'Polera Plus Size Hombre m/c IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 110000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-294', tipo: 'Poleron  Con Gorro Premium BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-295', tipo: 'Poleron C/G  IM 1Y2', proveedor: 'IM', precioCosto: 0, precioSugerido: 60000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-296', tipo: 'Poleron C/G Delgado Fashion IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-297', tipo: 'Poleron C/G Niño TOP', proveedor: 'General', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-298', tipo: 'Poleron C/G Primera BETA', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 25, unidad: 'FARDO' },
  { codigo: 'MDF-299', tipo: 'Poleron Con Cierre IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 90000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-300', tipo: 'Poleron con gorro 1ra im', proveedor: 'IM', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-301', tipo: 'Poleron Con Gorro 2DA', proveedor: 'General', precioCosto: 0, precioSugerido: 50000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-302', tipo: 'Poleron Con Gorro CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 120000, stockActual: 13, unidad: 'FARDO' },
  { codigo: 'MDF-303', tipo: 'Poleron con gorro marca 2da 25 kg', proveedor: 'General', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-304', tipo: 'Poleron Con Gorro Niño BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-305', tipo: 'Poleron Con Gorro Plus Size  CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-306', tipo: 'Poleron con gorro S.A o/s', proveedor: 'S.A', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-307', tipo: 'Poleron Con Gorro TIGRE 2da', proveedor: 'TIGRE', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-308', tipo: 'Poleron Con Gorro Top CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-309', tipo: 'Poleron Con y Sin Gorro Poms', proveedor: 'POMS', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-310', tipo: 'Poleron crop top', proveedor: 'General', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-311', tipo: 'POLERON MARCA ALGODON 25 KG TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-312', tipo: 'Poleron Marca Deportivo TOM Y JERRY 25 KG', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-313', tipo: 'Poleron S/G BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 100000, stockActual: 21, unidad: 'FARDO' },
  { codigo: 'MDF-314', tipo: 'Poleron S/G CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 90000, stockActual: 12, unidad: 'FARDO' },
  { codigo: 'MDF-315', tipo: 'Poleron S/G Canada 2,0', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 70000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-316', tipo: 'Poleron S/G TIGRE', proveedor: 'TIGRE', precioCosto: 0, precioSugerido: 55000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-317', tipo: 'Poleron S/G TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 80000, stockActual: 17, unidad: 'FARDO' },
  { codigo: 'MDF-318', tipo: 'Poleron Sin Gorro Marca  25 KG TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 240000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-320', tipo: 'Ravanas BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 10, unidad: 'FARDO' },
  { codigo: 'MDF-321', tipo: 'Retorno Traje de Baño Target', proveedor: 'TARGET', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-322', tipo: 'Ropa Clinica TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-323', tipo: 'Ropa de Casa "B" CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 110000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-324', tipo: 'Ropa de Casa A CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 150000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-325', tipo: 'Ropa de casa BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-326', tipo: 'Ropa De Casa Navidad CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-327', tipo: 'Ropa De Casa TIGRE', proveedor: 'TIGRE', precioCosto: 0, precioSugerido: 90000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-328', tipo: 'Ropa De Perro BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-329', tipo: 'Ropa De Trabajo', proveedor: 'General', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-330', tipo: 'Ropa ejercio premium beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-331', tipo: 'Ropa Mascota FE 20KG', proveedor: 'FE', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-332', tipo: 'Ropa Mascota IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-333', tipo: 'Ropa Sky Niño', proveedor: 'General', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-334', tipo: 'Sabana beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-335', tipo: 'Sabana Blanca CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 150000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-336', tipo: 'Sabana Franella CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-337', tipo: 'Sabanas bajeras', proveedor: 'General', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-338', tipo: 'Sabanas Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-339', tipo: 'Sabanas Franella BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-340', tipo: 'Saco Mantel', proveedor: 'General', precioCosto: 0, precioSugerido: 70000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-341', tipo: 'Shein Brand IM de', proveedor: 'IM', precioCosto: 0, precioSugerido: 150000, stockActual: 8, unidad: 'FARDO' },
  { codigo: 'MDF-342', tipo: 'Short 2da', proveedor: 'RT', precioCosto: 0, precioSugerido: 60000, stockActual: 14, unidad: 'FARDO' },
  { codigo: 'MDF-343', tipo: 'Short Boxer IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 170000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-344', tipo: 'Short Cargo CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-345', tipo: 'Short Cargo O/S 1', proveedor: 'RT', precioCosto: 0, precioSugerido: 140000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-346', tipo: 'Short Deportivo  Niño BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 250000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-347', tipo: 'Short deportivo Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-348', tipo: 'Short Deportivo Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 350000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-349', tipo: 'Short Hombre Plus Size IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-350', tipo: 'Short Juvenil Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 190000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-351', tipo: 'Short Mezclilla Beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-352', tipo: 'Short Mixto IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-353', tipo: 'Short Original canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-354', tipo: 'Short Sexy BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-355', tipo: 'Short Sexy Tigre', proveedor: 'TIGRE', precioCosto: 0, precioSugerido: 130000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-356', tipo: 'Shorts sexi canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-357', tipo: 'Skinny  Jeans CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-358', tipo: 'Sky Adulto IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 160000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-359', tipo: 'Sky Nieve Niño IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-360', tipo: 'Sky Niño JK', proveedor: 'JK', precioCosto: 0, precioSugerido: 140000, stockActual: 9, unidad: 'FARDO' },
  { codigo: 'MDF-361', tipo: 'Summer Brand 2DA IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 300000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-362', tipo: 'Summer Brand STD (Marca Verano) IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-363', tipo: 'Super niño invierno P1 IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-364', tipo: 'Surf  20 KG IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 90000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-365', tipo: 'Surtido Crema niño y adulto 1ra RT', proveedor: 'RT', precioCosto: 0, precioSugerido: 120000, stockActual: 17, unidad: 'FARDO' },
  { codigo: 'MDF-366', tipo: 'Surtido Crema Premium RT', proveedor: 'RT', precioCosto: 0, precioSugerido: 150000, stockActual: 100, unidad: '20 KILOS, 25 KILOS, PIEZA, FARDO' },
  { codigo: 'MDF-367', tipo: 'Surtido Juvenil Invierno P1 IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 180000, stockActual: 18, unidad: 'FARDO' },
  { codigo: 'MDF-368', tipo: 'Surtido Plush CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 100000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-369', tipo: 'Sweater  CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 60000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-370', tipo: 'Sweater Cardigan IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 50000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-371', tipo: 'Sweater Fashion Mujer POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-372', tipo: 'Sweater Hombre CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 150000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-373', tipo: 'Sweater Hombre POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 120000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-374', tipo: 'Sweater juvenil  BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 100000, stockActual: 12, unidad: 'FARDO' },
  { codigo: 'MDF-375', tipo: 'Sweater Largo BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 90000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-376', tipo: 'Sweater Mujer Moderno Premium BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-377', tipo: 'Sweater Niño CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-378', tipo: 'Sweater Pesado EMOJI', proveedor: 'General', precioCosto: 0, precioSugerido: 50000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-379', tipo: 'Sweater Pesado IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 50000, stockActual: 14, unidad: 'FARDO' },
  { codigo: 'MDF-380', tipo: 'Sweater Vestido 1RA IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 3, unidad: 'FARDO' },
  { codigo: 'MDF-381', tipo: 'Sweter hombre Premiun BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 2, unidad: 'FARDO' },
  { codigo: 'MDF-382', tipo: 'Talla Grande Invierno 1ra BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 140000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-383', tipo: 'Toallas Nuevas  POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 220000, stockActual: 4, unidad: 'FARDO' },
  { codigo: 'MDF-384', tipo: 'Traje De Baño', proveedor: 'General', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-385', tipo: 'Traje De Baño Hombre Canada', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 320000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-386', tipo: 'Traje De Baño Mujer  IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 100000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-387', tipo: 'Traje de Baño p1', proveedor: 'General', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-388', tipo: 'Traje De Baño POMS', proveedor: 'POMS', precioCosto: 0, precioSugerido: 80000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-389', tipo: 'Vestido De Novia CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 250000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-390', tipo: 'Vestido Fiesta TOM Y JERRY', proveedor: 'TOM Y JERRY', precioCosto: 0, precioSugerido: 320000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-391', tipo: 'Vestido Invierno CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 200000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-392', tipo: 'Vestido invierno premium BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 8, unidad: 'FARDO' },
  { codigo: 'MDF-393', tipo: 'Vestido Media Estacion IM', proveedor: 'IM', precioCosto: 0, precioSugerido: 140000, stockActual: 41, unidad: 'FARDO' },
  { codigo: 'MDF-394', tipo: 'vestido mini beta', proveedor: 'BETA', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-395', tipo: 'Vestido Niña', proveedor: 'General', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-396', tipo: 'Vestido Poliester', proveedor: 'General', precioCosto: 0, precioSugerido: 220000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-397', tipo: 'Vestido Polo', proveedor: 'General', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-398', tipo: 'Vestido Polo FE', proveedor: 'FE', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-399', tipo: 'Vestido Verano BETA', proveedor: 'BETA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-400', tipo: 'Vestido Verano CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 220000, stockActual: 1, unidad: 'FARDO' },
  { codigo: 'MDF-401', tipo: 'VESTIDOS POLO FE 2DA', proveedor: 'FE', precioCosto: 0, precioSugerido: 120000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-402', tipo: 'Winter Mix JK', proveedor: 'JK', precioCosto: 0, precioSugerido: 180000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-403', tipo: 'Winter Premium Platinium CANADA', proveedor: 'CANADA', precioCosto: 0, precioSugerido: 280000, stockActual: 0, unidad: 'FARDO' },
  { codigo: 'MDF-404', tipo: 'Zara  Invierno 25 KG', proveedor: 'ZARA', precioCosto: 0, precioSugerido: 220000, stockActual: 0, unidad: '25 KILOS' }
];

interface StoreContextType {
  currentUser: { nombre: string; rol: StaffRole } | null;
  settings: { soundEnabled: boolean; soundType?: 'classic' | 'retro' | 'melodic' | 'sci-fi'; cloudUrl: string; lastSync: string | null; dbConnected: boolean; lastError: string | null };
  updateSettings: (newSettings: any) => void;
  rates: RatesConfig;
  updateRates: (newRates: Partial<RatesConfig>) => Promise<void>;
  playSound: (type: 'click' | 'success' | 'transition') => void;
  login: (nombre: string, rol: StaffRole) => void;
  logout: () => void;
  sales: Sale[];
  stock: StockItem[];
  staff: StaffMember[];
  purchases: Purchase[];
  carriers: string[];
  adjustments: CommissionAdjustment[];
  addSale: (saleData: Partial<Sale>) => Promise<Sale>;
  updateSale: (id: string, updatedData: Partial<Sale>) => void;
  markAsSent: (saleId: string) => void;
  updateDispatchStatus: (saleId: string, status: DispatchStatus) => void;
  updateDispatchItems: (saleId: string, quantity: number) => void;
  assignCarrier: (saleId: string, carrier: string) => void;
  addCarrier: (name: string) => void;
  removeCarrier: (name: string) => void;
  coupons: Coupon[];
  addCoupon: (coupon: Omit<Coupon, 'id' | 'createdAt'>) => void;
  redeemCoupon: (id: string, authorizedBy?: string) => void;
  redeemCouponByCode: (code: string, authorizedBy?: string) => void;
  deleteCoupon: (id: string) => void;
  cheques: Cheque[];
  addCheque: (cheque: Omit<Cheque, 'id' | 'pagado'>) => void;
  markChequeAsPaid: (id: string) => void;
  deleteCheque: (id: string) => void;
  clearAllSales: () => void;
  clearAllStock: () => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  deleteAllSales: () => Promise<void>;
  addStockItem: (item: Omit<StockItem, 'id' | 'disponible'>) => void;
  updateStockItem: (id: string, updatedData: Partial<StockItem>) => void;
  togglePromocion: (id: string) => void;
  removeStockItem: (id: string) => void;
  bulkAddStock: (items: Omit<StockItem, 'id' | 'disponible'>[]) => void;
  fixDuplicateStock: () => Promise<void>;
  fixDuplicateStockByName: () => Promise<void>;
  purgeUnusedStock: () => Promise<void>;
  resetToMasterStock: () => void;
  addStaff: (member: Omit<StaffMember, 'id' | 'activo'>) => void;
  updateStaff: (id: string, updatedMember: Partial<StaffMember>) => Promise<void>;
  removeStaff: (id: string) => void;
  addPurchase: (p: Omit<Purchase, 'id' | 'saldoPendiente' | 'abonos' | 'estado'>) => void;
  removePurchase: (id: string) => void;
  addAbono: (purchaseId: string, monto: number, metodo: string, observacion: string) => void;
  removeAbono: (purchaseId: string, abonoId: string) => void;
  getStats: () => any;
  productionRecords: ProductionRecord[];
  addProductionRecord: (cantidad: number) => void;
  syncWithCloud: (silent?: boolean) => Promise<boolean>;
  pushToCloud: (curSales: Sale[], curStock: StockItem[], curStaff: StaffMember[], curPurchases: Purchase[]) => Promise<void>;
  isSyncing: boolean;
  lastSync: string | null;
  stockHistory: StockHistoryEvent[];
  addStockHistoryEvent: (event: Omit<StockHistoryEvent, 'id' | 'fecha'>) => Promise<void>;
}

// Safe storage wrapper to prevent Safari private mode exception crashes
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("Storage is blocked or unavailable:", e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage is blocked or unavailable:", e);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("Storage is blocked or unavailable:", e);
    }
  }
};

const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      console.warn("Storage is blocked or unavailable:", e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage is blocked or unavailable:", e);
    }
  },
  removeItem: (key: string): void => {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      console.warn("Storage is blocked or unavailable:", e);
    }
  }
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [settings, setSettings] = useState(() => {
    const saved = safeLocalStorage.getItem('mdf_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { soundType: 'classic', ...parsed };
    }
    return { soundEnabled: true, soundType: 'classic', cloudUrl: '', lastSync: null, dbConnected: false, lastError: null };
  });

  const [rates, setRates] = useState<RatesConfig>(() => {
    const saved = safeLocalStorage.getItem('mdf_rates');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      productionRate: 4000,
      commissionFardoNormal: 3000,
      commissionFardoPromo: 1500,
      commissionMedioFardo: 1500,
      commissionLote: 1000
    };
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = safeLocalStorage.getItem('mdf_sales');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [stock, setStock] = useState<StockItem[]>(() => {
    const saved = safeLocalStorage.getItem('mdf_stock');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    const saved = safeLocalStorage.getItem('mdf_staff');
    return saved ? JSON.parse(saved) : [];
  });
  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const saved = safeLocalStorage.getItem('mdf_purchases');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [carriers, setCarriers] = useState<string[]>(() => {
    const saved = safeLocalStorage.getItem('mdf_carriers');
    return saved ? JSON.parse(saved) : [
      'Isaias Peralta',
      'Anthony Mendez',
      'Ariel Echeverria',
      'Gonzalo Duarte',
      'Transportes Tamarindo',
      'Transportes Runn'
    ];
  });
  
  const [adjustments, setAdjustments] = useState<CommissionAdjustment[]>(() => {
    const saved = safeLocalStorage.getItem('mdf_adjustments');
    return saved ? JSON.parse(saved) : [];
  });
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = safeLocalStorage.getItem('mdf_coupons');
    return saved ? JSON.parse(saved) : [];
  });
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
  const [stockHistory, setStockHistory] = useState<StockHistoryEvent[]>(() => {
    const saved = safeLocalStorage.getItem('mdf_stock_history');
    return saved ? JSON.parse(saved) : [];
  });

  const isSyncingRef = useRef(false);

  const calculatePurchaseState = (purchase: Purchase) => {
    const totalAbonado = purchase.abonos.reduce((acc, a) => acc + a.monto, 0);
    const saldoPendiente = Math.max(0, purchase.montoTotal - totalAbonado);
    return {
      ...purchase,
      saldoPendiente,
      estado: saldoPendiente <= 0 ? 'PAGADO' : 'PENDIENTE' as 'PAGADO' | 'PENDIENTE'
    };
  };

  const updateSettings = (newSettings: any) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    safeLocalStorage.setItem('mdf_settings', JSON.stringify(updated));
  };

  const playSound = useCallback((type: 'click' | 'success' | 'transition') => {
    if (!settings.soundEnabled) return;
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const soundStyle = settings.soundType || 'classic';
      const now = ctx.currentTime;

      if (soundStyle === 'retro') {
        if (type === 'click') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.setValueAtTime(150, now + 0.05);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
          osc.start(now); osc.stop(now + 0.08);
        } else if (type === 'success') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(987.77, now); // B5
          osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          osc.start(now); osc.stop(now + 0.3);
        } else if (type === 'transition') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.setValueAtTime(450, now + 0.04);
          osc.frequency.setValueAtTime(600, now + 0.08);
          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          osc.start(now); osc.stop(now + 0.15);
        }
      } else if (soundStyle === 'melodic') {
        if (type === 'click') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(440, now); // A4
          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.start(now); osc.stop(now + 0.12);
        } else if (type === 'success') {
          const playNote = (freq: number, startOffset: number, duration: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(freq, now + startOffset);
            gain.gain.setValueAtTime(0.01, now + startOffset);
            gain.gain.linearRampToValueAtTime(0.06, now + startOffset + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);
            osc.start(now + startOffset);
            osc.stop(now + startOffset + duration);
          };
          playNote(523.25, 0, 0.4);       // C5
          playNote(659.25, 0.06, 0.35);    // E5
          playNote(784.00, 0.12, 0.3);     // G5
          playNote(1046.50, 0.18, 0.35);   // C6
        } else if (type === 'transition') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(329.63, now); // E4
          osc.frequency.exponentialRampToValueAtTime(493.88, now + 0.18); // B4
          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc.start(now); osc.stop(now + 0.2);
        }
      } else if (soundStyle === 'sci-fi') {
        if (type === 'click') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(1200, now);
          osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.start(now); osc.stop(now + 0.08);
        } else if (type === 'success') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
          osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.start(now); osc.stop(now + 0.3);
        } else if (type === 'transition') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(100, now);
          osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
          gain.gain.setValueAtTime(0.03, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.start(now); osc.stop(now + 0.15);
        }
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        if (type === 'click') {
          osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
          gain.gain.setValueAtTime(0.1, now); osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'success') {
          osc.frequency.setValueAtTime(523.25, now); osc.frequency.setValueAtTime(659.25, now + 0.1);
          gain.gain.setValueAtTime(0.1, now); osc.start(now); osc.stop(now + 0.3);
        } else if (type === 'transition') {
          osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
          gain.gain.setValueAtTime(0.05, now); osc.start(now); osc.stop(now + 0.15);
        }
      }
    } catch (e) {}
  }, [settings.soundEnabled, settings.soundType]);

  const pushToCloud = async (curSales: Sale[], curStock: StockItem[], curStaff: StaffMember[], curPurchases: Purchase[], curCarriers?: string[], curAdjustments?: CommissionAdjustment[]) => {
    setIsSyncing(true);
    try {
      const batch = writeBatch(db);
      
      curSales.forEach(s => batch.set(doc(db, 'sales', s.id), s));
      curStock.forEach(s => batch.set(doc(db, 'stock', s.id), s));
      curStaff.forEach(s => batch.set(doc(db, 'staff', s.id), s));
      curPurchases.forEach(p => batch.set(doc(db, 'purchases', p.id), p));
      (curAdjustments || adjustments).forEach(a => batch.set(doc(db, 'adjustments', a.id), a));
      
      batch.set(doc(db, 'config', 'carriers'), { list: curCarriers || carriers });
      
      await batch.commit();
      
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      updateSettings({ dbConnected: true, lastError: null, lastSync: timeString });
    } catch (error: any) {
      updateSettings({ dbConnected: false, lastError: error.message });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const syncWithCloud = async (silent = false) => {
    return true;
  };

  useEffect(() => {
    let unsubSales: any;
    let unsubStock: any;
    let unsubStaff: any;
    let unsubPurchases: any;
    let unsubAdjustments: any;
    let unsubCoupons: any;
    let unsubCheques: any;
    let unsubProduction: any;
    let unsubConfig: any;
    let unsubCustomers: any;
    let unsubStockHistory: any;
    let unsubRates: any;

    const initFirebase = async () => {
      try {
        unsubRates = onSnapshot(doc(db, 'config', 'rates'), (docSnap) => {
          if (docSnap.exists()) {
            setRates(prev => ({ ...prev, ...docSnap.data() as RatesConfig }));
          }
        });
        unsubSales = onSnapshot(collection(db, 'sales'), (snap) => {
          const salesData = snap.docs.map(d => d.data() as Sale);
          console.log("DEBUG: Retrived sales numbers:", salesData.map(s => s.numeroVenta));
          setSales(salesData);
        });
        unsubStock = onSnapshot(collection(db, 'stock'), (snap) => {
          setStock(snap.docs.map(d => d.data() as StockItem));
        });
        unsubStaff = onSnapshot(collection(db, 'staff'), (snap) => {
          setStaff(snap.docs.map(d => d.data() as StaffMember));
        });
        unsubPurchases = onSnapshot(collection(db, 'purchases'), (snap) => {
          setPurchases(snap.docs.map(d => d.data() as Purchase));
        });
        unsubAdjustments = onSnapshot(collection(db, 'adjustments'), (snap) => {
          setAdjustments(snap.docs.map(d => d.data() as CommissionAdjustment));
        });
        unsubCoupons = onSnapshot(collection(db, 'coupons'), (snap) => {
          setCoupons(snap.docs.map(d => d.data() as Coupon));
        });
        unsubCheques = onSnapshot(collection(db, 'cheques'), (snap) => {
          setCheques(snap.docs.map(d => ({ ...d.data(), id: d.id } as Cheque)));
        });
        unsubProduction = onSnapshot(collection(db, 'produccion'), (snap) => {
          setProductionRecords(snap.docs.map(d => ({ ...d.data(), id: d.id } as ProductionRecord)));
        });
        unsubConfig = onSnapshot(doc(db, 'config', 'carriers'), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.list) setCarriers(data.list);
          }
        });
        unsubCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
          setCustomers(snapshot.docs.map(doc => doc.data() as Customer));
        });
        unsubStockHistory = onSnapshot(collection(db, 'stock_history'), (snap) => {
          setStockHistory(snap.docs.map(d => d.data() as StockHistoryEvent));
        });
      } catch (error: any) {
        console.error("Error inicializando Firebase:", error.code, error.message);
      }
    };

    initFirebase();

    return () => {
      if (unsubSales) unsubSales();
      if (unsubStock) unsubStock();
      if (unsubStaff) unsubStaff();
      if (unsubPurchases) unsubPurchases();
      if (unsubAdjustments) unsubAdjustments();
      if (unsubCoupons) unsubCoupons();
      if (unsubCheques) unsubCheques();
      if (unsubProduction) unsubProduction();
      if (unsubConfig) unsubConfig();
      if (unsubCustomers) unsubCustomers();
      if (unsubStockHistory) unsubStockHistory();
      if (unsubRates) unsubRates();
    };
  }, []);

  useEffect(() => {
    safeLocalStorage.setItem('mdf_sales', JSON.stringify(sales));
    safeLocalStorage.setItem('mdf_stock', JSON.stringify(stock));
    safeLocalStorage.setItem('mdf_staff', JSON.stringify(staff));
    safeLocalStorage.setItem('mdf_purchases', JSON.stringify(purchases));
    safeLocalStorage.setItem('mdf_carriers', JSON.stringify(carriers));
    safeLocalStorage.setItem('mdf_adjustments', JSON.stringify(adjustments));
    safeLocalStorage.setItem('mdf_settings', JSON.stringify(settings));
    safeLocalStorage.setItem('mdf_stock_history', JSON.stringify(stockHistory));
    safeLocalStorage.setItem('mdf_rates', JSON.stringify(rates));
  }, [sales, stock, staff, purchases, carriers, adjustments, settings, stockHistory, rates]);

  const [currentUser, setCurrentUser] = useState<{ nombre: string; rol: StaffRole } | null>(() => {
    const saved = safeSessionStorage.getItem('mdf_session');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (nombre: string, rol: StaffRole) => {
    const user = { nombre, rol };
    setCurrentUser(user);
    safeSessionStorage.setItem('mdf_session', JSON.stringify(user));
    playSound('success');
    syncWithCloud();
  };

  const logout = () => {
    setCurrentUser(null);
    safeSessionStorage.removeItem('mdf_session');
    playSound('click');
  };

  const getCommissionValueForProduct = (codigo: string, valorUnitario: number): number => {
    const item = stock.find(i => i.codigo === codigo);
    if (item && item.comision !== undefined && item.comision !== null && item.comision >= 0) {
      return item.comision;
    }
    
    // Fallback to Tier-based comision (Category A to G)
    const price = valorUnitario || (item ? item.precioSugerido : 0);
    if (price <= 9990) return 500;       // Cat A
    if (price <= 19990) return 800;      // Cat B
    if (price <= 39990) return 1500;     // Cat C
    if (price <= 69990) return 2500;     // Cat D
    if (price <= 99990) return 3500;     // Cat E
    if (price <= 199990) return 5000;    // Cat F
    return 8000;                        // Cat G (Sobre 200.000)
  };

  const getPremiumBonusForProduct = (codigo: string): number => {
    const item = stock.find(i => i.codigo === codigo);
    if (!item) return 0;
    const name = (item.tipo || '').toLowerCase();
    if (name.includes('silla')) return 3000;
    if (name.includes('monitor')) return 5000;
    if (name.includes('parlante')) return 1000;
    return 0;
  };

  const addSale = async (saleData: Partial<Sale>) => {
    const now = new Date();
    const items = saleData.items || [];
    
    // Calculate total
    const total = saleData.tipoVenta === SaleType.NOTA_VENTA 
       ? items.reduce((acc, item) => acc + item.valorUnitario * item.cantidad, 0)
       : (saleData.valorUnitario || 0) * (saleData.cantidad || 0);

    // Calculate commission
    let totalComision = 0;
    let enrichedItems: SaleItem[] | undefined = undefined;

    if (saleData.tipoVenta === SaleType.NOTA_VENTA && items && items.length > 0) {
      enrichedItems = items.map(item => {
        const itemComm = getCommissionValueForProduct(item.codigoFardo, item.valorUnitario);
        const itemBonus = getPremiumBonusForProduct(item.codigoFardo);
        const totalItemComm = (itemComm + itemBonus) * item.cantidad;
        totalComision += totalItemComm;
        return {
          ...item,
          comisionCalculada: itemComm // Save base commission per unit
        };
      });
    } else if (saleData.codigoFardo) {
      const itemComm = getCommissionValueForProduct(saleData.codigoFardo, saleData.valorUnitario || 0);
      const itemBonus = getPremiumBonusForProduct(saleData.codigoFardo);
      totalComision = (itemComm + itemBonus) * (saleData.cantidad || 1);
    }

    const newSale: Sale = {
      ...saleData,
      total,
      id: Math.random().toString(36).substr(2, 9),
      numeroVenta: sales.length > 0 ? Math.max(...sales.map(s => s.numeroVenta || 0)) + 1 : 2000,
      fecha: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
      hora: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: SaleStatus.PENDIENTE,
      enviado: false,
      datosCompletos: saleData.tipoVenta === SaleType.NORMAL || saleData.tipoVenta === SaleType.NOTA_VENTA,
      estadoDespacho: DispatchStatus.PREPARACION,
      itemsDespachados: 0,
      tipoDespacho: saleData.tipoDespacho || '',
      timestamp: now.toISOString(),
      tipoComision: saleData.tipoComision || (saleData.codigoFardo ? calculateCommission(saleData.codigoFardo) : CommissionType.FARDO_NORMAL),
      items: enrichedItems || saleData.items,
      comisionCalculada: totalComision
    } as Sale;
    
    // Remove undefined values to prevent Firestore errors
    const cleanSale = Object.fromEntries(Object.entries(newSale).filter(([_, v]) => v !== undefined));
    

    try {
      console.log("Saving sale to Firestore...", newSale.id, cleanSale);
      const batch = writeBatch(db);
      batch.set(doc(db, 'sales', newSale.id), cleanSale);

      if (saleData.tipoVenta === SaleType.NOTA_VENTA) {
          console.log("Processing Nota de Venta items:", items);
          for (const item of items) {
              if (!item.esManual) {
                const stockRef = doc(db, 'stock', item.codigoFardo);
                batch.update(stockRef, {
                    stockActual: increment(-item.cantidad)
                });
              }
          }
      } else if (saleData.codigoFardo && !saleData.esManual) {
          const stockRef = doc(db, 'stock', saleData.codigoFardo);
          batch.update(stockRef, {
              stockActual: increment(-(saleData.cantidad || 0))
          });
      }

      await batch.commit();
      console.log("Sale and stock updates committed successfully.");
    } catch(error) {
        console.error("Error adding sale:", error);
        alert("Error al registrar venta. Revisa la consola.");
    }

    return newSale;
  };

  const addProductionRecord = async (cantidad: number) => {
    const record: ProductionRecord = {
      id: Math.random().toString(36).substr(2, 9),
      fecha: new Date().toISOString(),
      cantidad,
      totalPagar: cantidad * (rates.productionRate || 4000)
    };
    await setDoc(doc(db, 'produccion', record.id), record);
    playSound('success');
  };

  const updateRates = async (newRates: Partial<RatesConfig>) => {
    const updated = { ...rates, ...newRates };
    setRates(updated);
    safeLocalStorage.setItem('mdf_rates', JSON.stringify(updated));
    try {
      await setDoc(doc(db, 'config', 'rates'), updated);
      playSound('success');
    } catch (e) {
      console.error("Error updating rates in Firebase:", e);
    }
  };

  const deleteProductionRecord = (id: string) => {
    if (currentUser?.rol !== StaffRole.ADMIN) {
      alert("Solo el administrador puede borrar registros de producción.");
      return;
    }
    deleteDoc(doc(db, 'produccion', id));
    playSound('click');
  };

  const updateSale = (id: string, updatedData: Partial<Sale>) => {
    const sale = sales.find(s => s.id === id);
    if (sale) {
      if (sale.datosCompletos && updatedData.total !== undefined && updatedData.total !== sale.total && currentUser?.rol !== StaffRole.ADMIN) {
        alert("Solo el administrador puede editar el precio de una venta completada.");
        return;
      }
      setDoc(doc(db, 'sales', id), { ...sale, ...updatedData });
    }
  };

  const markAsSent = (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (sale) {
      const isLocal = sale.tipoDespacho === DispatchType.RETIRO || (sale.juntaCompra && sale.juntaCompra !== 'DESPACHO INMEDIATO');
      setDoc(doc(db, 'sales', saleId), { 
        ...sale, 
        status: SaleStatus.ENVIADO, 
        enviado: true, 
        fechaDespacho: new Date().toISOString(), 
        estadoDespacho: isLocal ? DispatchStatus.ENTREGADO : DispatchStatus.EN_RUTA 
      });
      playSound('success');
    }
  };

  const updateDispatchStatus = (saleId: string, status: DispatchStatus) => {
    const sale = sales.find(s => s.id === saleId);
    if (sale) {
      const updatedData: Partial<Sale> = { estadoDespacho: status };
      
      setDoc(doc(db, 'sales', saleId), { ...sale, ...updatedData });
    }
  };

  const updateDispatchItems = (saleId: string, quantity: number) => {
    const sale = sales.find(s => s.id === saleId);
    if (sale) setDoc(doc(db, 'sales', saleId), { ...sale, itemsDespachados: quantity });
  };

  const assignCarrier = (saleId: string, carrier: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (sale) setDoc(doc(db, 'sales', saleId), { ...sale, transportista: carrier });
  };

  const assignAgency = (saleId: string, agency: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (sale) setDoc(doc(db, 'sales', saleId), { ...sale, agencia: agency });
  };

  const addCarrier = (name: string) => {
    if (!carriers.includes(name)) {
      const newCarriers = [...carriers, name];
      setDoc(doc(db, 'config', 'carriers'), { list: newCarriers });
    }
  };

  const removeCarrier = (name: string) => {
    const newCarriers = carriers.filter(c => c !== name);
    setDoc(doc(db, 'config', 'carriers'), { list: newCarriers });
  };

  const addAdjustment = (adj: Omit<CommissionAdjustment, 'id'>) => {
    const newAdj = { ...adj, id: Math.random().toString(36).substr(2, 9) };
    setDoc(doc(db, 'adjustments', newAdj.id), newAdj);
  };

  const removeAdjustment = (id: string) => {
    deleteDoc(doc(db, 'adjustments', id));
  };

  const addCoupon = (coupon: Omit<Coupon, 'id' | 'createdAt'>) => {
    const newCoupon: Coupon = {
        ...coupon,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
    };
    setDoc(doc(db, 'coupons', newCoupon.id), newCoupon);
  };

  const addCheque = async (cheque: Omit<Cheque, 'id' | 'pagado'>) => {
    const newChequeRef = doc(collection(db, 'cheques'));
    await setDoc(newChequeRef, { ...cheque, id: newChequeRef.id, pagado: false });
  };

  const markChequeAsPaid = async (id: string) => {
    const cheque = cheques.find(c => c.id === id);
    if (cheque) {
       await setDoc(doc(db, 'cheques', id), { ...cheque, pagado: true });
    }
  };
  
  const deleteCheque = async (id: string) => {
    await deleteDoc(doc(db, 'cheques', id));
  };
  
  const redeemCoupon = (id: string, authorizedBy?: string) => {
    const coupon = coupons.find(c => c.id === id);
    if (coupon) {
      const isExpired = new Date(coupon.validUntil) < new Date();
      if (isExpired && !authorizedBy) {
        throw new Error("El cupón ha expirado y se requiere la autorización de un administrador.");
      }
      setDoc(doc(db, 'coupons', id), { 
        ...coupon, 
        used: true,
        authorizedBy: authorizedBy || null,
        authorizedAt: authorizedBy ? new Date().toISOString() : null
      });
    } else {
      throw new Error("Cupón no encontrado");
    }
  };

  const redeemCouponByCode = (code: string, authorizedBy?: string) => {
      const coupon = coupons.find(c => c.code === code);
      if (!coupon) throw new Error("Cupón no encontrado");
      if (coupon.used) throw new Error("Cupón ya utilizado");
      const isExpired = new Date(coupon.validUntil) < new Date();
      if (isExpired && !authorizedBy) {
        throw new Error("El cupón ha expirado y se requiere la autorización de un administrador.");
      }
      setDoc(doc(db, 'coupons', coupon.id), { 
        ...coupon, 
        used: true,
        authorizedBy: authorizedBy || null,
        authorizedAt: authorizedBy ? new Date().toISOString() : null
      });
  }

  const deleteCoupon = (id: string) => {
    deleteDoc(doc(db, 'coupons', id));
  };

  const clearAllSales = async () => {
    if (currentUser?.rol !== StaffRole.ADMIN) {
      alert("Solo el administrador puede borrar todo el historial.");
      return;
    }
    const salesDocs = await getDocs(collection(db, 'sales'));
    console.log("DEBUG: Limpiando ventas. Número de documentos encontrados en colección 'sales':", salesDocs.size);
    
    let batch = writeBatch(db);
    let count = 0;
    
    for (const docSnap of salesDocs.docs) {
      batch.delete(docSnap.ref);
      count++;
      if (count === 500) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }
    if (count > 0) await batch.commit();
    playSound('success');
    alert(`Proceso completado. Documentos eliminados: ${salesDocs.size}. Por favor recarga la página.`);
  };

  const clearAllStock = async () => {
    if (currentUser?.rol !== StaffRole.ADMIN) {
      alert("Solo el administrador puede borrar todo el inventario.");
      return;
    }
    const stockDocs = await getDocs(collection(db, 'stock'));
    console.log("DEBUG: Limpiando stock. Número de documentos encontrados en colección 'stock':", stockDocs.size);
    
    let batch = writeBatch(db);
    let count = 0;
    
    for (const docSnap of stockDocs.docs) {
      batch.delete(docSnap.ref);
      count++;
      if (count === 500) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }
    if (count > 0) await batch.commit();
    playSound('success');
    alert(`Proceso completado. Inventario eliminado: ${stockDocs.size}. Por favor recarga la página.`);
  };

  const addStockHistoryEvent = async (event: Omit<StockHistoryEvent, 'id' | 'fecha'>) => {
    try {
      const newRef = doc(collection(db, 'stock_history'));
      const newEvent: StockHistoryEvent = {
        ...event,
        id: newRef.id,
        fecha: new Date().toISOString()
      };
      await setDoc(newRef, newEvent);
    } catch (e) {
      console.error("Error creating stock history log:", e);
    }
  };

  const addStockItem = async (item: Omit<StockItem, 'id' | 'disponible'>) => {
    try {
      const code = (item.codigo || '').trim().toUpperCase();
      
      // Check if it already exists locally to alert user
      const existingCode = stock.find(s => (s.codigo || '').trim().toUpperCase() === code);
      if (existingCode) {
        if (!confirm(`El código ${code} ya existe (${existingCode.tipo}). ¿Deseas SOBREESCRIBIR su información con los nuevos datos?`)) {
          return;
        }
      }

      const newId = code; // ID is the code
      const rawData = { 
        ...item, 
        codigo: code, 
        id: newId, 
        disponible: item.stockActual > 0,
        categoria: item.categoria || 'FARDO'
      };
      
      // Remove undefined values to prevent Firestore errors
      const cleanData = Object.fromEntries(Object.entries(rawData).filter(([_, v]) => v !== undefined));

      await setDoc(doc(db, 'stock', newId), cleanData);

      await addStockHistoryEvent({
        productId: code,
        tipo: 'INGRESO',
        cantidad: item.stockActual,
        balanceAntes: existingCode ? existingCode.stockActual : 0,
        balanceDespues: item.stockActual,
        vendedor: currentUser?.nombre || 'SISTEMA',
        observaciones: existingCode ? `Sobreescritura del producto` : `Ingreso inicial de stock`
      });
    } catch (e: any) {
      console.error("Error adding stock item to Firestore:", e);
      alert("Error al guardar el producto en la base de datos: " + (e.message || e));
      throw e;
    }
  };

  const updateStockItem = async (id: string, updatedData: Partial<StockItem>) => {
    try {
      const item = stock.find(i => i.id === id);
      if (!item) return;

      let diff = 0;
      if (updatedData.stockActual !== undefined && updatedData.stockActual !== item.stockActual) {
        diff = updatedData.stockActual - item.stockActual;
      }

      // If code is being changed, we must be careful
      if (updatedData.codigo) {
        const newCode = updatedData.codigo.trim().toUpperCase();
        if (newCode !== item.codigo) {
          // Create new doc with new ID (code)
          const newItem = { ...item, ...updatedData, codigo: newCode, id: newCode, disponible: (updatedData.stockActual ?? item.stockActual) > 0 };
          const cleanNewItem = Object.fromEntries(Object.entries(newItem).filter(([_, v]) => v !== undefined));
          await setDoc(doc(db, 'stock', newCode), cleanNewItem);
          // Delete old doc
          await deleteDoc(doc(db, 'stock', id));
          
          await addStockHistoryEvent({
            productId: newCode,
            tipo: 'AJUSTE',
            cantidad: diff,
            balanceAntes: item.stockActual,
            balanceDespues: updatedData.stockActual ?? item.stockActual,
            vendedor: currentUser?.nombre || 'SISTEMA',
            observaciones: `Código cambiado de ${item.codigo} a ${newCode}. ${diff !== 0 ? `Stock modificado por ${diff}` : 'Sin cambio de stock'}`
          });
          return;
        }
      }

      const docData = { ...item, ...updatedData, disponible: (updatedData.stockActual ?? item.stockActual) > 0 };
      const cleanDocData = Object.fromEntries(Object.entries(docData).filter(([_, v]) => v !== undefined));
      await setDoc(doc(db, 'stock', id), cleanDocData);
      
      if (diff !== 0) {
        await addStockHistoryEvent({
          productId: item.codigo,
          tipo: 'AJUSTE',
          cantidad: diff,
          balanceAntes: item.stockActual,
          balanceDespues: updatedData.stockActual!,
          vendedor: currentUser?.nombre || 'SISTEMA',
          observaciones: `Ajuste manual de stock de ${item.stockActual} a ${updatedData.stockActual}`
        });
      }
    } catch (e: any) {
      console.error("Error updating stock item in Firestore:", e);
      alert("Error al actualizar el producto en la base de datos: " + (e.message || e));
      throw e;
    }
  };

  const togglePromocion = async (id: string) => {
    try {
      const item = stock.find(i => i.id === id);
      if (item) {
        const docData = { ...item, promocion: !item.promocion };
        const cleanDocData = Object.fromEntries(Object.entries(docData).filter(([_, v]) => v !== undefined));
        await setDoc(doc(db, 'stock', id), cleanDocData);
      }
    } catch (e: any) {
      console.error("Error toggling promotion in Firestore:", e);
      alert("Error al cambiar promoción: " + (e.message || e));
    }
  };
  
  const calculateCommission = (codigoFardo: string): CommissionType => {
      const item = stock.find(i => i.codigo === codigoFardo);
      if (!item) return CommissionType.FARDO_NORMAL;
      
      // Si es LOTE
      if (item.categoria === 'LOTE' || item.unidad === 'LOTE') {
          return CommissionType.LOTE;
      }

      // Si es MEDIO FARDO
      if (item.unidad === 'MEDIO FARDO') {
          return CommissionType.MEDIO_FARDO;
      }
      
      // Si es FARDO (Normal o Promo)
      if (item.promocion) {
          return CommissionType.FARDO_PROMO;
      }
      
      return CommissionType.FARDO_NORMAL;
  };

  const removeStockItem = (id: string) => {
    deleteDoc(doc(db, 'stock', id));
  };

  const bulkAddStock = async (items: Omit<StockItem, 'id' | 'disponible'>[]) => {
    try {
      let batch = writeBatch(db);
      let count = 0;
      
      for (const i of items) {
        const code = (i.codigo || '').trim().toUpperCase();
        if (!code) continue;
        const newId = code;
        const stockData = { ...i, codigo: code, id: newId, disponible: i.stockActual > 0 };
        const cleanStockData = Object.fromEntries(Object.entries(stockData).filter(([_, v]) => v !== undefined));
        batch.set(doc(db, 'stock', newId), cleanStockData);
        count++;
        
        await addStockHistoryEvent({
          productId: code,
          tipo: 'CARGA_MASIVA',
          cantidad: i.stockActual,
          balanceAntes: 0,
          balanceDespues: i.stockActual,
          vendedor: currentUser?.nombre || 'SISTEMA',
          observaciones: `Carga masiva CSV`
        });

        if (count === 400) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }

      if (count > 0) await batch.commit();
      alert(`Carga masiva completada. Se procesaron ${items.length} productos.`);
    } catch (e: any) {
      console.error("Error in bulkAddStock in Firestore:", e);
      alert("Error en la carga masiva: " + (e.message || e));
    }
  };

  const fixDuplicateStock = async () => {
    if (currentUser?.rol !== StaffRole.ADMIN) {
      alert("Solo el administrador puede realizar esta limpieza.");
      return;
    }
    
    setIsSyncing(true);
    try {
      const stockDocs = await getDocs(collection(db, 'stock'));
      const stockItems = stockDocs.docs.map(d => ({ ...d.data(), firestoreId: d.id } as StockItem & { firestoreId: string }));
      
      const codeMap = new Map<string, (StockItem & { firestoreId: string })[]>();
      stockItems.forEach(item => {
        const code = (item.codigo || '').trim().toUpperCase();
        if (!code) return;
        if (!codeMap.has(code)) codeMap.set(code, []);
        codeMap.get(code)!.push(item);
      });
      
      let batch = writeBatch(db);
      let count = 0;
      let totalFixed = 0;
      
      for (const [code, items] of codeMap.entries()) {
        if (items.length > 1 || items[0].firestoreId !== code) {
          totalFixed++;
          
          // Sumar el stock solo si NO parecen duplicaciones idénticas (mismo nombre, mismo precio, mismo proveedor)
          // Si son idénticos, probablemente sean duplicados de importación, así que tomamos el valor máximo
          let totalStock = 0;
          const first = items[0];
          const allIdentical = items.every(it => 
              it.tipo.trim().toUpperCase() === first.tipo.trim().toUpperCase() &&
              it.precioSugerido === first.precioSugerido &&
              it.proveedor.trim().toUpperCase() === first.proveedor.trim().toUpperCase()
          );

          if (allIdentical) {
              totalStock = Math.max(...items.map(i => i.stockActual || 0));
          } else {
              totalStock = items.reduce((acc, i) => acc + (i.stockActual || 0), 0);
          }
          
          const representativeItem = items[0];
          
          // Borrar todas las versiones (incluyendo las de IDs aleatorios)
          for (const item of items) {
            batch.delete(doc(db, 'stock', item.firestoreId));
            count++;
          }
          
          // Crear la versión única y limpia con ID = Código
          const fixedItem: StockItem = {
            ...representativeItem,
            id: code,
            codigo: code,
            stockActual: totalStock,
            disponible: totalStock > 0,
            categoria: representativeItem.categoria || 'FARDO'
          };
          delete (fixedItem as any).firestoreId;
          
          batch.set(doc(db, 'stock', code), fixedItem);
          count++;
          
          if (count >= 400) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
          }
        }
      }
      
      if (count > 0) await batch.commit();
      alert(`✅ LIMPIEZA COMPLETADA: Se unificaron ${totalFixed} productos. El inventario ahora es consistente.`);
      playSound('success');
    } catch (error: any) {
      console.error("Error en fixDuplicateStock:", error);
      alert("Error en limpieza: " + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const purgeUnusedStock = async () => {
    if (currentUser?.rol !== StaffRole.ADMIN) return;
    if (!confirm("⚠️ ¿PURGAR PRODUCTOS SIN USO? Se eliminarán permanentemente todos los productos con STOCK 0 que NO tengan ventas registradas. Esto limpiará tu catálogo de artículos que no usas.")) return;
    
    setIsSyncing(true);
    try {
      const salesDocs = await getDocs(collection(db, 'sales'));
      const activeCodes = new Set<string>();
      salesDocs.docs.forEach(d => {
        const sale = d.data() as Sale;
        if (sale.codigoFardo) activeCodes.add(sale.codigoFardo.trim().toUpperCase());
        if (sale.items) sale.items.forEach(i => activeCodes.add(i.codigoFardo.trim().toUpperCase()));
      });

      const stockDocs = await getDocs(collection(db, 'stock'));
      let batch = writeBatch(db);
      let count = 0;
      let purgedCount = 0;

      for (const d of stockDocs.docs) {
        const item = d.data() as StockItem;
        const code = (item.codigo || '').trim().toUpperCase();
        
        if (item.stockActual <= 0 && !activeCodes.has(code)) {
          batch.delete(d.ref);
          purgedCount++;
          count++;
          if (count >= 400) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
          }
        }
      }

      if (count > 0) await batch.commit();
      alert(`✅ PURGA EXITOSA: Se eliminaron ${purgedCount} productos obsoletos del catálogo.`);
      playSound('success');
    } catch (error: any) {
      alert("Error en purga: " + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const fixDuplicateStockByName = async () => {
    if (currentUser?.rol !== StaffRole.ADMIN) {
      alert("Solo el administrador puede realizar esta limpieza.");
      return;
    }
    
    setIsSyncing(true);
    try {
      const stockDocs = await getDocs(collection(db, 'stock'));
      const stockItems = stockDocs.docs.map(d => d.data() as StockItem);
      
      const nameMap = new Map<string, StockItem[]>();
      stockItems.forEach(item => {
        const name = item.tipo.trim().toUpperCase();
        if (!nameMap.has(name)) {
          nameMap.set(name, []);
        }
        nameMap.get(name)!.push(item);
      });
      
      let batch = writeBatch(db);
      let count = 0;
      let totalMerged = 0;
      let deletedCount = 0;
      
      for (const [name, items] of nameMap.entries()) {
        if (items.length > 1) {
          totalMerged++;
          const sortedItems = [...items].sort((a, b) => a.codigo.localeCompare(b.codigo));
          const [original, ...duplicates] = sortedItems;
          
          // Sumar el stock de los duplicados al original
          const totalStock = items.reduce((acc, i) => acc + (i.stockActual || 0), 0);
          
          // Actualizar el original con el nuevo stock
          batch.update(doc(db, 'stock', original.id), { 
            stockActual: totalStock,
            disponible: totalStock > 0 
          });
          count++;

          for (const duplicate of duplicates) {
            batch.delete(doc(db, 'stock', duplicate.id));
            deletedCount++;
            count++;
            
            if (count >= 400) {
              await batch.commit();
              batch = writeBatch(db);
              count = 0;
            }
          }
          
          if (count >= 400) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
          }
        }
      }
      
      if (count > 0) await batch.commit();
      alert(`✅ UNIFICACIÓN POR NOMBRE EXITOSA: Se corrigieron ${totalMerged} productos con nombres idénticos. Se consolidó el stock en los registros originales.`);
      playSound('success');
    } catch (error: any) {
      console.error("Error en fixDuplicateStockByName:", error);
      alert("Error al limpiar duplicados por nombre: " + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const resetToMasterStock = async () => {
    try {
      // First, delete all existing stock
      const stockDocs = await getDocs(collection(db, 'stock'));
      let deleteBatch = writeBatch(db);
      let deleteCount = 0;
      
      for (const document of stockDocs.docs) {
        deleteBatch.delete(document.ref);
        deleteCount++;
        if (deleteCount === 400) {
          await deleteBatch.commit();
          deleteBatch = writeBatch(db);
          deleteCount = 0;
        }
      }
      if (deleteCount > 0) await deleteBatch.commit();

      // Then, add the master stock (ONLY items with stock > 0)
      let addBatch = writeBatch(db);
      let addCount = 0;
      
      const filteredMaster = INITIAL_MASTER_STOCK.filter(i => (i.stockActual || 0) > 0);
      
      for (const item of filteredMaster) {
        const newId = item.codigo.trim().toUpperCase();
        addBatch.set(doc(db, 'stock', newId), { 
          ...item, 
          id: newId, 
          disponible: true,
          categoria: (item as any).categoria || 'FARDO'
        });
        addCount++;
        if (addCount === 400) {
          await addBatch.commit();
          addBatch = writeBatch(db);
          addCount = 0;
        }
      }
      if (addCount > 0) await addBatch.commit();
      
    } catch (error) {
      console.error("Error resetting stock:", error);
    }
  };

  const addStaff = (member: Omit<StaffMember, 'id' | 'activo'>) => {
    const newId = Math.random().toString(36).substr(2, 9);
    setDoc(doc(db, 'staff', newId), { ...member, id: newId, activo: true });
  };

  const updateStaff = async (id: string, updatedMember: Partial<StaffMember>) => {
    try {
      const current = staff.find(m => m.id === id);
      if (!current) return;

      const updated = { ...current, ...updatedMember };
      await setDoc(doc(db, 'staff', id), updated);

      if (updatedMember.nombre && updatedMember.nombre.trim() !== current.nombre.trim()) {
        const oldName = current.nombre.trim();
        const newName = updatedMember.nombre.trim();

        // 1. Update sales
        const salesToUpdate = sales.filter(s => s.vendedor === oldName);
        if (salesToUpdate.length > 0) {
          const batch = writeBatch(db);
          salesToUpdate.forEach(s => {
            batch.update(doc(db, 'sales', s.id), { vendedor: newName });
          });
          await batch.commit();
        }

        // 2. Update adjustments
        const adjToUpdate = adjustments.filter(a => a.vendedor === oldName);
        if (adjToUpdate.length > 0) {
          const batch = writeBatch(db);
          adjToUpdate.forEach(a => {
            batch.update(doc(db, 'adjustments', a.id), { vendedor: newName });
          });
          await batch.commit();
        }

        // 3. Update stock_history
        const histToUpdate = (stockHistory || []).filter(h => h.vendedor === oldName);
        if (histToUpdate.length > 0) {
          const batch = writeBatch(db);
          histToUpdate.forEach(h => {
            batch.update(doc(db, 'stock_history', h.id), { vendedor: newName });
          });
          await batch.commit();
        }
      }

      if (currentUser && currentUser.nombre === current.nombre) {
        const updatedUserSession = { 
          nombre: updated.nombre, 
          rol: updated.rol 
        };
        setCurrentUser(updatedUserSession);
        safeSessionStorage.setItem('mdf_session', JSON.stringify(updatedUserSession));
      }

    } catch (error) {
      console.error("Error updating staff member:", error);
    }
  };

  const removeStaff = (id: string) => {
    deleteDoc(doc(db, 'staff', id));
  };

  const addCustomer = (customer: Omit<Customer, 'id' | 'lastContacted' | 'notas'>) => {
    const newId = Math.random().toString(36).substr(2, 9);
    setDoc(doc(db, 'customers', newId), { 
      ...customer, 
      id: newId, 
      lastContacted: new Date().toISOString(),
      notas: []
    });
  };

  const updateCustomer = (customer: Customer) => {
    setDoc(doc(db, 'customers', customer.id), customer);
  };

  const removeCustomer = (id: string) => {
    deleteDoc(doc(db, 'customers', id));
  };

  const deleteSale = async (saleId: string) => {
    console.log("DEBUG: Intentando eliminar venta:", saleId, "Usuario actual:", currentUser?.nombre, "Rol:", currentUser?.rol);
    if (!currentUser) {
      alert("No hay usuario autenticado.");
      return;
    }
    if (currentUser?.rol !== StaffRole.ADMIN) {
      console.warn("Intento de borrado realizado por usuario sin permisos:", currentUser?.nombre, currentUser?.rol);
      alert(`No tienes permisos para borrar ventas. Solo el administrador puede hacerlo.`);
      return;
    }
    try {
      const saleToDelete = sales.find(s => s.id === saleId);
      const batch = writeBatch(db);
      
      batch.delete(doc(db, 'sales', saleId));

      if (saleToDelete) {
        if (saleToDelete.tipoVenta === SaleType.NOTA_VENTA && saleToDelete.items) {
          for (const item of saleToDelete.items) {
            if (!item.esManual) {
              const stockRef = doc(db, 'stock', item.codigoFardo);
              batch.update(stockRef, {
                stockActual: increment(item.cantidad)
              });
              const currentStockItem = stock.find(s => s.codigo === item.codigoFardo);
              await addStockHistoryEvent({
                productId: item.codigoFardo,
                tipo: 'ANULACION',
                cantidad: item.cantidad,
                balanceAntes: currentStockItem ? currentStockItem.stockActual : 0,
                balanceDespues: (currentStockItem ? currentStockItem.stockActual : 0) + item.cantidad,
                vendedor: currentUser?.nombre || 'SISTEMA',
                observaciones: `Anulación de Nota de Venta #${saleToDelete.numeroVenta || ''}`
              });
            }
          }
        } else if (saleToDelete.codigoFardo && !saleToDelete.esManual) {
          const stockRef = doc(db, 'stock', saleToDelete.codigoFardo);
          batch.update(stockRef, {
            stockActual: increment(saleToDelete.cantidad || 0)
          });
          const currentStockItem = stock.find(s => s.codigo === saleToDelete.codigoFardo);
          await addStockHistoryEvent({
            productId: saleToDelete.codigoFardo,
            tipo: 'ANULACION',
            cantidad: saleToDelete.cantidad || 0,
            balanceAntes: currentStockItem ? currentStockItem.stockActual : 0,
            balanceDespues: (currentStockItem ? currentStockItem.stockActual : 0) + (saleToDelete.cantidad || 0),
            vendedor: currentUser?.nombre || 'SISTEMA',
            observaciones: `Anulación de Venta #${saleToDelete.numeroVenta || ''}`
          });
        }
      }

      await batch.commit();
      playSound('click');
      alert("Venta eliminada con éxito y productos retornados al stock.");
      console.log("Venta eliminada con éxito:", saleId);
    } catch (e: any) {
      console.error("Error al borrar venta:", e);
      alert(`Error al borrar la venta: ${e.message}`);
    }
  };

  const deleteAllSales = async () => {
    if (currentUser?.rol !== StaffRole.ADMIN) {
      alert("Solo el administrador puede borrar todo el historial.");
      return;
    }
    const salesDocs = await getDocs(collection(db, 'sales'));
    let batch = writeBatch(db);
    let count = 0;
    
    for (const docSnap of salesDocs.docs) {
      batch.delete(docSnap.ref);
      count++;
      if (count === 500) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }
    if (count > 0) await batch.commit();
    playSound('success');
  };

  const addPurchase = (p: Omit<Purchase, 'id' | 'saldoPendiente' | 'abonos' | 'estado'>) => {
    const newId = Math.random().toString(36).substr(2, 9);
    setDoc(doc(db, 'purchases', newId), {
      ...p,
      id: newId,
      saldoPendiente: p.montoTotal,
      abonos: [],
      estado: 'PENDIENTE'
    });
  };

  const removePurchase = (id: string) => {
    deleteDoc(doc(db, 'purchases', id));
  };

  const addAbono = (purchaseId: string, monto: number, metodo: string, observacion: string) => {
    const p = purchases.find(p => p.id === purchaseId);
    if (p) {
      const newAbono: Abono = {
        id: Math.random().toString(36).substr(2, 9),
        fecha: new Date().toLocaleDateString(),
        monto, metodo, observacion
      };
      const tempPurchase = { ...p, abonos: [...p.abonos, newAbono] };
      setDoc(doc(db, 'purchases', purchaseId), calculatePurchaseState(tempPurchase));
    }
  };

  const removeAbono = (purchaseId: string, abonoId: string) => {
    const p = purchases.find(p => p.id === purchaseId);
    if (p) {
      const filteredAbonos = p.abonos.filter(a => a.id !== abonoId);
      const tempPurchase = { ...p, abonos: filteredAbonos };
      setDoc(doc(db, 'purchases', purchaseId), calculatePurchaseState(tempPurchase));
    }
  };

  const getStats = () => {
    const nowLocal = new Date();
    const today = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(nowLocal.getDate()).padStart(2, '0')}`;
    const todaySales = sales.filter(s => {
        let saleDateISO: string;
        if (s.timestamp) {
            const dObj = new Date(s.timestamp);
            saleDateISO = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
        } else {
            const parts = s.fecha.split('/');
            if (parts.length === 3) {
              const [d, m, y] = parts;
              saleDateISO = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            } else {
              saleDateISO = s.fecha;
            }
        }
        return saleDateISO === today;
    });
    let totalCosto = 0;
    sales.forEach(sale => {
      const product = stock.find(p => p.codigo === sale.codigoFardo);
      if (product) totalCosto += (product.precioCosto * sale.cantidad);
    });
    const totalIngresos = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    const sellerStats: Record<string, number> = {};
    sales.forEach(s => { if (s.vendedor) sellerStats[s.vendedor] = (sellerStats[s.vendedor] || 0) + s.total; });
    const topSellers = Object.entries(sellerStats).sort((a, b) => b[1] - a[1]).slice(0, 3);

    return {
      ventasHoy: todaySales.reduce((acc, s) => acc + (s.total || 0), 0),
      countHoy: todaySales.length,
      totalVendido: totalIngresos,
      utilidadTotal: totalIngresos - totalCosto,
      disponibles: stock.reduce((acc, i) => acc + i.stockActual, 0),
      pendientesDatos: sales.filter(s => !s.datosCompletos).length,
      topSellers,
      stockCritico: stock.filter(i => i.stockActual < 3 && i.stockActual > 0).length,
      valorInventarioVenta: stock.reduce((acc, i) => acc + (i.precioSugerido * i.stockActual), 0),
      deudaTotalProveedores: purchases.reduce((acc, p) => acc + p.saldoPendiente, 0),
      faltaCompletar: sales.filter(s => !s.datosCompletos).length,
      faltaPagar: sales.filter(s => s.estadoPago === 'Pendiente').length,
      faltaDespachar: sales.filter(s => s.datosCompletos && s.status === 'Pendiente').length
    };
  };

  const getReportData = (type: 'weekly' | 'monthly' | 'custom', startDate?: Date, endDate?: Date) => {
    const now = new Date();
    
    return sales.filter(s => {
      let saleDate: Date;
      if (s.timestamp) {
        saleDate = new Date(s.timestamp);
      } else {
        const parts = s.fecha.split('/');
        // Assuming DD/MM/YYYY based on Chilean context
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        saleDate = new Date(year, month - 1, day);
      }
      
      if (type === 'custom' && startDate && endDate) {
        return saleDate >= startDate && saleDate <= endDate;
      } else if (type === 'weekly') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return saleDate >= oneWeekAgo;
      } else {
        return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      }
    });
  };

  return (
    <StoreContext.Provider value={{
      currentUser, login, logout, settings, updateSettings, rates, updateRates, playSound,
      sales, stock, staff, customers, purchases, carriers, adjustments, coupons, addSale, updateSale, markAsSent, updateDispatchStatus, updateDispatchItems, assignCarrier, assignAgency, addCarrier, removeCarrier, addAdjustment, removeAdjustment, addCoupon, redeemCoupon, redeemCouponByCode, deleteCoupon, cheques, addCheque, markChequeAsPaid, deleteCheque, clearAllSales, clearAllStock,
      addStockItem, updateStockItem, togglePromocion, removeStockItem, bulkAddStock, fixDuplicateStock, fixDuplicateStockByName, purgeUnusedStock, resetToMasterStock, addStaff, updateStaff, removeStaff, addCustomer, updateCustomer, removeCustomer, deleteSale, deleteAllSales,
      addPurchase, removePurchase, addAbono, removeAbono, getStats, getReportData, syncWithCloud, pushToCloud, isSyncing, lastSync: settings.lastSync,
      productionRecords, addProductionRecord, deleteProductionRecord,
      stockHistory, addStockHistoryEvent
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error();
  return context;
};