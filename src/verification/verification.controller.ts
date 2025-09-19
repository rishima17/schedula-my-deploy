import { Controller, Post, Body } from '@nestjs/common';
import { VerificationService } from './verification.service';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  // Step 1: Request OTP
  @Post('request')
  async requestOtp(@Body('email') email: string) {
    return this.verificationService.sendOtp(email);
  }

  // Step 2: Verify OTP
  @Post('confirm')
  async confirmOtp(
    @Body('email') email: string,
    @Body('otp') otp: string,
  ) {
    return this.verificationService.verifyOtp(email, otp);
  }
}
