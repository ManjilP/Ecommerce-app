"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Package, ShoppingCart, Warehouse,
  Building2, BarChart2, LogOut, ShieldCheck, KeyRound,
  Ticket, Bell, Heart, Star,
} from "lucide-react";
import { logout, getMe, getUnreadNotificationCount } from "@/lib/api";

import { useTheme } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const adminNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/inventory", label: "Inventory", icon: Warehouse },
  { href: "/warehouses", label: "Warehouses", icon: Building2 },
  { href: "/coupons", label: "Coupons", icon: Ticket },
  { href: "/reports", label: "Reports", icon: BarChart2 },
];

const userNav = [
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/reviews", label: "My Reviews", icon: Star },
  { href: "/notifications", label: "Notifications", icon: Bell },
];


export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [open, setOpen] = useState(true);
  const { theme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) { router.push("/login"); return; }
    getUnreadNotificationCount()
      .then((res) => setUnreadCount(res.data.unread_count ?? res.data.count ?? 0))
      .catch(() => {});
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
        sessionStorage.removeItem("is_admin");
        sessionStorage.removeItem("orders_cache");
        sessionStorage.removeItem("username");
        document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.push("/login");
        return;
      }
    } catch { router.push("/login"); return; }

    setIsAdmin(sessionStorage.getItem("is_admin") === "true");
    
    getMe().then((r) => {
      setUsername(r.data.username || "");
      setRole(r.data.role || "customer");
    }).catch(() => {});
  }, []);

  const handleLogout = async () => {
    const refresh = sessionStorage.getItem("refresh_token");
    if (refresh) { try { await logout(refresh); } catch { } }
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("is_admin");
    sessionStorage.removeItem("orders_cache");
    sessionStorage.removeItem("username");
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const navItems = isAdmin ? adminNav : userNav;

  const itemStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: open ? "0 16px" : "0",
    justifyContent: open ? "flex-start" : "center",
    height: "50px",
    borderRadius: "14px",
    fontWeight: 500,
    fontSize: "16px",
    color: active ? "var(--text)" : "var(--text-2)",
    background: active ? "var(--card-2)" : "transparent",
    transition: "all 0.15s",
    cursor: "pointer",
    textDecoration: "none",
    width: "100%",
    border: "none",
  });

  return (
    <aside style={{ width: open ? "264px" : "68px", minWidth: open ? "264px" : "68px", height: "100vh", background: "var(--bg-elevated)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", transition: "width 0.25s ease, min-width 0.25s ease", overflow: "hidden" }}>

      {/* Logo + toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 12px 16px" }}>
        <Link href={isAdmin ? "/dashboard" : "/"} style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", overflow: "hidden" }}>
          <img src="/logo.png" alt="logo" style={{ width: "32px", height: "32px", objectFit: "contain", flexShrink: 0 }} />
          {open && (
            <div style={{ whiteSpace: "nowrap" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>Shop.</div>
              <div style={{ fontSize: "13px", color: "var(--text-3)", lineHeight: 1.2 }}>Vendor Panel</div>
            </div>
          )}
        </Link>
        <button
          className="group"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          style={{ width: "28px", height: "28px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--card-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-2)", flexShrink: 0 }}
        >
          <svg
            className="pointer-events-none"
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 12L20 12"
              className="origin-center -translate-y-[7px] transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
            />
            <path
              d="M4 12H20"
              className="origin-center transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
            />
            <path
              d="M4 12H20"
              className="origin-center translate-y-[7px] transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
            />
          </svg>
        </button>
      </div>

      <div style={{ height: "1px", background: "var(--border)", margin: "0 12px 12px" }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: "4px 8px", display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto" }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          const isNotif = href === "/notifications";
          return (
            <Link key={href} href={href} style={itemStyle(active)}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Icon size={20} strokeWidth={active ? 2 : 1.7} />
                {isNotif && unreadCount > 0 && (
                  <span style={{ position: "absolute", top: "-6px", right: "-6px", minWidth: "16px", height: "16px", borderRadius: "99px", background: "#ef4444", color: "#fff", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              {open && <span>{label}</span>}
              {open && active && <div style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "99px", background: "var(--accent)", flexShrink: 0 }} />}
            </Link>
          );
        })}

        {isAdmin && (
          <Link href="/admin" style={{ ...itemStyle(pathname === "/admin"), color: pathname === "/admin" ? "var(--text)" : "#f59e0b" }}>
            <ShieldCheck size={20} strokeWidth={1.7} />
            {open && <span>Vendor</span>}
          </Link>
        )}
      </nav>

      {/* User profile */}
      {username && (
        <>
          <div style={{ height: "1px", background: "var(--border)", margin: "8px 12px" }} />
          <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: open ? "12px" : "0", justifyContent: open ? "flex-start" : "center", margin: "4px 8px", padding: "10px 8px", borderRadius: "14px", textDecoration: "none", background: pathname === "/profile" ? "var(--card-2)" : "transparent", transition: "background 0.15s" }}
            onMouseEnter={(e) => { if (pathname !== "/profile") e.currentTarget.style.background = "var(--card-2)"; }}
            onMouseLeave={(e) => { if (pathname !== "/profile") e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ width: "34px", height: "34px", borderRadius: "99px", background: "linear-gradient(135deg, var(--accent), rgba(14,116,144,0.5))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{username.slice(0, 2).toUpperCase()}</span>
            </div>
            {open && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{username}</p>
                <p style={{ fontSize: "12px", color: "var(--text-3)", textTransform: "capitalize" }}>{role}</p>
              </div>
            )}
          </Link>
        </>
      )}

      {/* Bottom */}
      <div style={{ height: "1px", background: "var(--border)", margin: "8px 12px 12px" }} />
      <div style={{ padding: "0 8px 20px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {!isAdmin && (
          <Link href="/change-password" style={itemStyle(pathname === "/change-password")}>
            <KeyRound size={20} strokeWidth={1.7} />
            {open && <span>Change Password</span>}
          </Link>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: open ? "space-between" : "center", padding: open ? "0 16px" : "0", height: "50px" }}>
          {open && <span style={{ fontSize: "16px", fontWeight: 500, color: "var(--text-2)" }}>{theme === "light" ? "Dark mode" : "Light mode"}</span>}
          <ThemeToggle />
        </div>

        <button
          onClick={handleLogout}
          style={{ ...itemStyle(false), color: "#f87171", justifyContent: open ? "flex-start" : "center", padding: open ? "0 16px" : "0" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(248,113,113,0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <LogOut size={20} strokeWidth={1.7} />
          {open && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}

