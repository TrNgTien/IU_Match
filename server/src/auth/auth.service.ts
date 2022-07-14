import { Injectable, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { UserDocument } from '../model/user.models';
import { UserDto } from './dto/user.dto';
import * as admin from 'firebase-admin';

const saltOrRounds = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
    private jwtService: JwtService
  ) {}

  hashData(data: string) {
    return bcrypt.hash(data, saltOrRounds);
  }

  // async getToken(userId: string, userName: string): Promise<Tokens>{
  //   const [at, rt] = await Promise.all([
  //     this.jwtService.signAsync({
  //       sub: userId,
  //       userName,
  //     }, {
  //       secret: jwtConstants.atSecret,
  //       expiresIn: '1h',
  //     }),
  //     this.jwtService.signAsync({
  //       sub: userId,
  //       userName,
  //     }, {
  //       secret: jwtConstants.rtSecret,
  //       expiresIn: 60 * 60 * 24 * 7,
  //     }),
  //   ]);
  //   return {
  //     access_token: at,
  //     refresh_token: rt
  //   }
  // }

  async userRegister(userDto: UserDto) {
    try {
      const firestore = await admin.firestore();
      const checkUser = await firestore.collection('Users').where('userName', '==', userDto.userName).get();
      const user = checkUser.docs.map((user) => ({
        id: user.id,
        ...user.data()
      }));
      if (user.length > 0) {
        throw new HttpException({
          message: 'Account already exists',
          status: HttpStatus.CONFLICT,
        }, HttpStatus.CONFLICT);
      } else {
        const hash = await this.hashData(userDto.password);
        const userData = await firestore.collection('Users').add({
          userName: userDto.userName,
          password: hash,
          firstName: userDto.firstName,
          lastName: userDto.lastName,
          DOB: userDto.DOB,
          gender: userDto.gender,
        });
        return userData
      }
      // const token = await this.getToken(newUser._id, newUser.userName);
      // await this.updateRtHash(newUser._id, token.refresh_token);
      // const userData = ({
      //   newUser,
      //   // token,
      // });
    } catch (error) {
      return error.message;
    }
  }

  async userLogin(data) {
    try {
      let userData;
      const firestore = await admin.firestore();
      const checkUser = await firestore.collection('Users').where('userName', '==', data.userName).get();
      checkUser.forEach((user) => {
        userData = user.data();
      })

      if (userData == undefined) {
        throw new HttpException({
          status: HttpStatus.NOT_FOUND,
          message: 'User not found',
        }, HttpStatus.NOT_FOUND);
      }

      const checkPass = await bcrypt.compare(data.password, userData.password);
      if (!checkPass) {
        throw new HttpException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Wrong password',
        }, HttpStatus.BAD_REQUEST);
      }
      
      const payload = { userName: userData.userName, userId: userData.id };
      const token = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '1w',
      });
      const { password, ...rest } = userData;
      const userInfo = ({
        ...rest,
        token,
      });
      return userInfo;
    } catch (error) {
      return error.message;
    }
  }

  async getAllUsers() {
    try {
      const firestore = await admin.firestore();
      const users = await firestore.collection('Users').get();
      const listUsers = users.docs.map((user) => ({
        id: user.id,
        ...user.data()
      }));
      return listUsers;
      // const users = await this.userModel.find();
      // return users;
    } catch (error) {
      return error.message;
    }
  }

  async getUserById(id) {
    try {
      const firestore = await admin.firestore();
      const findUser = await firestore.collection('Users').doc(id).get();
      return findUser;
    } catch (error) {
      return error.message;
    }
  }
}
