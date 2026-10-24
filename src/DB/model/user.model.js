import mongoose from "mongoose";
import { GENDER_ENUM, ROLE_ENUM } from "../../common/enum/index.js";

const userschema = new mongoose.Schema({
firstName:{
    type : String ,
    minLength : 2 , 
    maxLength : 25 , 
    required : true 
},

lastName:{
    type : String ,
    minLength : 2 , 
    maxLength : 25 , 
    required : true 
},
email:{
    type : String ,
    unique : true ,
    required : true 
},
password:{
    type : String ,
    required : true 
} ,
phone: String , 
DOB : Date , 
confirmEmail : Date , 
image : String , 
coverImage : [String] , 
gender : {
    type : Number , 
    enum:Object.values(GENDER_ENUM) ,
    default:GENDER_ENUM.MALE
},
role : {
    type : Number , 
    default:ROLE_ENUM.USER,
    enum:Object.values(ROLE_ENUM) 
}

},{
    timestamps : true , 
    toObject : true , 
    toJSON : true , 
    strict : true , 
    strictQuery : true, 
    autoIndex : true
})

userschema.virtual("username").set(function(value){
    const [firstName , lastName] = value?.split (" ")|| [];
    this.set({firstName , lastName})
}).get(function(){
    return  `${this.firstName }   ${this.lastName} `
})

export const UserModel = mongoose.models.User || mongoose.model("User" , userschema)