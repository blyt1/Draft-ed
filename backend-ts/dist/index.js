"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./config/database");
const seed_1 = require("./utils/seed");
const auth_1 = __importDefault(require("./routes/auth"));
const beers_1 = __importDefault(require("./routes/beers"));
const user_1 = __importDefault(require("./routes/user"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
// Middleware
app.use((0, cors_1.default)({
    origin: '*', // Adjust in production
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Craft Beer Enthusiast API is running.' });
});
app.use('/auth', auth_1.default);
app.use('/beers', beers_1.default);
app.use('/user', user_1.default);
// Initialize database and start server
const startServer = async () => {
    try {
        await (0, database_1.connectToDatabase)();
        console.log('Database connected');
        // Seed database with sample data
        await (0, seed_1.seedDatabase)();
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
