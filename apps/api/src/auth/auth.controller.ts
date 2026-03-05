import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { AuthService } from './auth.service';
import {
  AuthMeDto,
  LoginDto,
  LogoutDto,
  PhoneSendCodeDto,
  RefreshDto,
  RegisterDto,
  RegisterVerifyEmailDto
} from './dto/auth.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiBody({ type: RegisterDto })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  register(@Body() body: RegisterDto) {
    return this.authService.register({
      email: body.email,
      password: body.password,
      roles: body.roles,
      country: body.country,
      locale: body.locale
    });
  }

  @Post('register/verify-email')
  @ApiBody({ type: RegisterVerifyEmailDto })
  @ApiOkResponse({ type: AuthResponseDto })
  verifyEmailRegister(@Body() body: RegisterVerifyEmailDto) {
    return this.authService.verifyEmailRegistration(body.email, body.code);
  }

  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Post('refresh')
  @ApiBody({ type: RefreshDto })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  refresh(@Body() body: RefreshDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiBody({ type: LogoutDto })
  @ApiOkResponse({
    schema: {
      example: {
        success: true
      }
    }
  })
  logout(@Req() req: { user: { sub: string } }, @Body() body: LogoutDto) {
    return this.authService.logout(req.user.sub, body.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: AuthMeDto })
  me(@Req() req: { user: { sub: string } }) {
    return this.authService.me(req.user.sub);
  }

  @Post('phone/send-code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiBody({ type: PhoneSendCodeDto })
  sendPhoneCode(@Req() req: { user: { sub: string } }, @Body() body: PhoneSendCodeDto) {
    return this.authService.requestManualPhoneVerification(req.user.sub, body.phone);
  }

  @Post('phone/request-manual')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiBody({ type: PhoneSendCodeDto })
  requestManualPhoneVerification(@Req() req: { user: { sub: string } }, @Body() body: PhoneSendCodeDto) {
    return this.authService.requestManualPhoneVerification(req.user.sub, body.phone);
  }
}
