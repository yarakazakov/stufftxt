import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { rpID, origin } from "@/lib/webauthn";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Читаем challenge из cookie
  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get("webauthn-challenge")?.value;

  if (!expectedChallenge) {
    return NextResponse.json({ error: "challenge expired or missing" }, { status: 400 });
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "verification failed" }, { status: 400 });
    }

    const { credential, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo;

    // Сохраняем authenticator в базу
    await prisma.authenticator.create({
      data: {
        userId: Number(session.user.id),
        credentialId: credential.id,
        credentialPublicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        credentialDeviceType,
        credentialBackedUp,
        transports: body.response?.transports
          ? JSON.stringify(body.response.transports)
          : null,
      },
    });

    // Удаляем challenge cookie
    cookieStore.delete("webauthn-challenge");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("WebAuthn registration error:", err);
    return NextResponse.json({ error: "verification failed" }, { status: 400 });
  }
}
