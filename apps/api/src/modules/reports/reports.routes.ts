import { Router } from "express";
import {
  createReport,
  verifyReport,
  updateReportStatus,
  verifyStatus,
} from "./reports.controller";

const router = Router();

router.post("/", createReport);

router.post("/verify", verifyReport);

router.post("/status", updateReportStatus);

router.post("/status/verify", verifyStatus);

export default router;
