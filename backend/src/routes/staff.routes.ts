import { Router } from "express";
import {
  createStaff,
  listStaff,
  patchStaff,
  setKitchenPin,
  uploadStaffPhoto,
} from "../controllers/staff.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";
import { uploadStaffImage } from "../middleware/upload.middleware.js";

const staffRouter = Router();
const adminOnly = [authMiddleware, requireRole("backoffice")] as const;

staffRouter.get("/", ...adminOnly, (req, res, next) => {
  void listStaff(req, res).catch(next);
});

staffRouter.post("/", ...adminOnly, (req, res, next) => {
  void createStaff(req, res).catch(next);
});

staffRouter.post("/cocina/pin", ...adminOnly, (req, res, next) => {
  void setKitchenPin(req, res).catch(next);
});

staffRouter.patch("/:id", ...adminOnly, (req, res, next) => {
  void patchStaff(req, res).catch(next);
});

staffRouter.post("/:id/foto", ...adminOnly, (req, res, next) => {
  uploadStaffImage(req, res, (err) => {
    if (err) {
      next(err);
      return;
    }
    void uploadStaffPhoto(req, res).catch(next);
  });
});

export default staffRouter;
