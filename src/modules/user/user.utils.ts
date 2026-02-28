import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { redisClient } from "../../redisCache";
import { email } from "zod";
import { Resend } from "resend";

dotenv.config()

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOTPEmail = async (email: string, otp: string) => {
    try {
        const data = await resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Your Login OTP",
            html: `
          <h2>Your OTP Code</h2>
          <p>Your verification code is:</p>
          <h1>${otp}</h1>
          <p>This code expires in 5 minutes.</p>
        `,
        });
        console.log("Resend API response:", data);
        return data;
    } catch (error) {
        console.error("Resend API error:", error);
        throw error;
    }
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

