
import { db } from './firebase';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';

const rawData = `Abrigo Corto Mujer CANADA		0	$120.000	FARDO
Abrigo Lana Hombre Corto IM		4	$90.000	FARDO
Abrigo Lana Mujer Corto IM		4	$90.000	FARDO
Abrigo largo CANADA		0	$130.000	FARDO
Abrigo Largo Y Corto POMS		0	$120.000	FARDO
Abrigo Moderno BETA 		0	$140.000	FARDO
Abrigo Mujer JK		12	$90.000	FARDO
Accesorios Navidad IM		0	$140.000	FARDO
Adult winter zipper coreano 40 kg 23H		0	$150.000	FARDO
Artes Marciales CANADA		0	$80.000	FARDO
Atletica De 1ra BETA		1	$280.000	FARDO
Baby Platinium IM		0	$180.000	FARDO
Banana Republic IM		0	$150.000	FARDO
Blazer Invierno CANADA		11	$140.000	FARDO
Blazer invierno cci		1	$160.000	FARDO
Blazer Juvenil IM		13	$120.000	FARDO
Blazer verano		0	$180.000	FARDO
Blusa Fancy BETA		0	$200.000	FARDO
Blusa Fanella BETA		10	$100.000	FARDO
Blusa Invierno IM		10	$100.000	FARDO
Blusa m/l FE		0	$80.000	FARDO
Blusa Media Estación FE		0	$100.000	FARDO
Blusa Media Temporada MDF		0	$220.000	FARDO
Blusa poly BETA		0	$180.000	FARDO
Blusa Poly IM		0	$160.000	FARDO
Blusa verano canada		0	$220.000	FARDO
Blusa Verano Plus Size CANADA		1	$180.000	FARDO
Blusas BETA		0	$180.000	FARDO
BODY SUIT S.A		0	$200.000	FARDO
Botas de inv 25 kg		7	$90.000	FARDO, 25 KILOS
Buzo A CANADA 		0	$220.000	FARDO
Buzo algodon  TOM Y JERRY		0	$120.000	FARDO
Buzo Algodón Canada 2.0		0	$160.000	FARDO
Buzo Algodon CANADA 2.0 1RA		0	$220.000	FARDO
Buzo Algodon Im		0	$140.000	FARDO
Buzo Algodon O/S Tom y jerry		0	$120.000	FARDO
Buzo canada 2.0 CCI		0	$160.000	FARDO
Buzo Canada SPL		0	$150.000	FARDO
Buzo JK		0	$140.000	FARDO
Buzo Juvenil BETA		0	$200.000	FARDO
Buzo Marca 25 KG ALGODON TOM Y JERRY 		0	$240.000	FARDO
Buzo Niño		0	$200.000	FARDO
Buzo Nylon TOM Y JERRY		0	$260.000	FARDO
Buzo Nylon Beta		1	$250.000	FARDO
Buzo Poly		0	$260.000	FARDO
Buzo polyester BETA 		1	$250.000	FARDO
Buzo y chaqueta de nylon prem beta		0	$350.000	FARDO
Buzo y Chaqueta Entrenamiento		2	$220.000	FARDO
Buzo y Chaqueta Poliester Premium BETA		0	$350.000	FARDO
Calcetin  ZT		0	$140.000	FARDO
Calcetin Beta		0	$160.000	FARDO
Calcetin Canada		3	$180.000	FARDO
Calvin Klein y algo de Guess invierno  25KG		0	$220.000	25 KILOS
Calza 3/4 CANADA		0	$250.000	FARDO
Calza Corta Deportiva CANADA		0	$330.000	FARDO
Calza Deportiva BETA		0	$280.000	FARDO
Calza deportiva CANADA		0	$280.000	FARDO
Calza Deportiva IM		0	$180.000	FARDO
Calza Deportiva Marca 25 kg TOM Y JERRY 		14	$220.000	FARDO
Calza deportiva poms		1	$220.000	FARDO
Calza Invierno CANADA 		2	$180.000	FARDO
Calza Moderna Leggins 		0	$140.000	FARDO
Calzon Beta		1	$300.000	FARDO
Camisa De Hombre M/C CANADA 		0	$140.000	FARDO
Camisa De Hombre TIGRE.		0	$100.000	FARDO
Camisa Franella BETA		4	$160.000	FARDO
Camisa Mezclilla CANADA  		0	$160.000	FARDO
Camisa ML Hombre Premiun BETA		4	$180.000	FARDO
Camisas Hombre M/L y M/C		0	$250.000	FARDO
Capri BETA		0	$100.000	FARDO
Capri CANADA		3	$70.000	FARDO
Chamarra moderna beta		2	$250.000	FARDO
Chamarra Niño BETA 		0	$180.000	FARDO
Chaqueta Atletica (Poleron Deportivo) BETA		8	$250.000	FARDO
Chaqueta De Cuero 1RA IM		5	$120.000	FARDO
Chaqueta De Cuero 2DA IM		9	$100.000	FARDO
Chaqueta De Entrenamiento CANADA		3	$230.000	FARDO
Chaqueta Fashion CANADA		3	$180.000	FARDO
Chaqueta Invierno CANADA 		1	$180.000	FARDO
Chaqueta Jeans  B CANADA		4	$180.000	FARDO
Chaqueta Jeans 1 Y 2 TOM Y JERRY 		48	$80.000	FARDO
Chaqueta Jeans BETA		0	$210.000	FARDO
Chaqueta Liviana CANADA		0	$140.000	FARDO
CHAQUETA LIVIANA CANADA		0	$300.000	FARDO
Chaqueta Marca Niño 25 KG TOM Y JERRY		0	$220.000	FARDO
Chaqueta Moderna BETA		0	$140.000	FARDO
Chaqueta moderna IM		17	$120.000	FARDO
Chaqueta Mujer Marca 25 kg TOM Y JERRY		0	$300.000	FARDO
Chaqueta niño 		0		FARDO
Chaqueta Polar Canada 2.0		0	$80.000	FARDO
Chaqueta Polar MARCA 25 KG		0	$280.000	FARDO
CHAQUETA SKY ADULTO DUBAY		0	$180.000	FARDO
Chic Pant ( jogger mujer) CANADA		1	$220.000	FARDO
CK/ GUESS 25 KILOS 		0	$200.000	FARDO
Clinico CANADA		0	$180.000	FARDO
Clinico Carhat Dickies 		0	$320.000	FARDO
Clinico im		0	$100.000	FARDO
Cobertor CANADA 		0	$140.000	FARDO
Cojin CANADA		0	$120.000	FARDO
Colcha Lana CANADA 		4	$130.000	FARDO
Columbia  25 KG Media Temporada Verano		0	$260.000	FARDO
Columbia 50 PRENDAS		0		20 KILOS
Columbia Jacket 25 KG TOMY JERRY 		0	$250.000	FARDO
Conjunto Zara 25 unidades RETORNO		0	$250.000	FARDO
CORDERITO ESPECIAL IM		11	$60.000	FARDO
Corderito Polar  TOM Y JERRY		0	$120.000	FARDO
Cortaviento 		0	$200.000	FARDO
Cortaviento  A CANADA		0	$220.000	FARDO
CORTAVIENTO 1RA  CNADA 2.0		0	$220.000	FARDO
CORTAVIENTO 2DA CANADA 2.0		0	$160.000	FARDO
Cortaviento B		0	$140.000	FARDO
Cortaviento Marca  25 KLS		0	$400.000	FARDO
Cortaviento TOM Y JERRY  40 KG		0	$160.000	FARDO
Cortaviento Vintage  POMS 25 KILOS 		0	$180.000	FARDO
Cortaviento y sodcherd coreano 40 kg		0	$250.000	FARDO
Cortavientos beta		0	$220.000	FARDO
Cotele De Hombre CANADA 		0	$180.000	FARDO
Cotsco Hombre		0	$6.000	PIEZA
Crip Crop Top CANADA		13	$180.000	FARDO
Crop Top  Invierno IM		67	$140.000	FARDO
CRUDO MARCA INV 50 LIBRAS		0	$200.000	25 KILOS
Cubre colchon #1 IM		13	$100.000	FARDO
Deportivo 1RA IM 		16	$280.000	FARDO
Deportivo A		0	$330.000	FARDO
Deportivo Adulto BETA 1RA		0	$300.000	FARDO
Deportivo B		6	$220.000	FARDO
Deportivo Crema F		0	$400.000	FARDO
Deportivo Economico Beta		0	$300.000	FARDO
DEPORTIVO INVIERNO JK		0	$280.000	FARDO
Deportivo Invierno Nylon  TOM Y JERRY		2	$180.000	FARDO
Deportivo Niño BETA		0	$280.000	FARDO
Deportivo O/S 		5	$100.000	FARDO
Deportivo Plus Size Crema IM		43	$220.000	FARDO
Deportivo Plus SIze Track Suite IM		34	$140.000	FARDO
Deportivo Premium Im		0	$350.000	FARDO
Deportivo Verano		0	$300.000	FARDO
Disfraz 2da		0	$80.000	FARDO
Disfraz adulto im		0	$100.000	FARDO
Disfraz Canada		0	$160.000	FARDO
Disfraz niño im 		0	$100.000	FARDO
Disfraz niño im p1		18	$160.000	FARDO
Enterito Bebe Pijama Canada		2	$160.000	FARDO
Enterito canada		0	$280.000	FARDO
enterito fe		0	$250.000	FARDO
Enterito mameluco niño JK 		0	$140.000	FARDO
Fajas De todo Tipo 		0	$200.000	FARDO
Falda de Cuero IM		1	$160.000	FARDO
Falda Invierno CANADA 		1	$160.000	FARDO
Falda Verano CANADA		1	$160.000	FARDO
Fashion Brand Exotico IM		0	$190.000	FARDO
Fashion Brand IM		0	$220.000	FARDO
FF Exotico IM		69	$140.000	FARDO
Frazada y mantas de Bebe tigre		2	$100.000	FARDO
Frazada CANADA 		0	$140.000	FARDO
GAMUZA IM 20 KG		0	$80.000	FARDO
GAP 25 KLS		0	$200.000	FARDO
Gorro Y Bufanda CANADA 		7	$90.000	FARDO
Halloween		3	$100.000	FARDO
Halloween disfraz nuevo 		0	$2.800	PIEZA
Hallowin retorno 		2		FARDO
Jardinera Mezclilla beta		0	$160.000	FARDO
Jardinera short IM		13	$100.000	FARDO
Jean levis mujer		0	$350.000	FARDO
Jeans Fashion 50 PIEZAS retorno		0	$350.000	FARDO
Jeans Hombre BETA 		0	$200.000	FARDO
Jeans hombre canada b		1	$220.000	FARDO
Jeans Loco TOM Y JERRY		0	$360.000	FARDO
Jeans Mujer  CANADA		3	$180.000	FARDO
jeans mujer beta		3	$160.000	FARDO
Jeans Mujer O/S CANADA 		1	$140.000	FARDO
Jordan y And One  25 KG		0	$240.000	FARDO
Jumper Beta		0	$300.000	FARDO
Jumper Canada		0	$300.000	FARDO
Ladies Fashion Sweater CANADA		0	$100.000	FARDO
lenceria beta		0	$400.000	FARDO
Lenceria CANADA		0	$350.000	FARDO
Leñadora CANADA 		2	$160.000	FARDO
Lino BETA		0	$180.000	FARDO
Mamemluco bebé TIGRE 		0	$140.000	FARDO
Mantel BETA.		1	$180.000	FARDO
Marca #2 CANADA		2	$280.000	FARDO
Marca Inv  S.A / 25 KG		0	$220.000	25 KILOS
Marca inv sacos 		0	$200.000	25 KILOS
Marca Invierno Talla Grande TOM Y JERRY		0	$250.000	FARDO
Marca niño mixto tom y jerry		0	$220.000	FARDO
MARCA VERANO POMS 		0	$200.000	FARDO
Mascota Coreana 40 kg		0	$250.000	FARDO
MASCOTA JK		1	$200.000	FARDO
Mix Chaqueta MDF		0	$120.000	FARDO
Mix Mujer Verano Premium BETA		1	$280.000	FARDO
Mixta Hombre invierno Premium BETA		0	$330.000	
Mixta mujer invierno premiun beta		8	$250.000	FARDO 
Mixta Mujer Invierno Talla Grande TOM Y JERRY		0	$260.000	FARDO
Mixta Mujer MT POMS		0	$120.000	FARDO
Mixta mujer verano premiun poms		0	$300.000	FARDO
Mixta Verano IM		19	$250.000	FARDO
Mixta  invierno  1ra beta		21	$120.000	FARDO
Mountain trecking BUZO tom y jerry		0	$260.000	FARDO
Musculosa Mujer CANADA		2	$120.000	FARDO
New Brand #1 IM		0	$350.000	FARDO
New brand exotico		0	$250.000	FARDO
New Brand STD IM		0	$200.000	FARDO
Niño Frio Beta		0	$100.000	FARDO
Niño Frio Dubai 1ra 		7	$300.000	FARDO
Niño inv 0/14 1y2 beta		1	$110.000	FARDO
Niño INV 1RA CANADA 		0	$220.000	FARDO
Niño invierno B CANADA		59	$140.000	FARDO
Niño Invierno Premiun BETA		5	$280.000	FARDO
Niño verano B CANADA		0	$140.000	FARDO
Niño Verano IM		43	$160.000	FARDO
niño verano p1 		0	$350.000	FARDO
Niño Verano Premiu BETA		0	$350.000	FARDO
North Face  Columbia  STD IM		0	$380.000	FARDO
North face jacket #2		0	$250.000	FARDO
North Face Jacket 25 KG		0	$330.000	FARDO
NYLON JOGUIN SUIT . FX		11	$280.000	FARDO
NYLON TRACKSUITE POMS		1	$180.000	FARDO
Old Navi Niño		0	$2.800	PIEZA
Original Short POMS 		0	$80.000	FARDO
Oversize  Premium Verano POMS 		0	$200.000	FARDO
Oversize Mixta Invierno Premium IM		3	$140.000	FARDO
Oversize Mixta Verano  Premium IM		27	$120.000	FARDO
Palazo BETA		0	$300.000	FARDO
Pantalon Cargo 1 Y 2 CANADA 		0	$200.000	FARDO
Pantalon Cotele BETA 		0	$130.000	FARDO
Pantalon Cotele Mujer CANADA 		0	$140.000	FARDO
Pantalon de trabajo		0	$180.000	FARDO
Pantalon de Vestir Hombre CANADA		4	$120.000	FARDO
Pantalon Deportivo BETA 		0	$300.000	FARDO
Pantalon Deportivo Marca POMS 25 KILOS 		0	$260.000	FARDO
Pantalon deportivo TOM Y JERRY		0	$150.000	FARDO
Pantalon Eco - Cuero IM		10	$180.000	FARDO
Pantalon Palazo IM		2	$240.000	FARDO
Pantalon Rayon Beta		0	$300.000	FARDO
Pantalón Rayon CANADA 		1	$280.000	FARDO
Pantalon Rayon IM		10	$200.000	FARDO
Pantalon Rayon tom y jerry		1	$230.000	FARDO
Pantalon secado rapido con chiporro 40 kg ( TPT )		0	$250.000	FARDO
Pantalon secado rapido coreano 40 kg ( TPL )		0	$250.000	FARDO
Pantalon Secado Rapido IM		12	$250.000	FARDO
Pantalon Skinny CANADA		5	$150.000	FARDO
Pantalon Vestir Mujer CANADA		3	$120.000	FARDO
PARKA 2DA POMS		0	$100.000	FARDO
Parka A		0	$200.000	FARDO
Parka Adulto Beta		0	$200.000	FARDO
Parka Adulto MDF		0	$200.000	FARDO
Parka Adulto Primera IM		0	$180.000	FARDO
Parka B Canada.		14	$140.000	FARDO
Parka coreana corta		0	$150.000	20 KILOS
Parka coreana corta y larga		0	$230.000	FARDO
parka coreana larga		23	$150.000	FARDO
PARKA CORTA TOM Y JERRY		8	$140.000	FARDO
Parka DE NIÑO 2DA		0	$50.000	FARDO
Parka JK		3	$180.000	FARDO
PARKA LARGA 2DA IM		0	$100.000	FARDO
Parka Larga IM 		0	$210.000	FARDO
PARKA LARGA TOM Y JERRY		61	$120.000	FARDO
Parka Niño 1ra IM		0	$70.000	FARDO
Parka Niño BETA		0	$200.000	FARDO
Parka Niño COREANA		70	$200.000	FARDO
Parka STD IM		31	$150.000	FARDO
ParkaSin Manga CANADA		0	$240.000	FARDO
Peto deportivo beta		0	$280.000	FARDO
Peto Deportivo CANADA 		1	$350.000	FARDO
Pijama Invierno CANADA		0	$120.000	FARDO
Pijama Invierno Premium BETA		5	$160.000	FARDO
Pijama Polar		0	$140.000	FARDO
Pijama Polar IM		0	$60.000	FARDO
PIJAMA POLAR JK		33	$100.000	FARDO
Pijama Polar zt		0	$90.000	FARDO
Pink  POMS 25 KG		0	$150.000	20 KILOS, FARDO, 25 KILOS
Pink  TOM Y JERRY 25 KG		0	$260.000	FARDO
Plus size  Hombre Invierno P1 IM		14	$220.000	FARDO
Plus Size  Mujer Invierno Crema IM		10	$220.000	FARDO
Plus Size Blusa beta		1	$200.000	FARDO
Plus Size Blusa IM		19	$160.000	FARDO
Plus Size Hombre Verano Crema IM		21	$200.000	FARDO
Plus Size Invierno Primera BETA		7	$130.000	FARDO
Plus Size Mixto POMS		0	$120.000	FARDO
Plus Size Polera Mujer Manga Corta Verano Premium		132	$100.000	FARDO
Plus Size Polera Musculosa Mujer  IM 		1	$150.000	FARDO
Plus Size Sumer Brand (Marca Verano ) IM		65	$250.000	FARDO
Plus Size Traje De Baño TARGET		1	$250.000	FARDO
Plus size Vestido BETA		0	$220.000	FARDO
Plus Size Vestido Media Estacion IM		14	$140.000	FARDO
Plus Size Vestido Verano CANADA		0	$220.000	FARDO
Plus Size Vestido Verano IM		0	$180.000	FARDO
Plus Size Winter Brand IM (Marca invierno)		0	$250.000	FARDO
POLAR ADULTO BT		2	$140.000	FARDO
Polar BETA 		10	$140.000	FARDO
polar canada		9	$120.000	FARDO
Polar Corderito IM		31	$120.000	FARDO
POLAR CORDERITO POMS		0	$100.000	FARDO
polar dubai		0	$100.000	FARDO
POLAR JK		17	$120.000	FARDO
Polar Marca 25 Kg		0		FARDO
Polar Moderno Premium BETA 		0	$260.000	FARDO
polar poms		0	$80.000	FARDO
Polar S.A		0	$120.000	FARDO
Polar TOM Y JERRY 		4	$80.000	FARDO
Polar Top IM		18	$80.000	FARDO
POLERA ATLETICA BETA		2	$220.000	FARDO
Polera Atletica primeras y segunda capa BETA		0	$250.000	FARDO
Polera Cuello De Tortuga CANADA 		3	$120.000	FARDO
Polera Deportiva B CANADA		0	$180.000	FARDO
Polera Deportiva Manga Corta IM		0	$150.000	FARDO
Polera Deportiva Premium		0	$330.000	FARDO
Polera Hombre M/C BETA		0	$210.000	FARDO
Polera Hombre M/C Canada		0	$210.000	FARDO
Polera Hombre M/C IM		70	$200.000	FARDO
Polera Hombre M/C POMS		0	$140.000	FARDO
Polera Hombre m/l		0	$120.000	FARDO
Polera Hombre M/L CANADA 		5	$150.000	FARDO
Polera Hombre M/L TOM Y JERRY		0	$120.000	FARDO
polera hombre ml canada 2.0		0	$140.000	FARDO
POLERA HOMBRE ML JK		4	$110.000	FARDO
Polera Hombre Plus Size CANADA		0	$160.000	FARDO
Polera M/C Hombre Plus Size  FE		0	$100.000	FARDO
Polera M/C Mujer Plus Size POMS		0	$80.000	FARDO
Polera m/l  Dubai		0	$140.000	FARDO
Polera m/l mujer JK		0	$100.000	FARDO
Polera Manga Corta Mujer IM 		80	$90.000	FARDO
Polera Manga Corta Mujer IM P1		36	$150.000	FARDO
Polera Marca deportiva 25 kg tom y jerry		14	$260.000	FARDO, 25 KILOS
Polera Marca m/c algodon 25 KG TOM Y JERRY		3	$240.000	FARDO
Polera Mujer  M/L Premium		0	$100.000	FARDO
Polera Mujer M/C Beta		0	$150.000	FARDO
Polera Mujer M/L / S.A		19	$70.000	FARDO
Polera Mujer M/L BETA		39	$100.000	FARDO
Polera Mujer m/l ZT		0	$80.000	FARDO
Polera Mujer Manga Corta B		4	$90.000	FARDO
Polera Mujer Manga corta FE		1	$100.000	FARDO
Poleron C Cierre IM		4	$60.000	FARDO
Poleron C/G  Niño TOP		0	$160.000	FARDO
Poleron C/G Delgado Fashion IM		0	$100.000	FARDO
Poleron C/G Niño TOP		1	$80.000	FARDO
Poleron C/G Primera BETA		13	$180.000	FARDO
poleron con gorro 1ra im		0	$120.000	FARDO
Poleron Con Gorro 1Y2 IM		33	$70.000	FARDO
Poleron Con Gorro CANADA		20	$120.000	FARDO
POLERON CON GORRO JK 2DA		1	$60.000	FARDO
Poleron con gorro marca 2da 25 kg 		0	$150.000	FARDO
Poleron Con Gorro Niño BETA  		0	$180.000	FARDO
POLERON CON GORRO O/S TIGRITO		47	$140.000	FARDO
Poleron Con Gorro P1 IM		0	$120.000	FARDO
Poleron Con Gorro Plus Size  CANADA 		0	$160.000	FARDO
Poleron con gorro S.A o/s		0	$80.000	FARDO
Poleron Con Gorro TIGRE 2da		49	$100.000	FARDO
Poleron Con Gorro Top CANADA		4	$220.000	FARDO
Poleron Con y Sin Gorro Poms		0	$120.000	FARDO
Poleron crop top 		0	$140.000	FARDO
Poleron Marca Algodon 25 KG TOM Y JERRY		0	$250.000	FARDO
Poleron Marca Deportivo TOM Y JERRY 25 KG		0	$280.000	FARDO
POLERON POLAR IM 		3	$80.000	FARDO
Poleron S/G CANADA		10	$90.000	FARDO
Poleron S/G Beta Premium 		5	$200.000	FARDO 
Poleron S/G TIGRE		0	$55.000	FARDO
Poleron S/G TOM Y JERRY		15	$80.000	FARDO
POLERON SIN GORRO BETA		13	$100.000	FARDO
POLERON SIN GORRO IM		29	$100.000	FARDO
POLERON SIN GORRO MARCA TOM Y JERRY 25 KG		0	$240.000	FARDO
Poleron sin gorro mujer 		48	$100.000	FARDO
poleron sin gorro poms 1Y2		0	$60.000	FARDO
POLERON Y BUZO NYLON POMS		0	$180.000	FARDO
PREMIUN WINTER MIX DUBAY		0	$220.000	FARDO
Ralph lauren formal inv 25kg		10	$220.000	FARDO, 25 KILOS
Ravanas BETA		9	$140.000	FARDO
Retorno Traje de Baño Target		0	$350.000	FARDO
Ropa Clinica TOM Y JERRY		0	$100.000	FARDO
Ropa de Casa "B" CANADA		2	$110.000	FARDO
Ropa de Casa A CANADA		5	$150.000	FARDO
Ropa de casa BETA		9	$140.000	FARDO
Ropa De Casa Navidad CANADA		0	$200.000	FARDO
Ropa De Casa TIGRE		0	$90.000	FARDO
Ropa De Perro BETA		0	$200.000	FARDO
ROPA DE SURF Y BUCEO 25 KG		6	$140.000	FARDO
ROPA DE SURF Y BUCEO 45 KG		2	$160.000	FARDO
Ropa De Trabajo		0	$200.000	FARDO
Ropa ejercio premium beta		0	$350.000	FARDO
Ropa Mascota FE 20KG		0	$120.000	FARDO
Ropa Mascota BETA		2	$260.000	FARDO
Ropa Sky Niño		0	$180.000	FARDO
Sabana beta		0	$140.000	FARDO
Sabana Blanca CANADA 		0	$150.000	FARDO
                                                                                                                                                                                                                                                                                         		1	$180.000	FARDO
Sabanas Canada B		1	$150.000	FARDO
Sabanas Canada A		2	$180.000	FARDO
Sabanas Franella BETA		0	$160.000	FARDO
Saco Mantel		0	$70.000	FARDO
Shein Brand IM 		10	$150.000	FARDO
Short 2da		14	$60.000	FARDO
Short Boxer IM		0	$170.000	FARDO
Short Cargo CANADA		0	$160.000	FARDO
Short Cargo O/S 1		1	$140.000	FARDO
Short Deportivo  Niño BETA		2	$250.000	FARDO
Short deportivo Beta		0	$280.000	FARDO
Short Deportivo Canada		0	$350.000	FARDO
Short Hombre Plus Size IM		0	$100.000	FARDO
Short Juvenil Beta		0	$190.000	FARDO
Short Mezclilla Beta		0	$180.000	FARDO
Short Mixto IM		0	$140.000	FARDO
Short Original canada		0	$120.000	FARDO
Short Sexy BETA		0	$140.000	FARDO
Short Sexy Tigre		0	$130.000	FARDO
Shorts sexi canada		0	$140.000	FARDO
Skinny  Jeans CANADA 		0	$140.000	FARDO
Sky Adulto IM              		10	$180.000	FARDO
SKY ADULTO JK		5	$180.000	FARDO
Sky Nieve Niño IM		23	$180.000	FARDO
Sky Niño JK		15	$140.000	FARDO
Summer Brand 2DA IM		4	$300.000	FARDO
Summer Brand STD (Marca Verano) IM		35	$220.000	FARDO
Super niño invierno P1 IM		7	$220.000	FARDO
SURF 20 KG IM		2	$90.000	FARDO
Surtido Crema niño y adulto 1ra RT 		20	$120.000	25 KILOS
Surtido Crema Premium RT		97	$150.000	20 KILOS, PIEZA, FARDO, 25 KILOS
Surtido Juvenil Invierno P1 IM		9	$180.000	FARDO
Surtido Plush CANADA		3	$100.000	FARDO
Surtido underamour .		150	$6.000	PIEZA
Plush Beta		2	$100.000	FARDO
Sweater Cardigan IM		11	$60.000	FARDO
Sweater hombre premium beta		2	$200.000	FARDO
Sweater Fashion Mujer POMS		2	$100.000	FARDO
Sweater Hombre CANADA 		2	$150.000	FARDO
Sweater Hombre Dubay.		4	$120.000	FARDO
Sweater juvenil  BETA		16	$100.000	FARDO
Sweater Largo BETA		4	$90.000	FARDO
Sweater Mujer Moderno Premium BETA		0	$180.000	FARDO
Sweater Niño CANADA 		0	$80.000	FARDO
sweater pesado		0	$260.000	FARDO
Sweater Pesado EMOJI 		0	$50.000	FARDO
Sweater Pesado IM		0	$60.000	FARDO
Sweater Vestido 1RA IM 		0	$100.000	FARDO
Sweter hombre Premiun BETA		1	$180.000	FARDO
Talla Grande Invierno 1ra BETA		0	$140.000	FARDO
Toallas Nuevas  POMS		1	$220.000	FARDO
Traje De Baño 		0	$120.000	FARDO
Traje De Baño Hombre Canada		0	$320.000	FARDO
Traje De Baño Mujer  IM		0	$100.000	FARDO
Traje de Baño p1		0	$220.000	FARDO
Traje De Baño POMS 		0	$80.000	FARDO
TRENCH COAT IM		0	$120.000	FARDO
Vestido Fiesta Beta 		1	$250.000	FARDO
Vestido Fiesta CANADA		1	$250.000	FARDO
Vestido Invierno CANADA 		1	$200.000	FARDO
Vestido invierno premium BETA		9	$180.000	FARDO
Vestido Media Estacion IM		60	$140.000	FARDO
vestido mini beta		0	$180.000	FARDO
Vestido MT POMS		1	$140.000	FARDO
Vestido Niña		0	$180.000	FARDO
Vestido Poliester		1	$220.000	FARDO
Vestido Polo		0	$220.000	FARDO
Vestido Polo FE 		0	$180.000	FARDO
Vestido Polo FE 2DA		0	$120.000	FARDO
Vestido Verano BETA 		0	$220.000	FARDO
Vestido Verano CANADA 		1	$220.000	FARDO
Winter brand 25 kg		0	$180.000	25 KILOS
Winter Mix JK 		37	$180.000	FARDO
Winter Premium Platinium CANADA 		0	$280.000	FARDO
Zapatilla De Marca SACO		0	$220.000	25 KILOS
Zapatillas Lona (CONVERSE, VANS, ETC)		14	$160.000	25 KILOS
Zara  Invierno 25 KG		0	$220.000	25 KILOS`;

async function importStock() {
  const stockCol = collection(db, 'stock');
  const lines = rawData.split('\n');
  let counter = 406;

  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Improved parsing: splitting by tabs and cleaning values
    const parts = line.split('\t');
    
    // Filter out empty parts
    const filteredParts = parts.filter(p => p.trim() !== '');
    
    if (filteredParts.length < 2) continue;
    
    // Last part is unit (if present and makes sense), second to last is price, previous is stock
    const unit = filteredParts[filteredParts.length - 1];
    const priceStr = filteredParts[filteredParts.length - 2];
    const stockStr = filteredParts[filteredParts.length - 3] || '0';
    
    const stockActual = parseInt(stockStr.replace('.', '').trim());
    const precioCosto = parseInt(priceStr.replace('$', '').replace('.', '').trim());
    const name = filteredParts.slice(0, filteredParts.length - 3).join(' ');

    const finalCodigo = `MDF-${counter.toString().padStart(3, '0')}`;
    try {
        await setDoc(doc(stockCol, finalCodigo), {
            codigo: finalCodigo,
            tipo: name,
            stockActual: isNaN(stockActual) ? 0 : stockActual,
            precioCosto: isNaN(precioCosto) ? 0 : precioCosto,
            unidad: unit,
            precioSugerido: isNaN(precioCosto) ? 0 : (precioCosto * 2),
            proveedor: 'Importación Inicial', 
            disponible: (isNaN(stockActual) ? 0 : stockActual) > 0,
            promocion: false,
            id: finalCodigo
        });
        console.log(`Imported ${name} as ${finalCodigo}`);
        counter++;
    } catch (e) {
        console.error(`Error importing ${name}:`, e);
    }
  }
  console.log('Import complete');
}

importStock();
