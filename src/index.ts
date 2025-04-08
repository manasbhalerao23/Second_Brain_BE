import express from "express";
import jwt from "jsonwebtoken";
import {z} from "zod";
import bcrypt from "bcrypt";
import { ContentModel, LinkModel, TagModel, UserModel } from "./db";
import { userMiddleware } from "./middleware";
import { random } from "./utils";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { configDotenv } from "dotenv";
import { error } from "console";
import { title } from "process";
configDotenv();

export const JWT_SECRET = process.env.JWT_SECRET;
export const FRONTEND_URL = process.env.FRONTEND_URL;

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: ["https://second-brain-alpha-gray.vercel.app"],
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    credentials: true,
}));
app.get('/', (req,res) => {
    res.send("hello");
    console.log("hello");
})

app.post("/api/v1/signup", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    //get here zod validation

    // z.string().min(3,{ message: "username must be of minimum size 3"});
    // username.z.string().max(10,{ message: "username must be of maximum size 10"});
    // password.z.string().min(4).max(10);

    const hashedpassword = await bcrypt.hash(password,7);
    try{
        const user = await UserModel.create({
            username: username,
            password: hashedpassword
        });
        const token = jwt.sign(
            {
              id: user._id,
            },
            JWT_SECRET
          );
      
          res.cookie("token", token, {
            sameSite: "none",
            secure: true,
            httpOnly: true,
          });
    
        res.status(200).json({
            message: "Signed up"
        })
    }
    catch(e){
        //check for more status codes
        res.status(411).json({
            error: "user already exists"
        })
    }
})

app.post("/api/v1/signin", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    try{
        const User = await UserModel.findOne({
            username: username
        });
        if(!User){
            res.status(403).json({
                error:"User does not exist."
            })
        }
        const hashpw = User?.password;
        
        if(typeof hashpw === 'string'){
            const check = await bcrypt.compare(password, hashpw);
            if(User && check){

                const token = jwt.sign({
                    id: User._id,
                }, JWT_SECRET);

                res.cookie("token",token, {
                    sameSite: "none",
                    secure: true,
                    httpOnly: true,
                  });

                //check for https in prod
                res.status(200).json({message: "Signed in success"
                });
                
            }
            else{
                res.status(403).json({
                    error: "incorrect credentials"
                })
            }
        }    
    }
    catch(e){
        console.log(e);
        res.status(500).json({
         error: "internal server error"
        })
    }
})

app.post("/api/v1/content", userMiddleware, async (req, res) => {
    const {link, type, title, tags} = req.body;

    try{ 
        const tagIds: string[] = [];
        await Promise.all(
            tags.map(async (title: any) => {
                const tag = await TagModel.findOne({title});
                if(!tag){
                    const newtag = await TagModel.create({title});
                    tagIds.push(newtag._id.toString());
                    return;
                }
                if(tagIds.includes(tag._id.toString())){
                    return;
                }
                tagIds.push(tag._id.toString());
            })
        );
        //console.log("tags done");

        await ContentModel.create({
            link: link,
            type: type,
            title: title,
            userId: req.userId,
            tags: tagIds,
        });
        // console.log("model done");
        res.status(200).json({message: "Content added"});
    }
    catch(e){
        console.log(e);
        res.status(500).json({
            error: "Error occured"
        });
    }
});


app.get("/api/v1/content", userMiddleware, async (req, res) => {
    const userId = req.userId;
    const contents = await ContentModel.find({
        userId: userId,
    }).populate<{
        tags: (typeof TagModel.prototype)[];
    }>("tags");

    const formattedcontent = contents.map((content) => ({
        id: content._id,
        type: content.type,
        link: content.link,
        title: content.title,
        tags: content.tags.map((tag) => (tag.title)),
    }));


    res.status(200).json({
        contents:formattedcontent
    });
});

app.delete("/api/v1/content", userMiddleware, async (req, res) => {
    const { id }  = req.body;
    const userId = req.userId;
    try{
        console.log(id);
        const content = await ContentModel.findOne({ _id: id});
        console.log(content);
        if(!content){
            res.status(400).json({
                error: "Content not found"
            });
        }
        
        if(content?.userId.toString() !== userId){
            res.status(403).json({
                error: "Unauthorized access"
            });
        }

        await ContentModel.findByIdAndDelete(content?._id);
        
        res.status(200).json({
            message: "delete successfull"
        })
    }
    catch(e){
        res.status(403).json({
            message: "cannot delete"
        })
    }
})

app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
        const share = req.body.share;
        if(share){
            const existinglink = await LinkModel.findOne({
                userId:req.userId
            });
            if(existinglink){
                
                res.status(200).json({
                    link: `${FRONTEND_URL}/brain/${existinglink.hash}`,
                })
                return;
            }
            const hashlink = random(12);

            await LinkModel.create({
                userId: req.userId,
                hash: hashlink
            })
            res.status(200).json({
                link:  `${FRONTEND_URL}/brain/${hashlink}`
            })
        }
        else {
            await LinkModel.deleteOne({
                userId: req.userId
            });
            res.json({
                message: "link deleted"
            })
        }
})

app.get("/api/v1/brain/:shareLink", async (req, res) => {
    const hash = req.params.shareLink;
    const link = await LinkModel.findOne({
        hash: hash
    })
    if(!link){
        res.status(411).json({
            message: "incorrect url"
        })
        return;
    }

    const content = await ContentModel.findOne({
        userId: link.userId
    })
    const user = await UserModel.findOne({
        _id: link.userId
    })

    if(!user){
        res.status(411).json({
            message: "user not found"
        })
        return;
    }
    res.json({
        username: user.username,
        content: content
    })
})

async function main() {
    await mongoose.connect(process.env.DB_URL as string);
    app.listen(3000);
    console.log("Running on 3000");
}

main();
