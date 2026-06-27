import { Router, type Router as RouterType } from "express";
import { requireAuth } from "../../../shared/middleware/requireAuth.js";
import { reportController } from "../controllers/report.controller.js";

const router: RouterType = Router();

router.post("/reports", requireAuth, reportController.create);
router.get("/reports", requireAuth, reportController.list);
router.get("/reports/:id", requireAuth, reportController.getById);
router.post("/reports/:id/moderate", requireAuth, reportController.moderate);

export default router;
