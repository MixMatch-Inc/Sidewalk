import type { Migration } from "./migration.types";
import { ReportModel } from "../../modules/reports/report.model";

export const migration001ReportIndexes: Migration = {
  id: "001-report-indexes",
  description: "Ensure Report geo and dashboard indexes exist",
  up: async () => {
    await ReportModel.syncIndexes();
  },
};
