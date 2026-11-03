import { Router } from "express";
import {
  createCategory,
  createDish,
  getMenu,
  listCategories,
  patchCategory,
  patchDish,
  uploadDishImageHandler,
} from "../controllers/menu.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";
import { uploadDishImage } from "../middleware/upload.middleware.js";

const menuRouter = Router();
const adminOnly = [authMiddleware, requireRole("backoffice")] as const;

menuRouter.get("/", (req, res, next) => {
  void getMenu(req, res).catch(next);
});

menuRouter.get("/categorias", ...adminOnly, (req, res, next) => {
  void listCategories(req, res).catch(next);
});

menuRouter.post("/categorias", ...adminOnly, (req, res, next) => {
  void createCategory(req, res).catch(next);
});

menuRouter.patch("/categorias/:slug", ...adminOnly, (req, res, next) => {
  void patchCategory(req, res).catch(next);
});

menuRouter.post("/platos", ...adminOnly, (req, res, next) => {
  void createDish(req, res).catch(next);
});

menuRouter.patch("/platos/:code", ...adminOnly, (req, res, next) => {
  void patchDish(req, res).catch(next);
});

menuRouter.post(
  "/platos/:code/imagen",
  ...adminOnly,
  (req, res, next) => {
    uploadDishImage(req, res, (err) => {
      if (err) {
        next(err);
        return;
      }
      void uploadDishImageHandler(req, res).catch(next);
    });
  },
);

export default menuRouter;
