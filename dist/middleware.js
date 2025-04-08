"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userMiddleware = void 0;
const index_1 = require("./index");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userMiddleware = (req, res, next) => {
    const token = req.cookies["token"];
    //console.log(token);
    if (!token) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, index_1.JWT_SECRET);
        req.userId = decoded.id;
        next();
    }
    catch (e) {
        res.status(401).json({ error: "Invalid token." });
    }
};
exports.userMiddleware = userMiddleware;
