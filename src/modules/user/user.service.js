import { findByIdAndUpdate } from "../../common/respository/base.repository.js";
import { UserModel } from "../../DB/model/user.model.js";
import { createLoginCredentials } from "../../common/security/token.security.js";
import { ACCESS_TOKEN_EXPIRES_IN } from "../../config.js";
import { ConflictException } from "../../common/exeptions/error.exeptions.js";

export const profile = async (account) => {
    
    return account
}

export const update = async (user , data) => {
const account = await findByIdAndUpdate({
    model : UserModel , 
    id : user._id , 
    update : data
})

    return account
}

//
export const rotateToken = async (payload,user , issuer) => {
    const accessExpiresIn = (payload.iat + ACCESS_TOKEN_EXPIRES_IN)*1000
    const currentTime = Date.now() + (30*60000)
    if (currentTime < accessExpiresIn) {
        throw ConflictException("SORRY WE CANNOT CREATE NEW LOGIN CREDENTIALS WHILE CURRENT ACCESS TOKEN IS WORKING ,, PLS TRY AGAIN LATER")
    }

///
         return await createLoginCredentials({user ,issuer})
}