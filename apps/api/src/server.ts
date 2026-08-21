import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

async function startServer(): Promise<void> {
  await prisma.$connect();

  const server = app.listen(env.PORT, () => {
    console.log(`API listening on port ${env.PORT}`);
  });

  let isShuttingDown = false;

  const shutdown = (signal: NodeJS.Signals): void => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    console.log(`${signal} received; shutting down`);

    server.close((error) => {
      void (async () => {
        if (error) {
          console.error("HTTP server shutdown failed", error);
          process.exitCode = 1;
        }

        try {
          await prisma.$disconnect();
        } catch (disconnectError) {
          console.error("Database shutdown failed", disconnectError);
          process.exitCode = 1;
        }
      })();
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch(async (error: unknown) => {
  console.error("API failed to start", error);

  try {
    await prisma.$disconnect();
  } catch (disconnectError) {
    console.error("Database shutdown failed", disconnectError);
  }

  process.exitCode = 1;
});
