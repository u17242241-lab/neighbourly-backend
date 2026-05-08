import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import portalRoutes from './routes/portal';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'neighbourly-backend' });
});

// Captive Portal and Ad Engine Routes
app.use('/api/v1/portal', portalRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Neighbourly Core Backend running on http://localhost:${PORT}`);
});
