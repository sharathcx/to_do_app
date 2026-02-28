import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { redisClient } from "redisCache";
import { email } from "zod";

dotenv.config()

export const sendOTPEmail = async (email: string, otp: string) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your Login OTP",
        text: `Your OTP is: ${otp}`
    });
};


export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 90000).toString();
};

export const saveOTP = async (email: string, otp: string) => {
    await redisClient.set(`otp:${email}`, otp, {
        EX: 300
    });
};

export const verifyOTP = async (email: string, otp: string) => {
    const storedOtp = await redisClient.get(`otp:${email}`);
    return storedOtp === otp;
}

