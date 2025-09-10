import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './google-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';


@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // 1) Initiates flow: GET /api/v1/auth/google?role=doctor
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard redirects to Google.
  }

  // 2) Callback: Google redirects here
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request & { user?: any }, @Res() res: Response) {
    // req.user is returned from GoogleStrategy.validate()
    const user = req.user;
    const tokenObj = await this.authService.login(user);

    // Option A: Redirect to frontend with token
    const redirectUrl = process.env.FRONTEND_URL;
    if (redirectUrl) {
      return res.redirect(`${redirectUrl}?token=${tokenObj.access_token}`);
    }

    // Option B: If no frontend, send JSON
    return res.json(tokenObj);
  }
}
