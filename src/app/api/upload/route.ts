import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "no file provided" }, { status: 400 });
    }

    // Проверка размера (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "file too large (max 5MB)" }, { status: 400 });
    }

    // Проверка формата
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "unsupported format (allowed: jpg, png, webp, gif)" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Обработка через sharp — resize и optimize
    const processed = await sharp(buffer)
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Сохранение
    const userId = session.user.id;
    const uploadDir = path.join(process.cwd(), "public", "uploads", String(userId));
    await mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, processed);

    const imageUrl = `/uploads/${userId}/${filename}`;
    return NextResponse.json({ imageUrl });
  } catch {
    return NextResponse.json({ error: "upload failed" }, { status: 500 });
  }
}
