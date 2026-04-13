# Wishlist — Project Conventions

## Stack
- Next.js 14, App Router, TypeScript
- Prisma + SQLite (dev), переход на PostgreSQL для prod
- NextAuth.js v4 (credentials provider)
- Plain CSS (no Tailwind, no frameworks)
- bcryptjs для хэширования паролей
- sharp для обработки изображений

## Design — "Reimagined Windows XP"
- НИКАКИХ: теней, градиентов, border-radius, анимаций, иконок
- Фон: #fff | Текст: #000 | Ссылки: #0000EE | Visited: #551A8B
- Второстепенный текст: #666 | Границы: 1px solid #ccc
- Шрифт: system-ui, sans-serif, 14-16px
- Кнопки: стандартные HTML, border: 1px solid #999, bg: #f0f0f0
- Всё текстом, никаких иконок. "← back" вместо стрелки, "search" вместо лупы

## Code Conventions
- Server Components по умолчанию, "use client" только когда нужен state/effects
- API routes: src/app/api/
- Компоненты: src/components/
- Утилиты: src/lib/
- Стили: src/styles/ + CSS Modules для компонентов
- Prisma client singleton: src/lib/prisma.ts
- Auth config: src/lib/auth.ts
- Всегда валидировать input на сервере
- Комментарии в коде можно на русском

## Database
- Dev: SQLite → prisma/dev.db
- После изменений схемы: npx prisma db push && npx prisma generate
- Prisma Studio: npx prisma studio

## File Upload
- Путь: public/uploads/[userId]/
- Макс размер: 5MB
- Форматы: jpg, png, webp, gif
- Обработка через sharp (resize, optimize)

## Progress
- [x] Окружение подготовлено
- [x] Схема базы данных
- [x] Авторизация (регистрация/логин)
- [x] Layout + Header + CSS
- [x] Dashboard + папки (аккордеон)
- [x] CRUD позиций
- [x] Загрузка фото
- [x] Публичные профили
- [x] Система подписок
- [x] Поиск
- [x] Привязка email + sticky banner
- [x] Навигация / breadcrumbs
