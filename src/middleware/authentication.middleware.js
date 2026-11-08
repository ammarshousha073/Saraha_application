import { TokenTypeEnum } from "../common/enum/security.enum.js";

import {
    ForbiddenException,
    UnauthorizedException,
} from "../common/exeptions/error.exeptions.js";

import {
    basicAuth,
    decodeToken,
} from "../common/security/token.security.js";



export const beraerAuth = async ({
    req,
    tokentype = TokenTypeEnum.ACCESS
} = {}) => {

    const [key, credential] =
        req.headers["authorization"]?.split(" ") || [];

    const { user, payload } = await decodeToken({
        credential,
        tokentype
    });

    req.user = user;
    req.payload = payload;
};





export const authentication = (
    tokentype = TokenTypeEnum.ACCESS
) => {
    return async (req, res, next) => {
        try {
            const { authorization } = req.headers;

            if (!authorization) {
                throw UnauthorizedException({
                    message: "Unauthorized Account",
                });
            }

            const [key, credential] = authorization.split(" ");

            switch (key) {
                case "Basic": {
                    const decoded = Buffer.from(
                        credential,
                        "base64"
                    ).toString();

                    const separatorIndex = decoded.indexOf(":");

                    if (separatorIndex === -1) {
                        throw UnauthorizedException({
                            message: "Invalid Basic credentials",
                        });
                    }

                    const email = decoded.slice(0, separatorIndex);
                    const password = decoded.slice(separatorIndex + 1);

                    req.user = await basicAuth({ email, password });
                    break;
                }

                case "Bearer": {
                await beraerAuth({req , tokentype})
                    break;
                }

                default:
                    throw UnauthorizedException({
                        message: "Invalid authentication schema",
                    });
            }

            return next();
        } catch (error) {
            return next(error);
        }
    };
};





export const authorization = (accessRoles) => {
    return async (req, res, next) => {
        try {
            if (req.user.level < accessRoles) {
                throw ForbiddenException({
                    message: "Forbidden Account",
                });
            }

            return next();
        } catch (error) {
            return next(error);
        }
    };
};