import nodemailer from "nodemailer";
import dotenv from "dotenv";

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