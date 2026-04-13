// Конфигурация WebAuthn / Passkeys
export const rpName = "Wishlist";
export const rpID = process.env.WEBAUTHN_RP_ID || "localhost";
export const origin = process.env.WEBAUTHN_ORIGIN || "http://localhost:3000";
