import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  private async generateTokens(user: User): Promise<{ access_token: string; refresh_token: string }> {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      firstName: user.firstName, 
      lastName: user.lastName,
      role: user.role 
    };
    
    const access_token = this.jwtService.sign(payload, { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
    });
    const refresh_token = this.jwtService.sign(payload, { 
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' 
    });
    
    return { access_token, refresh_token };
  }

  async register(registerDto: RegisterDto): Promise<{ user: Partial<User>; tokens: { access_token: string; refresh_token: string }; message: string }> {
    const { email, password, firstName, lastName, role } = registerDto;

    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || 'user',
    });

    const savedUser = await this.usersRepository.save(user);

    const { password: _, ...userWithoutPassword } = savedUser;
    const tokens = await this.generateTokens(savedUser);
    
    return {
      user: userWithoutPassword,
      tokens,
      message: 'User registered successfully'
    };
  }

  async login(loginDto: LoginDto): Promise<{ user: Partial<User>; tokens: { access_token: string; refresh_token: string }; message: string }> {
    const { email, password } = loginDto;

    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...userWithoutPassword } = user;
    const tokens = await this.generateTokens(user);
    
    return {
      user: userWithoutPassword,
      tokens,
      message: 'Login successful'
    };
  }

  async validateUser(payload: any): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { id: payload.sub } });
    return user || null;
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersRepository.findOne({ where: { id: payload.sub } });
      
      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      const newPayload = { 
        sub: user.id, 
        email: user.email, 
        firstName: user.firstName, 
        lastName: user.lastName,
        role: user.role 
      };
      
      const access_token = this.jwtService.sign(newPayload, { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
      });
      
      return { access_token };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async syncKeycloakUser(keycloakData: any): Promise<{ user: Partial<User>; tokens: { access_token: string; refresh_token: string }; message: string }> {
    const { preferred_username, email, given_name, family_name, sub } = keycloakData;

    let user = await this.usersRepository.findOne({ where: { email } });
    
    if (!user) {
      // Create new user from Keycloak data
      user = this.usersRepository.create({
        email: email,
        firstName: given_name || preferred_username,
        lastName: family_name || '',
        role: 'user',
        password: '', // No password needed for Keycloak users
      });
      
      user = await this.usersRepository.save(user);
    }

    const { password: _, ...userWithoutPassword } = user;
    const tokens = await this.generateTokens(user);
    
    return {
      user: userWithoutPassword,
      tokens,
      message: 'Keycloak sync successful'
    };
  }
}