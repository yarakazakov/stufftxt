import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "valid email is required" }, { status: 400 });
  }

  // Ищем пользователя по email
  const user = await prisma.user.findFirst({
    where: { email, emailVerified: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "no account found with this email" },
      { status: 404 }
    );
  }

  // Генерация 6-значного кода
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.verificationCode.create({
    data: {
      userId: user.id,
      email,
      code,
      expiresAt,
    },
  });

  // DEV: логируем код
  console.log(`Recovery code for ${email}: ${code}`);

  return NextResponse.json({ sent: true });
}
