import { Router } from "express";
import { confirmEmail, login, RequestForgotPassword, resendConfirmEmail,ResetForgotPassword,signup, verfiyForgotPasswordCode } from "./authentication.service.js";
import { successResponse } from "../../common/utlis/index.js";
import *as validators from './authentication.validation.js'
import { validation } from "../../middleware/validation.middleware.js";
import { rateLimiter } from "../../middleware/index.js";

import { RATE_LIMIT_CONFIG } from "../../config.js";

const router = Router();

const loginRateLimit = rateLimiter({
    ...RATE_LIMIT_CONFIG.LOGIN,
    prefix: "rate-limit:login"
});

const signupRateLimit = rateLimiter({
    ...RATE_LIMIT_CONFIG.SIGNUP,
    prefix: "rate-limit:signup"
});

const forgotPasswordRateLimit = rateLimiter({
    ...RATE_LIMIT_CONFIG.FORGOT_PASSWORD,
    prefix: "rate-limit:forgot-password"
});

const resendOtpRateLimit = rateLimiter({
    ...RATE_LIMIT_CONFIG.RESEND_OTP,
    prefix: "rate-limit:resend-otp"
});






router.post(
    "/signup",
    signupRateLimit,
    validation(validators.signup),
    async (req, res, next) => {

        const data = await signup(req.body);

        return successResponse({
            res,
            status: 201,
            data
        });
    }
);


router.patch(
    "/confirm-email",
    validation(validators.confirmEmail),
    async (req, res, next) => {
        const { email, otp } = req.validate.body;

        const data = await confirmEmail({ email, otp });

        return successResponse({ res, status: 200, data });
    }
);

router.patch(
    "/resend-confirm-email",
    validation(validators.ResendConfirmEmail()),
    async (req, res, next) => {
        const { email} = req.validate.body;

        const data = await resendConfirmEmail({ email});

        return successResponse({ res, status: 200, data });
    }
);
router.patch("/resend-confirm-email", validation(validators.ResendConfirmEmail()), async (req, res, next) => {
        const { email} = req.validate.body;

        const data = await resendConfirmEmail({ email});

        return successResponse({ res, status: 200, data });
    }
);
//


//
router.post(
    "/request-forgot-password-code",
    forgotPasswordRateLimit,
    validation(validators.ResendConfirmEmail()),
    async (req, res, next) => {

        const { email } = req.validate.body;

        const data = await RequestForgotPassword({ email });

        return successResponse({
            res,
            status: 201,
            data
        });
    }
);

router.post("/verify-forgot-password", validation(validators.confirmEmail()), async (req, res, next) => {
        const { email , otp} = req.validate.body;

        const data = await verfiyForgotPasswordCode({ email , otp});

        return successResponse({ res, status: 200, data });
    }
);

router.patch("/reset-forgot-password", validation(validators.resetforgotpassword()), async (req, res, next) => {
        const { email , otp ,password } = req.validate.body;

        const data = await ResetForgotPassword({ email , otp , password });

        return successResponse({ res, status: 200, data });
    }
);

router.post(
    "/login",
    loginRateLimit,
    validation(validators.Login),
    async (req, res, next) => {

        const { email, password, issuer } = req.validate.body;

        const requestIssuer = `${req.protocol}://${req.get("host")}`;

        const data = await login(
            email,
            password,
            issuer ?? requestIssuer
        );

        return successResponse({
            res,
            data
        });
    }
);


export default router