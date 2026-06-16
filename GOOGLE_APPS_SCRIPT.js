
/* 
   GUÍA DE INSTALACIÓN DEL BACKEND (NUBE)
   ======================================
   
   1. Abre tu Google Sheet donde quieres guardar los datos.
   2. Ve al menú: Extensiones > Apps Script.
   3. Borra cualquier código que haya y PEGA todo este código de abajo.
   4. Arriba a la derecha, haz clic en "Implementar" (Deploy) > "Nueva implementación".
   5. TIPO: "Aplicación web".
   6. DESCRIPCIÓN: "Backend MDF v1".
   7. EJECUTAR COMO: "Yo" (Tu correo).
   8. QUIÉN TIENE ACCESO: "Cualquier persona" (Anyone) -> ¡IMPORTANTE!.
   9. Haz clic en "Implementar", autoriza los permisos si te lo pide.
   10. COPIA la URL que dice "Aplicación web" (termina en /exec).
   11. Pega esa URL en la pantalla de inicio de tu Web App Cuaderno MDF.
*/

function doGet(e) {
  const wb = SpreadsheetApp.getActiveSpreadsheet();
  const data = {
    sales: getSheetData(wb, 'Ventas'),
    stock: getSheetData(wb, 'Stock'),
    staff: getSheetData(wb, 'Staff'),
    purchases: getSheetData(wb, 'Compras')
  };
  
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const wb = SpreadsheetApp.getActiveSpreadsheet();
    const json = JSON.parse(e.postData.contents);
    
    // Guardar cada entidad en su pestaña correspondiente
    if (json.sales) saveSheetData(wb, 'Ventas', json.sales);
    if (json.stock) saveSheetData(wb, 'Stock', json.stock);
    if (json.staff) saveSheetData(wb, 'Staff', json.staff);
    if (json.purchases) saveSheetData(wb, 'Compras', json.purchases);
    
    return ContentService.createTextOutput("SUCCESS");
  } catch (error) {
    return ContentService.createTextOutput("ERROR: " + error.toString());
  }
}

// Función auxiliar para leer datos
function getSheetData(wb, sheetName) {
  let sheet = wb.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length < 2) return []; // Solo encabezados o vacío
  
  const headers = values[0];
  const rows = values.slice(1);
  
  return rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      // Intentar parsear JSON si parece un array/objeto guardado como string
      let val = row[i];
      if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
        try { val = JSON.parse(val); } catch(e) {}
      }
      obj[h] = val;
    });
    return obj;
  });
}

// Función auxiliar para guardar datos (Sobreescritura completa para sincronización)
function saveSheetData(wb, sheetName, data) {
  if (!data || !Array.isArray(data) || data.length === 0) return;
  
  let sheet = wb.getSheetByName(sheetName);
  if (!sheet) { sheet = wb.insertSheet(sheetName); }
  
  sheet.clear(); // Limpiar hoja completa antes de escribir
  
  // Obtener encabezados del primer objeto
  const headers = Object.keys(data[0]);
  
  // Preparar filas
  const rows = data.map(item => headers.map(h => {
    const val = item[h];
    // Convertir objetos/arrays a string para guardar en celda
    if (typeof val === 'object' && val !== null) return JSON.stringify(val);
    return val;
  }));
  
  // Escribir encabezados y datos
  if (rows.length > 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}
