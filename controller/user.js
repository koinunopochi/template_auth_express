const { getDb } = require('../lib/mongo');
const customError = require('../lib/customError').customError;
const { logger } = require('../lib/logger');

/**
 * メールアドレスによって認証されたユーザーがデータベースに存在するかを確認します。
 * @param {string} email - 確認するユーザーのメールアドレス
 * @returns {object} user - データベースから取得したユーザー情報
 * @throws {customError} - ユーザーが存在しないか認証されていない場合にエラーを投げます
 */
const isUserExist = async (email) => {
  const db = getDb();
  const user = await db.collection('users').findOne({ email: email });
  if (!user) {
    logger.error('User not found');
    throw new customError(404, 'User not found');
  }
  if (user.verify === false) {
    logger.error('User not verified');
    throw new customError(403, 'User not verified');
  }
  return user;
};
exports.isUserExist = isUserExist;

/**
 * 新しいユーザーをデータベースに登録します。
 * @param {string} email - 新しいユーザーのメールアドレス
 * @param {string} password - 新しいユーザーのパスワード
 * @param {string} token - 認証トークン
 * @returns {object} user - 登録されたユーザー情報
 * @throws {customError} - ユーザーが既に存在する場合にエラーを投げます
 */
const insertUser = async (email, password, token) => {
  try {
    const db = getDb();
    // 既に登録されているか確認
    const is_exist = await db.collection('users').findOne({ email: email });
    if (is_exist && is_exist.verify == true) {
      logger.info('User already exists');
      throw new customError(409, 'User already exists');
    }
    // 未認証のユーザーの場合一度削除する
    if (is_exist && is_exist.verify == false) {
      await deleteUser(email);
    }
    // その後ユーザーを登録する
    const user = await db.collection('users').insertOne({
      email: email,
      password: password,
      verify: false,
      verify_token: token,
    });
    return user;
  } catch (error) {
    throw error;
  }
};
exports.insertUser = insertUser;

/**
 * ユーザーの認証ステータスを更新します。
 * @param {string} email - 認証するユーザーのメールアドレス
 * @returns {object} user - 更新されたユーザー情報
 */
const verifyUser = async (email) => {
  const db = getDb();
  // verifyをtrueにする
  const user = await db.collection('users').updateOne(
    {
      email: email,
    },
    {
      $set: {
        verify: true,
        verify_token: null,
      },
    }
  );
  return user;
};
exports.verifyUser = verifyUser;

/**
 * データベースからユーザーを削除します。
 * @param {string} email - 削除するユーザーのメールアドレス
 * @returns {object} user - 削除されたユーザー情報
 */
const deleteUser = async (email) => {
  const db = getDb();
  const user = await db.collection('users').deleteOne({
    email: email,
  });
  logger.info('User deleted');
  return user;
};
exports.deleteUser = deleteUser;

/**
 * ユーザーのパスワードを変更します。
 * @param {string} email - パスワードを変更するユーザーのメールアドレス
 * @param {string} password - 新しいパスワード
 * @returns {object} user - 更新されたユーザー情報
 */
const changePassword = async (email, password) => {
  const db = getDb();
  const user = await db.collection('users').updateOne(
    {
      email: email,
    },
    {
      $set: {
        password: password,
      },
    }
  );
  return user;
};
exports.changePassword = changePassword;
