import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from './auth.service';
import { User } from '../../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    console.log('JWT Strategy initialized with secret:', process.env.JWT_SECRET || 'superman');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'superman',
    });
  }

  async validate(payload: any): Promise<User> {
    console.log('JWT validate called with payload:', payload);
    const user = await this.authService.validateUser(payload);
    if (!user) {
      console.log('User not found for payload:', payload);
      throw new Error('Unauthorized');
    }
    console.log('JWT validation successful for user:', user.email);
    return user;
  }
}