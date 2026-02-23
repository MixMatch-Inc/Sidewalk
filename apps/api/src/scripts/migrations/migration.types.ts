import type { Connection } from "mongoose";

export type Migration = {
  id: string;
  description: string;
  up: (connection: Connection) => Promise<void>;
};
