import { Types } from 'mongoose';
import { ReportModel } from './report.model.js';
import { generateUniquePublicSlug } from './public-id.service.js';
import type { Report } from './report.model.js';

export async function createReportWithPublicSlug(reportData: Omit<Report, 'public_slug'>): Promise<Report> {
  // Generate unique public slug
  const publicSlug = await generateUniquePublicSlug(async (slug: string) => {
    const existing = await ReportModel.findOne({ public_slug: slug });
    return !!existing;
  });

  // Create report with public slug
  const report = await ReportModel.create({
    ...reportData,
    public_slug: publicSlug,
  });

  return report.toObject();
}

export async function ensurePublicSlug(reportId: string | Types.ObjectId): Promise<string> {
  const report = await ReportModel.findById(reportId);
  
  if (!report) {
    throw new Error('Report not found');
  }

  if (report.public_slug) {
    return report.public_slug;
  }

  // Generate slug for existing report
  const publicSlug = await generateUniquePublicSlug(async (slug: string) => {
    const existing = await ReportModel.findOne({ public_slug: slug });
    return !!existing;
  });

  await ReportModel.updateOne(
    { _id: reportId },
    { $set: { public_slug: publicSlug } }
  );

  return publicSlug;
}
