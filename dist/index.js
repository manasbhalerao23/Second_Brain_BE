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
exports.FRONTEND_URL = exports.JWT_SECRET = void 0;
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("./db");
const middleware_1 = require("./middleware");
const utils_1 = require("./utils");
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.configDotenv)();
exports.JWT_SECRET = process.env.JWT_SECRET;
exports.FRONTEND_URL = process.env.FRONTEND_URL;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: [],
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    credentials: true,
}));
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    //get here zod validation
    // z.string().min(3,{ message: "username must be of minimum size 3"});
    // username.z.string().max(10,{ message: "username must be of maximum size 10"});
    // password.z.string().min(4).max(10);
    const hashedpassword = yield bcrypt_1.default.hash(password, 7);
    try {
        const user = yield db_1.UserModel.create({
            username: username,
            password: hashedpassword
        });
        const token = jsonwebtoken_1.default.sign({
            id: user._id,
        }, exports.JWT_SECRET);
        res.cookie("token", token, {
            sameSite: "none",
            secure: true,
            httpOnly: true,
        });
        res.status(200).json({
            message: "Signed up"
        });
    }
    catch (e) {
        //check for more status codes
        res.status(411).json({
            error: "user already exists"
        });
    }
}));
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    try {
        const User = yield db_1.UserModel.findOne({
            username: username
        });
        if (!User) {
            res.status(403).json({
                error: "User does not exist."
            });
        }
        const hashpw = User === null || User === void 0 ? void 0 : User.password;
        if (typeof hashpw === 'string') {
            const check = yield bcrypt_1.default.compare(password, hashpw);
            if (User && check) {
                const token = jsonwebtoken_1.default.sign({
                    id: User._id,
                }, exports.JWT_SECRET);
                res.cookie("token", token, {
                    sameSite: "none",
                    secure: true,
                    httpOnly: true,
                });
                //check for https in prod
                res.status(200).json({ message: "Signed in success"
                });
            }
            else {
                res.status(403).json({
                    error: "incorrect credentials"
                });
            }
        }
    }
    catch (e) {
        console.log(e);
        res.status(500).json({
            error: "internal server error"
        });
    }
}));
app.post("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { link, type, title, tags } = req.body;
    try {
        const tagIds = [];
        yield Promise.all(tags.map((title) => __awaiter(void 0, void 0, void 0, function* () {
            const tag = yield db_1.TagModel.findOne({ title });
            if (!tag) {
                const newtag = yield db_1.TagModel.create({ title });
                tagIds.push(newtag._id.toString());
                return;
            }
            if (tagIds.includes(tag._id.toString())) {
                return;
            }
            tagIds.push(tag._id.toString());
        })));
        //console.log("tags done");
        yield db_1.ContentModel.create({
            link: link,
            type: type,
            title: title,
            userId: req.userId,
            tags: tagIds,
        });
        // console.log("model done");
        res.status(200).json({ message: "Content added" });
    }
    catch (e) {
        console.log(e);
        res.status(500).json({
            error: "Error occured"
        });
    }
}));
app.get("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const contents = yield db_1.ContentModel.find({
        userId: userId,
    }).populate("tags");
    const formattedcontent = contents.map((content) => ({
        id: content._id,
        type: content.type,
        link: content.link,
        title: content.title,
        tags: content.tags.map((tag) => (tag.title)),
    }));
    res.status(200).json({
        contents: formattedcontent
    });
}));
app.delete("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.body;
    const userId = req.userId;
    try {
        console.log(id);
        const content = yield db_1.ContentModel.findOne({ _id: id });
        console.log(content);
        if (!content) {
            res.status(400).json({
                error: "Content not found"
            });
        }
        if ((content === null || content === void 0 ? void 0 : content.userId.toString()) !== userId) {
            res.status(403).json({
                error: "Unauthorized access"
            });
        }
        yield db_1.ContentModel.findByIdAndDelete(content === null || content === void 0 ? void 0 : content._id);
        res.status(200).json({
            message: "delete successfull"
        });
    }
    catch (e) {
        res.status(403).json({
            message: "cannot delete"
        });
    }
}));
app.post("/api/v1/brain/share", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const share = req.body.share;
    if (share) {
        const existinglink = yield db_1.LinkModel.findOne({
            userId: req.userId
        });
        if (existinglink) {
            res.status(200).json({
                link: `${exports.FRONTEND_URL}/brain/${existinglink.hash}`,
            });
            return;
        }
        const hashlink = (0, utils_1.random)(12);
        yield db_1.LinkModel.create({
            userId: req.userId,
            hash: hashlink
        });
        res.status(200).json({
            link: `${exports.FRONTEND_URL}/brain/${hashlink}`
        });
    }
    else {
        yield db_1.LinkModel.deleteOne({
            userId: req.userId
        });
        res.json({
            message: "link deleted"
        });
    }
}));
app.get("/api/v1/brain/:shareLink", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hash = req.params.shareLink;
    const link = yield db_1.LinkModel.findOne({
        hash: hash
    });
    if (!link) {
        res.status(411).json({
            message: "incorrect url"
        });
        return;
    }
    const content = yield db_1.ContentModel.findOne({
        userId: link.userId
    });
    const user = yield db_1.UserModel.findOne({
        _id: link.userId
    });
    if (!user) {
        res.status(411).json({
            message: "user not found"
        });
        return;
    }
    res.json({
        username: user.username,
        content: content
    });
}));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield mongoose_1.default.connect(process.env.DB_URL);
        app.listen(3000);
        console.log("Running on 3000");
    });
}
main();
