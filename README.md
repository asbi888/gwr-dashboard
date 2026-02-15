# GWaveRunner Dashboard

Analytics dashboard for **GWaveRunner Marine Catering** (Mauritius).

Built with Next.js 14, TypeScript, Tailwind CSS, Recharts, and Supabase.

## Features

- **KPI Cards** - Revenue, Expenses, Profit/Loss, Orders with trend indicators
- **Revenue vs Expenses Chart** - Monthly comparison line chart
- **Weekly Revenue** - Bar chart with gradient fills
- **Top Clients** - Ranked by total revenue with progress bars
- **Top Suppliers** - Ranked by total spend with category tags
- **Menu Performance** - Donut chart showing revenue by menu item
- **Responsive** - Works on desktop, tablet, and mobile
- **Loading Skeletons** - Smooth loading states for all components

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Deployment (Vercel)

1. Push repository to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 14 | App Router, React framework |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| Recharts | Charts and data visualization |
| Supabase | Database (PostgreSQL) |

## Database Tables

| Table | Description |
|---|---|
| `gwr_expenses` | Expense transactions with supplier references |
| `gwr_suppliers` | Supplier master data with categories |
| `gwr_revenue` | Revenue orders per client |
| `gwr_revenue_lines` | Line items per order (menu items) |
