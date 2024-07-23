# ベースイメージ
FROM node:18

# 作業ディレクトリの指定
WORKDIR /app

# パッケージファイルをコピー
COPY package.json package-lock.json ./

# 依存関係のインストール
RUN npm install

# ソースコードをコピー
COPY . .

# アプリケーションの起動
CMD ["node", "index.js"]

# ポートの公開
EXPOSE 5000
