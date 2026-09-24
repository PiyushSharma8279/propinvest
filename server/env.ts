import "server-only";

function required(name: string, ...fallbacks: string[]): string {
  for (const key of [name, ...fallbacks]) {
    const value = process.env[key];
    if (value) return value;
  }
  throw new Error(`Missing environment variable ${name}. See .env.example.`);
}

/** Read lazily so a missing variable fails the request that needs it, not the whole build. */
export const env = {
  databaseUrl: () => required("DATABASE_URL"),
  jwtSecret: () => required("JWT_SECRET"),
  imagekitPrivateKey: () => required("IMAGEKIT_PRIVATE_KEY"),
  imagekitUrlEndpoint: () => required("IMAGEKIT_URL_ENDPOINT", "IMAGE_KIT_URL_ENDPOINT"),
  isProduction: () => process.env.NODE_ENV === "production",
};
