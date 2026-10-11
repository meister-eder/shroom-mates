import { loadEnv, defineConfig, Modules } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

const isProduction = process.env.NODE_ENV === "production";

const redisModules =
  isProduction && process.env.REDIS_URL
    ? [
        {
          resolve: "@medusajs/medusa/cache-redis",
          options: {
            redisUrl: process.env.REDIS_URL,
          },
        },
        {
          resolve: "@medusajs/medusa/event-bus-redis",
          options: {
            redisUrl: process.env.REDIS_URL,
          },
        },
        {
          resolve: "@medusajs/medusa/workflow-engine-redis",
          options: {
            redis: {
              redisUrl: process.env.REDIS_URL,
            },
          },
        },
      ]
    : [];

module.exports = defineConfig({
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseLogging: !isProduction,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET!,
      cookieSecret: process.env.COOKIE_SECRET!,
    },
  },
  modules: [
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              upload_dir: "static",
              backend_url: `${process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"}/static`,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          ...(process.env.SUMUP_API_KEY
            ? [
                {
                  resolve: "medusa-payment-sumup/providers/sumup",
                  id: "sumup",
                  options: {
                    apiKey: process.env.SUMUP_API_KEY,
                    merchantCode: process.env.SUMUP_MERCHANT_CODE,
                    // SUMUP_MEDUSA_URL must be the publicly reachable backend URL
                    // (e.g. your ngrok tunnel) so SumUp can POST webhook callbacks to it.
                    medusaUrl:
                      process.env.SUMUP_MEDUSA_URL ||
                      process.env.MEDUSA_BACKEND_URL,
                    // Browser redirect after SumUp hosted payment / 3DS
                    redirectUrl: process.env.SUMUP_REDIRECT_URL,
                    // The storefront sends a per-country redirect_url; its host must
                    // be the SUMUP_REDIRECT_URL host or listed here (comma-separated,
                    // host[:port]), e.g. for preview/test deploys on another domain.
                    redirectUrlAllowedHosts: (
                      process.env.SUMUP_REDIRECT_ALLOWED_HOSTS ?? ""
                    )
                      .split(",")
                      .map((h) => h.trim())
                      .filter(Boolean),
                  },
                },
              ]
            : []),
        ],
      },
    },
    {
      // Transactional email. Without RESEND_API_KEY (local dev) mails are only
      // logged by the built-in local provider.
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          process.env.RESEND_API_KEY
            ? {
                resolve: "./src/modules/resend",
                id: "resend",
                options: {
                  channels: ["email"],
                  apiKey: process.env.RESEND_API_KEY,
                  from:
                    process.env.EMAIL_FROM ||
                    "shroom-mates <bestellung@shroom-mates.de>",
                  replyTo: process.env.EMAIL_REPLY_TO || "hey@shroom-mates.de",
                },
              }
            : {
                resolve: "@medusajs/medusa/notification-local",
                id: "local",
                options: { channels: ["email"] },
              },
        ],
      },
    },
    {
      // Withdrawal declarations from the shop's "Vertrag widerrufen" function
      resolve: "./src/modules/withdrawal",
    },
    ...redisModules,
  ],
});
