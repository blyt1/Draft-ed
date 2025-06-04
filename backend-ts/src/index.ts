import express from 'express';
import cors from 'cors';
import { connectToDatabase } from './config/database';
import { seedDatabase } from './utils/seed';
import authRouter from './routes/auth';
import beersRouter from './routes/beers';
import userRouter from './routes/user';

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: '*', // Adjust in production
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Craft Beer Enthusiast API is running.' });
});

app.use('/auth', authRouter);
app.use('/beers', beersRouter);
app.use('/user', userRouter);

// Initialize database and start server
const startServer = async () => {
  try {
    await connectToDatabase();
    console.log('Database connected');
    
    // Seed database with sample data
    await seedDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
