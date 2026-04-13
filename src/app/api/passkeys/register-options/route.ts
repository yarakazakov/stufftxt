import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { rpName, rpID } from "@/lib/webauthn";
import { cookies } from "next/headers";

export async function POST() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);

  // Получаем уже зарегистрированные authenticators
  const existingAuthenticators = await prisma.authenticator.findMany({
    where: { userId },
  });

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode(String(userId)),
    userName: session.user.username,
    userDisplayName: session.user.username,
    // Не регистрировать дубликаты
    excludeCredentials: existingAuthenticators.map((auth) => ({
      id: auth.credentialId,
      transports: auth.transports
        ? JSON.parse(auth.transports)
        : undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  // Сохраняем challenge в httpOnly cookie (60s TTL)
  const cookieStore = await cookies();
  cookieStore.set("webauthn-challenge", options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60,
    path: "/",
  });

  return NextResponse.json(options);
}
