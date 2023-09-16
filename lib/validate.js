const { customError } = require('./customError');
const { logger } = require('./logger');

/**
 * 与えられた文字列が有効なメールアドレスであるかを確認します。
 *
 * @param {string} email - 検証するメールアドレス。
 * @returns {boolean} - メールアドレスが有効な場合はtrueを返します。
 * @throws {customError} - メールアドレスが無効な場合はエラーをスローします。
 */
const isEmail = (email) => {
  const regex = /\S+@\S+\.\S+/;
  if (!regex.test(email)) {
    logger.info('emailError: Invalid email address');
    throw new customError(400, 'Invalid email address');
  }
  logger.info('emailSuccess: Valid email address');
  return true;
};
exports.isEmail = isEmail;
/**
 * 指定されたルールに基づいてパスワードを検証します。
 *
 * @param {string} password - 検証するパスワード。
 * @returns {boolean} - パスワードが指定されたすべてのルールを満たしている場合はtrueを返します。
 * @throws {customError} - パスワードがルールを満たしていない場合はエラーをスローします。
 */
const isPassword = (password) => {
  if (password.length < 8) {
    logger.info('passwordError: Password must be at least 8 characters');
    throw new customError(400, 'Password must be at least 8 characters');
  }
  // passwordは半角英数字，ASCII記号のみ許可
  const regex = /^[!-~]+$/;
  if (!regex.test(password)) {
    logger.info('passwordError: Password must be alphanumeric');
    throw new customError(400, 'Password must be alphanumeric');
  }
  // 必ず，大文字，小文字，数字，記号を含む
  const regex2 = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!-/:-@[-`{-~])/;
  if (!regex2.test(password)) {
    logger.info('passwordError: Password must contain at least one uppercase letter, one lowercase letter, one number and one symbol')
    throw new customError(
      400,
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one symbol'
    );
  }
  logger.info('passwordSuccess: Valid password');
  return true;
};
exports.isPassword = isPassword;

/**
 * 値が提供されているかどうかを確認します（未定義またはnullでない）。
 *
 * @param {*} value - チェックする値。
 * @returns {boolean} - 値が提供されている場合はtrueを返します。
 * @throws {customError} - 値が提供されていない場合はエラーをスローします。
 */
const isRequired = (value) => {
  if (!value) {
    logger.info('isRequiredError: Required');
    throw new customError(400, 'Required');
  }
  logger.info('isRequiredSuccess: Valid');
  return true;
};
exports.isRequired = isRequired;

/**
 * bodyオブジェクトにすべての必要なパラメーターが存在するかどうかを確認し、
 * 余計なパラメータがないかもチェックします。
 *
 * @param {Object} body - 必要なパラメーターをチェックするオブジェクト。
 * @param {Array<string>} array - 必要なパラメーターを表す文字列の配列。
 * @returns {boolean} - bodyオブジェクトにすべての必要なパラメーターが存在し、余計なパラメータがない場合はtrueを返します。
 * @throws {customError} - 必要なパラメーターが欠落している場合や余計なパラメーターが存在する場合はエラーをスローします。
 */
const requiredParameters = (body, array) => {
  // arrayの要素がbodyに含まれているか確認
  array.forEach((element) => {
    if (!body[element]) {
      logger.info('requiredParametersError: ' + element + ' is required');
      throw new customError(400, `${element} is required`);
    }
  });

  // 余計なパラメータがないか確認
  Object.keys(body).forEach((key) => {
    if (!array.includes(key)) {
      logger.info('requiredParametersError: ' + key + ' is not a valid parameter');
      throw new customError(400, `${key} is not a valid parameter`);
    }
  });

  return true;
};
exports.requiredParameters = requiredParameters;
