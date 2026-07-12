import Link from 'next/link'
import Image from 'next/image'
import { categories } from '@/lib/pharmacy-data'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-[#1a1a1a] text-white mt-24">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1 — Brand + tagline */}
          <div className="lg:col-span-1">
            <h3 className="font-heading text-2xl font-bold text-white mb-3">
              Shop<span className="text-primary">.</span>
            </h3>
          </div>

          {/* Column 2 — Shop by Category */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              Shop by Category
            </h4>
            <ul className="space-y-2.5">
              {categories.map((cat) => (
                <li key={cat}>
                  <Link
                    href="/landing"
                    className="text-sm text-gray-400 hover:text-primary transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Company + Account */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              Company
            </h4>
            <ul className="space-y-2.5 mb-8">
              {[
                { label: 'About Us', href: '/landing#about' },
                { label: 'Contact', href: '/landing#contact' },
                { label: 'Privacy Policy', href: '#' },
                { label: 'Terms of Service', href: '#' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-gray-400 hover:text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              Account
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'My Orders', href: '/my-orders' },
                { label: 'My Wishlist', href: '/my-wishlist' },
                { label: 'My Reviews', href: '/my-reviews' },
                { label: 'Notifications', href: '/my-notifications' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-gray-400 hover:text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Payment methods */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              We Accept
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 overflow-hidden p-1">
                  <Image src="/esewa.png" alt="eSewa" width={36} height={36} className="object-contain" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">eSewa</p>
                  <p className="text-xs text-gray-400">Digital wallet payment</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 overflow-hidden p-1">
                  <Image src="/khalti.png" alt="Khalti" width={36} height={36} className="object-contain" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Khalti</p>
                  <p className="text-xs text-gray-400">Digital wallet payment</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-gray-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">COD</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Cash on Delivery</p>
                  <p className="text-xs text-gray-400">Pay when you receive</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            &copy; {year} Shop. All rights reserved. Registered in Nepal.
          </p>
          <p className="text-xs text-gray-500">
            Prices in Nepalese Rupees (NPR). All medicines require valid prescription where mandated.
          </p>
        </div>
      </div>
    </footer>
  )
}
