import { Router } from "express";
import { getMenu } from "../controllers/menu.controller.js";

const menuRouter = Router();

menuRouter.get("/", (req, res, next) => {
  void getMenu(req, res).catch(next);
});

// TODO(multer): Rutas del backoffice para crear/editar platos con imagen
// (authMiddleware + requireRole("backoffice") + uploadDishImage), p. ej.
// POST /menu/platos y PUT /menu/platos/:code/imagen.

export default menuRouter;
