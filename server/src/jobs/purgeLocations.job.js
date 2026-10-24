import cron from 'node-cron';
import Location from '../models/Location.model.js';

/**
 * Runs daily at midnight to purge location documents older than 7 days.
 * This is a belt-and-suspenders backup to the MongoDB TTL index just in case.
 */
export const startLocationPurgeJob = () => {
    // 0 0 * * * = every day at midnight
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('[CRON] Running daily location purge job...');
            
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const result = await Location.deleteMany({ timestamp: { $lt: sevenDaysAgo } });
            
            console.log(`[CRON] Location purge completed. Deleted ${result.deletedCount} documents.`);
        } catch (error) {
            console.error('[CRON] Location purge job failed:', error.message);
        }
    });
    
    console.log('Cron job registered: purgeLocations (runs daily at midnight)');
};
