import { SignJWT, jwtVerify } from 'jose';

function getSecretKey(secret) {
    return new TextEncoder().encode(secret);
}

export async function generateAccessToken(payload, secret) {
    const key = getSecretKey(secret);

    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('15m')
        .setIssuer('playerson-api')
        .setAudience('playerson-client')
        .sign(key);
}

export async function generateRefreshToken(payload, secret, family, generation = 0) {
    const key = getSecretKey(secret);

    return await new SignJWT({ ...payload, family, generation })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .setIssuer('playerson-api')
        .setAudience('playerson-client')
        .sign(key);
}

export async function verifyToken(token, secret) {
    try {
        const key = getSecretKey(secret);
        const { payload } = await jwtVerify(token, key, {
            issuer: 'playerson-api',
            audience: 'playerson-client',
        });
        return { valid: true, payload };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}
