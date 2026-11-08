
import { LanguageEnum } from "../common/enum/security.enum.js";
import { BadRequestException } from "../common/exeptions/error.exeptions.js";
import {
    getValidationCode,
    getValidationMessage,
} from "../common/validation.js";

export const validation = (schema) => {
    return (req, res, next) => {
        const lang = Number(
            req.headers["accept-language"] ?? LanguageEnum.EN
        );

     
const currentSchema =
    typeof schema === "function"
        ? schema(lang)
        : schema;

const requestData = {
    body: req.body,
    query: req.query,
    params: req.params,
    file: req.file,
    files: req.files,
};

const validationData = Object.fromEntries(
    Object.keys(currentSchema.shape).map((key) => [
        key,
        requestData[key]
    ])
);

const validationResult = currentSchema.safeParse(validationData);


        if (!validationResult.success) {
            // مؤقتًا: اعرف السبب الحقيقي للفشل
            console.log(
                JSON.stringify(
                    validationResult.error.issues,
                    null,
                    2
                )
            );

            const issues = validationResult.error.issues.map((issue) => {
                const code = getValidationCode(issue);

                return {
                    code,
                    path: issue.path,
                    message: getValidationMessage(code, lang),
                };
            });

            throw BadRequestException({
                code: 111,
                message: getValidationMessage(111, lang),
                extra: issues,
            });
        }

        req.validate = validationResult.data;

        return next();
    };
};
