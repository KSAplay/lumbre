import { Router } from "express";
import {
  getFloorPlan,
  putFloorPlan,
  releaseCleaningTables,
  updateTableStatus,
} from "../controllers/table.controller.js";
import {
  requestBill,
  requestHelp,
  sendManualRound,
  sendRound,
} from "../controllers/order.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const tableRouter = Router();

tableRouter.get("/plano", (req, res, next) => {
  void getFloorPlan(req, res).catch(next);
});

tableRouter.put("/plano", authMiddleware, (req, res, next) => {
  void putFloorPlan(req, res).catch(next);
});

tableRouter.post("/mesas/liberar-limpias", authMiddleware, (req, res, next) => {
  void releaseCleaningTables(req, res).catch(next);
});

tableRouter.post("/mesas/:id/estado", authMiddleware, (req, res, next) => {
  void updateTableStatus(req, res).catch(next);
});

tableRouter.post("/mesas/:id/ayuda", (req, res, next) => {
  void requestHelp(req, res).catch(next);
});

tableRouter.post("/mesas/:id/cuenta", (req, res, next) => {
  void requestBill(req, res).catch(next);
});

tableRouter.post("/mesas/:id/rondas", (req, res, next) => {
  void sendRound(req, res).catch(next);
});

tableRouter.post("/mesas/:id/rondas/manual", authMiddleware, (req, res, next) => {
  void sendManualRound(req, res).catch(next);
});

export default tableRouter;
