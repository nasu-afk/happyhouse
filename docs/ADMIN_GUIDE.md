# HappyHouse — Admin Guide

A plain-language guide to running the site day-to-day. No coding knowledge needed for anything in this document.

---

## Logging in

1. Go to `yoursite.com/admin/login` (locally: `http://localhost:3001/admin/login`).
2. Enter the email and password set up for you.
3. You'll land on the **Dashboard**, showing your enquiry count and a breakdown of your listings by status.

If you know your current password but want to change it, go to **Settings** and use the **Change password** section at the bottom — you'll need your current password to set a new one.

If you've forgotten your password entirely, there's no self-service email reset yet — ask whoever manages the server to run:
```
python -m scripts.reset_password
```
from the `backend/` folder (or `docker compose exec backend python -m scripts.reset_password` if running in Docker). It'll ask for your email and a new password.

---

## Adding a property

1. Click **Add property** from the Dashboard or the Properties page.
2. Fill in the sections top to bottom:
   - **Basic information** — title, description, property type, listing type (Buy/Rent), status.
   - **Property details** — bedrooms, bathrooms, area, floor, furnishing, parking.
   - **Pricing** — the actual price (used for sorting/filtering), and optionally a "display price" like "₹85 Lakh" if you want it shown differently than the raw number.
   - **Location** — address, locality, city, district, pincode.
   - **Amenities** — click to select any that apply.
   - **Images** — drag photos into the upload box, or click it to choose files from your computer. You can upload several at once. Hover over any photo to:
     - **Set primary** — this becomes the main photo shown on property cards and the top of the gallery.
     - **Move it left/right** — reorder the gallery.
     - **Remove it** — deletes it from the listing (and from image storage).
   - **Publishing** — two checkboxes:
     - **Published** — must be checked for the property to appear on the public site at all.
     - **Featured** — shows it on the homepage.
3. Click **Create property**.

The property appears on the public site immediately once Published is checked — no waiting, no developer needed.

---

## Editing a property

Go to **Properties**, click **Edit** on any listing. Same form as adding — change what you need and save. Image management (add/remove/reorder/set primary) works the same way and saves immediately as you make each change, rather than waiting for a final "save" click.

---

## Marking a property Sold or Rented

On the **Properties** page, or from the edit form, change the **Status** field to Sold, Rented, or On Hold. The public listing will show a "Sold"/"Rented" banner over the photo instead of being removed — this keeps the listing visible as a track record without letting people enquire on something no longer available.

You can also toggle **Published** and **Featured** directly from the Properties table without opening the full edit form — click the status word in those columns.

---

## Managing enquiries

Go to **Enquiries**. Every message submitted through the public site (property enquiries and general contact-page messages) lands here, newest first. Change the status dropdown on each one as you work through it: **New → Contacted → Follow-up → Closed**.

The Dashboard highlights how many are still marked "New" so nothing gets missed.

---

## Managing "Areas we serve"

Go to **Areas**. Add a locality by name, then click into it to:
- Upload a real photo of that area (drag-and-drop, same as property photos)
- Add a short description
- Toggle **Active** — only active areas show on the public `/areas` page

Areas without a photo yet show a placeholder pattern instead of a broken image, so the page never looks empty.

---

## Changing business information

Go to **Settings**. Everything here — phone, WhatsApp number, email, address, business hours, about text — feeds directly into the Contact page, footer, About page, and the WhatsApp enquiry button on every property. Change it once here, it updates everywhere. Nothing about your business (phone number, address, etc.) is hardcoded anywhere in the site's code.

---

## Bulk import/export (CSV)

On the **Properties** page:
- **Export CSV** downloads all your current listings in spreadsheet form — useful as a backup, or as a starting point for manually feeding your listings into a paid 99acres/MagicBricks/Housing.com broker account (those portals don't offer a public way to connect automatically; you'd need your own account with them and to match their specific upload format).
- **Import CSV** lets you bulk-add properties you already have written up elsewhere, using the same column layout as the export. Imported properties land as **unpublished drafts** — review and publish each one individually rather than having them go live automatically.

---

## Light/dark mode

There's a sun/moon toggle in the top-right of both the public site and the admin panel. This is a per-visitor preference (saved in their browser), not a site-wide setting you control from here.

---

## If something goes wrong

- **Can't log in**: double-check email/password; if you've forgotten your password, see the recovery steps above. If the server was restarted with a wiped database, your account may need to be recreated (ask your developer).
- **Images won't upload**: this means image storage (Cloudinary) isn't configured on the server yet — you'll see an explicit error message rather than a silent failure.
- **A page looks broken**: take a screenshot and send it to whoever maintains the site — most issues so far have been configuration problems (database password, port conflicts), not the application itself.
