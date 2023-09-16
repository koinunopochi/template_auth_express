const express = require('express');
const { logger } = require('./lib/logger.js');
const router = express.Router();
const isEmail = require('./lib/validate.js').isEmail;
const isPassword = require('./lib/validate.js').isPassword;
const requiredParameters = require('./lib/validate.js').requiredParameters;
const insertUser = require('./controller/user.js').insertUser;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { SendMail } = require('./lib/mail.js');
const { verifyUser, isUserExist, deleteUser } = require('./controller/user.js');
const { setRefreshToken, clearRefreshToken } = require('./controller/refuresh.js');

const customError = require('./lib/customError').customError;
require('dotenv').config();

const front_root_url = process.env.FRONT_ROOT_URL || 'http://localhost:8080';

/**
 * ユーザー登録のエンドポイント
 * 
 * @route POST /signup
 * @param {express.Request} req - Expressのリクエストオブジェクト
 * @param {express.Response} res - Expressのレスポンスオブジェクト
 * @param {express.NextFunction} next - Expressのネクストファンクション
 */
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // バリデーション
    requiredParameters(req.body, ['email', 'password']);
    isEmail(email);
    isPassword(password);

    // passwordのハッシュ化 bcryptで行う
    const hashedPassword = await bcrypt.hash(password, 10);

    // tokenの生成
    const token = jwt.sign({ email: email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    logger.info('Signup success');
    // ユーザー登録処理
    await insertUser(email, hashedPassword, token);

    // emailの送信
    await SendMail(email, `${front_root_url}/auth/verify?token=${token}`);

    logger.info('Signup success');
    res.status(200).json({ message: 'Signup success' });
  } catch (error) {
    next(error);
  }
});

/**
 * ユーザー認証のエンドポイント
 * 
 * @route POST /verify
 * @param {express.Request} req - Expressのリクエストオブジェクト
 * @param {express.Response} res - Expressのレスポンスオブジェクト
 * @param {express.NextFunction} next - Expressのネクストファンクション
 */
router.post('/verify', async (req, res, next) => {
  const { email, token } = req.body;
  try {
    isEmail(email);
    requiredParameters(req.body, ['email', 'token']);

    // tokenの検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.email !== email) {
      logger.error('Token is invalid');
      throw new customError(400, 'Token is invalid');
    }
    // ユーザーの認証
    await verifyUser(email);

    logger.info('User verified');

    res.status(200).json({ message: 'success !!! User verified' });
  } catch (error) {
    next(new Error(error));
  }
});

/**
 * ユーザーログインのエンドポイント
 * 
 * @route POST /login
 * @param {express.Request} req - Expressのリクエストオブジェクト
 * @param {express.Response} res - Expressのレスポンスオブジェクト
 * @param {express.NextFunction} next - Expressのネクストファンクション
 */
router.post('/login', async (req, res, next) => {
  try {
    // バリデーション
    const { email, password } = req.body;
    requiredParameters(req.body, ['email', 'password']);
    isEmail(email);
    isPassword(password);

    // ログイン処理
    const user = await isUserExist(email);
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      logger.info('Password is invalid');
      throw new customError(400, 'Password is invalid');
    }
    // auth_tokenの生成
    const auth_token = jwt.sign({ email: email }, process.env.JWT_SECRET, {
      expiresIn: '15h',
    });
    // refresh_tokenの生成
    const refresh_token = jwt.sign({ email: email }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    // refresh_tokenの設定
    await setRefreshToken(email, refresh_token);

    logger.info('Login success');
    // cookieにトークンを保存
    res.cookie('auth_token', auth_token, {
      maxAge: 1000 * 60 * 60 * 15,
      httpOnly: true,
    });
    res.cookie('refresh_token', refresh_token, {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
    });
    res.status(200).json({ message: 'You are logged in' });
  } catch (error) {
    next(error);
  }
});

/**
 * ユーザーログアウトのエンドポイント
 * 
 * @route POST /logout
 * @param {express.Request} req - Expressのリクエストオブジェクト
 * @param {express.Response} res - Expressのレスポンスオブジェクト
 * @param {express.NextFunction} next - Expressのネクストファンクション
 */
router.post('/logout', async (req, res, next) => {
  try {
    // バリデーション
    const { refresh_token } = req.cookies;
    requiredParameters(req.cookies, ['refresh_token']);
    // tokenの削除
    res.clearCookie('auth_token');
    res.clearCookie('refresh_token');
    // DBからrefresh_tokenの削除
    await clearRefreshToken(refresh_token);

    logger.info('Logout success');
    res.status(200).json({ message: 'Logout success' });
  } catch (error) {
    next(error);
  }
});

/**
 * アカウント削除のエンドポイント
 * 
 * @route POST /delete-account
 * @param {express.Request} req - Expressのリクエストオブジェクト
 * @param {express.Response} res - Expressのレスポンスオブジェクト
 * @param {express.NextFunction} next - Expressのネクストファンクション
 */
router.post('/delete-account', async (req, res, next) => {
  try {
    const { refresh_token,auth_token } = req.cookies;
    requiredParameters(req.cookies, ['refresh_token','auth_token']);

    // refresh_tokenの検証
    const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET);
    const email = decoded.email;
    // auth_tokenの検証
    const decoded_auth = jwt.verify(auth_token, process.env.JWT_SECRET);
    if (decoded_auth.email !== email) {
      logger.error('Token is invalid');
      throw new customError(400, 'Token is invalid');
    }
    // ユーザーの存在確認
    const user = await isUserExist(email);
    // refresh_tokenの一致確認
    if (user.refresh_token !== refresh_token) {
      logger.error('Refresh token is invalid');
      throw new customError(400, 'Refresh token is invalid');
    }
    // ユーザーの削除
    await deleteUser(email);
    res.clearCookie('auth_token');
    res.clearCookie('refresh_token');
    res.json({ message: 'Delete success' });
  } catch (error) {
    next(error);
  }
});


/**
 * トークン更新のエンドポイント
 * 
 * @route POST /refresh
 * @param {express.Request} req - Expressのリクエストオブジェクト
 * @param {express.Response} res - Expressのレスポンスオブジェクト
 * @param {express.NextFunction} next - Expressのネクストファンクション
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.cookies;
    requiredParameters(req.cookies, ['refresh_token']);

    // refresh_tokenの検証
    const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET);
    const email = decoded.email;
    // ユーザーの存在確認
    const user = await isUserExist(email);
    // refresh_tokenの一致確認
    if (user.refresh_token !== refresh_token) {
      logger.error('Refresh token is invalid');
      throw new customError(400, 'Refresh token is invalid');
    }
    // auth_tokenの生成
    const auth_token = jwt.sign({ email: email }, process.env.JWT_SECRET, {
      expiresIn: '15h',
    });

    res.cookie('auth_token', auth_token, {
      maxAge: 1000 * 60 * 60 * 15,
      httpOnly: true,
    });
    res.status(200).json({ message: 'Refresh success' });

  } catch (error) {
    next(error);
  }
});

exports.router = router;
