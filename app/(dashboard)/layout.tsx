import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "48px 48px", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
