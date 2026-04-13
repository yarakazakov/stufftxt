import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  const { email, code, newPassword } = await req.json();

  if (!email || !code || !newPassword) {
    return NextResponse.json(
      { error: "email, code and newPassword are required" },
      { status: 400 }
    );
  }

  if (newPassword.length < 4) {
    return NextResponse.json(
      { error: "password must be at least 4 characters" },
      { status: 400 }
    );
  }

  // Проверяем код
  const verification = await prisma.verificationCode.findFirst({
    where: {
      email,
      code,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  if (!verification) {
    return NextResponse.json(
      { error: "invalid or expired code" },
      { status: 400 }
    );
  }

  // Обновляем пароль
  const passwordHash = await hash(newPassword, 10);
  await prisma.user.update({
    where: { id: verification.userId },
    data: { passwordHash },
  });

  // Удаляем коды
  await prisma.verificationCode.deleteMany({
    where: { userId: verification.userId },
  });

  return NextResponse.json({ reset: true });
}
