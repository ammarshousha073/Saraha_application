import { resolve } from "node:path";
import dotenv from "dotenv";

export const NODE_ENV = process.env.NODE_ENV ?? "development";

dotenv.config({
  path: resolve(`.env.${NODE_ENV}`)
});

export const PORT = parseInt(process.env.PORT ?? "9000");



export const DB_URI = process.env.DB_URI;


export const APP_EMAIL = process.env.APP_EMAIL;
export const APP_PASSWORD = process.env.APP_PASSWORD;
export const APPLICATION_NAME = process.env.APPLICATION_NAME;

export const SALT = parseInt(process.env.SALT ?? "12");
export const IV_LENTGH = parseInt(process.env.IV_LENTGH ?? "16");
export const ENC_KEY = process.env.ENC_KEY;

export const ACCESS_USER_TOKEN_SIGNATURE = process.env.ACCESS_USER_TOKEN_SIGNATURE;
export const ACCESS_ADMIN_TOKEN_SIGNATURE = process.env.ACCESS_ADMIN_TOKEN_SIGNATURE;
export const REFRESH_USER_TOKEN_SIGNATURE = process.env.REFRESH_TOKEN_SIGNATURE;
export const REFRESH_ADMIN_TOKEN_SIGNATURE = process.env.REFRESH_TOKEN_SIGNATURE;
//
export const REDIS_USERNAME = process.env.REDIS_USERNAME;
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
export const REDIS_HOST = process.env.REDIS_HOST;
export const REDIS_PORT = parseInt(process.env.REDIS_PORT ?? "15905");

export const REFRESH_TOKEN_EXPIRES_IN = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN ?? "31536000");
export const ACCESS_TOKEN_EXPIRES_IN = parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN ?? "1800");

export const JWT_ISSUER = "SarahaAPP_FOR_AMMAR";

export const RATE_LIMIT_CONFIG = {
    LOGIN: {
        windowSeconds: 60,
        maxRequests: 5
    },

    SIGNUP: {
        windowSeconds: 60 * 60,
        maxRequests: 5
    },

    FORGOT_PASSWORD: {
        windowSeconds: 15 * 60,
        maxRequests: 3
    },

    RESEND_OTP: {
        windowSeconds: 15 * 60,
        maxRequests: 3
    }
};
