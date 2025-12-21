import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    async getDashboardSummary() {
        const now = new Date();
        const startOfToday = startOfDay(now);

        const [
            totalOrders,
            todayOrders,
            totalRevenue,
            todayRevenue,
            totalUsers,
            newUsersToday,
            lowStockProducts,
        ] = await Promise.all([
            this.prisma.order.count(),
            this.prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
            this.prisma.order.aggregate({
                _sum: { total: true },
                where: { paymentStatus: PaymentStatus.PAID },
            }),
            this.prisma.order.aggregate({
                _sum: { total: true },
                where: {
                    paymentStatus: PaymentStatus.PAID,
                    createdAt: { gte: startOfToday },
                },
            }),
            this.prisma.user.count(),
            this.prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
            this.prisma.product.count({ where: { stock: { lte: 5 } } }),
        ]);

        return {
            orders: {
                total: totalOrders,
                today: todayOrders,
            },
            revenue: {
                total: totalRevenue._sum.total || 0,
                today: todayRevenue._sum.total || 0,
            },
            users: {
                total: totalUsers,
                today: newUsersToday,
            },
            inventory: {
                lowStock: lowStockProducts,
            },
        };
    }

    async getSalesChart(days = 7) {
        const startDate = startOfDay(subDays(new Date(), days - 1));

        // Group by Date using Prisma raw query or fetching and map
        // Since we use SQLite/Postgres transparency, we'll fetch orders and aggregate in memory for simplicity/speed
        // Alternatively for large datasets, use Raw SQL.

        const orders = await this.prisma.order.findMany({
            where: {
                createdAt: { gte: startDate },
                paymentStatus: PaymentStatus.PAID,
            },
            select: {
                createdAt: true,
                total: true,
            },
        });

        const chartData: Record<string, number> = {};

        // Initialize all days
        for (let i = 0; i < days; i++) {
            const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
            chartData[date] = 0;
        }

        orders.forEach(order => {
            const date = format(order.createdAt, 'yyyy-MM-dd');
            if (chartData[date] !== undefined) {
                chartData[date] += order.total;
            }
        });

        return Object.entries(chartData)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, total]) => ({ date, total }));
    }

    async getTopProducts(limit = 5) {
        return this.prisma.product.findMany({
            take: limit,
            orderBy: { soldCount: 'desc' },
            select: {
                id: true,
                name: true,
                soldCount: true,
                basePrice: true,
                images: { take: 1, select: { url: true } }
            }
        });
    }
}
