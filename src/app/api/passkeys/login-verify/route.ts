import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { rpID, origin } from "@/lib/webauthn";
import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json();

  // Читаем challenge из cookie
  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get("webauthn-challenge")?.value;

  if (!expectedChallenge) {
    return NextResponse.json({ error: "challenge expired or missing" }, { status: 400 });
  }

  // Ищем authenticator по credentialId
  const credentialId = body.id;
  const authenticator = await prisma.authenticator.findUnique({
    where: { credentialId },
    include: { user: true },
  });

  if (!authenticator) {
    return NextResponse.json({ error: "passkey not found" }, { status: 404 });
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: authenticator.credentialId,
        publicKey: new Uint8Array(authenticator.credentialPublicKey),
        counter: Number(authenticator.counter),
        transports: authenticator.transports
          ? JSON.parse(authenticator.transports)
          : undefined,
      },
    });

    if (!verification.verified) {
      return NextResponse.json({ error: "verification failed" }, { status: 400 });
    }

    // Обновляем counter
    await prisma.authenticator.update({
      where: { id: authenticator.id },
      data: { counter: BigInt(verification.authenticationInfo.newCounter) },
    });

    // Удаляем challenge cookie
    cookieStore.delete("webauthn-challenge");

    // Создаём JWT сессию (программный signIn)
    const user = authenticator.user;
    const token = await encode({
      token: {
        id: String(user.id),
        username: user.username,
        name: user.username,
        email: user.email,
        sub: String(user.id),
      },
      secret: process.env.NEXTAUTH_SECRET!,
      maxAge: 30 * 24 * 60 * 60, // 30 дней
    });

    // Устанавливаем session cookie
    const secureCookie = process.env.NODE_ENV === "production";
    const cookieName = secureCookie
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

    // Получаем maxAge из authOptions или дефолт 30 дней
    const maxAge = authOptions.session?.maxAge || 30 * 24 * 60 * 60;

    cookieStore.set(cookieName, token, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    return NextResponse.json({ success: true, username: user.username });
  } catch (err) {
    console.error("WebAuthn login error:", err);
    return NextResponse.json({ error: "verification failed" }, { status: 400 });
  }
}
