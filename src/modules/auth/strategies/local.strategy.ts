import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({ usernameField: 'email' });
    }

    async validate(email: string, password: string): Promise<any> {
        console.log('LocalStrategy validate:', { email }); // Debug log

        const user = await this.authService.validateUser(email, password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        console.log('LocalStrategy user:', user); // Debug log

        const userData = {
            _id: user._id,
            email: user.email,
            name: user.name,
            role: user.role
        };

        console.log('LocalStrategy return:', userData); // Debug log
        return userData;
    }
} 