import type { Prisma, PrismaClient } from '@prisma/client';

type OrderItemSnapshot = {
  productId: string;
  quantity: number;
  sku: string;
  variantInfo?: Prisma.JsonValue | null;
};

export async function restoreOrderInventory(
  prisma: PrismaClient,
  items: OrderItemSnapshot[],
) {
  if (!items.length) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          soldCount: { decrement: item.quantity },
        },
      });

      if (item.variantInfo) {
        await tx.productVariant.updateMany({
          where: { sku: item.sku, productId: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
  });
}
