import { Router } from "express";
import mongoose from "mongoose";
import authRouter from "./auth.routes.js";
import menuRouter from "./menu.routes.js";
import notificationRouter from "./notification.routes.js";
import orderRouter from "./order.routes.js";
import tableRouter from "./table.routes.js";

/**
 * Router raíz bajo `/api`.
 */
const apiRouter = Router();

/**
 * Comprobación rápida: el servidor responde y muestra el estado de Mongo.
 */
apiRouter.get("/health", (_req, res) => {
  const mongoState = mongoose.connection.readyState;

  res.json({
    ok: true,
    message: "API Lumbre en marcha",
    mongo: {
      readyState: mongoState,
      connected: mongoState === 1,
      db: mongoose.connection.name || null,
    },
  });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/menu", menuRouter);
apiRouter.use(tableRouter);
apiRouter.use(orderRouter);
apiRouter.use("/avisos", notificationRouter);

export default apiRouter;
