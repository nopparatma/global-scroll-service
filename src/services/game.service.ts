import { redisService } from './redis.service';
import { milestoneManager } from './milestoneManager';
import logger from '../utils/logger';

class GameService {
    // Anti-cheat constants
    private readonly MAX_VELOCITY = 5000; // pixels per second
    private readonly MIN_BATCH_INTERVAL = 1000; // ms

    async processScrollBatch(userId: string, countryCode: string, delta: number, timeSinceLastBatch: number) {
        // 1. Anti-Cheat: Velocity Check
        const velocity = (delta / timeSinceLastBatch) * 1000; // px/sec
        if (velocity > this.MAX_VELOCITY) {
            logger.warn(`Suspicious activity from ${userId}: Velocity ${velocity.toFixed(2)} px/s`);
            return null; // Reject
        }

        // 2. Update Redis
        const newHeight = await redisService.incrementGlobalHeight(delta);
        await redisService.incrementCountryHeight(countryCode, delta);
        await redisService.updateLastActivity();

        // 3. Update Velocity (Exponential Moving Average)
        const currentVelocity = await redisService.getVelocity();
        const smoothedVelocity = currentVelocity * 0.7 + velocity * 0.3; // EMA with alpha=0.3
        await redisService.setVelocity(smoothedVelocity);

        // 4. Check Milestones (Async, don't block)
        // We pass the new height to the manager
        milestoneManager.checkMilestone(BigInt(newHeight), userId, countryCode).then((milestone) => {
            if (milestone) {
                // In a real app, we would emit this event back to the socket controller
                // For now, the controller polls or we use an event emitter
            }
        });

        return {
            height: newHeight.toString(),
            velocity: Math.round(smoothedVelocity)
        };
    }

    async getGameState() {
        const height = await redisService.getGlobalHeight();
        const velocity = await redisService.getVelocity();
        const countryHeights = await redisService.getAllCountryHeights(); // Get all countries dynamically

        return {
            height,
            velocity: Math.round(velocity),
            countryHeights
        };
    }
}

export const gameService = new GameService();
