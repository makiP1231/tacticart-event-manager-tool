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

# アプリケーションのビルド
RUN npm run build

# アプリケーションの起動
CMD ["npm", "start"]

# ポートの公開
EXPOSE 3000
