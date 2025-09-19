import { Injectable, BadRequestException } from '@nestjs/common';

// For demo, we’ll store OTPs in-memory.
// In real app, use database + expiry time.
const otpStore = new Map<string, string>();

@Injectable()
export class VerificationService {
  async sendOtp(email: string) {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP in memory (replace with DB in production)
    otpStore.set(email, otp);

    // TODO: Send OTP via email or SMS
    console.log(`OTP for ${email}: ${otp}`);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(email: string, otp: string) {
    const savedOtp = otpStore.get(email);

    if (!savedOtp) {
      throw new BadRequestException('No OTP found for this email');
    }

    if (savedOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Mark as verified (here just returning success)
    otpStore.delete(email); // clear OTP after use

    return { status: 'verified', email };
  }
}
