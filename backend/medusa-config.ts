import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const isProduction = process.env.NODE_ENV === 'production'

const redisModules = isProduction && process.env.REDIS_URL ? [
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
] : []

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
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
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
          ...(process.env.MOLLIE_API_KEY
            ? [
                {
                  resolve: "@variablevic/mollie-payments-medusa",
                  id: "mollie",
                  options: {
                    apiKey: process.env.MOLLIE_API_KEY,
                  },
                },
              ]
            : []),
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
                    medusaUrl: process.env.SUMUP_MEDUSA_URL || process.env.MEDUSA_BACKEND_URL,
                    // Browser redirect after SumUp hosted payment / 3DS
                    redirectUrl: process.env.SUMUP_REDIRECT_URL,
                  },
                },
              ]
            : []),
        ],
      },
    },
    ...redisModules,
  ],
})
