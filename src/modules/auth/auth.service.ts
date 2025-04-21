import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, password: string): Promise<any> {
        if (!password) {
            throw new UnauthorizedException('Password is required');
        }

        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (!user.password) {
            throw new UnauthorizedException('User password is not set');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid password');
        }

        return {
            _id: user._id,
            email: user.email,
            name: user.name,
            role: user.role
        };
    }

    async login(user: any) {
        console.log('Login user:', user); // Debug log

        if (!user || !user._id || !user.email || !user.role) {
            console.error('Invalid user data:', user);
            throw new UnauthorizedException('Invalid user data');
        }

        const payload = {
            email: user.email,
            _id: user._id,
            role: user.role
        };

        const response = {
            access_token: this.jwtService.sign(payload),
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        };

        console.log('Login response:', response); // Debug log
        return response;
    }

    async register(userData: any) {
        try {
            // Check if user already exists
            const emailExists = await this.usersService.checkEmailExists(userData.email);
            if (emailExists) {
                throw new ConflictException('Email already exists');
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            // Create new user
            const user = await this.usersService.create({
                ...userData,
                password: hashedPassword,
                role: 'user'
            });

            // Return token and user information
            return this.login(user);
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            console.error('Register error:', error);
            throw new UnauthorizedException('Registration failed');
        }
    }
} 