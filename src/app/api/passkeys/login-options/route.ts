import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { rpID } from "@/lib/webauthn";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { username } = body;

  let allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] | undefined;

  // Если передан username — подтягиваем его authenticators
  if (username) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { authenticators: true },
    });

    if (user && user.authenticators.length > 0) {
      allowCredentials = user.authenticators.map((auth) => ({
        id: auth.credentialId,
        transports: auth.transports ? JSON.parse(auth.transports) : undefined,
      }));
    }
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: "preferred",
  });

  // Сохраняем challenge в cookie
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
