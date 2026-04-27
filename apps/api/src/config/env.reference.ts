export const ENV_REFERENCE = {
  required: {
    MONGODB_URI: {
      example: "mongodb://localhost:27017/sidewalk",
      description: "MongoDB connection string (API and worker)",
    },
    REDIS_URL: {
      example: "redis://localhost:6379",
      description: "Redis connection string for job queues",
    },
    JWT_SECRET: {
      example: "change-me-in-production",
      description: "Secret for signing JWT tokens",
    },
    STELLAR_SECRET_KEY: {
      example: "S...",
      description: "Stellar account secret key for anchoring",
      degraded: "Stellar anchoring disabled when absent",
    },
  },
  optional: {
    PORT: { example: "3000", description: "API server port" },
    S3_ENDPOINT: { example: "http://localhost:9000", description: "S3-compatible storage endpoint" },
    S3_BUCKET: { example: "sidewalk", description: "Bucket for media uploads" },
    S3_ACCESS_KEY: { example: "minioadmin", description: "S3 access key" },
    S3_SECRET_KEY: { example: "minioadmin", description: "S3 secret key" },
    WEB_BASE_URL: { example: "http://localhost:3001", description: "Web app base URL" },
    MOBILE_BASE_URL: { example: "exp://localhost:19000", description: "Mobile app base URL" },
    STELLAR_NETWORK: { example: "testnet", description: "Stellar network (testnet|mainnet)" },
  },
} as const;