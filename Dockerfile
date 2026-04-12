# ============================================================
# Stage 1: Builder
# ============================================================
FROM node:22-alpine AS builder

# Нативные аддоны (argon2 требует python3/make/g++)
RUN apk add --no-cache python3 make g++ openssl

WORKDIR /app

# Копируем только то, что нужно для установки зависимостей
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Устанавливаем ВСЕ зависимости (включая dev — нужны для сборки)
RUN npm ci

# Prisma 7: генерируем TypeScript-клиент в src/generated/prisma
# ВАЖНО: делаем это ДО копирования src/ чтобы не потерять при COPY
RUN npx prisma generate --config prisma.config.ts

# Копируем исходники и собираем
COPY src ./src

RUN npm run build

# ============================================================
# Stage 2: Production
# ============================================================
FROM node:22-alpine AS production

# argon2 требует нативной компиляции и в production-образе
RUN apk add --no-cache python3 make g++ openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Устанавливаем ВСЕ зависимости (prisma — devDep, нужен для migrate deploy)
RUN npm ci

# Копируем скомпилированное приложение из builder-стадии
COPY --from=builder /app/dist ./dist

# Создаём директорию для загрузок (ServeStaticModule)
RUN mkdir -p uploads

EXPOSE 3000

# Сначала применяем миграции, потом стартуем приложение
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]