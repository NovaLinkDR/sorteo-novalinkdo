FROM node:22-slim
WORKDIR /app

# typescript, tailwindcss, postcss y autoprefixer viven en devDependencies,
# pero `next build` los necesita. Por eso se instalan devDependencies aunque
# llegue NODE_ENV=production (Coolify lo pasa como build arg).
COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build

# Ya solo hace falta para ejecutar `next start`.
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
