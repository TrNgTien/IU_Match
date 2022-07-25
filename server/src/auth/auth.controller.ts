import { Get, Controller, Post, Req, Res, HttpStatus, HttpCode, Param, Body, UsePipes, ValidationPipe } from '@nestjs/common';
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

  @Post('register')
  @UsePipes(ValidationPipe)
  async createUser(
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

  @Post('google')
  async google(
    @Res() res: Response
  ){
    return res
      .status(HttpStatus.CREATED)
      .json(await this.authService.google());
  }

  @Get('google')
  async googleLogin(
    @Req() req: Request,
    @Res() res: Response
  ){
    return res
      .status(HttpStatus.CREATED)
      .json(await this.authService.googleLogin(req));
  }

  @Post('forgotPass')
  async forgotPass(
    @Req() req: Request,
    @Res() res: Response
  ) {
    return res
      .status(HttpStatus.CREATED)
      .json(await this.authService.forgotPass(req.body));
  }

  @Post('resetPass/:userId/:accessToken')
  async resetPass(
    @Param('userId') userId: string,
    @Param('accessToken') accessToken: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    return res
      .status(HttpStatus.CREATED)
      .json(await this.authService.resetPass(req.body, String(userId), String(accessToken)));
  }

}
