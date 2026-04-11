// @ts-ignore
import mailjetApi from 'node-mailjet';
// @ts-ignore
const mailjet = mailjetApi.apiConnect(
  process.env.MAILJET_API as string,
  process.env.MAILJET_SECRET as string
);
import nodemailer from 'nodemailer';

export const sendOTPEmail = async (email: string, otp: string) => {
  try {
    // Attempt using Mailjet first
    const request = await mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: "noreply@trackittoo.com",
              Name: "ClimbIRL"
            },
            To: [
              {
                Email: email,
                Name: "Climber"
              }
            ],
            Subject: "Your ClimbIRL Verification Code",
            TextPart: `Your verification code is: ${otp}`,
            HTMLPart: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                <h2 style="color: #6200EE; text-align: center;">ClimbIRL</h2>
                <p>Welcome to ClimbIRL! Use the verification code below to complete your login:</p>
                <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 5px; margin: 20px 0;">
                  ${otp}
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p style="font-size: 12px; color: #777;">If you did not request this code, please ignore this email.</p>
              </div>
            `
          }
        ]
      });
    console.log('OTP sent via Mailjet:', request.body);
    return true;
  } catch (err: any) {
    console.error('Mailjet failed, trying Nodemailer (SMTP):', err.message);
    
    // Fallback to Nodemailer SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
      },
    } as any);

    try {
      await transporter.sendMail({
        from: '"ClimbIRL" <noreply@trackittoo.com>',
        to: email,
        subject: "Your ClimbIRL Verification Code",
        text: `Your verification code is: ${otp}`,
        html: `<p>Your verification code is: <b>${otp}</b></p>`,
      });
      console.log('OTP sent via SMTP');
      return true;
    } catch (smtpErr: any) {
      console.error('SMTP also failed:', smtpErr.message);
      return false;
    }
  }
};


