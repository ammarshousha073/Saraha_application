import { TokenTypeEnum } from "../common/enum/security.enum.js"
import { ForbiddenException, UnauthorizedException } from "../common/exeptions/error.exeptions.js"
import { basicAuth, decodeToken } from "../common/security/token.security.js"



export const authentication = (tokentype = TokenTypeEnum.ACCESS) => {
    return async (req, res, next) => {
        const { authorization } = req.headers;

        if (!authorization) {
            throw UnauthorizedException("Unauthoized Account");
        }

        const [key, credential] = authorization.split(" ") || [];
        console.log(key, credential);


        switch (key) {
            case "Basic":
                const [email , password] = Buffer.from(credential, 'base64').toString().split (":");
                console.log({email , password });
                req.user = await basicAuth({ email , password})
                break;

            case "Bearer":
                const { user, payload } = await
                    decodeToken
                        ({
                            authorization,
                            credential,
                            tokentype
                        });
                req.user = user
                req.payload = payload
break 
            default:
                next(new Error ("INVALID AUTHENTICATION SCHEMA" , {cause : {status : 400}} ))

                break;
        }

        next();

    }

}

export const authorization = (accessRoles) => {
    return async (req, res, next) => {
       if (req.user.level < accessRoles) {
                    throw ForbiddenException("Forbidden Account");
                }
        next();

    }

}