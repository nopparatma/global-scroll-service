import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: env.NODE_ENV === 'production' ? 'https://your-domain.com' : '*',
    credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Trust Proxy for GeoIP
app.set('trust proxy', 1);

app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

export default app;
