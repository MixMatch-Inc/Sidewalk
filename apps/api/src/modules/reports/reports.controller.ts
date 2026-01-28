import { Request, Response } from "express";
import { stellarService } from "../../config/stellar";
import crypto from "crypto";

export const createReport = async (req: Request, res: Response) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: "Description is required" });
    }

    const hash = crypto.createHash("sha256").update(description).digest("hex");

    const txHash = await stellarService.anchorHash(hash);

    res.status(201).json({
      message: "Report created and anchored",
      content_hash: hash,
      stellar_tx: txHash,
      explorer_url: `https://stellar.expert/explorer/testnet/tx/${txHash}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create report" });
  }
};

export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    const { originalTxHash, status, evidence } = req.body;

    if (!originalTxHash || !status) {
      return res
        .status(400)
        .json({ error: "originalTxHash and status are required" });
    }

    const dataToHash = `${originalTxHash}:${status}:${evidence || ""}`;

    const statusHash = crypto
      .createHash("sha256")
      .update(dataToHash)
      .digest("hex");

    const statusTxHash = await stellarService.anchorHash(statusHash);

    res.json({
      message: "Status updated and anchored",
      status: status,
      original_report_tx: originalTxHash,
      status_update_tx: statusTxHash,
      explorer_url: `https://stellar.expert/explorer/testnet/tx/${statusTxHash}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update status" });
  }
};

export const verifyReport = async (req: Request, res: Response) => {
  try {
    const { txHash, originalDescription } = req.body;

    if (!txHash || !originalDescription) {
      return res
        .status(400)
        .json({ error: "txHash and originalDescription are required" });
    }

    const expectedHash = crypto
      .createHash("sha256")
      .update(originalDescription)
      .digest("hex");

    const result = await stellarService.verifyTransaction(txHash, expectedHash);

    if (result.valid) {
      res.json({
        success: true,
        message: "✅ Content Verified! It matches the on-chain record.",
        timestamp: result.timestamp,
        signer: result.sender,
        on_chain_hash: expectedHash,
      });
    } else {
      res.status(409).json({
        success: false,
        message:
          "❌ Verification Failed. The content has been altered or does not match the record.",
        timestamp: result.timestamp,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: "Transaction not found" });
  }
};

export const verifyStatus = async (req: Request, res: Response) => {
  try {
    const { statusTxHash, originalTxHash, status, evidence } = req.body;

    if (!statusTxHash || !originalTxHash || !status) {
      return res
        .status(400)
        .json({ error: "All fields are required to verify the chain" });
    }

    const dataToHash = `${originalTxHash}:${status}:${evidence || ""}`;
    const expectedHash = crypto
      .createHash("sha256")
      .update(dataToHash)
      .digest("hex");

    const result = await stellarService.verifyTransaction(
      statusTxHash,
      expectedHash,
    );

    if (result.valid) {
      res.json({
        success: true,
        message:
          "✅ Chain Verified! This status update belongs to that report.",
        timestamp: result.timestamp,
        signer: result.sender,
      });
    } else {
      res.status(409).json({
        success: false,
        message:
          "❌ Broken Chain. The status update does not match the provided report or data.",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: "Transaction not found" });
  }
};
