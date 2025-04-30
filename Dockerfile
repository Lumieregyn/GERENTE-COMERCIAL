FROM node:18

# Instala bibliotecas necessárias para o Chromium rodar com Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Cria diretório do app
WORKDIR /app

# Copia arquivos do projeto
COPY . .

# Instala dependências do Node
RUN npm install

# Expõe a porta usada pela aplicação
EXPOSE 10000

# Comando padrão
CMD ["node", "index.js"]
