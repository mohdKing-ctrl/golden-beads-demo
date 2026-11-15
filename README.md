# Golden Beads POS - DEMO (نسخة تجريبية)

A try-it-yourself copy of the Golden Beads Collection boutique point of sale (**Plan 1**). **No server, no login, nothing to install**: it is plain files.
Everything a visitor does is saved only in her own browser. It starts with example products, prices and sales; **Reset demo** (menu) starts again.

## Put it online (GitHub Pages)
1. Create a new repository (for example `golden-beads-demo`), upload **the contents of this folder** (index.html, css, js, img, fonts ... at the top level).
2. Repository **Settings -> Pages -> Build and deployment -> Deploy from a branch -> main / (root) -> Save**.
3. After a minute the demo is at `https://<your-name>.github.io/golden-beads-demo/`. Send that address to the customer.

## What the customer can test
- New sale: in the shop or delivery (address); tap products; size / colour per piece; discount; cash / card / bank transfer; part payment; print as 80 mm / 58 mm receipt or A4.
- Invoices (search, filter, receive a later payment, void, delete, Excel), Products (add / edit products, sections, units), Reports (sales, best sellers, shop vs delivery, Excel), Settings.

## Not in the demo (in the real system)
The owner login, data kept on the owner's server with daily backups, the shop's real products, prices and C.R. number.

Rebuild: in the real project run `node tools/make-demo.js`.
