# Faster Place Order

Orders now confirm in about a second. The confirmation emails and WhatsApp messages arrive a few seconds after the order is placed, not before it. If a customer sees the order number straight away and the messages follow shortly, that is normal.

Follow-up: the header cart badge (Navbar) and the bottom nav badge (MobileNav) also read the persisted cart on the first client render, which was the remaining #418 mismatch on /checkout. Both now wait for mount.
