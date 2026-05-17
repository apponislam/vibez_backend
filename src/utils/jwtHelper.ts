import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";

type ExpiresIn = string | number;

const generateToken = (payload: string | object | Buffer, secret: Secret, expiresIn: ExpiresIn): string => {
    const options: SignOptions = {
        algorithm: "HS256",
        expiresIn: expiresIn as any,
    };

    return jwt.sign(payload, secret, options);
};

const verifyToken = (token: string, secret: Secret): JwtPayload => {
    return jwt.verify(token, secret) as JwtPayload;
};

export const jwtHelper = {
    generateToken,
    verifyToken,
};
