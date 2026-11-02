// TODO(multer): Controlador de imágenes de platos para el backoffice.
// - Recibir `req.file` (ya guardado por `uploadDishImage`) y guardar en el MenuItem
//   `imageUrl = /uploads/dishes/<req.file.filename>`.
// - Al reemplazar una imagen, borrar el archivo anterior de `uploads/dishes` (fs.unlink).
// - Si falla la actualización en Mongo, eliminar el archivo recién subido.
export {};
