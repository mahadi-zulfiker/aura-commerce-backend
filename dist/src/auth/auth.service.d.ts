import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../database/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            firstName: string | null;
            lastName: string | null;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            role: import("@prisma/client").$Enums.UserRole;
        };
    }>;
    private generateTokens;
}
