import exp from "constants";
import { model, Schema, Types } from "mongoose";
import mongoose from "mongoose";


const UserSchema = new Schema({
    username : {type: String, unique: true},
    password : {type: String}
    }
);

export const UserModel = model('User', UserSchema);

const contenttypes = ['Tweet','Video', 'Image'];

const ContentSchema = new Schema({
    link : {type: String, required: true},
    type : {type: String, enum: contenttypes, required: true},
    title : {type: String, required: true},
    tags: [{type: Schema.Types.ObjectId, ref: 'tag'}],
    userId: [{type: Schema.Types.ObjectId, ref: 'User', required: true, 
        validate: async (id: Types.ObjectId) => {
            const user = await UserModel.findById(id);
            if(!user){
                throw new Error("User does not exist");
            }
        }}]
});

export const ContentModel = model('Content', ContentSchema);

const LinkSchema = new Schema({
    hash : String,
    userId: [{type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}]
});

export const LinkModel = model('Links', LinkSchema);

const TagSchema = new Schema({
      title: {type: String, unique:true}
});

export const TagModel = model('tag', TagSchema);