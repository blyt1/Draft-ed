"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeAccessToken = exports.createAccessToken = exports.getPasswordHash = exports.verifyPassword = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key';
const ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24; // 24 hours
const verifyPassword = (plainPassword, hashedPassword) => {
    return bcryptjs_1.default.compareSync(plainPassword, hashedPassword);
};
exports.verifyPassword = verifyPassword;
const getPasswordHash = (password) => {
    return bcryptjs_1.default.hashSync(password, 10);
};
exports.getPasswordHash = getPasswordHash;
const createAccessToken = (data, expiresIn) => {
    const payload = {
        ...data,
        exp: Math.floor(Date.now() / 1000) + (60 * ACCESS_TOKEN_EXPIRE_MINUTES)
    };
    return jsonwebtoken_1.default.sign(payload, SECRET_KEY, { algorithm: ALGORITHM });
};
exports.createAccessToken = createAccessToken;
const decodeAccessToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, SECRET_KEY, { algorithms: [ALGORITHM] });
    }
    catch (error) {
        return null;
    }
};
exports.decodeAccessToken = decodeAccessToken;
