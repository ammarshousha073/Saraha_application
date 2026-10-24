
import { z } from "zod";
import { generalValidationFields } from "../../common/validation.js";


export const loginSchema = z.strictObject({
    email:generalValidationFields.email,

    password : generalValidationFields.password,

    issuer:generalValidationFields.issuer
});


export const Login = z.object({
    body: loginSchema,

    query: z.strictObject({
        lang: z.enum(["ar", "en"]).default("ar"),
    }),
});


export const signup = (lang)=>{
    return  z.object({
body : loginSchema.safeExtend({
username: generalValidationFields.username(lang),

phone: generalValidationFields.phone,
confirmPassword: generalValidationFields.confirmPassword,
gender: generalValidationFields.gender

}).superRefine((data, ctx) => {

    console.log(data , ctx);

    generalValidationFields.matchFields({ original: "password", copy: "confirmPassword", data, ctx , lang });

    if (!data.username.includes(" ")) {
        ctx.addIssue({
            code: "custom",
            path: ["username"],
            message: "Username must contain at least one space",
        });
    }

})});
}





//     phone: z.e164(),

//     confirmPassword: z
//         .string()
//         .min(8)
//         .max(20),
// }).superRefine((data, ctx) => {

//     // Check password confirmation
 

//     // Check username contains at least one space
//     if (!data.username.includes(" ")) {
//         ctx.addIssue({
//             code: "custom",
//             path: ["username"],
//             message: "Username must contain at least one space",
//         });
//     }
// });

// ==================== Signup Schema ====================

// export const signup = z.object({
//     body: signupSchema,

//     query: z.strictObject({
//         lang: z.string().length(2).optional(),
//     }),
// });
