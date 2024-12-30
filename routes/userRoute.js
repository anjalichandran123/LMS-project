import express from "express"
import { registerUser ,
    loginUser,
    logoutUser,
    forgotPassword,
    resetPassword,

} from "../controller/userController.js";

const router=express.Router()



router.post("/registerUser",registerUser);
router.post("/loginUser",loginUser);
router.post("/logoutUser",logoutUser);
router.post("/forgotPassword",forgotPassword);
router.post("/resetPassword",resetPassword);




export default router;