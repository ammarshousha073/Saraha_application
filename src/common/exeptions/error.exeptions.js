
import { NODE_ENV } from "../../config.js";
import { LanguageEnum } from "../enum/security.enum.js";
import { getValidationMessage } from "../validation.js";


export const ErrorResponse = ({
    code = 1014,
    message,
    status = 400,
    extra = undefined,
} = {}) => {
    throw new Error(message ?? "", {
        cause: {
            code,
            status,
            extra,
            message,
        },
    });
};

export const globalErrorHandling = (error, req, res, next) => {
    const status = error.cause?.status ?? 500;
    const isProduction = NODE_ENV === "production";

    const rawLang =
        req.query?.lang ??
        req.headers["accept-language"];

    const requestedLang = String(rawLang ?? "").toLowerCase();

    const lang = requestedLang.startsWith("en")
        ? LanguageEnum.EN
        : LanguageEnum.AR;

    const code =
        status >= 500
            ? 1014
            : error.cause?.code ?? 111;

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


// Error templates
export const BadRequestException = (options = {}) =>
    ErrorResponse({ ...options, status: 400 });

export const ConflictException = (options = {}) =>
    ErrorResponse({ ...options, status: 409 });

export const UnauthorizedException = (options = {}) =>
    ErrorResponse({ ...options, status: 401 });

export const NotFoundException = (options = {}) =>
    ErrorResponse({ ...options, status: 404 });

export const ForbiddenException = (options = {}) =>
    ErrorResponse({ ...options, status: 403 });
export const TooManyRequestException = (options = {}) =>
    ErrorResponse({ ...options, status: 429 });

// export const globalErrorHandling = (error, req, res, next) => {
//     const status = error.cause?.status ?? 500;
//     const isProduction = NODE_ENV === "production";

//     const rawLang =
//         req.query?.lang ??
//         req.headers["accept-language"];

//     const requestedLang = String(rawLang ?? "").toLowerCase();

//     const lang = requestedLang.startsWith("en")
//         ? LanguageEnum.EN
//         : LanguageEnum.AR;

//     const code =
//         status >= 500
//             ? 1014
//             : error.cause?.code ?? 111;

//     const validationMessage = getValidationMessage(code, lang);

//     const message =
//         error.cause?.message ??
//         (error.cause?.code !== undefined
//             ? validationMessage
//             : error.message || validationMessage);

//     return res.status(status).json({
//         success: false,
//         code,
//         message,
//         ...(error.cause?.extra !== undefined
//             ? { extra: error.cause.extra }
//             : {}),
//         ...(isProduction
//             ? {}
//             : { stack: error.stack }),
//     });
// };
