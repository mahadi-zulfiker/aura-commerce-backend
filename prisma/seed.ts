import "dotenv/config";
import { PrismaClient, ProductStatus, ShopStatus, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const categories = [
  {
    name: "Smartphones",
    slug: "smartphones",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
  },
  {
    name: "Laptops",
    slug: "laptops",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80",
  },
  {
    name: "Audio",
    slug: "audio",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
  },
  {
    name: "Wearables",
    slug: "wearables",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
  },
  {
    name: "Gaming",
    slug: "gaming",
    image: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&q=80",
  },
  {
    name: "Accessories",
    slug: "accessories",
    image: "https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=800&q=80",
  },
];

const brands = [
  { name: "Aura Labs", slug: "aura-labs" },
  { name: "SoundWave", slug: "soundwave" },
  { name: "GamePro", slug: "gamepro" },
  { name: "ViewMax", slug: "viewmax" },
  { name: "DataVault", slug: "datavault" },
];

const products = [
  {
    name: "Pro Max Ultra Smartphone",
    slug: "pro-max-ultra-smartphone",
    description:
      "Experience the pinnacle of mobile technology with our flagship smartphone. Featuring a stunning 6.7-inch ProMotion display, A17 Pro chip, and revolutionary camera system that captures every moment in stunning detail.",
    shortDescription: "Flagship 6.7-inch ProMotion display with A17 Pro power.",
    price: 1199,
    originalPrice: 1399,
    categorySlug: "smartphones",
    brandSlug: "aura-labs",
    sku: "AURA-PHONE-001",
    stock: 50,
    rating: 4.9,
    reviewCount: 2847,
    tags: ["bestseller", "new"],
    isFeatured: true,
    images: [
      "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&q=80",
      "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800&q=80",
      "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=80",
    ],
  },
  {
    name: "Studio Pro Wireless Headphones",
    slug: "studio-pro-wireless-headphones",
    description:
      "Immerse yourself in pure audio bliss with our premium wireless headphones. Active noise cancellation, spatial audio, and up to 40 hours of battery life.",
    shortDescription: "Premium wireless headphones with active noise cancellation.",
    price: 349,
    originalPrice: 399,
    categorySlug: "audio",
    brandSlug: "soundwave",
    sku: "SOUND-HEAD-001",
    stock: 120,
    rating: 4.8,
    reviewCount: 1523,
    tags: ["bestseller"],
    isFeatured: true,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80",
      "https://images.unsplash.com/photo-1545127398-14699f92334b?w=800&q=80",
    ],
  },
  {
    name: "UltraBook Pro 16",
    slug: "ultrabook-pro-16",
    description:
      "The ultimate creative powerhouse. M3 Max chip, stunning Liquid Retina XDR display, and exceptional battery life for all-day productivity.",
    shortDescription: "16-inch creative laptop with an M3 Max-class chip.",
    price: 2499,
    originalPrice: 2799,
    categorySlug: "laptops",
    brandSlug: "aura-labs",
    sku: "AURA-LAPTOP-001",
    stock: 25,
    rating: 4.9,
    reviewCount: 892,
    tags: ["new", "pro"],
    isFeatured: true,
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80",
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80",
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=80",
    ],
  },
  {
    name: "Smart Watch Series X",
    slug: "smart-watch-series-x",
    description:
      "Your ultimate health and fitness companion. Advanced health sensors, always-on display, and seamless integration with your devices.",
    shortDescription: "Always-on display with advanced health sensors.",
    price: 449,
    originalPrice: null,
    categorySlug: "wearables",
    brandSlug: "aura-labs",
    sku: "AURA-WATCH-001",
    stock: 80,
    rating: 4.7,
    reviewCount: 2156,
    tags: ["bestseller"],
    isFeatured: true,
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80",
    ],
  },
  {
    name: "Pro Gaming Controller",
    slug: "pro-gaming-controller",
    description:
      "Dominate every game with precision controls, customizable buttons, and haptic feedback that puts you in the action.",
    shortDescription: "Precision controller with adaptive haptics.",
    price: 179,
    originalPrice: 199,
    categorySlug: "gaming",
    brandSlug: "gamepro",
    sku: "GAME-CONTROL-001",
    stock: 200,
    rating: 4.6,
    reviewCount: 1834,
    tags: ["sale"],
    isFeatured: true,
    images: [
      "https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&q=80",
      "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&q=80",
      "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80",
    ],
  },
  {
    name: "Wireless Earbuds Pro",
    slug: "wireless-earbuds-pro",
    description:
      "Crystal-clear audio in a compact package. Adaptive EQ, active noise cancellation, and seamless switching between devices.",
    shortDescription: "Compact earbuds with adaptive EQ and ANC.",
    price: 249,
    originalPrice: null,
    categorySlug: "audio",
    brandSlug: "soundwave",
    sku: "SOUND-EAR-001",
    stock: 150,
    rating: 4.8,
    reviewCount: 3421,
    tags: ["bestseller"],
    isFeatured: true,
    images: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
      "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&q=80",
      "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&q=80",
    ],
  },
  {
    name: "4K Gaming Monitor 27\"",
    slug: "4k-gaming-monitor-27",
    description:
      "Experience gaming at its finest with 4K resolution, 144Hz refresh rate, and 1ms response time.",
    shortDescription: "27-inch 4K display with 144Hz refresh rate.",
    price: 699,
    originalPrice: 849,
    categorySlug: "gaming",
    brandSlug: "viewmax",
    sku: "VIEW-MONITOR-001",
    stock: 35,
    rating: 4.7,
    reviewCount: 567,
    tags: ["sale"],
    isFeatured: false,
    images: [
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80",
      "https://images.unsplash.com/photo-1616763355603-9755a640a287?w=800&q=80",
    ],
  },
  {
    name: "Portable SSD 2TB",
    slug: "portable-ssd-2tb",
    description:
      "Blazing fast portable storage with military-grade durability. Transfer files at up to 2000MB/s.",
    shortDescription: "2TB portable SSD with rugged protection.",
    price: 179,
    originalPrice: null,
    categorySlug: "accessories",
    brandSlug: "datavault",
    sku: "DATA-SSD-001",
    stock: 300,
    rating: 4.9,
    reviewCount: 1243,
    tags: ["bestseller"],
    isFeatured: false,
    images: [
      "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=800&q=80",
      "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=800&q=80",
    ],
  },
];

async function main() {
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const vendorPassword = await bcrypt.hash("Vendor@123", 10);
  const userPassword = await bcrypt.hash("User@123", 10);

  const [admin, vendor, user] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
        email: "admin@example.com",
        password: adminPassword,
        firstName: "Admin",
        lastName: "User",
        role: UserRole.ADMIN,
        isEmailVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "vendor@example.com" },
      update: {},
      create: {
        email: "vendor@example.com",
        password: vendorPassword,
        firstName: "Vendor",
        lastName: "Shop",
        role: UserRole.VENDOR,
        isEmailVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "user@example.com" },
      update: {},
      create: {
        email: "user@example.com",
        password: userPassword,
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
        isEmailVerified: true,
      },
    }),
  ]);

  const shop = await prisma.shop.upsert({
    where: { vendorId: vendor.id },
    update: {},
    create: {
      vendorId: vendor.id,
      name: "Aura Labs Official",
      slug: "aura-labs-official",
      description: "Official Aura Labs flagship store.",
      email: "shop@auracommerce.com",
      phone: "+8801000000000",
      status: ShopStatus.APPROVED,
      isVerified: true,
    },
  });

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        image: category.image,
      },
      create: {
        name: category.name,
        slug: category.slug,
        image: category.image,
        isActive: true,
      },
    });
  }

  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {
        name: brand.name,
      },
      create: {
        name: brand.name,
        slug: brand.slug,
        isActive: true,
      },
    });
  }

  const categoryMap = new Map(
    (await prisma.category.findMany()).map((category) => [category.slug, category.id]),
  );
  const brandMap = new Map(
    (await prisma.brand.findMany()).map((brand) => [brand.slug, brand.id]),
  );

  for (const product of products) {
    const basePrice = product.originalPrice ?? product.price;
    const salePrice = product.originalPrice ? product.price : null;
    const categoryId = categoryMap.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(`Missing category: ${product.categorySlug}`);
    }
    const brandId = brandMap.get(product.brandSlug) ?? null;

    const createdProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription,
        basePrice,
        salePrice,
        sku: product.sku,
        stock: product.stock,
        rating: product.rating,
        reviewCount: product.reviewCount,
        isFeatured: product.isFeatured,
        metaKeywords: product.tags.join(", "),
        status: ProductStatus.PUBLISHED,
        shopId: shop.id,
        categoryId,
        brandId,
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription,
        basePrice,
        salePrice,
        sku: product.sku,
        stock: product.stock,
        rating: product.rating,
        reviewCount: product.reviewCount,
        isFeatured: product.isFeatured,
        metaKeywords: product.tags.join(", "),
        status: ProductStatus.PUBLISHED,
        shopId: shop.id,
        categoryId,
        brandId,
      },
    });

    await prisma.productImage.deleteMany({
      where: { productId: createdProduct.id },
    });

    await prisma.productImage.createMany({
      data: product.images.map((url, index) => ({
        productId: createdProduct.id,
        url,
        altText: product.name,
        order: index,
        isPrimary: index === 0,
      })),
    });
  }

  return { admin, vendor, user };
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
