import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes/api';

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
const allowedOriginsPattern = /^(https?:\/\/(?:localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[0-1])\.\d+\.\d+)(?::\d+)?|https?:\/\/.*\.netlify\.app|https?:\/\/.*\.netlify\.live|https?:\/\/.*schoolappoint\.com)$/i;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOriginsPattern.test(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true
}));

app.use(express.json());

// Global Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 10000 requests per windowMs to allow chat polling
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use(limiter);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// API Routes
app.use('/api', apiRouter);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SchoolAppoint backend running on port ${PORT}`);
});
