const logger = require('./lib/logger.js').logger;

const mongo = require('./lib/mongo.js');

const express = require('express');

const app = express();
const authRoute = require('./auth_route.js');
const cors = require('cors');
const { customError } = require('./lib/customError.js');

const port = process.env.PORT || 3000;
const front_root_url = process.env.FRONT_ROOT_URL || 'http://localhost:8080';

app.use(express.json());
app.use(cors({ origin: front_root_url }));

app.use('/auth', authRoute.router);

app.use((req, res, next) => {
  next(new customError(404, 'Not found'));
});

/**
 * エラーハンドリングミドルウェア。
 * このミドルウェアは、発生したすべてのエラーをキャッチし、
 * カスタムエラーの場合は適切なステータスコードとメッセージを、
 * それ以外のエラーの場合は500内部サーバーエラーを返します。
 */
app.use((err, req, res, next) => {
  if (err instanceof customError) {
    logger.info('error' + err.status + ' ' + err.message);
    res.status(err.status).json({ message: err.message });
  } else {
    logger.error('error' + 500 + ' ' + err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * MongoDBへの接続とアプリケーションの起動を処理します。
 * まず、MongoDBに接続し、初期設定を行います。
 * 次に、アプリケーションを指定されたポートで起動します。
 */
mongo
  .connect()
  .then(async() => {
    // MongoDBの初期設定
    await mongo.init();
  })
  .then(() => {
    app.listen(port, () => {
      logger.info('Server started on port ' + port);
    });
  })
  .catch((err) => {
    logger.error(err);
  });
