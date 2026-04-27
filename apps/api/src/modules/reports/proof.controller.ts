import { Request, Response } from "express";

type ReportService = {
  findById(id: string): Promise<{
    snapshotHash?: string;
    anchorStatus?: string;
    anchorTxHash?: string;
    anchorVerifiedAt?: string;
  } | null>;
};

type AnchorService = {
  getExplorerUrl(txHash: string): string;
};

export function makeProofController(reportSvc: ReportService, anchorSvc: AnchorService) {
  return async function getReportProof(req: Request, res: Response): Promise<void> {
    const { reportId } = req.params;
    const report = await reportSvc.findById(reportId);

    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    res.json({
      reportId,
      snapshotHash: report.snapshotHash ?? null,
      anchorStatus: report.anchorStatus ?? "unanchored",
      txHash: report.anchorTxHash ?? null,
      explorerUrl: report.anchorTxHash ? anchorSvc.getExplorerUrl(report.anchorTxHash) : null,
      verifiedAt: report.anchorVerifiedAt ?? null,
    });
  };
}