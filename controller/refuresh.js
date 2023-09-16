const { getDb } = require('../lib/mongo');
const { logger } = require('../lib/logger');

/**
 * ユーザーのrefresh_tokenを設定する関数
 *
 * @function setRefreshToken
 * @async
 * @param {string} email - ユーザーのメールアドレス
 * @param {string} refresh_token - 設定する新しいrefresh_token
 * @returns {Promise<Object>} - MongoDBからのレスポンスオブジェクト
 * @throws Will throw an error if unable to connect to the database or set the refresh token
 */
const setRefreshToken = async (email, refresh_token) => {
  const db = getDb();
  const user = await db
    .collection('users')
    .updateOne(
      { email: email },
      { $set: { refresh_token: refresh_token } },
      { upsert: true }
    );
    logger.info('Refresh token set');
  return user;
};
exports.setRefreshToken = setRefreshToken;

/**
 * ユーザーのrefresh_tokenをクリアする関数
 *
 * @function clearRefreshToken
 * @async
 * @param {string} email - ユーザーのメールアドレス
 * @returns {Promise<Object>} - MongoDBからのレスポンスオブジェクト
 * @throws Will throw an error if unable to connect to the database or clear the refresh token
 */
const clearRefreshToken = async (email) => {
  const db = getDb();
  const user = await db
    .collection('users')
    .updateOne(
      { email: email },
      { $set: { refresh_token: null } },
      { upsert: true }
    );
    logger.info('Refresh token cleared');
  return user;
};
exports.clearRefreshToken = clearRefreshToken;