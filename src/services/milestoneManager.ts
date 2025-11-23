import { PrismaClient } from '@prisma/client';
import { redisService } from './redis.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

class MilestoneManager {
    private nextMilestone: bigint = BigInt(1000); // Start at 1000m
    private readonly MILESTONE_STEP = BigInt(1000);

    async checkMilestone(currentHeight: bigint, userId: string, countryCode: string, username?: string) {
        // In a real app, we might cache 'nextMilestone' in Redis to avoid re-calculating or race conditions
        // For simplicity, we'll assume linear progression for now.

        // Check Redis for next milestone
        // const storedNext = await redisService.getNextMilestone(); 
        // if (storedNext) this.nextMilestone = BigInt(storedNext);

        if (currentHeight >= this.nextMilestone) {
            const result = await this.unlockMilestone(this.nextMilestone, userId, countryCode, username);
            this.nextMilestone += this.MILESTONE_STEP;
            // await redisService.setNextMilestone(this.nextMilestone.toString());
            return result;
        }
        return null;
    }

    private async unlockMilestone(height: bigint, userId: string, countryCode: string, username?: string) {
        try {
            const flag = await prisma.flag.create({
                data: {
                    height,
                    userId,
                    countryCode,
                    message: `Reached ${height}m!`,
                },
            });

            logger.info(`Milestone unlocked at ${height}m by user ${userId}`);

            // Return details to broadcast
            return {
                height: height.toString(),
                capturedBy: {
                    username: username || 'Anonymous',
                    country: countryCode
                }
            };
        } catch (error) {
            logger.error('Error unlocking milestone', error);
            return null;
        }
    }
}

export const milestoneManager = new MilestoneManager();
