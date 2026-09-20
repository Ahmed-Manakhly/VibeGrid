import { execSync } from 'child_process';

let isBootstrapped = false;

export function ensureDatabaseSchemaPushed(): void {
  if (isBootstrapped) return;
  isBootstrapped = true;

  if (process.env.NODE_ENV !== 'production' || process.env.PRISMA_DB_PUSH === 'true') {
    try {
      console.log('🔄 [BFF Bootstrap] Syncing PostgreSQL schema with Prisma...');
      execSync('npx prisma db push --accept-data-loss', {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: { ...process.env },
      });
      console.log('✅ [BFF Bootstrap] PostgreSQL schema updated successfully!');
    } catch (err: any) {
      console.warn('⚠️ [BFF Bootstrap] Schema push warning:', err?.message || err);
    }
  }
}
