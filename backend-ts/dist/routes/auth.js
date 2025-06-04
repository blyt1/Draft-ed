"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const jwt_1 = require("../utils/jwt");
const router = express_1.default.Router();
// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ detail: 'Username, email, and password are required' });
        }
        const db = (0, database_1.getDatabase)();
        // Check if user already exists
        const existingUser = await db.collection('users').findOne({
            $or: [{ username }, { email }]
        });
        if (existingUser) {
            return res.status(400).json({ detail: 'User with this username or email already exists' });
        }
        // Create new user
        const hashedPassword = (0, jwt_1.getPasswordHash)(password);
        const newUser = {
            username,
            email,
            hashed_password: hashedPassword,
            created_at: new Date()
        };
        const result = await db.collection('users').insertOne(newUser);
        // Create default "All Beers" list
        await db.collection('beer_lists').insertOne({
            user_id: result.insertedId,
            name: 'All Beers',
            beers: [],
            created_at: new Date()
        });
        const userResponse = {
            _id: result.insertedId.toString(),
            username,
            email,
            created_at: newUser.created_at
        };
        res.status(201).json(userResponse);
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ detail: 'Internal server error' });
    }
});
// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ detail: 'Username and password are required' });
        }
        const db = (0, database_1.getDatabase)();
        const user = await db.collection('users').findOne({
            $or: [{ username }, { email: username }]
        });
        if (!user || !(0, jwt_1.verifyPassword)(password, user.hashed_password)) {
            return res.status(401).json({ detail: 'Incorrect username or password' });
        }
        const accessToken = (0, jwt_1.createAccessToken)({ sub: user._id.toString() });
        const tokenResponse = {
            access_token: accessToken,
            token_type: 'bearer'
        };
        res.json(tokenResponse);
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ detail: 'Internal server error' });
    }
});
exports.default = router;
