## APIのログイン機能等のテンプレート
### 機能
1. ログイン
2. ログアウト
3. サインアップ
4. アカウントの削除
5. サインアップ時にメールを送信する機能
6. トークンのリフレッシュ
7. データベース操作

### 使用法
プロジェクトのルートディレクトリに`.env`ファイルを作成する
中身は，
```
JWT_SECRET = "secret"
JWT_REFRESH_SECRET = "refresh_secret"
Mail_SENDER_ADDRESS = "your mail"
Mail_SENDER_PASSWORD = "your mail password"
```
あとは必要に応じて，portなどを設定して調整する

1. `node server`コマンドでAPIが起動する