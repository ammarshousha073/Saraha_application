
import mongoose from "mongoose";

const messageschema = new mongoose.Schema(
    {
        content: {
            type: String,
            minLength: 2,
            maxLength: 50000,
            required: function(){return this.attachments?.length > 0 ? false : true},
        },

       attachments:[String],
       senderId:{type:mongoose.Types.ObjectId,ref:"User"},
       receiverId:{type:mongoose.Types.ObjectId,ref:"User",required:true},

      
    },
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true },
        strict: true,
        strictQuery: true,
        autoIndex: true,
    }
);



export const MessageModel =
    mongoose.models.message || mongoose.model("message", messageschema);
