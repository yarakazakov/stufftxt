import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

// Хелпер для получения текущей сессии в API routes
export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}
