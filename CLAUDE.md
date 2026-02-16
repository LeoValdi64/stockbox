# CLAUDE.md - StockBox

## What is this?
StockBox is a free, minimal inventory management PWA with barcode scanning/generation and a basic sales module. Think Sortly but leaner — focused on garage sales, household inventory, and small business tracking.

## Stack
- Next.js 16 + TypeScript + React 19
- Tailwind CSS v4 (already configured)
- shadcn/ui + Radix UI for all components
- Lucide React for icons
- Framer Motion for animations
- Clerk for authentication (multi-tenant, free tier)
- Supabase (PostgreSQL) for database
- Prisma as ORM
- PWA (next-pwa or @serwist/next)
- Barcode scanning: html5-qrcode (camera-based)
- Barcode generation: JsBarcode
- Dark theme (zinc-950 base)

## Architecture

### Database Schema (Prisma + Supabase)
```
User (synced from Clerk)
  - id, clerkId, email, name, createdAt

Product
  - id, userId, name, description, barcode (unique per user), 
  - quantity, minStock (optional alert threshold)
  - category, imageUrl (optional)
  - costPrice, salePrice
  - createdAt, updatedAt

Sale
  - id, userId, createdAt, total, notes

SaleItem
  - id, saleId, productId, quantity, priceAtSale

Category
  - id, userId, name, color, icon
```

### Pages / Routes
```
/ → Landing (marketing, not behind auth)
/sign-in, /sign-up → Clerk auth pages
/dashboard → Main dashboard (inventory overview, quick stats)
/inventory → Product list with search, filter, sort
/inventory/new → Add product (manual or scan barcode)
/inventory/[id] → Product detail / edit
/inventory/scan → Barcode scanner (camera)
/sales → Sales history with totals
/sales/new → New sale (scan items or search, cart flow)
/settings → User settings, categories management
```

### Key Features
1. **Barcode Scanner** — Open camera, scan existing barcodes (EAN-13, UPC-A, Code128, QR), auto-lookup product
2. **Barcode Generator** — Generate printable barcodes for items without one
3. **Inventory CRUD** — Add/edit/delete products, track quantities, set low-stock alerts
4. **Quick Stock Adjust** — +/- buttons on product cards for fast quantity changes
5. **Sales Module** — Create sales by scanning/searching items, auto-deduct inventory
6. **Dashboard** — Total items, total value, low stock alerts, recent sales, daily/weekly revenue chart
7. **Categories** — Color-coded categories for organization
8. **Search & Filter** — By name, barcode, category, stock level
9. **PWA** — Installable, works offline for viewing inventory (sync when online)
10. **Responsive** — Mobile-first design (primary use case is phone)

### UI Guidelines
- Mobile-first, thumb-friendly
- Dark theme default (zinc-950 background)
- Large scan button always accessible (FAB or bottom nav)
- Bottom navigation: Dashboard, Inventory, Scan (center, prominent), Sales, Settings
- Cards for products with image placeholder, name, quantity badge, price
- Smooth animations on page transitions and interactions

## Environment Variables Needed
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
DATABASE_URL= (Supabase PostgreSQL connection string)
DIRECT_URL= (Supabase direct connection for migrations)
```

## Git Workflow
- Make commits as you work (small, descriptive)
- Push to main when features are complete
- Each push auto-deploys to Vercel

## Priority Order
1. Setup shadcn/ui, Clerk, Prisma, Supabase schema
2. Auth flow (sign in/up, protected routes)
3. Dashboard layout + bottom navigation
4. Inventory CRUD (add/edit/delete products)
5. Barcode scanner integration
6. Barcode generator
7. Sales module
8. PWA configuration
9. Polish animations and responsive design
