import { register as registerCron } from "./lib/cron"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await registerCron()
  }
}
