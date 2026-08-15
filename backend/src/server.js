import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

async function main() {
  await connectDb();
  const app = createApp();
  app.listen(env.port, () => logger.info(`listening on ${env.port}`));
}

process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'unhandledRejection');
  process.exit(1);
});

main();
