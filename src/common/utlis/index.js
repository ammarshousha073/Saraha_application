export*from './success.response.js'
export*from './email/index.js'
export*from './otp.js'
export*from './multer/index.js'


import { set } from "../services/cache.service.js";

export const userBaseRevokeTokenKey = ({ userId }) =>
    `user:${userId}:revoke-token:`;

export const createRevokeToken = async ({ payload }) => {
    const { sub, iat, exp } = payload;

    if (!sub || !iat || !exp) {
        throw new Error("Invalid token payload");
    }

    const ttl = exp - Math.floor(Date.now() / 1000);

    if (ttl <= 0) {
        return false;
    }

    const key =
        `${userBaseRevokeTokenKey({ userId: sub })}${iat}`;

    await set({
        key,
        value: "revoked",
        ttl,
    });

    return true;
};