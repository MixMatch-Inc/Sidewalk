import type { Request, Response } from 'express';
import { ReportModel } from './report.model.js';
import { isValidPublicSlug } from './public-id.service.js';

export async function getPublicReportBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;

    if (!slug || !isValidPublicSlug(slug)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid slug format',
      });
    }

    const report = await ReportModel.findOne({ public_slug: slug }).lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
      });
    }

    // Return only public-safe information
    const publicReport = {
      id: report._id,
      public_slug: report.public_slug,
      title: report.title,
      description: report.description,
      category: report.category,
      status: report.status,
      location: {
        type: report.location.type,
        coordinates: report.location.coordinates,
      },
      media_urls: report.media_urls,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      // Include anchoring info if successful
      ...(report.anchor_status === 'ANCHOR_SUCCESS' && {
        stellar_tx_hash: report.stellar_tx_hash,
        anchor_status: report.anchor_status,
      }),
      // Include integrity flag if suspicious
      ...(report.integrity_flag === 'SUSPICIOUS' && {
        integrity_flag: report.integrity_flag,
        exif_verified: report.exif_verified,
        exif_distance_meters: report.exif_distance_meters,
      }),
    };

    res.json({
      success: true,
      data: publicReport,
    });
  } catch (error) {
    console.error('Failed to get public report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve report',
    });
  }
}

export async function getPublicReportById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Report ID is required',
      });
    }

    const report = await ReportModel.findById(id).lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
      });
    }

    // Redirect to slug-based URL for consistency
    return res.redirect(302, `/reports/${report.public_slug}`);
  } catch (error) {
    console.error('Failed to redirect to public report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve report',
    });
  }
}
