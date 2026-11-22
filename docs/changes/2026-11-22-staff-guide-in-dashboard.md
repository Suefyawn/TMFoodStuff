# Staff guide and getting-started checklist in the dashboard

- **Help & guide** (`/dashboard/help`, in the menu for admins and staff): the staff manual with its screenshots. Staff do not see the promo code and delivery area sections, because Settings is admin-only.
- **Getting started** on the Overview: a checklist for each new user (add a product, photos, change a price or stock, hide or show, categories, and for admins promo codes and delivery areas). "Show me" opens the right page with a short tip. A step ticks itself when the person really does it, or they can press "I've done this". The checklist can be hidden and brought back from Help. Progress is kept in that browser only, per email, so a new phone starts the checklist again.
- **Empty screens explain themselves**: no products, no categories, no promo codes. Promo codes now warn "Not live yet" until Save Settings is pressed.
- **Fixes found while testing as a new user**: adding a product without a category failed with "Invalid request body" (it now saves with no category), form errors now name the field, and a new product shows in the list straight away instead of after a reload.
