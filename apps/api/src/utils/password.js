/**
 * Password hashing using PBKDF2-SHA256 via Web Crypto API.
 *
 * Cloudflare Workers limits PBKDF2 to 100,000 iterations max.
 * Combined with a 16-byte random salt and 32-byte hash output,
 * this provides strong protection against brute-force attacks.
 *
 * Parameters: 100,000 iterations, SHA-256, 32-byte hash, 16-byte salt.
 */

const PBKDF2_ITERATIONS = 100000;
const HASH_LENGTH = 32;
const SALT_LENGTH = 16;

function generateSalt(length = SALT_LENGTH) {
    const salt = new Uint8Array(length);
    crypto.getRandomValues(salt);
    return salt;
}

function bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function hexToBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
}

export async function hashPassword(password) {
    const salt = generateSalt();
    const encoder = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );

    const hashBuffer = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            hash: 'SHA-256',
            salt: salt,
            iterations: PBKDF2_ITERATIONS,
        },
        keyMaterial,
        HASH_LENGTH * 8
    );

    // Encode as: iterations$salt_hex$hash_hex
    const saltHex = bufferToHex(salt);
    const hashHex = bufferToHex(hashBuffer);

    return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${saltHex}$${hashHex}`;
}

export async function verifyPassword(password, encodedHash) {
    try {
        const parts = encodedHash.split('$');
        if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256') {
            return false;
        }

        const iterations = parseInt(parts[1], 10);
        const salt = hexToBuffer(parts[2]);
        const storedHash = parts[3];

        const encoder = new TextEncoder();

        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits']
        );

        const hashBuffer = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                hash: 'SHA-256',
                salt: salt,
                iterations: iterations,
            },
            keyMaterial,
            HASH_LENGTH * 8
        );

        const computedHash = bufferToHex(hashBuffer);

        // Constant-time comparison to prevent timing attacks
        if (computedHash.length !== storedHash.length) return false;

        let result = 0;
        for (let i = 0; i < computedHash.length; i++) {
            result |= computedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
        }

        return result === 0;
    } catch {
        return false;
    }
}
