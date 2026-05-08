import { Router, Request, Response } from 'express';
import { getLocalizedAds } from '../services/adEngine';
import { authorizeDevice } from '../services/radius';

const router = Router();

// In-memory OTP store (Mock for SMS provider)
const otpStore = new Map<string, string>();

/**
 * POST /api/v1/portal/send-otp
 * Generates a 4-digit OTP and "sends" it to the user.
 */
router.post('/send-otp', async (req: Request, res: Response) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        // Generate a random 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        
        // Store the OTP against the phone number (expires after 5 mins in a real app)
        otpStore.set(phone, otp);

        console.log(`[Mock SMS] Sending OTP ${otp} to phone number ${phone}`);
        
        // In reality, you would call Twilio, SNS, or local SMS provider API here.
        return res.status(200).json({ message: 'OTP sent successfully', mockOtp: otp });
    } catch (error) {
        console.error('Error sending OTP:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * POST /api/v1/portal/verify-otp
 * Verifies the submitted OTP against the stored OTP.
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) {
            return res.status(400).json({ error: 'Phone number and OTP are required' });
        }

        const storedOtp = otpStore.get(phone);
        if (!storedOtp) {
            return res.status(400).json({ error: 'OTP expired or not requested' });
        }

        if (storedOtp !== otp) {
            return res.status(401).json({ error: 'Invalid OTP' });
        }

        // OTP is valid. Clear it to prevent reuse.
        otpStore.delete(phone);

        return res.status(200).json({ message: 'OTP verified successfully' });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * GET /api/v1/portal/ad
 * Called by the captive portal frontend to fetch ads based on the requested connection tier.
 * Query Params: ?mac=xx:xx:xx:xx:xx:xx&nasid=router_uuid&tier=30
 */
router.get('/ad', async (req: Request, res: Response) => {
    try {
        const { mac, nasid, tier } = req.query;

        if (!mac || !nasid) {
            return res.status(400).json({ error: 'Missing required parameters: mac, nasid' });
        }

        const requestedTier = parseInt(tier as string) || 30;

        // Fetch ads based on the requested connection duration tier
        const ads = await getLocalizedAds(nasid as string, requestedTier);
        
        return res.status(200).json({ ads });
    } catch (error) {
        console.error('Error fetching ad:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * POST /api/v1/portal/authenticate
 * Called by the captive portal frontend after the user has finished watching the ads.
 * Body: { mac: string, nasid: string, adIds: string[], tier: number }
 */
router.post('/authenticate', async (req: Request, res: Response) => {
    try {
        const { mac, nasid, adIds, tier } = req.body;

        if (!mac || !nasid || !adIds || !tier) {
            return res.status(400).json({ error: 'Missing required parameters: mac, nasid, adIds, tier' });
        }

        console.log(`[AdEngine] Impressions recorded for Ads: ${adIds.join(', ')} on NAS: ${nasid} by MAC: ${mac}`);

        // Authorize the device via RADIUS with requested duration
        const authResult = await authorizeDevice(mac, nasid, tier);

        if (authResult.success) {
            return res.status(200).json({ 
                message: 'Authentication successful. You are now connected to the internet.',
                sessionTimeout: authResult.sessionTimeout
            });
        } else {
            return res.status(403).json({ error: 'Failed to authorize device.' });
        }
    } catch (error) {
        console.error('Error authenticating device:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
