import jwt from "jsonwebtoken";


const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET!;

export const generateAcessToken = (payload: object) => {
    return jwt.sign(payload, ACCESS_SECRET, {
        expiresIn: "15m"
    });
};

export const generateRefreshToken = (payload: object) => {
    return jwt.sign(payload, REFRESH_SECRET, {
        expiresIn: "7d"
    });
};


export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 90000).toString();
};





