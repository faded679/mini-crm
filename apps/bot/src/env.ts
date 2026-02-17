function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

export const env = {
  BOT_TOKEN: requireEnv("TELEGRAM_BOT_TOKEN"),
  API_URL: process.env.API_URL ?? "http://mini-crm-api:3000",
};
