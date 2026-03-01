import express, { Router } from "express";
import { validate } from "../../fastapify";
import { UserPayloadSchema, OtpPayloadSchema } from "./user.schemas";
import { generateAcessToken, generateOTP, generateRefreshToken } from "./user.utils";
import { saveOTP, sendOTPEmail, verifyOTP } from "./user.services";
import { redisClient } from "../../redisCache";


const userRouter = Router();

userRouter.post(
    "/auth/get-otp",
    validate(UserPayloadSchema),
    async (req: express.Request, res: express.Response) => {
        const { email } = req.parsed.body;
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

userRouter.post(
    "/auth/verify-otp",
    validate(OtpPayloadSchema),
    async (req: express.Request, res: express.Response) => {
        const { email, otp } = req.parsed.body;
        const isValid = await verifyOTP(email, otp);
        if (!isValid) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        const payload = { email };

        const accessToken = generateAcessToken(payload);
        const refreshToken = generateRefreshToken(payload);
        
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: "OTP verified successfully",
            accessToken
        });
    }
)


userRouter.post("/auth/logout", (req, res) => {
    res.clearCookie("refreshToken");
    return res.json({ message: "Logged out successfully" });
});

export default userRouter;



