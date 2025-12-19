import { PrismaService } from '../database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findOne(id: string): Promise<{
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.UserStatus;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        avatar: string | null;
        createdAt: Date;
    }>;
    findAll(page?: number, limit?: number, role?: string, status?: string): Promise<{
        data: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            status: import(".prisma/client").$Enums.UserStatus;
            firstName: string | null;
            lastName: string | null;
            createdAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    update(id: string, dto: UpdateUserDto): Promise<{
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        avatar: string | null;
    }>;
    updateStatus(id: string, status: string): Promise<{
        id: string;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.UserStatus;
        isEmailVerified: boolean;
        emailVerifyToken: string | null;
        resetPasswordToken: string | null;
        resetPasswordExpires: Date | null;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        avatar: string | null;
        dateOfBirth: Date | null;
        emailNotifications: boolean;
        smsNotifications: boolean;
        createdAt: Date;
        updatedAt: Date;
        lastLogin: Date | null;
    }>;
}
