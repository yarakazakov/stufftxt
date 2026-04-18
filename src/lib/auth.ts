import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import { verifyTelegramAuth, TelegramAuthData } from "./telegram";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await compare(credentials.password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: String(user.id),
          name: user.username,
          email: user.email,
        };
      },
    }),
    CredentialsProvider({
      id: "telegram",
      name: "Telegram",
      credentials: {
        payload: { label: "payload", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.payload) return null;

        let data: TelegramAuthData;
        try {
          data = JSON.parse(credentials.payload);
        } catch {
          return null;
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) return null;

        if (!verifyTelegramAuth(data, botToken)) return null;

        const telegramId = BigInt(data.id);

        // Ищем пользователя по telegramId
        let user = await prisma.user.findUnique({
          where: { telegramId },
        });

        if (!user) {
          // Создаём нового пользователя. username на основе telegram username или tg_<id>
          const base = data.username
            ? data.username.toLowerCase().replace(/[^a-z0-9_]/g, "")
            : `tg_${data.id}`;
          let username = base;
          let n = 0;
          while (await prisma.user.findUnique({ where: { username } })) {
            n += 1;
            username = `${base}${n}`;
          }

          user = await prisma.user.create({
            data: {
              username,
              passwordHash: null,
              displayName: [data.first_name, data.last_name].filter(Boolean).join(" ") || null,
              avatarUrl: data.photo_url || null,
              telegramId,
              telegramUsername: data.username || null,
            },
          });
        }

        return {
          id: String(user.id),
          name: user.username,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.name ?? undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id;
        (session.user as Record<string, unknown>).username = token.username;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
