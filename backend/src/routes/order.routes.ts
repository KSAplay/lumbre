import { Router } from "express";
import {
  completeRound,
  confirmRound,
  getKitchenTickets,
  getPendingOrders,
  getTableRounds,
  patchOrderAlert,
  patchOrderItem,
  rejectRound,
  restoreRound,
} from "../controllers/order.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const orderRouter = Router();

orderRouter.get("/rondas", (req, res, next) => {
  void getTableRounds(req, res).catch(next);
});

orderRouter.get("/rondas/pendientes", authMiddleware, (req, res, next) => {
  void getPendingOrders(req, res).catch(next);
});

orderRouter.post("/rondas/:id/confirmar", authMiddleware, (req, res, next) => {
  void confirmRound(req, res).catch(next);
});

orderRouter.post("/rondas/:id/rechazar", authMiddleware, (req, res, next) => {
  void rejectRound(req, res).catch(next);
});

orderRouter.patch(
  "/rondas/:id/items/:itemId",
  authMiddleware,
  (req, res, next) => {
    void patchOrderItem(req, res).catch(next);
  },
);

orderRouter.patch("/rondas/:id/alert", authMiddleware, (req, res, next) => {
  void patchOrderAlert(req, res).catch(next);
});

orderRouter.post("/rondas/:id/completar", authMiddleware, (req, res, next) => {
  void completeRound(req, res).catch(next);
});

orderRouter.post("/rondas/:id/restaurar", authMiddleware, (req, res, next) => {
  void restoreRound(req, res).catch(next);
});

orderRouter.get("/cocina/tickets", authMiddleware, (req, res, next) => {
  void getKitchenTickets(req, res).catch(next);
});

export default orderRouter;
