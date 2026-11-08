
import { incrementWithExpiry } from "../common/services/cache.service.js";

import {
    TooManyRequestException,
    ErrorResponse
} from "../common/exeptions/error.exeptions.js";


export const rateLimiter = ({
    windowSeconds,
    maxRequests,
    prefix = "rate-limit"
} = {}) => {

    if (
        !Number.isInteger(windowSeconds) ||
        windowSeconds < 1 ||
        !Number.isInteger(maxRequests) ||
        maxRequests < 1
    ) {
        throw new Error("Invalid rate limiter configuration");
    }

    return async (req, res, next) => {

        try {

            const ip = req.ip || req.socket.remoteAddress;

            const key = `${prefix}:${ip}`;

            const { count, ttl } = await incrementWithExpiry({
                key,
                ttl: windowSeconds
            });

            res.setHeader("RateLimit-Limit", maxRequests);
            res.setHeader("RateLimit-Remaining", Math.max(0, maxRequests - count));
            res.setHeader("RateLimit-Reset", ttl);

            if (count > maxRequests) {

                res.setHeader("Retry-After", ttl);

                throw TooManyRequestException({
                    code: 1007,
                    message: "Too many requests. Please try again later.",
                    extra: {
                        retryAfter: ttl
                    }
                });
            }

            return next();

        } catch (error) {

            if (error?.cause?.status === 429) {
                return next(error);
            }

            const serviceError = new Error(
                "Rate limiting service is temporarily unavailable",
                {
                    cause: {
                        status: 503,
                        code: 1014,
                        message: "Rate limiting service is temporarily unavailable"
                    }
                }
            );

            return next(serviceError);
        }}}
