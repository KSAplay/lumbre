import { Router } from "express";
import {
  closeShift,
  getShift,
  listShifts,
} from "../controllers/shift.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";

const shiftRouter = Router();

shiftRouter.post(
  "/cerrar",
  authMiddleware,
  requireRole("recepcion"),
  (req, res, next) => {
    void closeShift(req, res).catch(next);
  },
);

shiftRouter.get(
  "/",
  authMiddleware,
  requireRole("backoffice"),
  (req, res, next) => {
    void listShifts(req, res).catch(next);
  },
);

shiftRouter.get(
  "/:id",
  authMiddleware,
  requireRole("backoffice"),
  (req, res, next) => {
    void getShift(req, res).catch(next);
  },
);

export default shiftRouter;
