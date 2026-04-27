/**
 * Migration: Add public_slug field to existing reports
 * This script generates unique public slugs for all existing reports
 */

import { connectToDatabase } from '../../config/db.js';
import { ReportModel } from '../../modules/reports/report.model.js';
import { generateDeterministicSlug } from '../../modules/reports/public-id.service.js';

async function migrate() {
  console.log('Starting migration: Add public slugs to existing reports');
  
  try {
    await connectToDatabase();
    
    // Find all reports without public_slug
    const reportsWithoutSlug = await ReportModel.find({ public_slug: { $exists: false } });
    
    console.log(`Found ${reportsWithoutSlug.length} reports without public slugs`);
    
    for (const report of reportsWithoutSlug) {
      let slug = generateDeterministicSlug(report._id);
      
      // Check for collision and resolve if needed
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        const existing = await ReportModel.findOne({ public_slug: slug });
        
        if (!existing) {
          break;
        }
        
        // Collision detected, add suffix
        const suffix = String.fromCharCode(97 + attempts); // a, b, c, ...
        slug = slug.substring(0, 7) + suffix;
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        console.error(`Failed to generate unique slug for report ${report._id}`);
        continue;
      }
      
      await ReportModel.updateOne(
        { _id: report._id },
        { $set: { public_slug: slug } }
      );
      
      console.log(`Added slug "${slug}" to report ${report._id}`);
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate();
}
