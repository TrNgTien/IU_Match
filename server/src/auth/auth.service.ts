import { Injectable, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { UserDocument } from '../model/user.models';
import { UserDto } from './dto/user.dto';

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
      const user = await this.userModel.findOne({ userName: userDto.userName });
      if (user) {
        throw new HttpException({
          message: 'Account already exists',
          status: HttpStatus.CONFLICT,
        }, HttpStatus.CONFLICT);
      };
      const hash = await this.hashData(userDto.password);
      const newUser = new this.userModel({
        userName: userDto.userName,
        password: hash,
        firstName: userDto.firstName,
        lastName: userDto.lastName,
        DOB: userDto.DOB,
        gender: userDto.gender,
      });
      await newUser.save();
      return newUser;
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
      const user = await this.userModel.findOne({ userName: data.userName });
      if (!user) {
        throw new HttpException({
          status: HttpStatus.NOT_FOUND,
          message: 'User not found',
        }, HttpStatus.NOT_FOUND);
      }

      const checkPass = await bcrypt.compare(data.password, user.password);
      if (!checkPass) {
        throw new HttpException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Wrong password',
        }, HttpStatus.BAD_REQUEST);
      }
      
      const payload = { userName: user.userName, userId: user._id };
      const token = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '1w',
      });
      const { password, ...rest } = user.toObject();
      const userData = ({
        ...rest,
        token,
      });
      return userData;
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

  async getUserById(id) {
    try {
      const user = await this.userModel.findById(id);
      return user;
    } catch (error) {
      return error.message;
    }
  }
}
