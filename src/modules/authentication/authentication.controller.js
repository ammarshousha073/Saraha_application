import { Router } from "express";
import { login, signup } from "./authentication.service.js";
import { successResponse } from "../../common/utlis/index.js";
import *as validators from './authentication.validation.js'
import { validation } from "../../middleware/validation.middleware.js";

const router = Router();
router.post("/signup" , validation(validators.signup) , async (req, res , next)=>{
     
    const data = await signup(req.body)
    return successResponse({res , status:201 , data})
})

router.post("/login", validation(validators.Login), async (req, res, next) => {

    const { email, password, issuer } = req.validate.body;

    const requestIssuer = `${req.protocol}://${req.get("host")}`;
const data = await login(
            email,
            password,
            issuer ?? requestIssuer
        );


    return successResponse({ res, data });
});


export default router