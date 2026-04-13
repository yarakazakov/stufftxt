import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { email } = await req.json();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "valid email is required" }, { status: 400 });
  }

  // Генерация 6-значного кода
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 минут

  await prisma.verificationCode.create({
    data: {
      userId: Number(session.user.id),
      email,
      code,
      expiresAt,
    },
  });

  // DEV: логируем код в консоль
  console.log(`Verification code for ${email}: ${code}`);

  return NextResponse.json({ sent: true });
}
