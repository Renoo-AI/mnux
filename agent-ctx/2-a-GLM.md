# Task 2-a: Watermark Component

## Agent: GLM

## Task: Create Watermark component for MenuxPro

## Requirements Met:
1. ✅ Shows "Powered by MenuxPro" branding on free plan restaurants
2. ✅ Visible on public menu pages and customer-facing pages
3. ✅ Links to https://wa.me/21656110674 (WhatsApp contact)
4. ✅ Accepts `show` prop to conditionally render (restaurant.plan === 'free' or watermarkEnabled)
5. ✅ Uses design colors: Dark Espresso #3A322D, Accent Gold #C9A07E, Soft Beige #EFE4D8
6. ✅ Fixed at bottom of page, z-index 40 (below navigation at z-50)
7. ✅ Subtle but not removable by free plan users
8. ✅ Year is 2026

## Component Location:
- `/home/z/my-project/src/components/Watermark.tsx`

## Usage Example:
```tsx
import { Watermark, WatermarkSpacer } from '@/components/Watermark';

// In a page component:
<WatermarkSpacer showWatermark={restaurant?.plan === 'free'}>
  {/* Page content */}
</WatermarkSpacer>
<Watermark show={restaurant?.plan === 'free'} />
```

## Features:
- Responsive design (mobile-first)
- WhatsApp link with icon
- "Powered by MenuxPro © 2026" text
- Subtle gradient highlight line at top
- Safe area support for mobile devices
- WatermarkSpacer helper to prevent content overlap

## Integration Notes:
- Import and use in public-facing pages (menu, ordering, etc.)
- Pass `show={true}` when restaurant is on free plan
- Wrap page content with WatermarkSpacer when watermark is visible
