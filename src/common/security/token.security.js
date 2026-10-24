import jwt from "jsonwebtoken";

import {
    ACCESS_ADMIN_TOKEN_SIGNATURE,
    ACCESS_TOKEN_EXPIRES_IN,
    ACCESS_USER_TOKEN_SIGNATURE,
    REFRESH_ADMIN_TOKEN_SIGNATURE,
    REFRESH_TOKEN_EXPIRES_IN,
    REFRESH_USER_TOKEN_SIGNATURE,
    JWT_ISSUER
} from "../../config.js";

import {
    BadRequestException,
    NotFoundException
} from "../exeptions/error.exeptions.js";

import { findById, findOne } from "../respository/base.repository.js";
import { UserModel } from "../../DB/model/user.model.js";
import { TokenTypeEnum } from "../enum/security.enum.js";
import { ROLE_ENUM } from "../enum/user.gender.js";
import { compare } from "bcrypt";


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
    tokentype = TokenTypeEnum.ACCESS
} = {}) => {

    console.log("================================");
    console.log("AUTHORIZATION:", authorization);
    console.log("AUTH TYPE:", typeof authorization);
    console.log("================================");

    const [bearer, token] = authorization.split(" ");

    console.log("BEARER:", bearer);
    console.log("TOKEN:", token);

    if (bearer !== "Bearer" || !token) {
        throw BadRequestException("Invalid authorization header");
    }

    const decoded = jwt.decode(token);

    console.log("DECODED:", decoded);

    if (!decoded?.aud?.length) {
        throw BadRequestException("MISSING TOKEN PAYLOAD");
    }

    const secret = await getSignature({
        tokentype,
        role: decoded.aud[0]
    });

    console.log("ROLE:", decoded.aud[0]);
    console.log("SECRET EXISTS:", !!secret);

    const payload = await verifyToken({
        token,
        secret
    });

    console.log("PAYLOAD:", payload);

    if (!payload?.sub) {
        throw BadRequestException("missing token payload");
    }

    const user = await findById({
        model: UserModel,
        id: payload.sub
    });

    if (!user) {
        throw NotFoundException("Invalid user");
    }

    return {
        user,
        payload
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
