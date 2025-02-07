const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// ✅ Definir la variable para evitar "ReferenceError"
const fileExpirations = {};

// Directorio donde se guardarán los archivos subidos
const uploadDir = path.join(__dirname, 'uploads');

// ✅ Crear la carpeta 'uploads' si no existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento de Multer con nombres seguros
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Reemplazar espacios y caracteres especiales en el nombre del archivo
    const safeFileName = file.originalname
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quita acentos
  .replace(/\s+/g, "_") // Reemplaza espacios por "_"
  .replace(/[^a-zA-Z0-9._-]/g, ""); // Elimina caracteres especiales


    console.log(`📁 Guardando archivo como: ${safeFileName}`);
    cb(null, safeFileName);
  }
});

// Configuración de Multer
const upload = multer({ storage });

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));

// Ruta para subir archivos
app.post('/upload', upload.single('archivo'), (req, res) => {
  try {
    console.log("📥 Datos recibidos en el servidor:", req.body);
    console.log("📂 Archivo recibido:", req.file);

    if (!req.file) {
      console.error("⚠️ Error: No se subió ningún archivo.");
      return res.status(400).json({ success: false, error: "❌ No se ha subido ningún archivo." });
    }

    const fileName = req.file.filename; 
    let expirationMinutes = parseInt(req.body.expiration) || 5;
    expirationMinutes = Math.min(expirationMinutes, 20);

    fileExpirations[fileName] = Date.now() + expirationMinutes * 60 * 1000;

    console.log(`📂 Archivo guardado como "${fileName}" (Expira en ${expirationMinutes} minutos)`);

    res.json({ success: true, file: fileName, expiration: expirationMinutes });
  } catch (error) {
    console.error("🔥 Error en la subida:", error);
    res.status(500).json({ success: false, error: "❌ Error interno en la subida." });
  }
});





// Ruta de descarga
app.get('/download', (req, res) => {
  const fileName = req.query.file;  // Ya viene decodificado por Express
  if (!fileName)
    return res.status(400).send('❌ No se ha especificado ningún archivo.');

  const filePath = path.join(uploadDir, fileName);

  if (!fs.existsSync(filePath)) {
    console.error(`⚠️ Error: El archivo "${filePath}" no existe.`);
    return res.status(404).send('<h2>❌ El archivo no existe.</h2>');
  }

  console.log(`📥 Descargando archivo: ${fileName}`);
  res.download(filePath);
});


// Iniciar el servidor
app.listen(port, () => {
  console.log(`✅ Servidor en http://localhost:${port}`);
});
