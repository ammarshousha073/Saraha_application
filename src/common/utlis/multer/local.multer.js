
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import {
    writeFile,
    mkdir,
    unlink
} from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import { BadRequestException } from '../../exeptions/error.exeptions.js';

export const filevalidation = {
    Image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    files: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
};


// Local File Upload
export const localFileUpload = ({
    maxFileSize = 5,
    validation = [],
} = {}) => {

    const storage = multer.memoryStorage();

    const fileFilter = (req, file, cb) => {

        if (
            validation.length &&
            !validation.includes(file.mimetype)
        ) {
            return cb(
                new Error('Invalid file MIME type!', {
                    cause: {
                        status: 400,
                        code: 111,
                        message: 'Invalid file MIME type!'
                    }
                })
            );
        }

        return cb(null, true);
    };

    return multer({
        storage,
        fileFilter,
        limits: {
            fileSize: maxFileSize * 1024 * 1024
        }
    });
};


// Process one file
export const processFile = async ({
    customPath = "general",
    file,
    validation = []
}) => {

    if (!file?.buffer) {
        throw BadRequestException({
    code: 111,
    message: 'File buffer is missing!'
});
    }

    const fileBuffer = file.buffer;

    // Detect actual file type
    const result = await fileTypeFromBuffer(fileBuffer);

    if (!result || !validation.includes(result.mime)) {
        throw BadRequestException({
    code: 111,
    message: 'Invalid file type!'
});
    }

    // Create folder
    const folderPath = resolve('./assets', customPath);

    await mkdir(folderPath, { recursive: true });

    // Generate unique filename
    const uniqueFilepath =
        `./assets/${customPath}/${randomUUID()}.${result.ext}`;

    const finalPath = resolve(uniqueFilepath);

    // Save file
    try {

        await writeFile(finalPath, fileBuffer);

    } catch (error) {

        await unlink(finalPath).catch(() => {});

        throw error;
    }

    // Attach file information
    file.finalpath = uniqueFilepath;
    file.detectedMimeType = result.mime;

    // Buffer is no longer needed after saving
    delete file.buffer;

    return file;
};


// Process multiple files
export const processFiles = async ({
    customPath,
    files = [],
    validation = []
}) => {

    const assets = [];

    try {

        for (const file of files) {

            const uploadedFile = await processFile({
                customPath,
                file,
                validation
            });

            assets.push(uploadedFile);
        }

        return assets;

    } catch (error) {

        // Cleanup previously processed files
        for (const file of assets) {

            if (file.finalpath) {
                await unlink(resolve(file.finalpath)).catch(() => {});
            }

        }

        throw error;
    }
};


// Process multiple fields
export const processFields = async ({
    customPath,
    fields = {},
    validation = []
}) => {

    const assets = {};

    try {

        for (const field of Object.keys(fields)) {

            assets[field] = await processFiles({
                customPath,
                files: fields[field],
                validation
            });

        }

        return assets;

    } catch (error) {

        // Cleanup previously processed fields
        for (const field of Object.keys(assets)) {

            for (const file of assets[field]) {

                if (file.finalpath) {
                    await unlink(resolve(file.finalpath)).catch(() => {});
                }

            }

        }

        throw error
    }
};


// Process Multer Files
export const processMulterFile = async ({
    req,
    customPath = "general",
    validation = []
} = {}) => {

    if (!req) {
        throw BadRequestException({
            code: 111,
            message: 'Request object is missing!'
        });
    }

    // Single file
    if (req.file) {

        req.file = await processFile({
            customPath,
            file: req.file,
            validation
        });

    }

    // Array files
    else if (Array.isArray(req.files)) {

        req.files = await processFiles({
            customPath,
            files: req.files,
            validation
        });

    }

    // Multiple fields
    else if (
        req.files &&
        typeof req.files === 'object' &&
        Object.keys(req.files).length
    ) {

        req.files = await processFields({
            customPath,
            fields: req.files,
            validation
        });

    }

    return req.file || req.files;
};


// Upload Middleware




// export const processFile = async ({ customPath = "general" , file, validation = [] }) => {
//     const result = await fileTypeFromBuffer(file.buffer)
//     if(!result || !validation.includes(result.mime)){
//         throw BadRequestException('Invalid file type!');
//     }
    




// export const processFile = async ({ customPath = "general" , file, validation = [] }) => {
//     const result = await fileTypeFromBuffer(file.buffer)
//     if(!result || !validation.includes(result.mime)){
//         throw BadRequestException('Invalid file type!');
//     }
//     else{
//         await mkdir(resolve(`./assets/${customPath}`))
// const uniqueFilepath = `./assets/${customPath}/${randomUUID()}.${result.ext}`;
// await writeFile(resolve(`./${uniqueFilepath}`), file.buffer);
// file.finalpath = uniqueFilepath;
// return file;

//     }
// }

// //
// export const processFields = async ({customPath , fields={}, validation = [] }) => {
// const assets = {};
// for (const field of Object.keys(fields)) {
//     const files =   await processFiles ({ customPath, files: fields[field], validation });
//     assets.push({field, files})
// }
// return assets;
// }

// //


// export const processFiles = async ({ customPath , files = [], validation = [] }) => {

//     const assets = [];

//     for (const file of files) {
//         const uploadedFile = await processFile({
//             customPath,file,
//             validation
//         });

//         assets.push(uploadedFile);
//     }

//     return assets;
// };



// export const processMulterFile = ({ customPath="general" , validation = [] } = {}) => {

//     return async (req, res, next) => {
//         console.log(req.files);
//             if (req.file) {
//                  await processFile({file: req.file,validation});
//             }
//             else if
//              (Array.isArray(req.files)) {
// await processFiles({files: req.files,validation})
// }
// else if (typeof req.files === 'object' && Object.keys(req.files)?.length ) {
// await processFields({files: req.files,validation})
// }
// next();
//     }
// }




// // export const processFile = ({ validation = [] } = {}) => {
// //     return async (req, res, next) => {
// //         try {
// //             if (!req.file?.path) {
// //                 return next(new Error('Uploaded file path not found'));
// //             }

// //             const filePath = resolve(req.file.path);

// //             const fileBuffer = await readFile(filePath);

// //             console.log({
// //                 filePath,
// //                 bufferExists: !!fileBuffer,
// //                 bufferLength: fileBuffer?.length
// //             });

// //             const result = await fileTypeFromBuffer(fileBuffer);

// //             console.log({ result });

// //             if (!result || !validation.includes(result.mime)) {
// //                 await unlink(filePath);

// //                 return next(new Error('Invalid file type!'));
// //             }

// //             const uniqueFilepath =
// //                 `./assets/${randomUUID()}.${result.ext}`;

// //             await writeFile(resolve(uniqueFilepath), fileBuffer);

// //             await unlink(filePath);

// //             req.file.finalpath = uniqueFilepath;

// //             return next();

// //         } catch (error) {
// //             return next(error);
// //         }
// //     };
// // };
// //
// export const processFiles = async ({ files = [], validation = [] }) => {
//     const assets = [];
//     for (const file of files) {
//         const uploadedFile = await processFile({ file, validation });
//         assets.push(uploadedFile);
//     }
//     return assets;
// }



// ///
// export const processMulterFile = ({ validation = [] } = {}) => {
//     return async (req, res, next) => {
//         if (req.file) {
//             await processFile({ file: req.file, validation });

//         }
//         if (Array.isArray(req.files) && req.files.length) {
//             await processFiles({ files: req.files, validation });
//         }
//         next();
//  