import { RefreshSessionCoordinator } from '../application/RefreshSessionCoordinator';
import { RedisCacheService } from '@/shared/infrastructure/cache/RedisCacheService';
import { PinoLogger } from '@/shared/infrastructure/PinoLogger';

const cacheService = new RedisCacheService();
const logger = new PinoLogger('vibegrid-bff');

export const refreshSessionCoordinator = new RefreshSessionCoordinator(cacheService, logger);
