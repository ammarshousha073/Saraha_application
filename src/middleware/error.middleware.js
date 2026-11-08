
import { NODE_ENV } from "../config.js";
import { LanguageEnum } from "../common/enum/security.enum.js";

import { getValidationMessage } from "../common/validation.js";

export const globalErrorHandling = (error, req, res, next) => {
    const status = error.cause?.status ?? 500;
    const code = status >= 500 ? 1014 : error.cause?.code ?? 111;
    const isProduction = NODE_ENV === "production";

    const rawLang = req.query?.lang ?? req.headers["accept-language"];
    const lang = String(rawLang ?? "").toLowerCase().startsWith("en")
        ? LanguageEnum.EN
        : LanguageEnum.AR;

    const message =
        error.cause?.message ||
        getValidationMessage(code, lang);


        
    return res.status(status).json({
        success: false,
        code,
        message,
        ...(error.cause?.extra !== undefined
            ? { extra: error.cause.extra }
            : {}),
        ...(isProduction ? {} : { stack: error.stack }),
    });
};
