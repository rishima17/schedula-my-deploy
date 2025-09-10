import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/User';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      passReqToCallback: true,
      scope: ['email', 'profile'],
    });
  }

  async validate(req: any, accessToken: string, refreshToken: string, profile: any, done: Function) {
    try {
      // role passed via state from guard
      const state = req.query.state ? JSON.parse(req.query.state) : {};
      const role = state.role || 'patient';

      const { emails, displayName } = profile;
      const email = emails[0].value;

      // 🔍 Check if user exists
      let user = await this.userRepo.findOne({ where: { email } });

      if (!user) {
        // 🆕 Create new user
        user = this.userRepo.create({
          email,
          name: displayName,
          role,
          provider: 'google',
          password: null,
        });
        await this.userRepo.save(user);
      }

      done(null, user);
    } catch (err) {
      done(err, false);
    }
  }
}
