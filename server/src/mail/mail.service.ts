import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
  ) {}

  async sendMail(data) {
    try {
      const output = `
              <!DOCTYPE html>
              <html>
              <head>
                  <style>
                      .btn:hover {
                          background-color: #737373 
                      }
                  </style>
              </head>
              <body style="background-color: #fff;">
                      <!-- start preheader -->
                      <div class="preheader"
                          style="display: none; max-width: 0; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #40de65; opacity: 0;">
                          The request for reseting password from SharingWeb Service
                      </div>
                      <!-- end preheader -->
                      <!-- start body -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                          <!-- start logo -->
                          <tr>
                              <td align="center" bgcolor="#fff">
                                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                                      <tr>
                                          <td align="center" valign="top" style="padding: 20px 24px;">
                                              <h3 style="color: #348D1C;
                                              font-weight: 700;
                                              font-size: 50px;
                                              line-height: 0.65;
                                              font-family: 'Roboto', cursive; margin-bottom: -10px">
                                                  SharingWeb
                                              </h3>
                                              <p style="font-size: 14px;
                                              text-algin: center;
                                              color: #545454;
                                              font-weight: 400;
                                              text-transform: capitalize;
                                              font-style: italic;
                                              font-family: 'Mansalva', cursive;"></p>
                                          </td>
                                      </tr>
                                  </table>
                              </td>
                          </tr>
                          <!-- end logo -->
  
                          <!-- start hero -->
                          <tr>
                              <td align="center" bgcolor="#fff">
                                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                                      <tr>
                                          <td align="left" bgcolor="#fff"
                                              style="padding: 36px 24px 0; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; border-top: 3px solid #666;">
                                              <h1
                                                  style="color: #348D1C; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -1px; line-height: 48px;">
                                                  Verify Your Account</h1>
                                          </td>
                                      </tr>
                                  </table>
                              </td>
                          </tr>
                          <!-- end hero -->
                          <!-- start copy block -->
                          <tr>
                              <td align="center" bgcolor="#fff">
                                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                                      <!-- start copy -->
                                      <tr>
                                          <td align="left" bgcolor="#fff"
                                              style="color: #fff; padding: 24px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px;">
                                              <p style="margin: 0; color: #000">Tap the button below to confirm your email address. If you didn't
                                                  register your account, you can safely delete this email.</p>
                                          </td>
                                      </tr>
                                      <!-- end copy -->
                                      <!-- start button -->
                                      <tr>
                                          <td align="left" bgcolor="#fff">
                                              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                  <tr>
                                                      <td align="center" bgcolor="#fff" style="padding: 12px;">
                                                          <table border="0" cellpadding="0" cellspacing="0">
                                                              <tr>
                                                                  <td align="center" bgcolor="#348D1C" style="border-radius: 6px;">
                                                                      <a class="btn" href="#" target="_blank"
                                                                          style="display: inline-block; padding: 16px 36px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; color: #fff; text-decoration: none; border-radius: 6px;">Account Verification</a>
                                                                  </td>
                                                              </tr>
                                                          </table>
                                                      </td>
                                                  </tr>
                                              </table>
                                          </td>
                                      </tr>
                                      <!-- end button -->
                                      <!-- start copy -->
                                      <tr>
  
                                      </tr>
                                      <!-- end copy -->
                                      <!-- start copy -->
                                      <tr>
                                          <td align="left" bgcolor="#fff"
                                              style="padding: 20px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; border-bottom: 3px solid #333">
                                              <p style="margin: 0; color: #000">Sincerely,<br></p>
                                              <p style="margin: 0; color: #348D1C">SharingWeb Service</p>
                                          </td>
                                      </tr>
                                      <!-- end copy -->
                                  </table>
                              </td>
                          </tr>
                          <!-- end copy block -->
                          <!-- start footer -->
                          <tr>
                              <td align="center" bgcolor="#fff" style="padding: 20px;">
                                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                                      <!-- start permission -->
                                      <tr>
                                          <td align="center" bgcolor="#fff"
                                              style="padding: 12px 24px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px; color: #ccc;">
                                              <p style="margin: 0; color: #000">You received this email because we received a request for reseting for
                                                  your account. If you didn't request it you can safely delete this email.</p>
                                              <p style="margin: 0; color: #000">Quarter 6, Linh Trung Ward, Thu Duc City, Ho Chi Minh City</p>
                                          </td>
                                      </tr>
                                      <!-- end permission -->
                                  </table>
                              </td>
                          </tr>
                          <!-- end footer -->
  
                      </table>
                      <!-- end body -->
                  </body>
              </html>            
          `;
      let mailOptions = {
        from: '"SharingWeb Customer Service" <glamorous.cs01@gmail.com>',
        to: data,
        subject: 'Verify Your Account',
        text: 'Verify Your Account',
        html: output,
      };
      return this.mailerService
        .sendMail(mailOptions)
        .then(() => {
          console.log('Email sent!');
          // return sendObject;
        })
        .catch((error) => {
          console.log(error);
          return error.message;
        });
    } catch (error) {
      return error.message;
    }
  }
}
