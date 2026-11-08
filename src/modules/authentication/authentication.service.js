
import { set, get, del, ttl, incrBy, expire, keys } from '../../common/services/cache.service.js';

import { EmailSubjectEnum } from '../../common/enum/email.enum.js';

import {
    ConflictException,
    NotFoundException,
    UnauthorizedException,
    ErrorResponse,
    TooManyRequestException,
} from '../../common/exeptions/index.js';


import {
    create,
    findOne,
} from '../../common/respository/index.js';

import {
    compare,
    createLoginCredentials,
    encryption,
    hash,
} from '../../common/security/index.js';

import { emailEvent } from '../../common/utlis/email/email.event.js';

import {
    createOtp,
    userBaseRevokeTokenKey,
    UserEmailKey,
    UserEmailTrailsKey,
} from '../../common/utlis/index.js';

import { UserModel } from '../../DB/model/user.model.js';
import { ProviderEnum } from '../../common/enum/provider.enum.js';




const sendEmailOtp = async ({
    email,
    username,
    subject = EmailSubjectEnum.CONFIRM_EMAIL,
    expiresIn = 120,
    maxTrials = 3,
    blockInseconds = 300,
    title
}) => {
    const otpKey = UserEmailKey({ email, subject });
    const trialsKey = UserEmailTrailsKey({ email, subject });

    // Check if the account is temporarily blocked
    const oldTrials = Number(await get({ key: trialsKey })) || 0;

    if (oldTrials >= maxTrials) {
        throw TooManyRequestException({
            code: 1007,
            message: `Maximum OTP requests reached. Try again later.`,
            extra: {
                retryAfter: await ttl({ key: trialsKey }),
            },
        });
    }

    // Prevent sending another OTP while the current one is valid
    const existingOtpTTL = await ttl({ key: otpKey });

    if (existingOtpTTL > 0) {
        throw ConflictException({
            code: 1006,
            message: `Please wait ${existingOtpTTL} seconds before requesting a new OTP.`,
            extra: {
                retryAfter: existingOtpTTL,
            },
        });
    }

    const code = createOtp();

    await set({
        key: otpKey,
        value: await hash({ plaintext: code }),
        ttl: expiresIn,
    });

    // Increment resend trials separately from the OTP key
    const currentTrials = await incrBy({
        key: trialsKey,
        value: 1,
    });

    // Apply the blocking period after reaching the limit
    if (currentTrials >= maxTrials) {
        await expire({
            key: trialsKey,
            ttl: blockInseconds,
        });

        // Remove the newly created OTP because the limit was reached
        await del({ key: otpKey });

        throw TooManyRequestException({
            code: 1007,
            message: `Maximum OTP requests reached. Try again in ${blockInseconds} seconds.`,
            extra: {
                retryAfter: blockInseconds,
            },
        });
    }

    emailEvent.emit('sendEmail', {
        recipient: { to: email },
        subject,
        data: {
            template: 'Confirm Email',
            code,
            username,
            expiresInMinutes: Math.ceil(expiresIn / 60),
            title 
        },
    });
};



export const signup = async ({ email, password, username, phone }) => {
    let account;

    try {
        const duplicatedAccount = await findOne({
            model: UserModel,
            filter: { email },
            options: { select: 'email' },
        });

        if (duplicatedAccount) {
            throw ConflictException({
                code: 1001,
            });
        }

        account = await create({
            model: UserModel,
            data: {
                username,
                email,
                password: await hash({ plaintext: password }),
                phone: await encryption(phone),
            },
        });
    } catch (error) {
        // Preserve our custom exceptions
        if (error?.cause?.status) {
            throw error;
        }

        console.error('[Signup] Account creation failed:', error.message);

        throw ErrorResponse({
            code: 1014,
            status: 500,
            message: 'Signup failed while creating account',
        });
    }

    // 2. Generate and store OTP
    await sendEmailOtp({ email, username, subject: EmailSubjectEnum.CONFIRM_EMAIL })
    return account;
};

//

///
export const confirmEmail = async ({ email, otp }) => {
    let account;

    try {
        account = await findOne({
            model: UserModel,
            filter: {
                email,
                provider: ProviderEnum.SYSTEM,
                confirmEmail: { $exists: false },
            },
            options: { select: 'email' },
        });
    } catch (error) {
        console.error('[Confirm Email] Database query failed:', error.message);

        throw ErrorResponse({
            code: 1014,
            status: 500,
            message: 'Could not check account for email verification',
        });
    }

    if (!account) {
        throw NotFoundException({
            code: 1003,
            message: 'Invalid account or email already confirmed',
        });
    }

    // 2. Retrieve the hashed OTP
    let hashedOtp;

    try {
        hashedOtp = await get({
            key: UserEmailKey({
                email,
                subject: EmailSubjectEnum.CONFIRM_EMAIL,
            }),
        });
    } catch (error) {
        console.error('[Confirm Email] Redis GET failed:', error.message);

        throw ErrorResponse({
            code: 1014,
            status: 500,
            message: 'Email verification service is temporarily unavailable',
        });
    }

    if (!hashedOtp) {
        throw ConflictException({
            code: 1004,
            message: 'OTP has expired or does not exist',
        });
    }

    // 3. Compare the OTP
    let isValidOtp;

    try {
        isValidOtp = await compare(otp, hashedOtp);
    } catch (error) {
        console.error('[Confirm Email] OTP comparison failed:', error.message);

        throw ErrorResponse({
            code: 1014,
            status: 500,
            message: 'Could not verify OTP',
        });
    }

    if (!isValidOtp) {
        throw ConflictException({
            code: 1005,
            message: 'Invalid OTP',
        });
    }

    // 4. Confirm the account and remove the OTP
    
        account.confirmEmail = new Date();
        await account.save();

    await del({ key: await keys({ prefix: UserEmailKey({ email, subject: EmailSubjectEnum.CONFIRM_EMAIL }) }) })
    return
    }

    //


export const RequestForgotPassword = async ({ email }) => {
    const account = await findOne({
        model: UserModel,
        filter: {
            email: email.trim().toLowerCase(),
            provider: ProviderEnum.SYSTEM,
            confirmEmail: { $exists: true },
        },
    });

    if (!account) {
        throw NotFoundException({
            code: 1003,
            message: 'fail to find user account',
        });
    }

    await sendEmailOtp({
        email: account.email,
        username: account.username,
        subject: EmailSubjectEnum.FORGOT_PASSWORD,
    });

    return {
        message: 'Password reset OTP sent successfully',
    };
};



export const verfiyForgotPasswordCode = async ({ email, otp }) => {
    let account;

    try {
        account = await findOne({
            model: UserModel,
            filter: {
                email,
                provider: ProviderEnum.SYSTEM,
                confirmEmail: { $exists: true },
            },
            options: { select: 'email' },
        });
    } catch (error) {
        console.error('[Forgot Password] Database query failed:', error.message);

        throw ErrorResponse({
            code: 1014,
            status: 500,
            message: 'Could not check account for password reset',
        });
    }

    if (!account) {
        throw NotFoundException({
            code: 1003,
            message: 'Invalid account',
        });
    }

    const otpKey = UserEmailKey({
        email,
        subject: EmailSubjectEnum.FORGOT_PASSWORD,
    });

    let hashedOtp;

    try {
        hashedOtp = await get({ key: otpKey });
    } catch (error) {
        console.error('[Forgot Password] Redis GET failed:', error.message);

        throw ErrorResponse({
            code: 1014,
            status: 500,
            message: 'Password reset service is temporarily unavailable',
        });
    }

    if (!hashedOtp) {
        throw ConflictException({
            code: 1004,
            message: 'OTP has expired or does not exist',
        });
    }


    let isValidOtp;

    try {
        isValidOtp = await compare(otp, hashedOtp);
    } catch (error) {
        console.error(
            '[Forgot Password] OTP comparison failed:',
            error.message,
        );

        throw ErrorResponse({
            code: 1014,
            status: 500,
            message: 'Could not verify OTP',
        });
    }

    if (!isValidOtp) {
        throw ConflictException({
            code: 1005,
            message: 'Invalid OTP',
        });
    }

    return {
        message: 'OTP verified successfully',
        email: account.email,
        account
    };
};


export const ResetForgotPassword = async ({ email, otp, password }) => {
    const { account } = await verfiyForgotPasswordCode({ email, otp });

    account.password = await hash({ plaintext: password });
    account.changeCredentialsTime = new Date();

    await account.save();

    const [revokeKeys, otpKeys] = await Promise.all([
        keys({
            prefix: userBaseRevokeTokenKey({
                userId: account._id.toString(),
            }),
        }),
        keys({
            prefix: UserEmailKey({
                email,
                subject: EmailSubjectEnum.FORGOT_PASSWORD,
            }),
        }),
    ]);

    const keysToDelete = [...revokeKeys, ...otpKeys];

    if (keysToDelete.length > 0) {
        await del({ key: keysToDelete });
    }

    return {
        message: "Password reset successfully",
    };
};


    // // 4. Confirm the account and remove the OTP
    
    //     account.confirmEmail = new Date();
    //     await account.save();

    // await del({ key: await keys({ prefix: UserEmailKey({ email, subject: EmailSubjectEnum.CONFIRM_EMAIL }) }) })
    // return
    // }

///
export const resendConfirmEmail = async ({ email }) => {
    const account = await findOne({
        model: UserModel,
        filter: {
            email,
            provider: ProviderEnum.SYSTEM,
            confirmEmail: { $exists: false },
        },
        options: { select: 'email username' },
    });
    if (!account) {
        throw NotFoundException({                                                                                                               
            code: 1003,
            message: 'Invalid account or email already confirmed',
        });
    }
    await sendEmailOtp({ email,username : account.username , subject: EmailSubjectEnum.CONFIRM_EMAIL })
    return
}



///



export const login = async (email, password, issuer) => {
    let account;

    // 1. Find the account
    try {
        account = await findOne({
            model: UserModel,
            filter: {
                email,
                provider: ProviderEnum.SYSTEM,
                confirmEmail: { $exists: true },
            },
        });
    } catch (error) {
        console.error('[Login] Database query failed:', error.message);

        throw ErrorResponse({
            code: 1014,
            status: 500,
            message: 'Login service is temporarily unavailable',
        });
    }

    if (!account) {
        throw UnauthorizedException({
            code: 1002,
        });
    }

    // 2. Compare the password
    let match;

    try {
        match = await compare(password, account.password);
    } catch (error) {
        console.error('[Login] Password comparison failed:', error.message);

        throw ErrorResponse({
            code: 1014,
            status: 500,
            message: 'Could not verify login credentials',
        });
    }

    if (!match) {
        throw UnauthorizedException({
            code: 1002,
        });
    }

    // 3. Generate login credentials
    try {
        return await createLoginCredentials({
            user: account,
            issuer,
        });
    } catch (error) {
        console.error('[Login] Credential creation failed:', error.message);

        throw ErrorResponse({
            code: 1014,
            status: 500,
            message: 'Failed to create login credentials',
        });
    }
};
