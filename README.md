# 🌊 Voyage Event Manager (TBO)

> **Enterprise-grade SaaS platform for MICE events and destination weddings.**  
> Streamline your group bookings — from hotel inventory and room mapping to guest portals and post-booking intelligence.

---

## 📋 Table of Contents

- [What Is This?](#-what-is-this)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Application Routes](#-application-routes)
- [Authentication & Roles](#-authentication--roles)
- [Architecture Overview](#-architecture-overview)
- [UI Component Library](#-ui-component-library)
- [Environment Variables](#-environment-variables)
- [Scripts](#-scripts)
- [Documentation](#-documentation)

---

## 🌐 What Is This?

**Voyage Event Manager** (internally referred to as **TBO**) is a full-stack web application built for travel agents and event planners who manage **MICE** (Meetings, Incentives, Conferences, and Exhibitions) events and **destination weddings**.

Instead of juggling spreadsheets and email chains, agents get a centralised command centre to:

- Create and manage multi-day events
- Track hotel inventory and allocate rooms
- Onboard guests and group them into family units
- Let guests self-register via a dedicated **Guest Portal**
- Book flights and arrange transfers
- Negotiate hotel rates and evaluate bids
- Analyse booking performance through dashboards

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **Event Management** | Create events with dates, location, itinerary, and guest capacity |
| **Guest Management** | Add, edit, and group guests into family units; track head guests |
| **Head Guest Portal** | A self-service portal where a designated head guest manages their sub-group (family/team) |
| **Hotel Inventory** | Browse and select hotels; view room types, availability, and allocation |
| **Room Mapping** | Map guests to specific rooms visually; enforce occupancy rules |
| **Flight Booking** | Search, filter, and book flights for guests |
| **Transfers** | Manage ground transport for guests |
| **Negotiation Module** | Agents negotiate hotel pricing; hotels submit counter-bids |
| **Post-Booking Intelligence** | Analytics and insights after bookings are locked |
| **Real-Time Booking Status** | Track the status of each booking in real time |
| **TBO Admin Panel** | Internal admin interface for platform-level management |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | TypeScript |
| **Authentication** | [Clerk](https://clerk.com/) (`@clerk/nextjs`) |
| **Server State** | [TanStack Query v5](https://tanstack.com/query/latest) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Toasts / Notifications** | [Sonner](https://sonner.emilkowal.ski/) |
| **Component Variants** | CVA (Class Variance Authority) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A [Clerk](https://clerk.com/) account (for authentication)

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd TBO

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Clerk keys (see Environment Variables section)

# 4. Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**

---

## 📁 Project Structure

```
tbo/
├── src/
│   ├── app/                    # Next.js App Router (pages & API routes)
│   │   ├── layout.tsx          # Root layout with all providers
│   │   ├── page.tsx            # Landing/login redirect page
│   │   ├── dashboard/          # Agent dashboard
│   │   ├── events/[eventId]/   # All event-specific sub-pages
│   │   ├── analytics/          # Global analytics view
│   │   ├── negotiation/        # Hotel negotiation module
│   │   ├── post-booking-intelligence/  # Post-booking insights
│   │   ├── tbo-admin/          # Internal admin panel
│   │   ├── sign-in/ & sign-up/ # Clerk auth pages
│   │   ├── profile/            # User profile
│   │   └── api/                # Backend API route handlers
│   │       ├── events/         # Event CRUD
│   │       ├── hotels/         # Hotel listings & availability
│   │       ├── flights/        # Flight search & booking
│   │       ├── agents/         # Agent management
│   │       └── transfers/      # Ground transport
│   │
│   ├── modules/                # Domain-driven feature modules
│   │   ├── dashboard/          # Dashboard metrics & mock data
│   │   ├── events/             # Event types & services
│   │   ├── inventory/          # Inventory types & risk calculation
│   │   ├── booking/            # Booking logic (future)
│   │   ├── analytics/          # Analytics logic (future)
│   │   └── post-booking/       # Post-booking logic (future)
│   │
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Core design system components
│   │   │   ├── Badge/          # Status indicator badges
│   │   │   ├── Button/         # Action buttons with variants
│   │   │   ├── Card/           # Content containers & metric cards
│   │   │   └── EventCard/      # Composite event display card
│   │   └── legacy/             # Components being migrated
│   │       ├── auth/           # ProtectedRoute, LogoutButton
│   │       ├── portal/         # Guest portal components
│   │       ├── Navigation.tsx
│   │       ├── Sidebar.tsx
│   │       └── EventModal.tsx
│   │
│   ├── context/                # React Context providers
│   │   ├── AuthContext.tsx     # Auth state (user, role)
│   │   ├── EventContext.tsx    # Active event state
│   │   └── SidebarContext.tsx  # Sidebar open/close state
│   │
│   ├── services/               # API service layer
│   ├── hooks/                  # Custom React hooks
│   ├── utils/                  # Pure utility functions
│   │   ├── classNames.ts       # Tailwind class merging (cn)
│   │   ├── dateFormatters.ts   # Date display helpers
│   │   └── numberFormatters.ts # Currency & number formatting
│   ├── config/                 # App-wide constants & route definitions
│   ├── types/                  # Global TypeScript types
│   └── lib/                    # Backward compatibility re-exports
│
├── docs/                       # Developer documentation
│   ├── ARCHITECTURE.md         # Deep-dive architecture guide
│   ├── QUICK_REFERENCE.md      # Cheat sheet for common tasks
│   ├── head_guest_prd.md       # Product requirements for Guest Portal
│   └── implementation.md       # Implementation notes
│
├── public/                     # Static assets
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
└── package.json
```

---

## 🗺 Application Routes

### Agent-Facing Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page — redirects to sign-in |
| `/sign-in` | Clerk-powered sign-in |
| `/sign-up` | Clerk-powered sign-up |
| `/dashboard` | Agent dashboard with event overview & metrics |
| `/analytics` | Global booking analytics |
| `/negotiation` | Hotel rate negotiation view |
| `/post-booking-intelligence` | Post-event insights and reporting |
| `/tbo-admin` | Internal platform administration |
| `/profile` | Agent profile settings |

### Event-Specific Routes (`/events/[eventId]/...`)

| Route | Description |
|-------|-------------|
| `/events/[eventId]` | Event detail page (summary, status, itinerary) |
| `/events/[eventId]/guests` | Guest list, add/edit guests, family grouping |
| `/events/[eventId]/manage-guests` | Detailed guest management view |
| `/events/[eventId]/hotels` | Hotel search & selection for the event |
| `/events/[eventId]/inventory` | Room type inventory & availability tracking |
| `/events/[eventId]/room-mapping` | Visual guest-to-room assignment |
| `/events/[eventId]/flights` | Flight booking for event guests |
| `/events/[eventId]/transfers` | Ground transfer management |
| `/events/[eventId]/negotiation` | Per-event hotel negotiation |
| `/events/[eventId]/booking` | Booking review & confirmation |
| `/events/[eventId]/cart` | Booking cart before confirmation |
| `/events/[eventId]/post-booking` | Post-booking status & intelligence |

### Guest Portal Routes

| Route | Description |
|-------|-------------|
| `/events/[eventId]/portal/[guestId]` | Head Guest dashboard (group summary) |
| `/events/[eventId]/portal/[guestId]/manage` | Head Guest adds/edits sub-guests |
| `/events/[eventId]/portal/[guestId]/rooms` | Head Guest assigns sub-guests to rooms |

### API Routes (`/api/...`)

| Route | Description |
|-------|-------------|
| `/api/events` | Create, read, update, delete events |
| `/api/hotels` | Hotel search and room availability |
| `/api/flights` | Flight search and booking |
| `/api/agents` | Agent account management |
| `/api/transfers` | Transfer booking |

---

## 🔐 Authentication & Roles

Authentication is powered by **[Clerk](https://clerk.com/)**, providing secure, passwordless-ready sign-in. The system supports two distinct user types:

### 👔 Agent
- Full access to the dashboard, event management, hotels, inventory, and analytics.
- Can create events, add guests, manage bookings, and negotiate hotel rates.
- Accesses the app through `/sign-in`.

### 👥 Head Guest
- Limited access to their event's **Guest Portal** only.
- Can self-register their family/team members, view room allocations, and browse the curated hotel showcase.
- Accesses via a **secure magic link** sent by the agent — no account required.

```
Agent  ──── manages ────► Events ──── invites ────► Head Guests
                                                        │
                                            sub-guests self-register
                                            via Guest Portal
```

---

## 🏛 Architecture Overview

The project follows **Domain-Driven Design (DDD)** with a clear separation of concerns:

```
┌─────────────────────────────────┐
│           Next.js App Router     │  ← Pages & API Routes
├─────────────────────────────────┤
│         React Context API        │  ← Auth, Event, Sidebar state
├─────────────────────────────────┤
│       Domain Modules (src/modules)│  ← Business logic per domain
├─────────────────────────────────┤
│     Services + Custom Hooks      │  ← Data fetching (TanStack Query)
├─────────────────────────────────┤
│      Reusable UI Components      │  ← Design system (CVA + Tailwind)
└─────────────────────────────────┘
```

### Key Patterns

- **App Router** — File-system based routing; layouts are composable and nested.
- **Domain Modules** — Each business area (`events`, `inventory`, `booking`) is self-contained with its own types, services, and utilities.
- **Context Providers** — Lightweight global state (auth, active event, sidebar) via React Context.
- **TanStack Query** — Server state management, caching, background refetching.
- **CVA** — Type-safe component variants (e.g., `Button` with `primary | secondary | ghost` variants).
- **Path Aliases** — Clean imports via `@/components/...`, `@/modules/...`, `@/config/...`, etc.

---

## 🎨 UI Component Library

Core components live in `src/components/ui/` and follow a consistent folder pattern:

```
ComponentName/
├── ComponentName.tsx   # Implementation
├── types.ts            # Props & variant types
└── index.ts            # Barrel export
```

| Component | Description | Usage |
|-----------|-------------|-------|
| `Badge` | Status indicators (success, warning, error) | `<Badge variant="success" label="Active" />` |
| `Button` | CTA buttons with multiple variants | `<Button variant="primary">Save</Button>` |
| `Card` | Generic content container | `<Card className="p-4">...</Card>` |
| `MetricCard` | Dashboard KPI tile with trend | `<MetricCard label="Bookings" value="124" trend="up" />` |
| `EventCard` | Rich event display card | `<EventCard event={eventData} />` |

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root:

```env
# Clerk Authentication (required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk Redirect URLs (optional, defaults shown)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

Get your Clerk keys from the [Clerk Dashboard](https://dashboard.clerk.com/).

---

## 📜 Scripts

```bash
# Development server (with hot reload)
npm run dev

# Production build
npm run build

# Start production server (after build)
npm start

# Lint the codebase
npm run lint

# Type-check without emitting files
npx tsc --noEmit

# Clear Next.js build cache
rm -rf .next
```

---

## 📚 Documentation

| File | Description |
|------|-------------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Full architecture deep-dive: patterns, guidelines, naming conventions |
| [`docs/QUICK_REFERENCE.md`](docs/QUICK_REFERENCE.md) | Cheat sheet: common tasks, import aliases, component usage |
| [`docs/head_guest_prd.md`](docs/head_guest_prd.md) | Product requirements for the Head Guest Portal feature |
| [`docs/implementation.md`](docs/implementation.md) | Implementation notes and decisions |

---

## 🤝 Contributing

1. **Identify the domain** — Find the right module in `src/modules/`
2. **Define types first** — Add/update types in `modules/[domain]/types.ts`
3. **Build components** — Add UI in `src/components/ui/`
4. **Add routes** — Create pages in `src/app/`
5. **Keep config central** — Add routes/constants to `src/config/`
6. **Use import aliases** — Always use `@/` paths, never relative `../` paths

### File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `EventCard.tsx` |
| Utilities | camelCase | `dateFormatters.ts` |
| Routes | kebab-case | `post-booking/` |
| Constants | UPPER_SNAKE_CASE | `MAX_GUESTS` |
| Hooks | `use` prefix + camelCase | `useGuestList.ts` |

---

*Built with ❤️ for travel agents who manage extraordinary experiences.*
