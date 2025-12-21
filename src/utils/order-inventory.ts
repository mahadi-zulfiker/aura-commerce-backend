import { Prisma, PrismaClient } from '@prisma/client';

type OrderItemSnapshot = {
  productId: string;
  quantity: number;
  sku: string;
  variantInfo?:
    | Prisma.InputJsonValue
    | Prisma.NullableJsonNullValueInput
    | null;
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

      const hasVariant =
        item.variantInfo !== null &&
        item.variantInfo !== undefined &&
        item.variantInfo !== Prisma.DbNull &&
        item.variantInfo !== Prisma.JsonNull;

      if (hasVariant) {
        await tx.productVariant.updateMany({
          where: { sku: item.sku, productId: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
  });
}
