# GWR Dashboard — Strategic Roadmap & AI Insights Plan

> Generated: 2026-02-20
> Status: Planning phase — priorities to be confirmed with stakeholders

---

## Current State Summary

| Area | Data Available | Records |
|------|---------------|---------|
| Revenue (Orders) | 511 headers, 627 line items, 8+ menu items, client tracking | ✅ |
| Expenses | 196 transactions, supplier master, payment methods, VAT | ✅ |
| Food Usage | 78 days (poulet, langoustes, poisson in kg) | ✅ |
| Drinks Usage | 78 days (6 types in bottles) | ✅ |
| WR Revenue | 14 trips, client + amount tracking | ✅ |
| Users/RBAC | 3-tier: admin, manager, staff | ✅ |

### Current App Features
- Revenue: Trend, By Client, Menu Performance
- Expenses: By Supplier, All Transactions, Odoo Export
- Operations: Inventory, Data Entry, Food Cost, Drinks Cost
- Admin: User Management
- ETL: 5 pipelines (Expenses, Revenue, WR Revenue, Food, Drinks)

---

## P0 — HIGH IMPACT (Build First)

### 1. Profit & Loss (P&L) Dashboard
**Effort:** 2-3 days | **Data Ready:** Yes

The #1 view any business owner needs. Combines revenue + expenses into one unified view.

**Features:**
- Monthly P&L statement: Total Revenue - Total Expenses = Gross Profit
- Gross margin % over time (trend line)
- Revenue breakdown: Restaurant orders vs WR trips
- Expense breakdown: Food costs vs Drinks costs vs Operating costs vs Utilities
- Net profit per month with trend arrow
- YTD cumulative profit chart

**KPIs:**
- Gross Profit, Gross Margin %, Net Profit, Operating Expense Ratio

---

### 2. Food Cost % (The Restaurant Golden Metric)
**Effort:** 1-2 days | **Data Ready:** Yes

Formula: `Food Cost % = (Food Purchases / Food Revenue) x 100`

**Features:**
- Daily/Weekly/Monthly food cost % — industry target is 28-35%
- Red/Yellow/Green status: >35% = red, 28-35% = yellow, <28% = green
- Food cost % per menu item (langoustes vs poulet vs poisson)
- Trend chart: Is food cost % going up or down?
- Alert when food cost % exceeds threshold for 3+ consecutive days

**Why Critical:** If food cost % creeps above 35%, the restaurant loses money on every plate.

---

### 3. Revenue Per Cover (Average Spend Per Guest)
**Effort:** 1 day | **Data Ready:** Yes

Formula: `Revenue Per Cover = Total Revenue / Total Pax`

**Features:**
- Average revenue per guest (daily/weekly/monthly)
- Revenue per cover by client — who are high-value clients?
- Revenue per cover trend — is average spend going up or down?
- Comparison: weekday vs weekend revenue per cover

---

### 4. Supplier Price Tracking & Alerts
**Effort:** 2 days | **Data Ready:** Yes

**Features:**
- Price per kg/unit over time for each product from each supplier
- Price change alerts: "Poulet from Supplier X went up 15% this month"
- Supplier comparison: Same product, different supplier prices
- Cost trend chart: Are ingredient costs rising?
- Monthly price volatility index per product

---

## P1 — PREDICTIVE ANALYTICS

### 5. Client Lifetime Value (CLV) & RFM Scoring
**Effort:** 2 days | **Data Ready:** Yes

**Features:**
- Client frequency: How often does each client order?
- Client recency: When was their last order?
- Client monetary value: Total lifetime spend
- RFM scoring: VIP / Regular / At Risk / Lost
- Churn prediction: "Client X hasn't ordered in 45 days — at risk"
- Client retention rate month over month

**Why Important:** 5x cheaper to retain a client than acquire a new one.

---

### 6. Demand Forecasting
**Effort:** 3-5 days | **Data Ready:** Yes (improves with more history)

**Features:**
- Predicted food needs for next 7 days based on:
  - Day-of-week patterns
  - Historical averages
  - Seasonal trends
- Weekly ingredient order suggestions
- Drinks consumption forecast — optimal stock quantities
- Confidence bands on predictions

**Implementation Options:**
- Simple: Moving average + day-of-week multiplier (no ML needed)
- Advanced: Time-series model (Prophet) via Supabase Edge Function

---

### 7. Menu Engineering Matrix
**Effort:** 2 days | **Data Ready:** Partial (need cost per dish)

Classic restaurant analytics — plot each menu item on 2 axes:

| | High Popularity | Low Popularity |
|---|---|---|
| **High Profit** | Stars (Promote!) | Puzzles (Market more) |
| **Low Profit** | Workhorses (Raise price) | Dogs (Remove/revamp) |

**Data Needed:** Revenue per item (have it) + Ingredient cost per item (need recipe/costing)

---

## P2 — AI INSIGHTS

### 8. AI-Powered Daily Briefing
**Effort:** 3 days | **Data Ready:** Yes

Auto-generated daily summary using LLM (Gemini):

Example:
```
Daily Briefing — Feb 20, 2026
- Yesterday's revenue: Rs 45,000 (up 12% vs same day last week)
- Food cost %: 31.2% (within target)
- WARNING: Langoustes stock critical — 2.1 days remaining
- WARNING: Sprite purchases up 22% this month vs last month
- TIP: Client "Dupont" hasn't ordered in 38 days — consider follow-up
- TIP: Poulet price from Supplier X is 8% above last month — check alternatives
```

**Implementation:** Supabase Edge Function (daily cron) -> query metrics -> send to LLM -> store summary -> display on dashboard homepage

---

### 9. Waste & Efficiency Tracking
**Effort:** 2-3 days | **Data Ready:** Partial

**Features:**
- Yield ratio: Kg purchased vs Kg used (is food being wasted?)
- Conversion ratio: Kg used vs Covers served (portion control)
- Drinks efficiency: Bottles opened vs Revenue generated
- Anomaly detection: Flag unusual days (e.g., 20kg chicken used, only 15 covers)

---

### 10. Break-Even Analysis
**Effort:** 2 days | **Data Ready:** Partial (need fixed vs variable cost split)

**Features:**
- Fixed costs per month (rent, staff, utilities)
- Variable costs per cover (food + drinks per guest)
- Break-even covers: How many guests per month to cover all costs?
- Break-even revenue: Minimum monthly revenue needed
- Days to break-even: Operating days this month before profitable

---

## P3 — OPERATIONAL IMPROVEMENTS

### 11. Real-Time Alerts (Push Notifications)
- Stock drops below 3 days supply -> push notification
- Supplier invoice 20%+ above historical average -> flag
- Food cost % exceeds 35% for 3 consecutive days -> alert
- Client at risk of churning -> notification

### 12. Comparative Analytics
- This month vs last month (side-by-side)
- This week vs same week last year (when enough data)
- Budget vs Actual (requires adding budget table to Supabase)

### 13. Staff Performance (Future — requires more data)
- Revenue per staff member
- Orders handled per shift
- Data entry accuracy (from correction_log)

---

## Implementation Priority Matrix

| Priority | Feature | Effort | Impact | Data Ready? |
|----------|---------|--------|--------|-------------|
| P0 | P&L Dashboard | 2-3 days | Very High | Yes |
| P0 | Food Cost % | 1-2 days | Very High | Yes |
| P0 | Revenue Per Cover | 1 day | High | Yes |
| P0 | Supplier Price Alerts | 2 days | High | Yes |
| P1 | Client Lifetime Value | 2 days | High | Yes |
| P1 | Demand Forecasting | 3-5 days | High | Yes (needs history) |
| P1 | Menu Engineering | 2 days | High | Partial |
| P2 | AI Daily Briefing | 3 days | Medium | Yes |
| P2 | Waste Tracking | 2-3 days | Medium | Partial |
| P2 | Break-Even Analysis | 2 days | Medium | Needs budget data |
| P3 | Push Notifications | 2 days | Medium | Yes |
| P3 | Comparative Analytics | 2 days | Medium | Partial |
| P3 | Staff Performance | 3 days | Low | Needs more data |

---

## Tech Stack Considerations

- **Charts:** Already using Recharts — extend with more chart types
- **AI/LLM:** Gemini API (already integrated in ETL) or OpenAI for daily briefings
- **Forecasting:** Simple moving averages first, Prophet model later
- **Notifications:** Supabase Edge Functions + web push or email alerts
- **Caching:** Consider React Query or SWR for real-time data freshness

---

## Notes
- All P0 features use 100% existing data — no new ETL needed
- P1/P2 features may need additional data collection (recipes, budgets, fixed costs)
- As data history grows (3+ months), prediction accuracy improves significantly
- Consider adding a "cost per dish" reference table for menu engineering
