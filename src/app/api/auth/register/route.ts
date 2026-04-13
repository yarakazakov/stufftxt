import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    // Валидация
    if (!username || !password) {
      return NextResponse.json(
        { error: "username and password are required" },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { error: "username must be 3-30 characters" },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: "username can only contain letters, numbers and underscores" },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: "password must be at least 4 characters" },
        { status: 400 }
      );
    }

    // Проверка что username не занят
    const existing = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "username is already taken" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        passwordHash,
      },
    });

    return NextResponse.json({ id: user.id, username: user.username });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "something went wrong" },
      { status: 500 }
    );
  }
}
