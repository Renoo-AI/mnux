# 🌟 MenuxPro Wish List

> Feature requests, ideas, and improvements to track over time.

---

## 🗄️ Database & Backend
- [x] Complete Supabase Realtime migration for Orders, Tables, and Cashier dashboard
- [ ] Add Row Level Security (RLS) policies on all Supabase tables
- [ ] Supabase Edge Functions for heavy server-side logic (e.g., analytics aggregation)
- [ ] Multi-tenant restaurant isolation at the database level

## 🎨 UI / UX
- [ ] Animated order status transitions on customer-facing status page
- [ ] Dark mode support across all pages
- [ ] Skeleton loaders instead of spinners while data loads
- [ ] Improved empty states with illustrations

## 📦 Orders & Cashier
- [ ] Order history with filters (date range, status, table)
- [ ] Print receipt / kitchen ticket from cashier view
- [ ] Sound notification when a new order arrives at the cashier dashboard
- [ ] Ability to modify an order before accepting (add/remove items)

## 📊 Analytics
- [ ] Daily revenue chart on admin dashboard
- [ ] Most ordered items ranking
- [ ] Peak hours heatmap

## 🔐 Security
- [x] Fix TypeScript interface naming in advanced-security-defense.ts (spaces in names → camelCase)
- [ ] Add CAPTCHA on order submission
- [ ] Webhook for suspicious activity alerts

## 🚀 Performance
- [ ] Image optimization with next/image across all menus
- [ ] Lazy load menu categories
- [ ] Bundle size audit

---

*Last updated: 2026-06-18*
