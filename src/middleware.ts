import { Request, Response, NextFunction } from "express";
import { JWT_SECRET } from "./index";
import jwt from "jsonwebtoken";


export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
        const token = req.cookies["token"];
        //console.log(token);
        if(!token){
            res.status(401).json({ error: "Unauthorized"});
            return;
        }

        try{
        const decoded = jwt.verify(token as string, JWT_SECRET ) as { id: string};
            req.userId = decoded.id;
            next();
        }
        catch(e){
            res.status(401).json({ error: "Invalid token." });
        }
}