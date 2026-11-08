
import { z } from "zod";
import { LanguageEnum } from "./enum/security.enum.js";
import mongoose from "mongoose";

const validationMessage = {
    101: {
        ar: "البريد الإلكتروني غير صالح",
        en: "Invalid email address",
    },
    102: {
        ar: "اسم المستخدم يجب أن يكون على الأقل 3 أحرف",
        en: "Username must be at least 3 characters long",
    },
    103: {
        ar: "اسم المستخدم يجب ألا يتجاوز 50 حرفًا",
        en: "Username must be at most 50 characters long",
    },
    104: {
        ar: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
        en: "Password must be at least 8 characters long",
    },
    105: {
        ar: "كلمة المرور يجب ألا تتجاوز 20 حرفًا",
        en: "Password must be at most 20 characters long",
    },
    106: {
        ar: "رقم الهاتف غير صالح",
        en: "Invalid phone number",
    },
    107: {
        ar: "تأكيد كلمة المرور يجب أن يكون 8 أحرف على الأقل",
        en: "Confirm password must be at least 8 characters long",
    },
    108: {
        ar: "تأكيد كلمة المرور يجب ألا يتجاوز 20 حرفًا",
        en: "Confirm password must be at most 20 characters long",
    },
    109: {
        ar: "كلمة المرور وتأكيدها غير متطابقين",
        en: "Password and confirm password do not match",
    },
    110: {
        ar: "اسم المستخدم غير صالح",
        en: "Invalid username",
    },
    111: {
        ar: "البيانات المرسلة غير صالحة",
        en: "Invalid request data",
    },
    112: {
        ar: "النوع المحدد غير صالح",
        en: "Invalid gender",
    },
    1001: {
        ar: "البريد الإلكتروني مستخدم بالفعل",
        en: "Email already exists",
    },
    1002: {
        ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        en: "Invalid email or password",
    },
    1003: {
        ar: "الحساب غير صالح أو تم تأكيد البريد الإلكتروني بالفعل",
        en: "Invalid account or email already confirmed",
    },
    1004: {
        ar: "انتهت صلاحية رمز التحقق أو أنه غير موجود",
        en: "OTP has expired or does not exist",
    },
    1005: {
        ar: "رمز التحقق غير صحيح",
        en: "Invalid OTP",
    },
    1014: {
        ar: "حدث خطأ داخلي في الخادم",
        en: "Internal server error",
    },
};

export const getValidationMessage = (
    code,
    lang = LanguageEnum.AR
) => {
    const language =
        lang === LanguageEnum.EN ? "en" : "ar";

    return (
        validationMessage[code]?.[language] ??
        validationMessage[111][language]
    );
};

export const getValidationCode = (issue) => {
    const field = issue.path.at(-1);

    if (field === "email") return 101;

    if (field === "username") {
        if (issue.code === "too_small") return 102;
        if (issue.code === "too_big") return 103;
        return 110;
    }

    if (field === "password") {
        if (issue.code === "too_small") return 104;
        if (issue.code === "too_big") return 105;
        return 111;
    }

    if (field === "phone") return 106;

    if (field === "confirmPassword") {
        if (issue.code === "custom") return 109;
        if (issue.code === "too_small") return 107;
        if (issue.code === "too_big") return 108;
        return 111;
    }

    if (field === "gender") return 112;

    return 111;
};

const matchFields = ({ original, copy, data, ctx, lang }) => {
    if (data[original] !== data[copy]) {
        ctx.addIssue({
            code: "custom",
            path: [copy],
            message:
                lang === LanguageEnum.AR
                    ? `${original} و ${copy} غير متطابقين`
                    : `${original} and ${copy} do not match`,
        });
    }
};

export const generalValidationFields = {
    // Login validation
    email: z.email({
        message: "Invalid email address",
    }),

    otp: (lang) =>
        z.string().regex(/^\d{6}$/, {
            message:
                lang === LanguageEnum.AR
                    ? "رمز التحقق يجب أن يكون 6 أرقام"
                    : "OTP must be 6 digits",
        }),

    password: z
        .string()
        .min(8, {
            message: getValidationMessage(104),
        })
        .max(20, {
            message: getValidationMessage(105),
        })
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/,
            {
                message:
                    "Password must contain uppercase, lowercase, number, and special character",
            }
        ),

    issuer: z.string().optional(),

    // Signup validation
    username: (lang) =>
        z
            .string()
            .min(3, {
                message: getValidationMessage(102, lang),
            })
            .max(50, {
                message: getValidationMessage(103, lang),
            }),

    phone: z.e164({
        message: getValidationMessage(106),
    }),

    id: (lang) => z.string().refine((data) => { return mongoose.Types.ObjectId.isValid(data) }, { message: lang?.message?.receiverId?.invalid || "Invalid receiverId" }).min(24, { message: lang?.message?.receiverId?.minLength || "receiverId must be at least 24 characters long" }).max(24, { message: lang?.message?.receiverId?.maxLength || "receiverId must be at most 24 characters long" }),
    confirmPassword: z
        .string()
        .min(8, {
            message: getValidationMessage(107),
        })
        .max(20, {
            message: getValidationMessage(108),
        }),

    gender: z.enum(["0", "1"]).transform(Number),

    matchFields,

    file: (lang) =>
        z.strictObject({
            fieldname: z.string(),
            originalname: z.string(),
            encoding: z.string(),
            mimetype: z.string(),
            buffer: z.instanceof(Buffer),
            size: z.number(),
            path: z.string(),



        })

};
export const verifyForgotPasswordCode = () =>
    z.object({
        email: generalValidationFields.email,
        otp: generalValidationFields.otp(LanguageEnum.EN),
    });
