import { execSync } from 'child_process';
import { PinoLogger } from './PinoLogger';

const logger = new PinoLogger('vibegrid-bootstrap');

let isBootstrapped = false;

export function ensureDatabaseSchemaPushed(): void {
  if (isBootstrapped) return;
  isBootstrapped = true;

  if (process.env.NODE_ENV !== 'production' || process.env.PRISMA_DB_PUSH === 'true') {
    try {
      logger.info('🔄 [BFF Bootstrap] Syncing PostgreSQL schema with Prisma...');
      execSync('npx prisma db push --accept-data-loss', {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: { ...process.env },
      });
      logger.info('✅ [BFF Bootstrap] PostgreSQL schema updated successfully!');
    } catch (err: any) {
      logger.warn('⚠️ [BFF Bootstrap] Schema push warning:', { error: err?.message || err });
    }
  }
}

