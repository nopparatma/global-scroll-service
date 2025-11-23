import { redisService } from '../services/redis.service';
import logger from '../utils/logger';

const GRAVITY_CHECK_INTERVAL = 1000; // 1 sec
const IDLE_THRESHOLD = 10000; // 10 sec
const GRAVITY_DECAY = 100; // px per tick

export const startGravityWorker = () => {
    setInterval(async () => {
        try {
            const lastActivity = await redisService.getLastActivity();
            const now = Date.now();

            if (now - lastActivity > IDLE_THRESHOLD) {
                const currentHeight = await redisService.getGlobalHeight();
                if (BigInt(currentHeight) > 0) {
                    await redisService.decreaseGlobalHeight(GRAVITY_DECAY);
                    // In a real app, we would broadcast this 'gravity' event via Redis Pub/Sub to the Socket Server
                    // logger.debug('Gravity applied');
                }
            }
        } catch (error) {
            logger.error('Gravity worker error', error);
        }
    }, GRAVITY_CHECK_INTERVAL);
};
