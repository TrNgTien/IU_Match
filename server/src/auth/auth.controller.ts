import { Get, Controller, Post, Req, Res, HttpStatus, HttpCode, Param, HttpException, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { UserDto } from '../auth/dto/user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('users')
  @HttpCode(200)
  async getAllUsers(
    @Res() res: Response
  ) {
    return res.json(await this.authService.getAllUsers());
  }

  @Get('user/:id')
  async getUserId(
    @Param('id') id: string,
    @Res() res: Response
  ) {
    const findUser = await this.authService.getUserById(id);
    if (findUser) {
      res.status(HttpStatus.OK).json(findUser);
    } else {
      throw new HttpException({
        status: HttpStatus.NOT_FOUND,
        message: 'User not found',
      }, HttpStatus.NOT_FOUND);
    }
  }

  @Post('register')
  @UsePipes(ValidationPipe)
  async createUser(
    // @Req() req: Request,
    @Body() userDto: UserDto,
    @Res() res: Response
  ) {
    return res
      .status(HttpStatus.CREATED)
      .json(await this.authService.userRegister(userDto));
  }

  @Post('login')
  async userLogin(
    @Req() req: Request,
    @Res() res: Response
  ){
    return res
      .status(HttpStatus.CREATED)
      .json(await this.authService.userLogin(req.body));
  }
}
