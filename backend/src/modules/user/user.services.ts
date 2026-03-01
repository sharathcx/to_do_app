import { Resend } from "resend";
import { redisClient } from "../../redisCache";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOTPEmail = async (email: string, otp: string) => {
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

