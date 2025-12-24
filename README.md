# Aura Commerce Backend

A comprehensive **NestJS** backend API for the Aura Commerce e-commerce platform, featuring multi-vendor support, complete order management, payment processing with Stripe, and advanced analytics.

## 🚀 Features

### Authentication & Authorization
- **JWT-based authentication** with refresh token rotation
- **Role-based access control** (USER, VENDOR, ADMIN)
- **Email verification** with 6-digit PIN
- **Password reset** functionality
- **Session management** with refresh tokens

### User Management
- User profiles with avatar support
- Address management (multiple addresses per user)
- Email and SMS notification preferences
- User status management (ACTIVE, SUSPENDED, PENDING)

### Multi-Vendor Shop System
- **Vendor registration** and shop creation
- **Shop approval workflow** (PENDING, APPROVED, SUSPENDED, REJECTED)
- Shop profiles with logo, banner, and business information
- Shop ratings and reviews
- Shop followers system
- Featured shops

### Product Management
- **Complete product CRUD** operations
- **Product variants** (size, color, etc.)
- **Multiple product images** with primary image selection
- **Category hierarchy** (parent-child relationships)
- **Brand management**
- **Inventory tracking** with low stock alerts
- **Product status** (DRAFT, PUBLISHED, OUT_OF_STOCK, DISCONTINUED)
- **SEO metadata** (meta title, description, keywords)
- Product ratings and reviews
- View count and sold count tracking

### Shopping Cart & Wishlist
- **Persistent cart** per user
- **Cart item management** with variant support
- **Wishlist** functionality

### Order Management
- **Complete order lifecycle** (PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED)
- **Order tracking** with carrier and tracking number
- **Multiple payment methods** (CARD, CASH_ON_DELIVERY, MOBILE_BANKING)
- **Payment status tracking** (PENDING, PAID, FAILED, REFUNDED)
- **Order notes** (customer and admin)
- **Coupon support** with discount calculation

### Payment Processing
- **Stripe integration** for card payments
- **Payment intent creation**
- **Webhook handling** for payment confirmation
- **Refund support**

### Returns & Refunds
- **Return request system** (REQUESTED, APPROVED, REJECTED, RECEIVED, REFUNDED)
- **Return item tracking**
- **Refund processing**

### Reviews & Ratings
- **Product reviews** with 1-5 star ratings
- **Review images** support
- **Verified purchase** badges
- **Helpful count** tracking

### Coupon System
- **Flexible coupon types** (PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING)
- **Usage limits** (total and per user)
- **Date-based validity**
- **Minimum purchase** requirements
- **Category and product** restrictions
- **Coupon usage tracking**

### Notifications
- **Real-time notifications** for order updates
- **Multiple notification types** (ORDER_PLACED, ORDER_SHIPPED, PRICE_DROP, etc.)
- **Read/unread status**

### Analytics & Reporting
- **Page view tracking**
- **Audit logs** for all critical actions
- **Sales analytics**
- **User activity tracking**

### Additional Features
- **Newsletter subscription** management
- **File uploads** with Cloudinary integration
- **Store settings** (shipping costs, tax rates, return policies)
- **Email notifications** with Nodemailer
- **Rate limiting** for API protection
- **Swagger API documentation**

## 🛠️ Technology Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Passport
- **Payment**: Stripe
- **File Storage**: Cloudinary
- **Email**: Nodemailer
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger/OpenAPI
- **Security**: bcryptjs, cookie-parser, rate limiting

## 📋 Prerequisites

- Node.js 18+ or higher
- PostgreSQL 14+ or higher
- npm or yarn package manager
- Stripe account (for payments)
- Cloudinary account (for image uploads)
- SMTP server credentials (for emails)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   cd aura-commerce-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory with the following variables:

   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=4000

   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/aura_commerce?schema=public"

   # JWT Authentication
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000

   # Stripe
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Email (SMTP)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=Aura Commerce <noreply@auracommerce.com>
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   npx prisma generate

   # Run migrations
   npx prisma migrate dev

   # (Optional) Seed the database
   npm run seed
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run start:dev
```
The API will be available at `http://localhost:4000`

### Production Mode
```bash
# Build the application
npm run build

# Start the production server
npm run start:prod
```

### Debug Mode
```bash
npm run start:debug
```

## 📚 API Documentation

When running in development mode, Swagger documentation is available at:
```
http://localhost:4000/docs
```

## 🗄️ Database Management

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio (Database GUI)
npx prisma studio

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

## 🔐 API Endpoints Overview

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/verify-email` - Verify email with PIN
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `GET /auth/me` - Get current user

### Products
- `GET /products` - List products (with filters, pagination)
- `GET /products/:id` - Get product details
- `POST /products` - Create product (VENDOR/ADMIN)
- `PATCH /products/:id` - Update product (VENDOR/ADMIN)
- `DELETE /products/:id` - Delete product (VENDOR/ADMIN)

### Cart
- `GET /cart` - Get user's cart
- `POST /cart/items` - Add item to cart
- `PATCH /cart/items/:id` - Update cart item
- `DELETE /cart/items/:id` - Remove cart item
- `DELETE /cart` - Clear cart

### Orders
- `GET /orders` - List user's orders
- `GET /orders/:id` - Get order details
- `POST /orders` - Create order
- `PATCH /orders/:id/status` - Update order status (VENDOR/ADMIN)
- `PATCH /orders/:id/cancel` - Cancel order

### Payments
- `POST /payments/create-intent` - Create Stripe payment intent
- `POST /payments/webhook` - Stripe webhook handler

### Shops
- `GET /shops` - List shops
- `GET /shops/:slug` - Get shop details
- `POST /shops` - Create shop (VENDOR)
- `PATCH /shops/:id` - Update shop (VENDOR)
- `PATCH /shops/:id/approve` - Approve shop (ADMIN)

### Reviews
- `GET /reviews` - List reviews
- `POST /reviews` - Create review
- `PATCH /reviews/:id` - Update review
- `DELETE /reviews/:id` - Delete review

### Coupons
- `GET /coupons` - List coupons (ADMIN)
- `POST /coupons` - Create coupon (ADMIN)
- `POST /coupons/validate` - Validate coupon code
- `PATCH /coupons/:id` - Update coupon (ADMIN)
- `DELETE /coupons/:id` - Delete coupon (ADMIN)

### Analytics
- `GET /analytics/dashboard` - Get dashboard stats (ADMIN)
- `GET /analytics/sales` - Get sales analytics (ADMIN/VENDOR)

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

## 🔒 Security Features

- **JWT Authentication** with access and refresh tokens
- **Password hashing** with bcryptjs
- **Rate limiting** to prevent abuse
- **CORS configuration** for frontend access
- **Input validation** with class-validator
- **SQL injection protection** via Prisma
- **XSS protection** via input sanitization

## 📦 Project Structure

```
src/
├── addresses/          # Address management
├── analytics/          # Analytics and reporting
├── auth/              # Authentication & authorization
├── brands/            # Brand management
├── cart/              # Shopping cart
├── categories/        # Product categories
├── common/            # Shared utilities, filters, interceptors
├── config/            # Configuration files
├── coupons/           # Coupon management
├── database/          # Database module
├── newsletter/        # Newsletter subscriptions
├── notifications/     # User notifications
├── orders/            # Order management
├── payments/          # Payment processing
├── products/          # Product management
├── returns/           # Return requests
├── reviews/           # Product reviews
├── settings/          # Store settings
├── shops/             # Vendor shops
├── uploads/           # File uploads
├── users/             # User management
├── utils/             # Utility functions
├── wishlist/          # Wishlist functionality
├── app.module.ts      # Root module
└── main.ts            # Application entry point
```

## 🌐 Deployment

### Vercel Deployment

This backend is configured for Vercel serverless deployment:

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard

### Traditional Server Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set environment variables on your server

3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

4. Start the server:
   ```bash
   npm run start:prod
   ```

## 🔄 Stripe Webhook Setup

1. Install Stripe CLI for local testing:
   ```bash
   stripe listen --forward-to localhost:4000/payments/webhook
   ```

2. For production, configure webhook in Stripe Dashboard:
   - URL: `https://your-domain.com/payments/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

## 📧 Email Templates

Email templates are located in the auth service. Customize them for:
- Email verification
- Password reset
- Order confirmations
- Shipping notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the UNLICENSED License.

## 👥 Support

For support, email mahade.adib45@gmail.com or open an issue in the repository.

---

**Built with ❤️ using NestJS and Prisma**
