import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// DELETE — удалить passkey (только свои)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const authenticator = await prisma.authenticator.findFirst({
    where: { id, userId: Number(session.user.id) },
  });

  if (!authenticator) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.authenticator.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
