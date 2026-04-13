import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { email, code } = await req.json();

  if (!email || !code) {
    return NextResponse.json({ error: "email and code are required" }, { status: 400 });
  }

  // Ищем последний валидный код
  const verification = await prisma.verificationCode.findFirst({
    where: {
      userId: Number(session.user.id),
      email,
      code,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!verification) {
    return NextResponse.json({ error: "invalid or expired code" }, { status: 400 });
  }

  // Обновляем пользователя
  await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: { email, emailVerified: true },
  });

  // Удаляем использованные коды
  await prisma.verificationCode.deleteMany({
    where: { userId: Number(session.user.id) },
  });

  return NextResponse.json({ verified: true });
}
