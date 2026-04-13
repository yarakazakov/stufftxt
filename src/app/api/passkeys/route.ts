import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET — список passkeys текущего пользователя
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const authenticators = await prisma.authenticator.findMany({
    where: { userId: Number(session.user.id) },
    select: {
      id: true,
      credentialDeviceType: true,
      credentialBackedUp: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(authenticators);
}
