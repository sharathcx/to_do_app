import express, { Router } from "express";
import { validate } from "../../fastapify";
import { UserPayloadSchema } from "./user.schemas";
import { generateOTP, saveOTP, sendOTPEmail } from "./user.utils";
import { redisClient } from "../../redisCache";


const userRouter = Router();

userRouter.post(
    "/auth/get-otp",
    validate(UserPayloadSchema),
    async (req: express.Request, res: express.Response) => {
        const { email } = req.body;


        const existingOtp = await redisClient.get(`otp:${email}`);
        if (existingOtp) {
            return res.status(429).json({
                message: "OTP already sent. Please wait before requesting again."
            });
        }

        const otp = generateOTP();
        await saveOTP(email, otp);

        await sendOTPEmail(email, otp);

        return res.status(200).json({
            message: "OTP sent successfully"
        });

    }
)


export default userRouter;



