const dotenv = require("dotenv")
let ENV_FILE_NAME = ""
try {
  dotenv.config({ path: process.env.ENV_FILE_NAME || ".env" })
} catch (e) {}

const BACKEND_URL = process.env.BACKEND_URL || "localhost:9000"
const DATABASE_URL = process.env.DATABASE_URL || "postgres://localhost/tmfoodstuff"
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379"

const plugins = [
  "medusa-fulfillment-manual",
  "medusa-payment-manual",
]

const modules = {}

/** @type {import('@medusajs/medusa').ConfigModule["projectConfig"]} */
const projectConfig = {
  jwt_secret: process.env.JWT_SECRET || "supersecret",
  cookie_secret: process.env.COOKIE_SECRET || "supersecret",
  store_cors: process.env.STORE_CORS || "http://localhost:3000",
  admin_cors: process.env.ADMIN_CORS || "http://localhost:7001",
  database_url: DATABASE_URL,
  redis_url: REDIS_URL,
}

module.exports = {
  projectConfig,
  plugins,
  modules,
}
