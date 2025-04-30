# Use imagem oficial Node
FROM node:18

# Instala libs para o Chromium funcionar no Docker (incluindo libdrm2, libgbm1)
RUN apt-get update && apt-get install -y \
    wget ca-certificates fonts-liberation libappindicator3-1 libasound2 \
    libatk-bridge2.0-0 libatk1.0-0 libcups2 libdbus-1-3 libgdk-pixbuf2.0-0 \
    libnspr4 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 \
    libdrm2 libgbm1 xdg-utils --no-install-recommends \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Define diretório da sua aplicação
WORKDIR /app

# Copia só o package.json e package-lock.json primeiro
COPY package*.json ./

# Instala dependências
RUN npm install --production

# Copia todo o resto do projeto
COPY . .

# Expõe porta (a Railway vai mapear)
EXPOSE 8080

# Comando de start
CMD ["npm", "start"]
