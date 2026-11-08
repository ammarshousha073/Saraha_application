import jwt from "jsonwebtoken";

import {
    ACCESS_ADMIN_TOKEN_SIGNATURE,
    ACCESS_TOKEN_EXPIRES_IN,
    ACCESS_USER_TOKEN_SIGNATURE,
    REFRESH_ADMIN_TOKEN_SIGNATURE,
    REFRESH_TOKEN_EXPIRES_IN,
    REFRESH_USER_TOKEN_SIGNATURE,
    JWT_ISSUER,
} from "../../config.js";

import {
    BadRequestException,
    NotFoundException,
    UnauthorizedException,
} from "../exeptions/error.exeptions.js";

import { findById, findOne } from "../respository/base.repository.js";
import { UserModel } from "../../DB/model/user.model.js";
import { TokenTypeEnum } from "../enum/security.enum.js";
import { ROLE_ENUM } from "../enum/user.gender.js";
import { compare } from "bcrypt";
import { get } from "../services/cache.service.js";
import { userBaseRevokeTokenKey } from "../utlis/index.js";

export const createToken = async ({
    payload = {},
    options = {},
    secret = ACCESS_USER_TOKEN_SIGNATURE
} = {}) => {

    return jwt.sign(
        payload,
        secret,
        options
    );
};


export const verifyToken = async ({
    token = "",
    secret = ACCESS_USER_TOKEN_SIGNATURE
} = {}) => {

    return jwt.verify(
        token,
        secret
    );
};


const getTokenSignatures = async ({
    role = ROLE_ENUM.USER
} = {}) => {

    let signatures;

    switch (role) {

        case ROLE_ENUM.ADMIN:

            signatures = {
                accessSignautre: ACCESS_ADMIN_TOKEN_SIGNATURE,
                refreshSignature: REFRESH_ADMIN_TOKEN_SIGNATURE
            };

            break;

        default:

            signatures = {
                accessSignautre: ACCESS_USER_TOKEN_SIGNATURE,
                refreshSignature: REFRESH_USER_TOKEN_SIGNATURE
            };

            break;
    }

    return signatures;
};


const getSignature = async ({
    tokentype = TokenTypeEnum.ACCESS,
    role = ROLE_ENUM.USER
} = {}) => {

    const signatures = await getTokenSignatures({
        role
    });

    return tokentype === TokenTypeEnum.ACCESS
        ? signatures.accessSignautre
        : signatures.refreshSignature;
};


export const decodeToken = async ({
    authorization = "",
    credential,
    tokentype = TokenTypeEnum.ACCESS,
} = {}) => {
    const token =
        credential ||
        authorization.split(" ")[1];

    if (!token) {
        throw BadRequestException({
            message: "Missing token",
        });
    }

    const decoded = jwt.decode(token);

    if (!decoded?.aud) {
        throw BadRequestException({
            message: "Invalid token payload",
        });
    }

    const role = Array.isArray(decoded.aud)
        ? decoded.aud[0]
        : decoded.aud;

    const secret = await getSignature({
        tokentype,
        role,
    });

    const payload = await verifyToken({
        token,
        secret,
    });

    if (!payload?.sub || !payload?.iat) {
        throw BadRequestException({
            message: "Invalid token payload",
        });
    }

    const user = await findById({
        model: UserModel,
        id: payload.sub,
    });

    if (!user) {
        throw UnauthorizedException({
            message: "Invalid user",
        });
    }

    // Reject tokens issued before logout from all devices.
    if (user.changeCredentialsTime) {
        const invalidBefore = Math.floor(
            new Date(user.changeCredentialsTime).getTime() / 1000
        );

        if (payload.iat <= invalidBefore) {
            throw UnauthorizedException({
                message: "Token is no longer valid",
            });
        }
    }

    // Check whether this token was individually revoked.
    const revokeKey =
        `${userBaseRevokeTokenKey({ userId: payload.sub })}${payload.iat}`;

    const revoked = await get({
        key: revokeKey,
    });

    if (revoked) {
        throw UnauthorizedException({
            message: "Token has been revoked",
        });
    }

    return {
        user,
        payload,
    };
};



export const createLoginCredentials = async ({
    user,
    issuer = JWT_ISSUER,
    options = {}
} = {}) => {

    const {
        accessSignautre,
        refreshSignature
    } = await getTokenSignatures({
        role: user.role
    });


    // =========================
    // Access Token
    // =========================

    const access_token = await createToken({

        payload: {
            sub: user._id
        },

        secret: accessSignautre,

        options: {
            ...options,
issuer,
            expiresIn: ACCESS_TOKEN_EXPIRES_IN,

            audience: [user.role]
        }
    });


    // =========================
    // Refresh Token
    // =========================

    const refresh_token = await createToken({

        payload: {
            sub: user._id
        },

        secret: refreshSignature,

        options: {
            ...options,
            "issuer": issuer,

            expiresIn: REFRESH_TOKEN_EXPIRES_IN,

            audience: [user.role]
        }
    });


    return {
        access_token,
        refresh_token
    };
};

// 

export const basicAuth = async ({email , password}) => {
    
        const user = await findOne({
            model: UserModel,
    
            filter: { email, },
        })
        if (!user) {
            throw NotFoundException({ message: "Invalid Email or Password" })
        }
        const match = await compare(password, user.password)
    
        if (!match) throw NotFoundException({ message: "NOT EXIST" })
            return user
}
