import { Router } from "express";
import {
  listNotifications,
  markNotificationRead,
} from "../controllers/notification.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const notificationRouter = Router();

notificationRouter.get("/", authMiddleware, (req, res, next) => {
  void listNotifications(req, res).catch(next);
});

notificationRouter.patch("/:id/leer", authMiddleware, (req, res, next) => {
  void markNotificationRead(req, res).catch(next);
});

export default notificationRouter;
