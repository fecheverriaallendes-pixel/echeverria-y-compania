const fs = require('fs');

const rawData = `Abrigo Corto Mujer CANADA		0	$120.000	FARDO
Abrigo Lana Hombre Corto IM		6	$90.000	FARDO
Abrigo Lana Mujer Corto IM		1	$90.000	FARDO
Abrigo largo CANADA		0	$130.000	FARDO
Abrigo Moderno BETA 		0	$140.000	FARDO
Abrigo mujer JK		3	$90.000	FARDO
Accesorios Navidad IM		3	$140.000	FARDO
Artes Marciales CANADA		1	$80.000	FARDO
Baby Platinium IM		0	$180.000	FARDO
Banana Republic IM		0	$150.000	FARDO
Blazer Invierno CANADA		1	$180.000	FARDO
Blazer Juvenil IM		0	$120.000	FARDO
Blazer verano		0	$180.000	FARDO
Blusa Fancy BETA		0	$200.000	FARDO
Blusa Fanella BETA		10	$100.000	FARDO
Blusa Invierno IM		3	$100.000	FARDO
Blusa m/l FE		0	$80.000	FARDO
Blusa Media Estación FE		0	$100.000	FARDO
Blusa Media Temporada MDF		0	$220.000	FARDO
Blusa poly BETA		0	$180.000	FARDO
Blusa Poly IM		0	$160.000	FARDO
Blusa verano canada		0	$220.000	FARDO
Blusa Verano Plus Size CANADA		1	$180.000	FARDO
Blusas BETA		0	$180.000	FARDO
Buzo A CANADA 		0	$220.000	FARDO
Buzo algodon  TOM Y JERRY		0	$120.000	FARDO
BUZO ALGODON CANADA 2.0		0	$160.000	FARDO
BUZO ALGODON CANADA 2.0 1RA		0	$220.000	FARDO
Buzo Algodon Im		0	$120.000	FARDO
Buzo algodon O/S Tom y jerry		0	$120.000	FARDO
Buzo Canada SPL		0	$140.000	FARDO
Buzo JK		0	$140.000	FARDO
Buzo Juvenil BETA		0	$200.000	FARDO
Buzo Marca 25 KG ALGODON TOM Y JERRY 		0	$240.000	FARDO
Buzo Marca nylon 25 kg TOM Y JERRY		0	$260.000	FARDO
Buzo Niño		0	$200.000	FARDO
Buzo Nylon TOM Y JERRY		0	$220.000	FARDO
Buzo Old Navy		0	$200.000	FARDO
Buzo Poly		0	$260.000	FARDO
Buzo polyester BETA 		0	$260.000	FARDO
Buzo y chaqueta de nylon prem beta		0	$350.000	FARDO
Buzo y Chaqueta Entrenamiento		2	$220.000	FARDO
Buzo y Chaqueta Poliester Premium BETA		0	$350.000	FARDO
Calcetin  ZT		0	$140.000	FARDO
Calcetin Beta		0	$160.000	FARDO
Calcetin Canada		2	$180.000	FARDO
Calvin Klein y algo de Guess invierno  25KG		0	$220.000	25 KILOS
Calza 3/4 CANADA		1	$250.000	FARDO
Calza Corta Deportiva CANADA		0	$330.000	FARDO
Calza deportiva 		0	$220.000	FARDO
Calza Deportiva BETA		0	$280.000	FARDO
Calza deportiva CANADA		0	$280.000	FARDO
Calza Deportiva IM		0	$180.000	FARDO
Calza Deportiva Marca 25 kg TOM Y JERRY 		0	$220.000	FARDO
Calza Invierno CANADA 		0	$180.000	FARDO
Calza Moderna Leggins 		0	$140.000	FARDO
Calzon		0	$180.000	FARDO
Camisa De Hombre M/C CANADA 		0	$140.000	FARDO
Camisa De Hombre TIGRE.		0	$100.000	FARDO
Camisa Franella BETA		3	$160.000	FARDO
Camisa Mezclilla CANADA  		0	$160.000	FARDO
Camisa ML Hombre Premiun BETA		2	$180.000	FARDO
Camisas Hombre M/L y M/C		0	$250.000	FARDO
Capri BETA		0	$100.000	FARDO
Capri CANADA		3	$70.000	FARDO
Chamarra BETA		1	$250.000	FARDO
Chamarra Niño BETA 		1	$180.000	FARDO
Chaqueta Atletica (Poleron Deportivo) BETA		2	$250.000	FARDO
Chaqueta De Cuero 1RA IM		0	$120.000	FARDO
Chaqueta De Cuero 2DA IM		4	$100.000	FARDO
Chaqueta De Entrenamiento CANADA		0	$200.000	FARDO
Chaqueta Fashion CANADA		4	$180.000	FARDO
Chaqueta Gamuza 20 kg IM		0	$80.000	FARDO
Chaqueta Invierno CANADA 		0	$180.000	FARDO
Chaqueta Jeans  B CANADA		4	$180.000	FARDO
Chaqueta Jeans 1 Y 2 TOM Y JERRY 		93	$80.000	FARDO
Chaqueta Jeans BETA		0	$210.000	FARDO
Chaqueta Liviana CANADA		0	$140.000	FARDO
CHAQUETA LIVIANA CANADA		0	$300.000	FARDO
Chaqueta Moderna BETA		0	$140.000	FARDO
Chaqueta moderna IM		4	$120.000	FARDO
Chaqueta Mujer Marca 25 kg TOM Y JERRY		0	$200.000	FARDO
Chaqueta Polar BETA 		5	$140.000	FARDO
Chic Pant ( jogger mujer) CANADA		1	$220.000	FARDO
CK/ GUESS 25 KILOS 		0	$200.000	FARDO
Clinico CANADA		0	$180.000	FARDO
Clinico im		0	$100.000	FARDO
Cobertor CANADA 		1	$160.000	FARDO
Cojin CANADA		0	$120.000	FARDO
Colcha Lana CANADA 		3	$130.000	FARDO
Columbia  25 KG Media Temporada Verano		0	$260.000	FARDO
Columbia 50 PRENDAS		0	$320.000	20 KILOS
Columbia Jacket 25 KG TOMY JERRY		0	$300.000	FARDO
Conjunto Zara 25 unidades RETORNO		0	$250.000	FARDO
Corderito Polar  TOM Y JERRY		0	$120.000	FARDO
Cortaviento 		0	$200.000	FARDO
Cortaviento  A CANADA		0	$220.000	FARDO
CORTAVIENTO 1RA  CNADA 2.0		0	$220.000	FARDO
CORTAVIENTO 2DA CANADA 2.0		0	$160.000	FARDO
Cortaviento B		0	$140.000	FARDO
Cortaviento Marca  25 KLS		0	$400.000	FARDO
Cortaviento TOM Y JERRY  40 KG		0	$160.000	FARDO
Cortaviento Vintage  POMS 25 KILOS 		0	$180.000	FARDO
Cortavientos beta		0	$220.000	FARDO
COTELE DE HOMBRE CANADA 		1	$180.000	FARDO
Cotsco Hombre		0	$6.000	PIEZA
Crip Crop Top CANADA		9	$180.000	FARDO
Crop Top  Invierno IM		4	$140.000	FARDO
Cubre colchon #1 IM		13	$100.000	FARDO
Deportivo 1RA IM 		0	$280.000	FARDO
Deportivo A		0	$330.000	FARDO
Deportivo Adulto BETA 1RA		0	$300.000	FARDO
Deportivo B		0	$220.000	FARDO
Deportivo Crema F		0	$400.000	FARDO
Deportivo Economico Beta		0	$300.000	FARDO
Deportivo Invierno Nylon  TOM Y JERRY		23	$180.000	FARDO
Deportivo Niño BETA		0	$280.000	FARDO
Deportivo O/S 		5	$100.000	FARDO
Deportivo Plus Size Crema IM		25	$200.000	FARDO
Deportivo Plus SIze Track Suite IM		0	$140.000	FARDO
Deportivo Premium Im		0	$350.000	FARDO
Deportivo Verano		0	$300.000	FARDO
Disfraz 2da		3	$80.000	FARDO
Disfraz adulto im		2	$100.000	FARDO
Disfraz Canada		1	$160.000	FARDO
Disfraz niño im 		3	$100.000	FARDO
Disfraz niño im p1		5	$140.000	FARDO
Enterito Bebe Pijama Canada		0		FARDO
Enterito canada		0	$280.000	FARDO
enterito fe		0	$250.000	FARDO
Enterito mameluco niño JK 		10	$140.000	FARDO
Falda de Cuero IM		1	$160.000	FARDO
Falda Invierno CANADA 		1	$160.000	FARDO
Falda Verano CANADA		1	$160.000	FARDO
Fashion Brand Exotico IM		0	$180.000	FARDO
Fashion Brand IM		0	$210.000	FARDO
FF Exotico IM		12	$140.000	FARDO
Frazada BETA		2	$140.000	FARDO
Frazada CANADA 		1	$140.000	FARDO
GAP 25 KLS		0	$200.000	FARDO
Gorro Y Bufanda CANADA 		2	$80.000	FARDO
Halloween		3	$100.000	FARDO
Halloween disfraz nuevo 		0	$2.800	PIEZA
Jardinera Mezclilla beta		0	$160.000	FARDO
Jardinera short IM		10	$80.000	FARDO
Jean levis mujer		0	$350.000	FARDO
Jeans Fashion 50 PIEZAS 		0	$350.000	FARDO
Jeans Hombre BETA 		0	$200.000	FARDO
Jeans hombre canada b		0	$220.000	FARDO
Jeans Loco TOM Y JERRY		0	$360.000	FARDO
Jeans Mujer  CANADA		2	$180.000	FARDO
Jeans Mujer BETA		4	$160.000	FARDO
Jeans Mujer O/S CANADA 		1	$140.000	FARDO
Jordan y And One  25 KG		0	$240.000	FARDO
Jumper Beta		0	$300.000	FARDO
Jumper Canada		0	$300.000	FARDO
Ladies Fashion Sweater CANADA		0	$100.000	FARDO
lenceria beta		1	$400.000	FARDO
Lenceria CANADA		0	$350.000	FARDO
Leñadora CANADA 		0	$160.000	FARDO
Lino BETA		0	$180.000	FARDO
Mamemluco bebé TIGRE 		0	$140.000	FARDO
Mantel BETA.		1	$180.000	FARDO
Marca #2 CANADA		3	$280.000	FARDO
Marca Invierno Talla Grande TOM Y JERRY		0	$250.000	FARDO
Mix Chaqueta MDF		0	$120.000	FARDO
Mix Mujer Verano Premium BETA		1	$280.000	FARDO
Mixta Hombre invierno Premiun BETA		0	$330.000	
Mixta mujer invierno premiun beta		5	$250.000	FARDO 
Mixta Mujer Invierno Talla Grande TOM Y JERRY		0	$260.000	FARDO
Mixta mujer verano premiun poms		0	$300.000	FARDO
Mixta Verano IM		16	$250.000	FARDO
Mixto Invierno 1RA BETA		17	$120.000	FARDO
Musculosa Mujer CANADA		2	$120.000	FARDO
New Brand #1 IM		0	$350.000	FARDO
New brand exotico		0	$250.000	FARDO
New Brand STD IM		0	$200.000	FARDO
Niño Frio Beta		0	$100.000	FARDO
niño inv 0/14 1y2 beta		0	$110.000	FARDO
Niño INV 1RA CANADA 		0	$220.000	FARDO
Niño invierno B CANADA		15	$150.000	FARDO
Niño Invierno Premiun BETA		9	$280.000	FARDO
Niño verano B CANADA		0	$140.000	FARDO
Niño Verano IM		36	$160.000	FARDO
niño verano p1 		0	$350.000	FARDO
Niño Verano Premiu BETA		1	$350.000	FARDO
North Face  Columbia A STD IM		0	$380.000	FARDO
North Face Jacket 25 KG		0	$320.000	FARDO
Old Navi Niño		0	$2.800	PIEZA
Original Short POMS 		0	$80.000	FARDO
Oversize  Premium Verano POMS 		0	$200.000	FARDO
Oversize Mixta Invierno Premium IM		5	$130.000	FARDO
Oversize Mixta Verano  Premium IM		17	$120.000	FARDO
Palazo BETA		0	$300.000	FARDO
Pantalon Cargo 1 Y 2 CANADA 		0	$200.000	FARDO
Pantalon Cotele BETA 		0	$130.000	FARDO
Pantalon Cotele Mujer CANADA 		2	$140.000	FARDO
Pantalon de trabajo		0	$180.000	FARDO
Pantalon de Vestir Hombre CANADA		4	$120.000	FARDO
Pantalon Deportivo BETA 		0	$300.000	FARDO
Pantalon Deportivo Marca POMS 25 KILOS 		0	$260.000	FARDO
Pantalon deportivo TOM Y JERRY		0	$150.000	FARDO
Pantalon Eco - Cuero IM		4	$180.000	FARDO
Pantalon Palazo IM		2	$240.000	FARDO
Pantalon Rayon Beta		0	$300.000	FARDO
Pantalón Rayon CANADA 		1	$280.000	FARDO
Pantalon Rayon IM		6	$240.000	FARDO
Pantalon Secado Rapido IM		0	$250.000	FARDO
Pantalon Skinny CANADA		3	$150.000	FARDO
Pantalon Vestir CANADA		2	$120.000	FARDO
Parka A		0	$200.000	FARDO
Parka Adulto Beta		0	$200.000	FARDO
Parka Adulto MDF		0	$200.000	FARDO
Parka Adulto Primera IM		0	$180.000	FARDO
Parka B		0	$140.000	FARDO
Parka coreana corta		23	$150.000	20 KILOS
Parka coreana corta y larga		0	$230.000	FARDO
Parka COREANA larga		0	$150.000	FARDO
Parka DE NIÑO 2DA		0	$50.000	FARDO
Parka Italiana 40 kg 		4	$200.000	FARDO
Parka Larga IM 		0	$150.000	FARDO
Parka Niño 1ra IM		0	$70.000	FARDO
Parka Niño BETA		0	$200.000	FARDO
Parka Niño COREANA		2	$200.000	FARDO
Parka STD IM		0	$150.000	FARDO
ParkaSin Manga CANADA		1	$240.000	FARDO
Peto deportivo beta		0	$280.000	FARDO
Peto Deportivo CANADA 		1	$350.000	FARDO
Pijama Invierno CANADA		0	$120.000	FARDO
Pijama Invierno Premium BETA		1	$180.000	FARDO
Pijama Polar		0	$140.000	FARDO
Pijama Polar CANADA 2.0		0	$80.000	FARDO
Pijama Polar IM		0	$50.000	FARDO
Pijama Polar zt		2	$90.000	FARDO
Pink  POMS 25 KG		0	$150.000	20 KILOS
Pink  TOM Y JERRY 25 KG		0	$260.000	FARDO
Plus size  Hombre Invierno P1 IM		14	$200.000	FARDO
Plus Size  Mujer Invierno Crema IM		9	$220.000	FARDO
Plus Size Blusa beta		0	$200.000	FARDO
Plus Size Blusa IM		10	$160.000	FARDO
Plus Size Hombre Verano Crema IM		17	$200.000	FARDO
Plus Size Invierno Premium BETA		3	$200.000	FARDO
Plus Size Mixto POMS		0	$120.000	FARDO
Plus Size Mujer Verano P1 IM		19	$220.000	FARDO
Plus Size Polera Mujer Manga Corta Verano Premium		82	$100.000	FARDO
Plus Size Polera Musculosa Mujer  IM 		1	$150.000	FARDO
Plus Size Sumer Brand (Marca Verano ) IM		37	$250.000	FARDO
Plus Size Traje De Baño TARGET		1	$250.000	FARDO
Plus size Vestido BETA		0	$220.000	FARDO
Plus Size Vestido Media Estacion IM		13	$150.000	FARDO
Plus Size Vestido Verano CANADA		0	$220.000	FARDO
Plus Size Vestido Verano IM		0	$180.000	FARDO
Plus Size Winter Brand IM (Marca invierno)		0	$250.000	FARDO
polar canada		0	$130.000	FARDO
Polar Corderito IM		0	$120.000	FARDO
polar dubai		8	$100.000	FARDO
Polar IM		0	$130.000	FARDO
Polar Marca 25 Kg		0	$200.000	FARDO
Polar Moderno Premium BETA 		0	$260.000	FARDO
Polar POMS 		0	$80.000	FARDO
Polar S.A		0	$120.000	FARDO
Polar TOM Y JERRY 		1	$80.000	FARDO
Polar Top IM		0	$60.000	FARDO
POLERA ATLETICA BETA		2	$220.000	FARDO
Polera Atletica primeras y segunda capa BETA		1	$250.000	FARDO
Polera Cuello De Tortuga CANADA 		4	$120.000	FARDO
Polera Deportiva B CANADA		0	$180.000	FARDO
Polera Deportiva Manga Corta IM		0	$150.000	FARDO
Polera Deportiva Premium		0	$330.000	FARDO
Polera Hombre M/C BETA		0	$210.000	FARDO
Polera Hombre M/C Canada		0	$210.000	FARDO
Polera Hombre M/C IM		13	$200.000	FARDO
Polera Hombre M/C POMS		0	$140.000	FARDO
Polera Hombre m/l		0	$120.000	FARDO
Polera Hombre M/L CANADA 		0	$150.000	FARDO
Polera Hombre m/l IM		0	$120.000	FARDO
Polera Hombre M/L TOM Y JERRY		0	$130.000	FARDO
Polera Hombre Plus Size CANADA		0	$160.000	FARDO
Polera M/C Hombre Plus Size  FE		0	$100.000	FARDO
Polera M/C Mujer Plus Size POMS		0	$80.000	FARDO
Polera m/l mujer JK		0	$100.000	FARDO
Polera Manga Corta Mujer IM 		30	$100.000	FARDO
Polera Manga Corta Mujer IM P1		16	$150.000	FARDO
Polera Marca m/c 25 KG TOM Y JERRY		0	$240.000	FARDO
Polera Mujer  M/L Premium		0	$100.000	FARDO
Polera Mujer M/C Beta		0	$150.000	FARDO
Polera Mujer M/L / S.A		0	$70.000	FARDO
Polera Mujer M/L BETA		3	$100.000	FARDO
Polera Mujer m/l ZT		0	$80.000	FARDO
Polera Mujer Manga Corta B		4	$90.000	FARDO
Polera Mujer Manga corta FE		1	$100.000	FARDO
Polera Niño M/L TIGRE		0	$120.000	FARDO
Polera Plus Size Hombre m/c IM		0	$110.000	FARDO
Poleron  Con Gorro Premium BETA		0	$280.000	FARDO
Poleron C/G  IM 1Y2 		0	$60.000	FARDO
Poleron C/G Delgado Fashion IM		0	$100.000	FARDO
Poleron C/G Niño TOP		0	$160.000	FARDO
Poleron C/G Primera BETA		25	$180.000	FARDO
Poleron Con Cierre IM		0	$90.000	FARDO
Poleron con gorro 1ra im		0	$120.000	FARDO
Poleron Con Gorro 2DA		0	$50.000	FARDO
Poleron Con Gorro CANADA		13	$120.000	FARDO
Poleron con gorro marca 2da 25 kg 		0	$150.000	FARDO
Poleron Con Gorro Niño BETA  		0	$180.000	FARDO
Poleron Con Gorro Plus Size  CANADA 		0	$160.000	FARDO
Poleron con gorro S.A o/s		0	$80.000	FARDO
Poleron Con Gorro TIGRE 2da		0	$100.000	FARDO
Poleron Con Gorro Top CANADA		0	$220.000	FARDO
Poleron Con y Sin Gorro Poms		0	$120.000	FARDO
Poleron crop top 		0	$140.000	FARDO
POLERON MARCA ALGODON 25 KG TOM Y JERRY		0	$250.000	FARDO
Poleron Marca Deportivo TOM Y JERRY 25 KG		0	$280.000	FARDO
Poleron S/G BETA		21	$100.000	FARDO
Poleron S/G CANADA		12	$90.000	FARDO
Poleron S/G Canada 2,0		0	$70.000	FARDO 
Poleron S/G TIGRE		4	$55.000	FARDO
Poleron S/G TOM Y JERRY		17	$80.000	FARDO
Poleron Sin Gorro Marca  25 KG TOM Y JERRY		0	$240.000	FARDO
Ravanas BETA		10	$140.000	FARDO
Retorno Traje de Baño Target		0	$350.000	FARDO
Ropa Clinica TOM Y JERRY		0	$100.000	FARDO
Ropa de Casa "B" CANADA		2	$110.000	FARDO
Ropa de Casa A CANADA		1	$150.000	FARDO
Ropa de casa BETA		3	$140.000	FARDO
Ropa De Casa Navidad CANADA		0	$200.000	FARDO
Ropa De Casa TIGRE		0	$90.000	FARDO
Ropa De Perro BETA		0	$200.000	FARDO
Ropa De Trabajo		0	$200.000	FARDO
Ropa ejercio premium beta		0	$350.000	FARDO
Ropa Mascota FE 20KG		0	$120.000	FARDO
Ropa Mascota IM 		0	$200.000	FARDO
Ropa Sky Niño		0	$180.000	FARDO
Sabana beta		0	$140.000	FARDO
Sabana Blanca CANADA 		0	$150.000	FARDO
Sabana Franella CANADA 		0	$180.000	FARDO
Sabanas bajeras		0	$140.000	FARDO
Sabanas Canada		0	$180.000	FARDO
Sabanas Franella BETA		0	$160.000	FARDO
Saco Mantel		0	$70.000	FARDO
Shein Brand IM de		8	$150.000	FARDO
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
Sky Adulto IM		0	$160.000	FARDO
Sky Nieve Niño IM		0	$140.000	FARDO
Sky Niño JK		9	$140.000	FARDO
Summer Brand 2DA IM		1	$300.000	FARDO
Summer Brand STD (Marca Verano) IM		0	$220.000	FARDO
Super niño invierno P1 IM		0	$180.000	FARDO
Surf  20 KG IM		0	$90.000	FARDO
Surtido Crema niño y adulto 1ra RT 		17	$120.000	FARDO
Surtido Crema Premium RT		100	$150.000	20 KILOS, 25 KILOS, PIEZA, FARDO
Surtido Juvenil Invierno P1 IM		18	$180.000	FARDO
Surtido Plush CANADA		2	$100.000	FARDO
Sweater  CANADA 		0	$60.000	FARDO
Sweater Cardigan IM		0	$50.000	FARDO
Sweater Fashion Mujer POMS		0	$100.000	FARDO
Sweater Hombre CANADA 		2	$150.000	FARDO
Sweater Hombre POMS		4	$120.000	FARDO
Sweater juvenil  BETA		12	$100.000	FARDO
Sweater Largo BETA		0	$90.000	FARDO
Sweater Mujer Moderno Premium BETA		0	$180.000	FARDO
Sweater Niño CANADA 		0	$80.000	FARDO
Sweater Pesado EMOJI 		0	$50.000	FARDO
Sweater Pesado IM		14	$50.000	FARDO
Sweater Vestido 1RA IM 		3	$100.000	FARDO
Sweter hombre Premiun BETA		2	$180.000	FARDO
Talla Grande Invierno 1ra BETA		0	$140.000	FARDO
Toallas Nuevas  POMS		4	$220.000	FARDO
Traje De Baño 		0	$120.000	FARDO
Traje De Baño Hombre Canada		0	$320.000	FARDO
Traje De Baño Mujer  IM		0	$100.000	FARDO
Traje de Baño p1		0	$220.000	FARDO
Traje De Baño POMS 		0	$80.000	FARDO
Vestido De Novia CANADA 		0	$250.000	FARDO
Vestido Fiesta TOM Y JERRY		0	$320.000	FARDO
Vestido Invierno CANADA 		0	$200.000	FARDO
Vestido invierno premium BETA		8	$180.000	FARDO
Vestido Media Estacion IM		41	$140.000	FARDO
vestido mini beta		0	$180.000	FARDO
Vestido Niña		0	$180.000	FARDO
Vestido Poliester		1	$220.000	FARDO
Vestido Polo		0	$220.000	FARDO
Vestido Polo FE 		0	$180.000	FARDO
Vestido Verano BETA 		0	$220.000	FARDO
Vestido Verano CANADA 		1	$220.000	FARDO
VESTIDOS POLO FE 2DA		0	$120.000	FARDO
Winter Mix JK 		0	$180.000	FARDO
Winter Premium Platinium CANADA 		0	$280.000	FARDO
Zara  Invierno 25 KG		0	$220.000	25 KILOS`;

const lines = rawData.trim().split('\n');
let items = [];
let counter = 1;

const providers = ['IM', 'JK', 'BETA', 'CANADA', 'TOM Y JERRY', 'ZARA', 'CASA DE ROPA', 'POMS', 'TIGRE', 'FE', 'OLD NAVY', 'SHEIN', 'TARGET', 'RT', 'S.A', 'ZT', 'MDF', 'PLATINIUM'];

for (const line of lines) {
  if (!line.trim()) continue;
  const parts = line.split('\t').map(p => p.trim()).filter(p => p !== '');
  if (parts.length < 2) continue;
  
  let tipo = parts[0];
  let stockActual = parseInt(parts[1], 10) || 0;
  
  let precioStr = '0';
  let unidad = 'FARDO';
  
  if (parts.length === 3) {
    if (parts[2].includes('$') || /\d/.test(parts[2])) {
      precioStr = parts[2];
    } else {
      unidad = parts[2];
    }
  } else if (parts.length >= 4) {
    precioStr = parts[2];
    unidad = parts[3];
  }

  let precioSugerido = parseInt(precioStr.replace(/[^0-9]/g, ''), 10) || 0;

  let proveedor = 'General';
  for (const p of providers) {
    if (tipo.toUpperCase().includes(p)) {
      proveedor = p;
      break;
    }
  }

  items.push(`  { codigo: 'MDF-${String(counter).padStart(3, '0')}', tipo: '${tipo.replace(/'/g, "\\'")}', proveedor: '${proveedor}', precioCosto: 0, precioSugerido: ${precioSugerido}, stockActual: ${stockActual}, unidad: '${unidad}' }`);
  counter++;
}

const newStockCode = `const INITIAL_MASTER_STOCK: Omit<StockItem, 'id' | 'disponible'>[] = [\n${items.join(',\n')}\n];`;

const filePath = 'store/GlobalContext.tsx';
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(/const INITIAL_MASTER_STOCK: Omit<StockItem, 'id' \| 'disponible'>\[\] = \[[\s\S]*?\];/, newStockCode);
fs.writeFileSync(filePath, content);
console.log('Stock updated successfully. Total items:', items.length);
