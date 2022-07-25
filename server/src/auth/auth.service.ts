import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { UserDocument } from '../model/user.models';
import { UserDto } from './dto/user.dto';
import axios from 'axios';
import { MailerService } from '@nestjs-modules/mailer';
import { MailService } from '../mail/mail.service';

const saltOrRounds = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    private readonly mailService: MailService,
  ) {}

  hashData(data: string) {
    return bcrypt.hash(data, saltOrRounds);
  }

  async userRegister(userDto: UserDto) {
    try {
      const checkEmail = await this.userModel.findOne({ email: userDto.email });
      if (checkEmail) {
        throw new HttpException(
          {
            message: 'Email already exists',
            status: HttpStatus.CONFLICT,
          },
          HttpStatus.CONFLICT,
        );
      }
      const hash = await this.hashData(userDto.password);
      const newUser = new this.userModel({
        email: userDto.email,
        password: hash,
        firstName: userDto.firstName,
        lastName: userDto.lastName,
        DOB: userDto.DOB,
        gender: userDto.gender,
      });
      const userData = await newUser.save();
      return userData;
    } catch (error) {
      return error.message;
    }
  }

  async userLogin(data) {
    try {
      const userData = await this.userModel.findOne({ email: data.email });
      if (!userData) {
        throw new HttpException(
          {
            message: 'User not found',
            status: HttpStatus.NOT_FOUND,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const checkPass = await bcrypt.compare(data.password, userData.password);
      if (!checkPass) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            message: 'Wrong password',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const payload = { email: userData.email, userId: userData._id };
      const token = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '1w',
      });
      const { password, ...rest } = userData.toObject();
      const userInfo = {
        ...rest,
        token,
      };
      return userInfo;
    } catch (error) {
      return error.message;
    }
  }

  async getAllUsers() {
    try {
      const users = await this.userModel.find();
      return users;
    } catch (error) {
      return error.message;
    }
  }

  async google() {
    function getGoogleAuthURL() {
      const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
      const options = {
        redirect_uri: 'http://localhost:5000/auth/google',
        client_id: process.env.CLIENT_ID,
        access_type: 'offline',
        response_type: 'code',
        prompt: 'consent',
        scope: [
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email',
        ].join(' '),
      };
      return `${rootUrl}?${new URLSearchParams(options)}`;
    }
    return getGoogleAuthURL();
  }

  async getTokens({ code, clientId, ClientSecret, redirectUri }) {
    const url = 'https://oauth2.googleapis.com/token';
    const values = {
      code,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SCERET,
      redirect_uri: 'http://localhost:5000/auth/google',
      grant_type: 'authorization_code',
    };
    return axios
      .post(url, new URLSearchParams(values), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .then((res) => {
        return res.data;
      })
      .catch((error) => {
        console.error(`Failed to fetch auth tokens`);
        throw new Error(error.message);
      });
  }

  async googleLogin(req) {
    try {
      const { code } = req.query;
      const CLIENTID = process.env.CLIENT_ID;
      const CLIENTSCERET = process.env.CLIENT_SECRET;
      const REDIRECTURL = process.env.REDIRECT_URI;
      const tokens = await this.getTokens({
        code,
        clientId: CLIENTID,
        ClientSecret: CLIENTSCERET,
        redirectUri: REDIRECTURL,
      });

      // Fetch the user's profile with the access token and bearer
      const googleUser = await axios
        .get(
          `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`,
          {
            headers: {
              Authorization: `Bearer ${tokens.id_token}`,
            },
          },
        )
        .then((res) => res.data)
        .catch((error) => {
          console.error(`Failed to fetch user`);
          throw new Error(error.message);
        });

      const emailCus = `${googleUser.email}`;
      const sendObject = {
        status: 'success',
        id: googleUser.id,
        email: googleUser.email,
        link: 'send',
      };
      if (googleUser.verified_email == true) {
        try {
          const newUserGoogle = new this.userModel({
            // userAvatar: googleUser.picture,
            firstName: googleUser.given_name,
            lastName: googleUser.family_name,
            email: googleUser.email,
            DOB: googleUser.birth,
          });
          await newUserGoogle.save();
          return this.mailService.sendMail(emailCus);
          // const output = `
          //     <!DOCTYPE html>
          //     <html>
          //     <head>
          //         <style>
          //             .btn:hover {
          //                 background-color: #737373 
          //             }
          //         </style>
          //     </head>
          //     <body style="background-color: #fff;">
          //             <!-- start preheader -->
          //             <div class="preheader"
          //                 style="display: none; max-width: 0; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #40de65; opacity: 0;">
          //                 The request for reseting password from SharingWeb Service
          //             </div>
          //             <!-- end preheader -->
          //             <!-- start body -->
          //             <table border="0" cellpadding="0" cellspacing="0" width="100%">
          //                 <!-- start logo -->
          //                 <tr>
          //                     <td align="center" bgcolor="#fff">
          //                         <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
          //                             <tr>
          //                                 <td align="center" valign="top" style="padding: 20px 24px;">
          //                                     <h3 style="color: #348D1C;
          //                                     font-weight: 700;
          //                                     font-size: 50px;
          //                                     line-height: 0.65;
          //                                     font-family: 'Roboto', cursive; margin-bottom: -10px">
          //                                         SharingWeb
          //                                     </h3>
          //                                     <p style="font-size: 14px;
          //                                     text-algin: center;
          //                                     color: #545454;
          //                                     font-weight: 400;
          //                                     text-transform: capitalize;
          //                                     font-style: italic;
          //                                     font-family: 'Mansalva', cursive;"></p>
          //                                 </td>
          //                             </tr>
          //                         </table>
          //                     </td>
          //                 </tr>
          //                 <!-- end logo -->
  
          //                 <!-- start hero -->
          //                 <tr>
          //                     <td align="center" bgcolor="#fff">
          //                         <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
          //                             <tr>
          //                                 <td align="left" bgcolor="#fff"
          //                                     style="padding: 36px 24px 0; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; border-top: 3px solid #666;">
          //                                     <h1
          //                                         style="color: #348D1C; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -1px; line-height: 48px;">
          //                                         Verify Your Account</h1>
          //                                 </td>
          //                             </tr>
          //                         </table>
          //                     </td>
          //                 </tr>
          //                 <!-- end hero -->
          //                 <!-- start copy block -->
          //                 <tr>
          //                     <td align="center" bgcolor="#fff">
          //                         <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
          //                             <!-- start copy -->
          //                             <tr>
          //                                 <td align="left" bgcolor="#fff"
          //                                     style="color: #fff; padding: 24px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px;">
          //                                     <p style="margin: 0; color: #000">Tap the button below to confirm your email address. If you didn't
          //                                         register your account, you can safely delete this email.</p>
          //                                 </td>
          //                             </tr>
          //                             <!-- end copy -->
          //                             <!-- start button -->
          //                             <tr>
          //                                 <td align="left" bgcolor="#fff">
          //                                     <table border="0" cellpadding="0" cellspacing="0" width="100%">
          //                                         <tr>
          //                                             <td align="center" bgcolor="#fff" style="padding: 12px;">
          //                                                 <table border="0" cellpadding="0" cellspacing="0">
          //                                                     <tr>
          //                                                         <td align="center" bgcolor="#348D1C" style="border-radius: 6px;">
          //                                                             <a class="btn" href="#" target="_blank"
          //                                                                 style="display: inline-block; padding: 16px 36px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; color: #fff; text-decoration: none; border-radius: 6px;">Account Verification</a>
          //                                                         </td>
          //                                                     </tr>
          //                                                 </table>
          //                                             </td>
          //                                         </tr>
          //                                     </table>
          //                                 </td>
          //                             </tr>
          //                             <!-- end button -->
          //                             <!-- start copy -->
          //                             <tr>
  
          //                             </tr>
          //                             <!-- end copy -->
          //                             <!-- start copy -->
          //                             <tr>
          //                                 <td align="left" bgcolor="#fff"
          //                                     style="padding: 20px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; border-bottom: 3px solid #333">
          //                                     <p style="margin: 0; color: #000">Sincerely,<br></p>
          //                                     <p style="margin: 0; color: #348D1C">SharingWeb Service</p>
          //                                 </td>
          //                             </tr>
          //                             <!-- end copy -->
          //                         </table>
          //                     </td>
          //                 </tr>
          //                 <!-- end copy block -->
          //                 <!-- start footer -->
          //                 <tr>
          //                     <td align="center" bgcolor="#fff" style="padding: 20px;">
          //                         <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
          //                             <!-- start permission -->
          //                             <tr>
          //                                 <td align="center" bgcolor="#fff"
          //                                     style="padding: 12px 24px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px; color: #ccc;">
          //                                     <p style="margin: 0; color: #000">You received this email because we received a request for reseting for
          //                                         your account. If you didn't request it you can safely delete this email.</p>
          //                                     <p style="margin: 0; color: #000">Quarter 6, Linh Trung Ward, Thu Duc City, Ho Chi Minh City</p>
          //                                 </td>
          //                             </tr>
          //                             <!-- end permission -->
          //                         </table>
          //                     </td>
          //                 </tr>
          //                 <!-- end footer -->
  
          //             </table>
          //             <!-- end body -->
          //         </body>
          //     </html>            
          // `;
          // return this.mailerService
          //   .sendMail({
          //     from: '"SharingWeb Customer Service" <glamorous.cs01@gmail.com>',
          //     to: emailCus,
          //     subject: 'Verify Your Account',
          //     text: 'Verify Your Account',
          //     html: output,
          //   })
          //   .then(() => {
          //     console.log('Email sent!');
          //     return sendObject;
          //   })
          //   .catch((error) => {
          //     console.log(error);
          //     return error.message;
          //   });
        } catch (error) {
          if (error.code === 11000) {
            return 'Email already exists';
          }
          return error.message;
        }
      } else {
        return 'Something went wrong';
      }
    } catch (error) {
      return error.message;
    }
  }

  async forgotPass(data) {
    try {
      const user = await this.userModel.findOne({ email: data.email });
      if (!user) {
        throw new HttpException(
          {
            message: 'No account exist',
            status: HttpStatus.NOT_FOUND,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const payload = { email: user.email, userId: user._id };
      const accessToken = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '15',
      });

      const linkReset = `http://localhost:5000/auth/resetPass/${user._id}/${accessToken}`;
      const emailCus = `${user.email}`;

      const sendObject = {
        status: 'success',
        id: user.id,
        email: user.email,
        token: accessToken,
        link: linkReset,
      };

      try {
        return this.mailService.sendMail(emailCus)
        // const output = `
        //       <!DOCTYPE html>
        //       <html>
        //       <head>
        //           <style>
        //               .btn:hover {
        //                   background-color: #737373 
        //               }
        //           </style>
        //       </head>
        //       <body style="background-color: #fff;">
        //               <!-- start preheader -->
        //               <div class="preheader"
        //                   style="display: none; max-width: 0; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #40de65; opacity: 0;">
        //                   The request for reseting password from SharingWeb Service
        //               </div>
        //               <!-- end preheader -->
        //               <!-- start body -->
        //               <table border="0" cellpadding="0" cellspacing="0" width="100%">
        //                   <!-- start logo -->
        //                   <tr>
        //                       <td align="center" bgcolor="#fff">
        //                           <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
        //                               <tr>
        //                                   <td align="center" valign="top" style="padding: 20px 24px;">
        //                                       <h3 style="color: #348D1C;
        //                                       font-weight: 700;
        //                                       font-size: 50px;
        //                                       line-height: 0.65;
        //                                       font-family: 'Roboto', cursive; margin-bottom: -10px">
        //                                           SharingWeb
        //                                       </h3>
        //                                       <p style="font-size: 14px;
        //                                       text-algin: center;
        //                                       color: #545454;
        //                                       font-weight: 400;
        //                                       text-transform: capitalize;
        //                                       font-style: italic;
        //                                       font-family: 'Mansalva', cursive;"></p>
        //                                   </td>
        //                               </tr>
        //                           </table>
        //                       </td>
        //                   </tr>
        //                   <!-- end logo -->
  
        //                   <!-- start hero -->
        //                   <tr>
        //                       <td align="center" bgcolor="#fff">
        //                           <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
        //                               <tr>
        //                                   <td align="left" bgcolor="#fff"
        //                                       style="padding: 36px 24px 0; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; border-top: 3px solid #666;">
        //                                       <h1
        //                                           style="color: #348D1C; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -1px; line-height: 48px;">
        //                                           Verify Your Account</h1>
        //                                   </td>
        //                               </tr>
        //                           </table>
        //                       </td>
        //                   </tr>
        //                   <!-- end hero -->
        //                   <!-- start copy block -->
        //                   <tr>
        //                       <td align="center" bgcolor="#fff">
        //                           <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
        //                               <!-- start copy -->
        //                               <tr>
        //                                   <td align="left" bgcolor="#fff"
        //                                       style="color: #fff; padding: 24px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px;">
        //                                       <p style="margin: 0; color: #000">Tap the button below to confirm your email address. If you didn't
        //                                           register your account, you can safely delete this email.</p>
        //                                   </td>
        //                               </tr>
        //                               <!-- end copy -->
        //                               <!-- start button -->
        //                               <tr>
        //                                   <td align="left" bgcolor="#fff">
        //                                       <table border="0" cellpadding="0" cellspacing="0" width="100%">
        //                                           <tr>
        //                                               <td align="center" bgcolor="#fff" style="padding: 12px;">
        //                                                   <table border="0" cellpadding="0" cellspacing="0">
        //                                                       <tr>
        //                                                           <td align="center" bgcolor="#348D1C" style="border-radius: 6px;">
        //                                                               <a class="btn" href="${linkReset}" target="_blank"
        //                                                                   style="display: inline-block; padding: 16px 36px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; color: #fff; text-decoration: none; border-radius: 6px;">Account Verification</a>
        //                                                           </td>
        //                                                       </tr>
        //                                                   </table>
        //                                               </td>
        //                                           </tr>
        //                                       </table>
        //                                   </td>
        //                               </tr>
        //                               <!-- end button -->
        //                               <!-- start copy -->
        //                               <tr>
  
        //                               </tr>
        //                               <!-- end copy -->
        //                               <!-- start copy -->
        //                               <tr>
        //                                   <td align="left" bgcolor="#fff"
        //                                       style="padding: 20px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; border-bottom: 3px solid #333">
        //                                       <p style="margin: 0; color: #000">Sincerely,<br></p>
        //                                       <p style="margin: 0; color: #348D1C">SharingWeb Service</p>
        //                                   </td>
        //                               </tr>
        //                               <!-- end copy -->
        //                           </table>
        //                       </td>
        //                   </tr>
        //                   <!-- end copy block -->
        //                   <!-- start footer -->
        //                   <tr>
        //                       <td align="center" bgcolor="#fff" style="padding: 20px;">
        //                           <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
        //                               <!-- start permission -->
        //                               <tr>
        //                                   <td align="center" bgcolor="#fff"
        //                                       style="padding: 12px 24px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px; color: #ccc;">
        //                                       <p style="margin: 0; color: #000">You received this email because we received a request for reseting for
        //                                           your account. If you didn't request it you can safely delete this email.</p>
        //                                       <p style="margin: 0; color: #000">Quarter 6, Linh Trung Ward, Thu Duc City, Ho Chi Minh City</p>
        //                                   </td>
        //                               </tr>
        //                               <!-- end permission -->
        //                           </table>
        //                       </td>
        //                   </tr>
        //                   <!-- end footer -->
  
        //               </table>
        //               <!-- end body -->
        //           </body>
        //       </html>            
        //   `;
        // return this.mailerService
        //   .sendMail({
        //     from: '"SharingWeb Customer Service" <glamorous.cs01@gmail.com>',
        //     to: emailCus,
        //     subject: 'Verify Your Account',
        //     text: 'Verify Your Account',
        //     html: output,
        //   })
        //   .then(() => {
        //     console.log('Email sent!');
        //     return sendObject;
        //   })
        //   .catch((error) => {
        //     console.log(error);
        //     return error.message;
        //   });
      } catch (error) {
        return error.message;
      }
    } catch (error) {
      return error.message;
    }
  }

  async resetPass(data, userId, accessToken) {
    try {
      const { password, confirmPass } = data;
      if (password.length < 6) {
        return 'Password must be at least 6 characters';
      }
      if (password !== confirmPass) {
        return 'Password and Confirm Password is not match';
      }
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);
      await this.userModel.findOneAndUpdate({ _id: userId }, { password: hashPassword });
      return {
          message: 'Reset password success',
          status: 'success'
      }
    } catch (error) {
      return error.message;
    }
  }
}
