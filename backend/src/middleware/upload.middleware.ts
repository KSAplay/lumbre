// TODO(multer): Configurar la subida de imágenes de platos desde el backoffice.
// - diskStorage con destino `uploads/dishes` (la carpeta que sirve `app.ts` en /uploads).
// - filename único (p. ej. `<code>-<timestamp>.<ext>`) para no pisar imágenes ni cachés.
// - fileFilter: solo image/png, image/jpeg y image/webp.
// - limits: tamaño máximo razonable (p. ej. 2 MB).
// - Exportar `uploadDishImage = multer({...}).single("image")`.
export {};
