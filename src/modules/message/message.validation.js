import { z } from "zod";
import { generalValidationFields } from "../../common/validation.js";

export const createMessage = (lang) => {
    return z.object({
        body: z.strictObject({
            content: z.string()
                .min(2, {
                    message: lang?.message?.content?.minLength ||
                        "Content must be at least 2 characters long"
                })
                .max(50000, {
                    message: lang?.message?.content?.maxLength ||
                        "Content must be at most 50000 characters long"
                })
                .optional(),

            receiverId: generalValidationFields.id(lang)
        })
    }).superRefine((data, ctx) => {

        if (!data.body.content && !data.files?.length) {
            ctx.addIssue({
                code: "custom",
                path: ["body", "content"],
                message: "Missing message content"
            });
        }

    });
};


//

export const allMessages = (lang) => {
    return z.object({
        query: z.strictObject({
            type: z.enum(["0", "1", "2"]).default("0"),

            page: z.union([
                z.literal("all"),
                z.coerce.number().int().min(1)
            ]).default("all"),

            size: z.coerce.number()
                .int()
                .min(1)
                .max(100)
                .default(5)
        })
    });
};


export const messageById = (lang) => {
    return z.object({
        params: z.strictObject({
            messageId: generalValidationFields.id(lang)
        })
    });
};
