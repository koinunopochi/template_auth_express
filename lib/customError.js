/**
 * カスタムエラークラスは標準のErrorクラスを拡張して、HTTPステータスコードも含めることができます。
 * このクラスは、アプリケーション全体で特定のタイプのエラーを表すために使用されます。
 *
 * @class customError
 * @extends {Error}
 */
class customError extends Error {
  /**
   * customErrorクラスの新しいインスタンスを作成します。
   *
   * @param {number} status - HTTPステータスコード
   * @param {string} message - エラーメッセージ
   */
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

exports.customError = customError;
