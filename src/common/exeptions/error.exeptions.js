
import { NODE_ENV } from "../../config.js";
import { LanguageEnum } from "../enum/security.enum.js";
import { getValidationMessage } from "../validation.js";

// General customized error method
export const ErrorResponse = ({
    code = 1014,
    message,
    status = 400,
    extra = undefined,
} = {}) => {
    throw new Error(message ?? "Error", {
        cause: {
            code,
            status,
            extra,
        },
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

// Fixed error structure
export const globalErrorHandling = (error, req, res, next) => {
    const status = error.cause?.status ?? 500;
    const isProduction = NODE_ENV === "production";

    const rawLang =
        req.query?.lang ??
        req.headers["accept-language"];

    const requestedLang = String(rawLang ?? "").toLowerCase();

    const lang = requestedLang.startsWith("en")
        ? LanguageEnum.EN
        : requestedLang.startsWith("ar")
            ? LanguageEnum.AR
            : LanguageEnum.AR;

    const code =
        status >= 500
            ? 1014
            : error.cause?.code ?? 111;

    const message =
        error.cause?.code === undefined && status < 500
            ? getValidationMessage(111, lang)
            : getValidationMessage(code, lang);

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
