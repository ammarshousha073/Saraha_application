
import { Router } from "express";
import {
    filevalidation,
    localFileUpload,
    successResponse
} from "../../common/utlis/index.js";

import { createMessage, getAllMessages , getMessageById, deleteMessage } from "./message.service.js";
import { uploadMiddleware } from "../../middleware/multer.middleware.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from './message.validation.js';
import { authentication, beraerAuth } from "../../middleware/authentication.middleware.js";
import { decodeToken } from "../../common/security/token.security.js";

const router = Router();

const messageFolderName = "messages";


///with no account

router.post(
    "/",
    async (req, res, next) => {
        try {
            if (req.headers['authorization']) {
                await beraerAuth({ req });
            }

            return next();

        } catch (error) {
            return next(error);
        }
    },

    uploadMiddleware({
        multerMiddleware: localFileUpload({
            maxFileSize: 5,
            validation: filevalidation.Image
        }).array("attachments", 3),

        validation: filevalidation.Image,
        customPath: messageFolderName,
        isRequired: false
    }),

    validation(validators.createMessage),

    async (req, res, next) => {
        try {
            console.log("BODY:", req.body);
            console.log("FILES:", req.files);

            const data = await createMessage(
                req.body,
                req.files || [],
                req.user
            );

            return successResponse({
                res,
                status: 201,
                data
            });

        } catch (error) {
            return next(error);
        }
    }
);


//



router.get(
    "/",
    authentication(),
    validation(validators.allMessages),
    async (req, res, next) => {
        const data = await getAllMessages(
            req.validate.query,
            req.user
        );

        return successResponse({
            res,
            data
        });
    }
);


router.get(
    "/:messageId",
    authentication(),
    validation(validators.messageById),
    async (req, res, next) => {

        const data = await getMessageById(
            req.validate.params,
            req.user
        );

        return successResponse({
            res,
            data
        });
    }
);


router.delete(
    "/:messageId",
    authentication(),
    validation(validators.messageById),
    async (req, res, next) => {

        const data = await deleteMessage(
            req.validate.params,
            req.user
        );

        return successResponse({
            res,
            data
        });
    }
);





export default router;
