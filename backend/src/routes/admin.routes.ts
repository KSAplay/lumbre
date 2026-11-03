import { Router } from "express";
import { getDaySummary } from "../controllers/admin.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";

const adminRouter = Router();

adminRouter.get(
  "/resumen",
  authMiddleware,
  requireRole("backoffice"),
  (req, res, next) => {
    void getDaySummary(req, res).catch(next);
  },
);

export default adminRouter;
