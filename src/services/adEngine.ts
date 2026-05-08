/**
 * Mock Ad Engine Service
 * In a production environment, this would query a PostgreSQL database or Redis cache
 * to find the highest-bidding ad for the specific neighborhood (NAS-ID).
 */

export interface AdPayload {
    id: string;
    type: 'video' | 'image';
    mediaUrl: string;
    title: string;
    durationSeconds: number;
    advertiser: string;
}

export const getLocalizedAds = async (nasid: string, tierMinutes: number): Promise<AdPayload[]> => {
    // Simulate database lookup latency
    await new Promise(resolve => setTimeout(resolve, 200));

    const baseAd = {
        type: 'video' as const,
        mediaUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        title: 'Support Local: Joe\'s Burger Joint 🍔',
        advertiser: 'Joe\'s Burgers'
    };

    if (tierMinutes === 30) {
        return [{ ...baseAd, id: `ad_${Math.floor(Math.random() * 10000)}`, durationSeconds: 10 }];
    } else if (tierMinutes === 90) {
        return [{ ...baseAd, id: `ad_${Math.floor(Math.random() * 10000)}`, durationSeconds: 20 }];
    } else if (tierMinutes === 180) {
        return [
            { ...baseAd, id: `ad_${Math.floor(Math.random() * 10000)}`, durationSeconds: 30 },
            { 
                id: `ad_${Math.floor(Math.random() * 10000)}`, 
                type: 'video', 
                mediaUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 
                title: 'Neighbourly: Connect your street.', 
                advertiser: 'Neighbourly', 
                durationSeconds: 30 
            }
        ];
    }

    return [{ ...baseAd, id: `ad_${Math.floor(Math.random() * 10000)}`, durationSeconds: 10 }];
};
