import mongoose from "mongoose";
import { connectScriptDb, disconnectScriptDb } from "./_db-script";
import { migration001ReportIndexes } from "./migrations/001-report-indexes";
import type { Migration } from "./migrations/migration.types";

type AppliedMigration = {
  id: string;
  appliedAt: Date;
};

const MIGRATIONS: Migration[] = [migration001ReportIndexes];

const runMigrations = async (): Promise<void> => {
  await connectScriptDb();

  try {
    const collection = mongoose.connection.collection("migrations");
    const applied = await collection
      .find<AppliedMigration>({}, { projection: { id: 1 } })
      .toArray();
    const appliedIds = new Set(applied.map((record) => record.id));

    for (const migration of MIGRATIONS) {
      if (appliedIds.has(migration.id)) {
        console.log(`Skipping ${migration.id} (${migration.description})`);
        continue;
      }

      console.log(`Running ${migration.id} (${migration.description})`);
      await migration.up(mongoose.connection);
      await collection.insertOne({ id: migration.id, appliedAt: new Date() });
      console.log(`Applied ${migration.id}`);
    }
  } finally {
    await disconnectScriptDb();
  }
};

runMigrations().catch((error: unknown) => {
  console.error("Migration failed", error);
  process.exit(1);
});
