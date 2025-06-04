"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_1 = require("./jwt");
const database_1 = require("../config/database");
const mongodb_1 = require("mongodb");
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ detail: 'Missing or invalid token' });
    }
    const token = authHeader.substring(7);
    const payload = (0, jwt_1.decodeAccessToken)(token);
    if (!payload) {
        return res.status(401).json({ detail: 'Invalid token' });
    }
    try {
        const db = (0, database_1.getDatabase)();
        const user = await db.collection('users').findOne({ _id: new mongodb_1.ObjectId(payload.sub) });
        if (!user) {
            return res.status(401).json({ detail: 'User not found' });
        }
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(401).json({ detail: 'Invalid token' });
    }
};
exports.authenticate = authenticate;
