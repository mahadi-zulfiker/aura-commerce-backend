"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const bcrypt = __importStar(require("bcryptjs"));
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
}
const pool = new pg_1.Pool({ connectionString: databaseUrl });
const prisma = new client_1.PrismaClient({
    adapter: new adapter_pg_1.PrismaPg(pool),
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
        description: "Experience the pinnacle of mobile technology with our flagship smartphone. Featuring a stunning 6.7-inch ProMotion display, A17 Pro chip, and revolutionary camera system that captures every moment in stunning detail.",
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
        variants: [
            {
                name: "128GB / Midnight",
                sku: "AURA-PHONE-001-128",
                price: 1099,
                stock: 18,
                attributes: { storage: "128GB", color: "Midnight" },
            },
            {
                name: "256GB / Silver",
                sku: "AURA-PHONE-001-256",
                price: 1199,
                stock: 16,
                attributes: { storage: "256GB", color: "Silver" },
            },
            {
                name: "512GB / Graphite",
                sku: "AURA-PHONE-001-512",
                price: 1299,
                stock: 12,
                attributes: { storage: "512GB", color: "Graphite" },
            },
        ],
    },
    {
        name: "Studio Pro Wireless Headphones",
        slug: "studio-pro-wireless-headphones",
        description: "Immerse yourself in pure audio bliss with our premium wireless headphones. Active noise cancellation, spatial audio, and up to 40 hours of battery life.",
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
        variants: [
            {
                name: "Matte Black",
                sku: "SOUND-HEAD-001-BLK",
                price: 349,
                stock: 40,
                attributes: { color: "Matte Black" },
            },
            {
                name: "Sandstone",
                sku: "SOUND-HEAD-001-SND",
                price: 349,
                stock: 32,
                attributes: { color: "Sandstone" },
            },
            {
                name: "Arctic White",
                sku: "SOUND-HEAD-001-WHT",
                price: 349,
                stock: 28,
                attributes: { color: "Arctic White" },
            },
        ],
    },
    {
        name: "UltraBook Pro 16",
        slug: "ultrabook-pro-16",
        description: "The ultimate creative powerhouse. M3 Max chip, stunning Liquid Retina XDR display, and exceptional battery life for all-day productivity.",
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
        variants: [
            {
                name: "16GB / 512GB",
                sku: "AURA-LAPTOP-001-16-512",
                price: 2399,
                stock: 8,
                attributes: { ram: "16GB", storage: "512GB" },
            },
            {
                name: "32GB / 1TB",
                sku: "AURA-LAPTOP-001-32-1TB",
                price: 2699,
                stock: 6,
                attributes: { ram: "32GB", storage: "1TB" },
            },
        ],
    },
    {
        name: "Smart Watch Series X",
        slug: "smart-watch-series-x",
        description: "Your ultimate health and fitness companion. Advanced health sensors, always-on display, and seamless integration with your devices.",
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
        variants: [
            {
                name: "41mm / Graphite",
                sku: "AURA-WATCH-001-41",
                price: 429,
                stock: 22,
                attributes: { size: "41mm", color: "Graphite" },
            },
            {
                name: "45mm / Starlight",
                sku: "AURA-WATCH-001-45",
                price: 449,
                stock: 20,
                attributes: { size: "45mm", color: "Starlight" },
            },
        ],
    },
    {
        name: "Pro Gaming Controller",
        slug: "pro-gaming-controller",
        description: "Dominate every game with precision controls, customizable buttons, and haptic feedback that puts you in the action.",
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
        description: "Crystal-clear audio in a compact package. Adaptive EQ, active noise cancellation, and seamless switching between devices.",
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
        variants: [
            {
                name: "Black",
                sku: "SOUND-EAR-001-BLK",
                price: 249,
                stock: 60,
                attributes: { color: "Black" },
            },
            {
                name: "Pearl",
                sku: "SOUND-EAR-001-PRL",
                price: 249,
                stock: 54,
                attributes: { color: "Pearl" },
            },
        ],
    },
    {
        name: "4K Gaming Monitor 27\"",
        slug: "4k-gaming-monitor-27",
        description: "Experience gaming at its finest with 4K resolution, 144Hz refresh rate, and 1ms response time.",
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
            "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=800&q=80",
        ],
    },
    {
        name: "Portable SSD 2TB",
        slug: "portable-ssd-2tb",
        description: "Blazing fast portable storage with military-grade durability. Transfer files at up to 2000MB/s.",
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
            "https://images.unsplash.com/photo-1563770660941-20978e870e26?w=800&q=80",
        ],
    },
    {
        name: "Aura Lite Smartphone",
        slug: "aura-lite-smartphone",
        description: "A sleek everyday smartphone with a vibrant OLED display, fast charging, and a triple-lens camera that captures crisp detail in any light.",
        shortDescription: "Slim OLED phone with fast charging and a triple camera.",
        price: 699,
        originalPrice: 799,
        categorySlug: "smartphones",
        brandSlug: "aura-labs",
        sku: "AURA-PHONE-002",
        stock: 90,
        rating: 4.6,
        reviewCount: 1124,
        tags: ["new"],
        isFeatured: true,
        images: [
            "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
            "https://images.unsplash.com/photo-1510557880182-3c5bdb1f4f4a?w=800&q=80",
            "https://images.unsplash.com/photo-1512499617640-c2f999098c8e?w=800&q=80",
        ],
    },
    {
        name: "Aura Fold X Smartphone",
        slug: "aura-fold-x-smartphone",
        description: "A bold foldable design with a tablet-sized inner display, multitasking power, and an ultra-smooth hinge built for daily use.",
        shortDescription: "Foldable 7.2-inch display with seamless multitasking.",
        price: 1599,
        originalPrice: 1799,
        categorySlug: "smartphones",
        brandSlug: "aura-labs",
        sku: "AURA-PHONE-003",
        stock: 22,
        rating: 4.8,
        reviewCount: 642,
        tags: ["premium"],
        isFeatured: true,
        images: [
            "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=800&q=80",
            "https://images.unsplash.com/photo-1510557880182-3c5bdb1f4f4a?w=800&q=80",
            "https://images.unsplash.com/photo-1512499617640-c2f999098c8e?w=800&q=80",
        ],
    },
    {
        name: "SoundWave Mini Speaker",
        slug: "soundwave-mini-speaker",
        description: "Pocket-sized power with rich bass and punchy volume. IP67 water resistance and 15 hours of playtime make it a travel essential.",
        shortDescription: "Portable speaker with deep bass and 15-hour battery.",
        price: 129,
        originalPrice: 159,
        categorySlug: "audio",
        brandSlug: "soundwave",
        sku: "SOUND-SPK-001",
        stock: 180,
        rating: 4.5,
        reviewCount: 736,
        tags: ["portable"],
        isFeatured: false,
        images: [
            "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&q=80",
            "https://images.unsplash.com/photo-1454922915609-78549ad709bb?w=800&q=80",
            "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80",
        ],
    },
    {
        name: "ZenBook Air 14",
        slug: "zenbook-air-14",
        description: "An ultralight laptop built for daily productivity, featuring a 14-inch edge-to-edge display, silent cooling, and instant wake.",
        shortDescription: "Ultralight 14-inch laptop for everyday productivity.",
        price: 1199,
        originalPrice: 1299,
        categorySlug: "laptops",
        brandSlug: "aura-labs",
        sku: "AURA-LAPTOP-002",
        stock: 45,
        rating: 4.6,
        reviewCount: 624,
        tags: ["portable"],
        isFeatured: true,
        images: [
            "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80",
            "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?w=800&q=80",
            "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&q=80",
        ],
    },
    {
        name: "Creator Studio 14",
        slug: "creator-studio-14",
        description: "A color-accurate 14-inch laptop designed for designers and editors. Pantone-validated display, discrete graphics, and fast SSD storage.",
        shortDescription: "Color-accurate 14-inch laptop for creators.",
        price: 1799,
        originalPrice: 1999,
        categorySlug: "laptops",
        brandSlug: "aura-labs",
        sku: "AURA-LAPTOP-003",
        stock: 30,
        rating: 4.7,
        reviewCount: 388,
        tags: ["creator"],
        isFeatured: false,
        images: [
            "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
            "https://images.unsplash.com/photo-1517059224940-d4af9eec41e5?w=800&q=80",
            "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
        ],
    },
    {
        name: "Tablet Pro 11",
        slug: "tablet-pro-11",
        description: "A powerful 11-inch tablet with studio-quality speakers, an edge-to-edge display, and a lightning-fast chip for work or play.",
        shortDescription: "11-inch tablet with pro performance and vibrant display.",
        price: 899,
        originalPrice: 999,
        categorySlug: "accessories",
        brandSlug: "aura-labs",
        sku: "AURA-TABLET-001",
        stock: 60,
        rating: 4.6,
        reviewCount: 544,
        tags: ["new"],
        isFeatured: true,
        images: [
            "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=800&q=80",
            "https://images.unsplash.com/photo-1454165205744-3b78555e5572?w=800&q=80",
            "https://images.unsplash.com/photo-1512499617640-c2f999098c8e?w=800&q=80",
        ],
    },
    {
        name: "Fitness Band Pulse",
        slug: "fitness-band-pulse",
        description: "A lightweight fitness tracker with continuous heart-rate monitoring, sleep insights, and 10-day battery life.",
        shortDescription: "Lightweight tracker with 10-day battery life.",
        price: 129,
        originalPrice: 159,
        categorySlug: "wearables",
        brandSlug: "aura-labs",
        sku: "AURA-WEAR-001",
        stock: 140,
        rating: 4.4,
        reviewCount: 512,
        tags: ["fitness"],
        isFeatured: false,
        images: [
            "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=800&q=80",
            "https://images.unsplash.com/photo-1519744346363-dc244a15248f?w=800&q=80",
            "https://images.unsplash.com/photo-1518976024611-4888c4a1f593?w=800&q=80",
        ],
    },
    {
        name: "VR Explorer Headset",
        slug: "vr-explorer-headset",
        description: "A comfortable VR headset with a wide field of view, precise tracking, and immersive spatial audio for next-level gaming.",
        shortDescription: "Wide field-of-view VR headset with precision tracking.",
        price: 499,
        originalPrice: 549,
        categorySlug: "gaming",
        brandSlug: "gamepro",
        sku: "GAME-VR-001",
        stock: 40,
        rating: 4.5,
        reviewCount: 298,
        tags: ["immersive"],
        isFeatured: false,
        images: [
            "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&q=80",
            "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=800&q=80",
            "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
        ],
    },
    {
        name: "Elite Mechanical Keyboard",
        slug: "elite-mechanical-keyboard",
        description: "A premium mechanical keyboard with hot-swappable switches, customizable RGB lighting, and a sturdy aluminum frame.",
        shortDescription: "Premium hot-swappable keyboard with RGB lighting.",
        price: 199,
        originalPrice: 229,
        categorySlug: "gaming",
        brandSlug: "gamepro",
        sku: "GAME-KEY-001",
        stock: 110,
        rating: 4.6,
        reviewCount: 412,
        tags: ["creator"],
        isFeatured: false,
        images: [
            "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80",
            "https://images.unsplash.com/photo-1517511620798-cec17d428bc0?w=800&q=80",
            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80",
        ],
    },
    {
        name: "Precision Gaming Mouse",
        slug: "precision-gaming-mouse",
        description: "Ultra-light gaming mouse with 26K DPI sensor, customizable buttons, and a comfortable ergonomic profile.",
        shortDescription: "Ultra-light mouse with 26K DPI sensor.",
        price: 89,
        originalPrice: 99,
        categorySlug: "gaming",
        brandSlug: "gamepro",
        sku: "GAME-MOUSE-001",
        stock: 240,
        rating: 4.5,
        reviewCount: 620,
        tags: ["popular"],
        isFeatured: false,
        images: [
            "https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&q=80",
            "https://images.unsplash.com/photo-1587202372775-98925f97b39d?w=800&q=80",
            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80",
        ],
    },
    {
        name: "Ultrawide Monitor 34\"",
        slug: "ultrawide-monitor-34",
        description: "A 34-inch ultrawide monitor with cinematic color and smooth 120Hz refresh rate for immersive gaming and multitasking.",
        shortDescription: "34-inch ultrawide monitor with cinematic color.",
        price: 899,
        originalPrice: 999,
        categorySlug: "gaming",
        brandSlug: "viewmax",
        sku: "VIEW-MONITOR-002",
        stock: 28,
        rating: 4.6,
        reviewCount: 312,
        tags: ["immersive"],
        isFeatured: false,
        images: [
            "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=800&q=80",
            "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
            "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80",
        ],
    },
    {
        name: "USB-C Hub Pro",
        slug: "usb-c-hub-pro",
        description: "Expand your workstation with HDMI, Ethernet, SD card, and USB-C power delivery in one sleek aluminum hub.",
        shortDescription: "All-in-one USB-C hub with HDMI and Ethernet.",
        price: 79,
        originalPrice: 99,
        categorySlug: "accessories",
        brandSlug: "datavault",
        sku: "DATA-HUB-001",
        stock: 220,
        rating: 4.4,
        reviewCount: 408,
        tags: ["work"],
        isFeatured: false,
        images: [
            "https://images.unsplash.com/photo-1555617117-08fda9d9af1a?w=800&q=80",
            "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?w=800&q=80",
            "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&q=80",
        ],
    },
    {
        name: "Wireless Charging Stand",
        slug: "wireless-charging-stand",
        description: "Fast wireless charging with a sturdy stand design that keeps your phone visible while powering up.",
        shortDescription: "Fast wireless charging stand for desk setups.",
        price: 59,
        originalPrice: 69,
        categorySlug: "accessories",
        brandSlug: "aura-labs",
        sku: "AURA-CHARGE-001",
        stock: 180,
        rating: 4.3,
        reviewCount: 312,
        tags: ["desk"],
        isFeatured: false,
        images: [
            "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80",
            "https://images.unsplash.com/photo-1510557880182-3c5bdb1f4f4a?w=800&q=80",
            "https://images.unsplash.com/photo-1582594576399-3d1481c3b05f?w=800&q=80",
        ],
    },
    {
        name: "StreamCam 4K Webcam",
        slug: "streamcam-4k-webcam",
        description: "A 4K webcam with AI auto-framing, dual microphones, and low-light enhancement for professional-quality streaming.",
        shortDescription: "4K webcam with AI auto-framing and dual mics.",
        price: 179,
        originalPrice: 199,
        categorySlug: "accessories",
        brandSlug: "viewmax",
        sku: "VIEW-CAM-001",
        stock: 95,
        rating: 4.4,
        reviewCount: 187,
        tags: ["streaming"],
        isFeatured: false,
        images: [
            "https://images.unsplash.com/photo-1519183071298-a2962be96c8f?w=800&q=80",
            "https://images.unsplash.com/photo-1517059224940-d4af9eec41e5?w=800&q=80",
            "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=800&q=80",
        ],
    },
    {
        name: "Smart Home Hub",
        slug: "smart-home-hub",
        description: "Control your smart home with voice commands, automation routines, and a crisp touchscreen interface.",
        shortDescription: "Voice-enabled smart home hub with touchscreen display.",
        price: 199,
        originalPrice: 229,
        categorySlug: "accessories",
        brandSlug: "aura-labs",
        sku: "AURA-HUB-001",
        stock: 70,
        rating: 4.3,
        reviewCount: 144,
        tags: ["smart-home"],
        isFeatured: false,
        images: [
            "https://images.unsplash.com/photo-1518444220520-3c4f6b0e9f1b?w=800&q=80",
            "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80",
            "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
        ],
    },
    {
        name: "NoiseShield Gaming Headset",
        slug: "noiseshield-gaming-headset",
        description: "A lightweight gaming headset with 7.1 surround sound, noise-cancelling mic, and breathable ear cushions.",
        shortDescription: "7.1 surround gaming headset with noise-cancelling mic.",
        price: 149,
        originalPrice: 169,
        categorySlug: "gaming",
        brandSlug: "soundwave",
        sku: "SOUND-GAME-001",
        stock: 130,
        rating: 4.4,
        reviewCount: 354,
        tags: ["gaming"],
        isFeatured: false,
        images: [
            "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80",
            "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80",
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
        ],
    },
];
const coupons = [
    {
        code: "WELCOME10",
        type: "PERCENTAGE",
        value: 10,
        description: "Welcome offer for new shoppers",
        minPurchase: 100,
        maxDiscount: 50,
        usageLimit: 500,
        usagePerUser: 1,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2026-01-01"),
        status: "ACTIVE",
    },
    {
        code: "AURA20",
        type: "PERCENTAGE",
        value: 20,
        description: "Seasonal Aura savings",
        minPurchase: 200,
        maxDiscount: 120,
        usageLimit: 300,
        usagePerUser: 1,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2026-06-30"),
        status: "ACTIVE",
    },
    {
        code: "SAVE75",
        type: "FIXED_AMOUNT",
        value: 75,
        description: "Flat savings on orders over $500",
        minPurchase: 500,
        usageLimit: 200,
        usagePerUser: 1,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2026-12-31"),
        status: "ACTIVE",
    },
    {
        code: "FREESHIP",
        type: "FREE_SHIPPING",
        value: 0,
        description: "Free shipping on any order",
        usageLimit: 1000,
        usagePerUser: 2,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2026-12-31"),
        status: "ACTIVE",
    },
];
const reviewSeeds = [
    {
        productSlug: "pro-max-ultra-smartphone",
        reviews: [
            {
                userEmail: "user@example.com",
                rating: 5,
                title: "Best phone I've ever used",
                comment: "The camera and display are stunning. Battery lasts all day.",
            },
            {
                userEmail: "vendor@example.com",
                rating: 4,
                title: "Premium feel",
                comment: "Incredible performance, just wish it were a bit lighter.",
            },
        ],
    },
    {
        productSlug: "studio-pro-wireless-headphones",
        reviews: [
            {
                userEmail: "user@example.com",
                rating: 5,
                title: "Noise cancellation is unreal",
                comment: "Great soundstage and very comfortable for long sessions.",
            },
            {
                userEmail: "admin@example.com",
                rating: 4,
                title: "Solid daily driver",
                comment: "Excellent build quality and reliable ANC.",
            },
        ],
    },
    {
        productSlug: "ultrabook-pro-16",
        reviews: [
            {
                userEmail: "user@example.com",
                rating: 5,
                title: "Dream laptop for creators",
                comment: "Fast renders and a gorgeous display. Worth the price.",
            },
        ],
    },
    {
        productSlug: "smart-watch-series-x",
        reviews: [
            {
                userEmail: "user@example.com",
                rating: 4,
                title: "Great health insights",
                comment: "Sleep tracking and heart-rate data are very accurate.",
            },
        ],
    },
    {
        productSlug: "precision-gaming-mouse",
        reviews: [
            {
                userEmail: "vendor@example.com",
                rating: 4,
                title: "Feels super responsive",
                comment: "Lightweight and smooth tracking for FPS games.",
            },
        ],
    },
    {
        productSlug: "portable-ssd-2tb",
        reviews: [
            {
                userEmail: "admin@example.com",
                rating: 5,
                title: "Fast and durable",
                comment: "Transfer speeds are excellent and the build is rugged.",
            },
        ],
    },
    {
        productSlug: "soundwave-mini-speaker",
        reviews: [
            {
                userEmail: "user@example.com",
                rating: 4,
                title: "Great for travel",
                comment: "Small but surprisingly loud with good bass.",
            },
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
                role: client_1.UserRole.ADMIN,
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
                role: client_1.UserRole.VENDOR,
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
                role: client_1.UserRole.USER,
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
            status: client_1.ShopStatus.APPROVED,
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
    const categoryMap = new Map((await prisma.category.findMany()).map((category) => [category.slug, category.id]));
    const brandMap = new Map((await prisma.brand.findMany()).map((brand) => [brand.slug, brand.id]));
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
                status: client_1.ProductStatus.PUBLISHED,
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
                status: client_1.ProductStatus.PUBLISHED,
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
        if (product.variants?.length) {
            await prisma.productVariant.deleteMany({
                where: { productId: createdProduct.id },
            });
            await prisma.productVariant.createMany({
                data: product.variants.map((variant) => ({
                    productId: createdProduct.id,
                    name: variant.name,
                    sku: variant.sku,
                    price: variant.price ?? null,
                    stock: variant.stock,
                    attributes: variant.attributes ?? {},
                })),
            });
        }
    }
    for (const coupon of coupons) {
        await prisma.coupon.upsert({
            where: { code: coupon.code },
            update: {
                type: coupon.type,
                value: coupon.value,
                description: coupon.description,
                minPurchase: coupon.minPurchase,
                maxDiscount: coupon.maxDiscount,
                usageLimit: coupon.usageLimit,
                usagePerUser: coupon.usagePerUser,
                startDate: coupon.startDate,
                endDate: coupon.endDate,
                status: coupon.status,
            },
            create: {
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                description: coupon.description,
                minPurchase: coupon.minPurchase,
                maxDiscount: coupon.maxDiscount,
                usageLimit: coupon.usageLimit,
                usagePerUser: coupon.usagePerUser,
                startDate: coupon.startDate,
                endDate: coupon.endDate,
                status: coupon.status,
                applicableCategories: [],
                applicableProducts: [],
            },
        });
    }
    const productMap = new Map((await prisma.product.findMany()).map((product) => [product.slug, product.id]));
    const userMap = new Map([
        [admin.email, admin.id],
        [vendor.email, vendor.id],
        [user.email, user.id],
    ]);
    for (const seed of reviewSeeds) {
        const productId = productMap.get(seed.productSlug);
        if (!productId) {
            continue;
        }
        for (const review of seed.reviews) {
            const reviewerId = userMap.get(review.userEmail);
            if (!reviewerId) {
                continue;
            }
            await prisma.review.upsert({
                where: {
                    userId_productId: {
                        userId: reviewerId,
                        productId,
                    },
                },
                update: {
                    rating: review.rating,
                    title: review.title,
                    comment: review.comment,
                },
                create: {
                    userId: reviewerId,
                    productId,
                    rating: review.rating,
                    title: review.title,
                    comment: review.comment,
                    images: [],
                },
            });
        }
    }
    const reviewStats = await prisma.review.groupBy({
        by: ["productId"],
        _avg: { rating: true },
        _count: { rating: true },
    });
    for (const stat of reviewStats) {
        await prisma.product.update({
            where: { id: stat.productId },
            data: {
                rating: stat._avg.rating ?? 0,
                reviewCount: stat._count.rating,
            },
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
//# sourceMappingURL=seed.js.map