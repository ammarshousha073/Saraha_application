import { BadRequestException } from "../common/exeptions/error.exeptions.js";
import { processMulterFile } from "../common/utlis/index.js";

export const uploadMiddleware = ({
    isRequired = true,
    multerMiddleware,
    customPath = "general",
    validation = []
}) => {

    return (req, res, next) => {

        if (typeof multerMiddleware !== 'function') {
            return next(
                new Error('Multer middleware is required!')
            );
        }

        try {

            multerMiddleware(req, res, async (error) => {

                try {

                    // Multer errors
                    if (error) {

                        return next(
                            new Error(error.message, {
                                cause: {
                                    status: 400,
                                    code: 111,
                                    message: error.message
                                }
                            })
                        );
                    }

                    // Check uploaded files
                    const hasSingleFile = Boolean(req.file);

                    const hasArrayFiles =
                        Array.isArray(req.files) &&
                        req.files.length > 0;

                    const hasFieldsFiles =
                        req.files &&
                        !Array.isArray(req.files) &&
                        Object.values(req.files).some(
                            files => Array.isArray(files) && files.length > 0
                        );

                    const hasFiles =
                        hasSingleFile ||
                        hasArrayFiles ||
                        hasFieldsFiles;

                if (isRequired && !hasFiles) {
    throw BadRequestException({
        code: 111,
        message: "File is required!"
    });
}

                    // Process uploaded files
                    await processMulterFile({
                        customPath,
                        validation,
                        req
                    });

                    return next();

                } catch (error) {

                    return next(error);

                }

            });

        } catch (error) {

            return next(error);

        }

    };
};