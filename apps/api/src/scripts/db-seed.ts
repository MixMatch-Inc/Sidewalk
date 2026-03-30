import { faker } from "@faker-js/faker";
import type { Types } from "mongoose";
import { connectScriptDb, disconnectScriptDb } from "./_db-script";
import { logger } from "../core/logging/logger";
import { UserModel } from "../modules/users/user.model";
import { ReportModel, type ReportCategory, type ReportStatus } from "../modules/reports/report.model";
import { StatusUpdateModel } from "../modules/reports/status-update.model";
import { hashSnapshot, buildDeterministicSnapshot } from "../modules/reports/reports.snapshot";

const USER_COUNT = 50;
const REPORT_COUNT = 500;
const STATUS_UPDATE_COUNT = 100;
const DEMO_DISTRICTS = ['Ikeja', 'Yaba', 'Surulere', 'Lekki'] as const;

const CATEGORIES: ReportCategory[] = [
  "INFRASTRUCTURE",
  "SANITATION",
  "SAFETY",
  "UTILITIES",
  "TRAFFIC",
  "OTHER",
];

const STATUSES: ReportStatus[] = [
  "PENDING",
  "ACKNOWLEDGED",
  "RESOLVED",
  "REJECTED",
  "ESCALATED",
];

const SAN_FRANCISCO_BOUNDS = {
  minLng: -122.53,
  maxLng: -122.35,
  minLat: 37.70,
  maxLat: 37.83,
};

const randomCoordinate = (): [number, number] => {
  const lng = faker.number.float({
    min: SAN_FRANCISCO_BOUNDS.minLng,
    max: SAN_FRANCISCO_BOUNDS.maxLng,
    fractionDigits: 6,
  });
  const lat = faker.number.float({
    min: SAN_FRANCISCO_BOUNDS.minLat,
    max: SAN_FRANCISCO_BOUNDS.maxLat,
    fractionDigits: 6,
  });

  return [lng, lat];
};

const randomCategory = (): ReportCategory => faker.helpers.arrayElement(CATEGORIES);
const randomStatus = (): ReportStatus => faker.helpers.arrayElement(STATUSES);
const randomDistrict = (): string => faker.helpers.arrayElement(DEMO_DISTRICTS);

const maybeTxHash = (): string | null =>
  faker.datatype.boolean(0.65) ? faker.string.hexadecimal({ length: 64, casing: "lower", prefix: "" }) : null;

const makeMediaUrls = (): string[] => {
  const count = faker.number.int({ min: 0, max: 3 });
  return Array.from({ length: count }, () => faker.image.urlPicsumPhotos());
};

const runSeed = async (): Promise<void> => {
  faker.seed(90210);
  await connectScriptDb();

  try {
    await Promise.all([
      StatusUpdateModel.deleteMany({}),
      ReportModel.deleteMany({}),
      UserModel.deleteMany({}),
    ]);

    const users = await UserModel.insertMany(
      [
        {
          email: 'demo.admin@sidewalk.dev',
          role: 'AGENCY_ADMIN',
          district: 'Ikeja',
          reputationScore: 95,
        },
        {
          email: 'demo.citizen@sidewalk.dev',
          role: 'CITIZEN',
          district: 'Ikeja',
          reputationScore: 78,
        },
        ...Array.from({ length: USER_COUNT }).map((_, index) => ({
          email: `seed.user.${index + 1}@sidewalk.dev`,
          role: index < 5 ? "AGENCY_ADMIN" : "CITIZEN",
          district: randomDistrict(),
          reputationScore: faker.number.int({ min: 20, max: 95 }),
        })),
      ],
      { ordered: true },
    );

    const reports = await ReportModel.insertMany(
      Array.from({ length: REPORT_COUNT }).map(() => {
        const title = faker.helpers.arrayElement([
          "Pothole blocking lane",
          "Broken street light",
          "Flooded drainage spot",
          "Overflowing waste bin",
          "Damaged pedestrian crossing",
        ]);
        const description = faker.helpers.arrayElement([
          "Issue has been unresolved for several days and is affecting residents.",
          "Observed during evening commute and it presents a safety risk.",
          "Needs urgent inspection by local maintenance team.",
          "Traffic and accessibility are impacted in this area.",
        ]);
        const location = {
          type: "Point" as const,
          coordinates: randomCoordinate(),
        };
        const category = randomCategory();
        const media_urls = makeMediaUrls();
        const snapshot = buildDeterministicSnapshot({
          title,
          description,
          location,
          category,
          media_urls,
        });

        return {
          reporter_user_id: String(faker.helpers.arrayElement(users)._id),
          district: randomDistrict(),
          title,
          description,
          status: randomStatus(),
          category,
          location,
          media_urls,
          data_hash: hashSnapshot(snapshot),
          anchor_status: faker.helpers.arrayElement(['ANCHOR_QUEUED', 'ANCHOR_SUCCESS', 'ANCHOR_FAILED']),
          anchor_attempts: faker.number.int({ min: 0, max: 4 }),
          anchor_last_error: faker.datatype.boolean(0.15) ? faker.lorem.words(3) : null,
          anchor_needs_attention: faker.datatype.boolean(0.1),
          anchor_failed_at: faker.datatype.boolean(0.1) ? faker.date.recent({ days: 14 }) : null,
          snapshot_hash: hashSnapshot(snapshot),
          stellar_tx_hash: maybeTxHash(),
          exif_verified: faker.datatype.boolean(0.6),
          exif_distance_meters: faker.datatype.boolean(0.4)
            ? faker.number.int({ min: 3, max: 850 })
            : null,
          integrity_flag: faker.helpers.arrayElement(['NORMAL', 'SUSPICIOUS']),
          createdAt: faker.date.recent({ days: 120 }),
          updatedAt: new Date(),
        };
      }),
      { ordered: true },
    );

    const reportIds = reports.map((report) => report._id);
    const userIds = users.map((user) => user._id);

    await StatusUpdateModel.insertMany(
      Array.from({ length: STATUS_UPDATE_COUNT }).map(() => {
        const previousStatus = randomStatus();
        const nextStatus = randomStatus();

        return {
          reportId: faker.helpers.arrayElement(reportIds) as Types.ObjectId,
          previousStatus,
          nextStatus,
          note: faker.lorem.sentence(),
          actorId: faker.helpers.arrayElement(userIds) as Types.ObjectId,
          createdAt: faker.date.recent({ days: 60 }),
          updatedAt: new Date(),
        };
      }),
      { ordered: true },
    );

    logger.info('Seed complete', {
      demoUsers: ['demo.admin@sidewalk.dev', 'demo.citizen@sidewalk.dev'],
      users: USER_COUNT + 2,
      reports: REPORT_COUNT,
      statusUpdates: STATUS_UPDATE_COUNT,
    });
  } finally {
    await disconnectScriptDb();
  }
};

runSeed().catch((error: unknown) => {
  logger.error('Seeding failed', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
