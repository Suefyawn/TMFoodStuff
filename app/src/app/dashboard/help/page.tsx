// Staff guide, inside the dashboard. Same content as
// docs/staff-manual/staff-manual.md (the PDF handed to clients), with each
// section's id matching a getting-started step (lib/onboarding.ts) so a tip's
// "More with pictures" link lands on the right place.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { getDashboardSession, isAdminLevel } from '@/lib/admin-auth'
import { GuideControls } from '@/components/dashboard/Guide'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Help & guide', robots: { index: false, follow: false } }

interface Section {
  id: string
  title: string
  adminOnly?: boolean
  body: React.ReactNode
  img?: { src: string; alt: string }
}

const SECTIONS: Section[] = [
  {
    id: 'around',
    title: 'Find your way around',
    body: (
      <>
        <p>On a computer the menu is on the left. On a phone, press the menu button at the top right.</p>
        <p>Open <b>Products</b> to see every item in the shop. At the top of the list you can search by name, filter by category, or filter by Active and Inactive. <b>Categories</b> is a tab at the top of the Products page.</p>
        <p>Administrators also see <b>Settings</b>, where promo codes and delivery areas live.</p>
      </>
    ),
    img: { src: '/staff-guide/02-products-list.webp', alt: 'The products list' },
  },
  {
    id: 'add-product',
    title: 'Add a product',
    body: (
      <>
        <ol>
          <li>Open <b>Products</b> and press the green <b>Add Product</b> button at the top right.</li>
          <li>Fill in the form:
            <ul>
              <li><b>Name</b> is required. The Slug (the web address of the product) fills in by itself from the name.</li>
              <li><b>Category</b>: pick one from the list. Add new categories first.</li>
              <li><b>Price (AED)</b> is required. This is the price a customer pays for one unit.</li>
              <li><b>Compare-at Price (AED)</b>: the old, higher price. If you fill it in, the old price shows crossed out beside the new one. Leave it empty for no offer.</li>
              <li><b>Unit</b>: type just the unit, <code>kg</code> for goods sold by weight, or <code>piece</code>, <code>box</code> or <code>bunch</code>. The shop adds the word &ldquo;per&rdquo; itself, so customers see &ldquo;per kg&rdquo;.</li>
              <li><b>Stock</b>: how many units you have right now. <b>Low-stock alert at</b>: you are warned when stock falls to this number.</li>
              <li><b>Origin</b> and <b>Description</b>: where it comes from, and a few plain sentences for the customer.</li>
            </ul>
          </li>
          <li>Add photos (next section).</li>
          <li>Press <b>Add Product</b> at the bottom of the form. A green &ldquo;Product created&rdquo; message appears.</li>
        </ol>
        <p>New products are Active, so customers see them straight away. If you only want to practise, hide or delete the product afterwards.</p>
      </>
    ),
    img: { src: '/staff-guide/03-add-product-form.webp', alt: 'The Add New Product form, filled in' },
  },
  {
    id: 'photos',
    title: 'Add or change photos',
    body: (
      <ol>
        <li>In the product form, under <b>Product Images</b>, press <b>Add more</b>.</li>
        <li>Choose a picture from your phone or computer. JPG, PNG, WebP and AVIF pictures work, up to 5 MB each, and up to 6 per product.</li>
        <li>The first picture is the main one, marked <b>Primary</b>. To make another picture the main one, press <b>Set Primary</b> on it. To remove a picture, press the small red cross on it.</li>
        <li>Press <b>Save Changes</b> (when editing) or <b>Add Product</b> (when adding).</li>
      </ol>
    ),
  },
  {
    id: 'edit-product',
    title: 'Change a price, stock or photo later',
    body: (
      <>
        <ol>
          <li>Open <b>Products</b> and type the product name in the search box.</li>
          <li>Press <b>Edit</b> at the end of the row.</li>
          <li>Change what you need and press <b>Save Changes</b> at the bottom of the form.</li>
        </ol>
        <p>A quick way to change stock: in the products list, press the <b>minus</b> or <b>plus</b> buttons beside the stock number. Each press changes it by one.</p>
      </>
    ),
    img: { src: '/staff-guide/05-edit-product-form.webp', alt: 'The Edit Product form' },
  },
  {
    id: 'show-hide',
    title: 'Show or hide a product',
    body: (
      <>
        <p>Each row has a status button: <b>Active</b> (customers can see and buy it) or <b>Inactive</b> (hidden from customers, nothing is deleted). Press it once to switch.</p>
        <p>You can also open <b>Edit</b>, scroll down and use the <b>Active</b> switch.</p>
        <p>To change many products at once, tick the boxes on the left of their rows. Buttons appear above the list: <b>Activate</b>, <b>Deactivate</b>, <b>Feature</b>, <b>Unfeature</b> and <b>Delete</b>. Delete removes a product for good, so use Deactivate if you only want it hidden.</p>
      </>
    ),
    img: { src: '/staff-guide/06-active-inactive.webp', alt: 'The Active status on a product row' },
  },
  {
    id: 'categories',
    title: 'Categories',
    body: (
      <p>Open <b>Categories</b> from the tabs above the products list. Press <b>Add Category</b> to make a new one. Press <b>Edit</b> on a row to rename it, or the red bin to remove it. Removing a category does not delete its products, but they become uncategorized, so move them to another category first.</p>
    ),
    img: { src: '/staff-guide/09-categories.webp', alt: 'The categories page' },
  },
  {
    id: 'sale-price',
    title: 'Put one product on sale',
    body: (
      <p>Open the product with <b>Edit</b>, put the normal price in <b>Compare-at Price (AED)</b> and the lower sale price in <b>Price (AED)</b>, then save. To end the sale, clear the Compare-at Price and put the normal price back.</p>
    ),
  },
  {
    id: 'promo',
    title: 'Promo codes',
    adminOnly: true,
    body: (
      <>
        <ol>
          <li>Open <b>Settings</b>, then the <b>Promo codes</b> tab.</li>
          <li>Under <b>Code</b>, type the code in capital letters, for example <code>WELCOME10</code>.</li>
          <li>Under <b>Discount %</b>, type the percentage, for example <code>10</code>.</li>
          <li>Under <b>Expires</b>, pick an end date, or leave it empty for no end date.</li>
          <li>Press the green <b>+</b> button. The code appears in the list above.</li>
          <li>Press <b>Save Settings</b> at the top right. The code does not work until you save.</li>
        </ol>
        <p>To stop a code, press <b>Disable</b> beside it, then <b>Save Settings</b>.</p>
      </>
    ),
    img: { src: '/staff-guide/07-promo-code-form.webp', alt: 'Adding a promo code' },
  },
  {
    id: 'delivery',
    title: 'Delivery areas',
    adminOnly: true,
    body: (
      <>
        <p>Customers can only order to the areas on this list. Any other address is told we do not deliver there yet.</p>
        <ol>
          <li>Open <b>Settings</b>, then the <b>Delivery &amp; pricing</b> tab.</li>
          <li>Find the box called <b>Delivery areas (Dubai)</b>.</li>
          <li>Type one area per line. Delete a line to stop delivering there. Add a new line to start.</li>
          <li>Press <b>Save Settings</b> at the top right. Wait for &ldquo;Saved!&rdquo;.</li>
        </ol>
        <p>On the same tab you can change the <b>Delivery Fee (AED)</b> and switch <b>Free Delivery</b> on or off. Staff can still deliver outside the list by editing an order by hand.</p>
      </>
    ),
    img: { src: '/staff-guide/08-delivery-areas.webp', alt: 'The delivery areas list' },
  },
  {
    id: 'trouble',
    title: 'If something goes wrong',
    body: (
      <ul>
        <li>A red message at the top of the page says what failed. Read it, press the cross to dismiss it, and try again.</li>
        <li>If a product does not show on the shop, check it is Active and has stock.</li>
        <li>If a change does not appear, reload the page and look again.</li>
        <li>Still stuck? Write down what you pressed and what the message said, and send it to the person who set up the site.</li>
      </ul>
    ),
  },
]

export default async function HelpPage() {
  const session = await getDashboardSession()
  if (session.state !== 'ok' || session.role === 'driver') redirect('/dashboard')
  const admin = isAdminLevel(session.role)
  const sections = SECTIONS.filter(s => !s.adminOnly || admin)

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-white inline-flex items-center gap-2">
          <BookOpen size={22} className="text-emerald-400" aria-hidden="true" /> Help &amp; guide
        </h1>
        <p className="text-gray-400 text-sm">How to add and change products, run promotions and change where we deliver. Prices are in AED. The pictures show a practice copy with sample products.</p>
        <GuideControls />
        {!admin && (
          <p className="text-gray-500 text-sm">Promo codes and delivery areas are in Settings, which only administrators see. Ask an administrator if one needs changing.</p>
        )}
      </header>

      <nav aria-label="On this page" className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">On this page</p>
        <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm list-decimal pl-5">
          {sections.map(s => (
            <li key={s.id}><a href={`#${s.id}`} className="text-emerald-400 hover:text-emerald-300">{s.title}</a></li>
          ))}
        </ol>
      </nav>

      {sections.map((s, i) => (
        <section key={s.id} id={s.id} className="scroll-mt-16 lg:scroll-mt-4 bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5 space-y-3">
          <h2 className="text-lg font-bold text-white">{i + 1}. {s.title}</h2>
          <div className="help-prose text-gray-300 text-[15px] leading-relaxed space-y-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:mt-1.5 [&_b]:text-white [&_code]:bg-gray-800 [&_code]:px-1.5 [&_code]:rounded [&_code]:text-emerald-300">
            {s.body}
          </div>
          {s.img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={s.img.src}
              alt={s.img.alt}
              width={1280}
              height={900}
              loading="lazy"
              className="w-full h-auto rounded-lg border border-gray-800"
            />
          )}
        </section>
      ))}

      <p className="text-sm text-gray-500">
        New here? The <Link href="/dashboard" className="text-emerald-400 hover:text-emerald-300 font-semibold">Overview</Link> has a getting-started checklist that walks you through each of these once.
      </p>
    </div>
  )
}
