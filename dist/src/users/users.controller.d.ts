import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: {
        user: {
            id: string;
        };
    }): Promise<{
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.UserStatus;
        isEmailVerified: boolean;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        avatar: string | null;
        createdAt: Date;
        lastLogin: Date | null;
    }>;
    updateProfile(req: {
        user: {
            id: string;
        };
    }, updateUserDto: UpdateUserDto): Promise<{
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        avatar: string | null;
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
    findOne(id: string): Promise<{
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.UserStatus;
        isEmailVerified: boolean;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        avatar: string | null;
        createdAt: Date;
        lastLogin: Date | null;
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        avatar: string | null;
    }>;
    updateStatus(id: string, dto: UpdateUserStatusDto): Promise<{
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
