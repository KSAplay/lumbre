import { Router } from "express";
import { loginWithPin } from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post("/pin", (req, res, next) => {
  void loginWithPin(req, res).catch(next);
});

export default authRouter;
