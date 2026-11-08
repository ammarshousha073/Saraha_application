import { Router } from "express";
import { filevalidation, localFileUpload, successResponse} from "../../common/utlis/index.js";
import { profile, rotateToken, update,logout } from "./user.service.js";
import { authentication, authorization } from "../../middleware/authentication.middleware.js";
import { TokenTypeEnum } from "../../common/enum/security.enum.js";
import { ROLE_ENUM } from "../../common/enum/user.gender.js";
import { uploadMiddleware } from "../../middleware/multer.middleware.js";
const router = Router()
router.patch("/profile-image",uploadMiddleware({
        isRequired: false,
        multerMiddleware: localFileUpload({maxFileSize: 5}).fields([
            { name: "attachment", maxCount: 5 },
            { name: "profile", maxCount: 1 }
        ]),
        customPath: "profiles",
        validation: filevalidation.Image
    }),

    async (req, res, next) => {
        console.log(req.files);

        return successResponse({
            res,
            data: {
                files: req.files
            }
        });
    }
);
    async (req, res, next) => {
        console.log({after : req.body});
        
        req.user.Image= req.finalpath;
        await req.user.save();
        return successResponse({res,data: { user : req.user }
        });
    }


router.get("/", authentication(), async (req, res, next) => {
    const data = await profile(req.user)
    return successResponse({res,data})
})

router.patch("/", authentication(), authorization([ROLE_ENUM.ADMIN, ROLE_ENUM.USER]), async (req, res, next) => {
    const data = await update(req.user , req.body)
    return successResponse({res,data})
})
router.post("/rotate-token", authentication(TokenTypeEnum.REFRESH), async (req, res, next) => {
    const data = await rotateToken(req.payload , req.user ,`${req.protocol}://${req.host}`)
    return successResponse({res,data})
})
router.post("/logout", authentication(TokenTypeEnum.ACCESS), async (req, res, next) => {
    const data = await logout(req.payload, req.user, {
        action: req.body.action,
    });

    return successResponse({ res, data });
});











////
export default router