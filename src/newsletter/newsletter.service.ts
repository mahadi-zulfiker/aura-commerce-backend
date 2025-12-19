import { Injectable } from '@nestjs/common';
import { SubscriberStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class NewsletterService {
  constructor(private prisma: PrismaService) {}

  async subscribe(email: string) {
    return this.prisma.newsletter.upsert({
      where: { email },
      update: {
        status: SubscriberStatus.SUBSCRIBED,
        unsubscribedAt: null,
      },
      create: {
        email,
        status: SubscriberStatus.SUBSCRIBED,
      },
    });
  }

  async unsubscribe(email: string) {
    return this.prisma.newsletter.update({
      where: { email },
      data: {
        status: SubscriberStatus.UNSUBSCRIBED,
        unsubscribedAt: new Date(),
      },
    });
  }

  async list(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [subscribers, total] = await Promise.all([
      this.prisma.newsletter.findMany({
        skip,
        take: limit,
        orderBy: { subscribedAt: 'desc' },
      }),
      this.prisma.newsletter.count(),
    ]);

    return {
      data: subscribers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
