// https://news.mynavi.jp/techplus/article/zerojavascript-20/

const nodemailer = require('nodemailer');
require('dotenv').config();

const MAIL_SENDER_ADDRESS = process.env.MAIL_SENDER_ADDRESS;
const MAIL_SENDER_PASSWORD = process.env.MAIL_SENDER_PASSWORD;

if (!MAIL_SENDER_ADDRESS || !MAIL_SENDER_PASSWORD) {
  console.warn(
    'Mail sender credentials are not set properly in the environment variables.'
  );
}

// 認証情報などを設定してNodemailerオブジェクトを生成
const porter = nodemailer.createTransport({
  service: 'gmail',
  port: 465,
  secure: true,
  auth: {
    user: MAIL_SENDER_ADDRESS,
    pass: MAIL_SENDER_PASSWORD,
  },
});

/**
 * @function SendMail
 * @param {string} getter - 受信者のメールアドレス
 * @param {string} url - 認証用のURL
 * @param {string} [subject='【重要】URLから認証を完了してください．'] - メールの件名
 * @param {string} [text='下記のURLから認証を完了してください．\n\n'] - メールの本文
 * @throws エラーオブジェクト - メールの送信に失敗した場合
 * @description
 * この関数は認証用のURLを含むメールをユーザーに送信します。メールの送信に失敗した場合は、エラーオブジェクトをスローします。送信に成功した場合は、コンソールに成功メッセージが表示されます。
 *
 * @example
 * SendMail('example@example.com', 'http://example.com/auth');
 */
const SendMail = async (
  getter,
  url,
  subject = '【重要】URLから認証を完了してください．',
  text = '下記のURLから認証を完了してください．\n\n'
) => {
  try {
    const info = await porter.sendMail({
      from: MAIL_SENDER_ADDRESS,
      to: getter,
      subject: subject,
      text: `${text}${url}`,
    });

    console.log('ok', info);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

exports.SendMail = SendMail;
