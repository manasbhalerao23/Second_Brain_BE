"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagModel = exports.LinkModel = exports.ContentModel = exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const UserSchema = new mongoose_1.Schema({
    username: { type: String, unique: true },
    password: { type: String }
});
exports.UserModel = (0, mongoose_1.model)('User', UserSchema);
const contenttypes = ['Tweet', 'Video', 'Image'];
const ContentSchema = new mongoose_1.Schema({
    link: { type: String, required: true },
    type: { type: String, enum: contenttypes, required: true },
    title: { type: String, required: true },
    tags: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'tag' }],
    userId: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true,
            validate: (id) => __awaiter(void 0, void 0, void 0, function* () {
                const user = yield exports.UserModel.findById(id);
                if (!user) {
                    throw new Error("User does not exist");
                }
            }) }]
});
exports.ContentModel = (0, mongoose_1.model)('Content', ContentSchema);
const LinkSchema = new mongoose_1.Schema({
    hash: String,
    userId: [{ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'User', required: true }]
});
exports.LinkModel = (0, mongoose_1.model)('Links', LinkSchema);
const TagSchema = new mongoose_1.Schema({
    title: { type: String, unique: true }
});
exports.TagModel = (0, mongoose_1.model)('tag', TagSchema);
