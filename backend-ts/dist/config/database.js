"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.getDatabase = exports.connectToDatabase = void 0;
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'craftbeer';
let client = null;
let db = null;
const connectToDatabase = async () => {
    if (client && db) {
        return db;
    }
    try {
        client = new mongodb_1.MongoClient(MONGO_URL);
        await client.connect();
        db = client.db(DB_NAME);
        console.log('Database connected successfully');
        return db;
    }
    catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
};
exports.connectToDatabase = connectToDatabase;
const getDatabase = () => {
    if (!db) {
        throw new Error('Database not initialized. Call connectToDatabase first.');
    }
    return db;
};
exports.getDatabase = getDatabase;
const closeDatabase = async () => {
    if (client) {
        await client.close();
        client = null;
        db = null;
    }
};
exports.closeDatabase = closeDatabase;
