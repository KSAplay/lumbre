import { Router } from "express";
import {
  getSettings,
  patchSettings,
} from "../controllers/settings.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";

const settingsRouter = Router();
const adminOnly = [authMiddleware, requireRole("backoffice")] as const;

settingsRouter.get("/", ...adminOnly, (req, res, next) => {
  void getSettings(req, res).catch(next);
});

settingsRouter.patch("/", ...adminOnly, (req, res, next) => {
  void patchSettings(req, res).catch(next);
});

export default settingsRouter;
