"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, ChatCircleText, Gear, House, SignOut, User as UserIcon } from "@phosphor-icons/react";
import SpecularContainer from "@/components/SpecularContainer";
import { AuthProvider, useAuth } from "@/context/AuthContext";

const navItems = [
  { name: "Overview", href: "/admin", icon: House },
  { name: "Setup Interview", href: "/admin/setup", icon: Briefcase },
  { name: "Candidates", href: "/admin/candidates", icon: ChatCircleText },
  { name: "Settings", href: "/admin/settings", icon: Gear },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // If on login page, render full screen without sidebar frame
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen w-full bg-[#050505] overflow-hidden text-white">
      {/* Sidebar */}
      <SpecularContainer
        radius={0}
        tintOpacity={0.01}
        className="w-64 h-full shrink-0 border-r border-white/10 glass-panel"
        contentClassName="flex flex-col h-full py-6 px-4"
      >
        <div className="mb-8 px-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg glass-panel flex items-center justify-center overflow-hidden border border-white/10 bg-white/5 p-1 shrink-0">
            <img src="/favicon.ico" alt="Conlatus" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">
            Conlatus Admin
          </h2>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ease-fluid ${isActive
                    ? "bg-violet-600/20 text-white border border-violet-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                  }`}
              >
                <Icon size={18} weight={isActive ? "fill" : "light"} />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="mt-auto pt-4 border-t border-white/10 px-2 space-y-3">
          {user && (
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-7 h-7 rounded-full bg-purple-600/30 border border-purple-400/30 flex items-center justify-center text-xs font-semibold text-purple-300 shrink-0">
                  {user.full_name ? user.full_name[0].toUpperCase() : "U"}
                </div>
                <div className="truncate text-xs">
                  <p className="font-medium text-white/90 truncate">{user.full_name}</p>
                  <p className="text-white/40 text-[10px] truncate capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={() => logout()}
                title="Logout"
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <SignOut size={16} />
              </button>
            </div>
          )}
          <p className="text-[10px] text-white/30 px-2">Conlatus AI v0.2.0</p>
        </div>
      </SpecularContainer>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto relative">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 via-[#111]/30 to-transparent opacity-80 pointer-events-none" />
        <div className="relative z-10 h-full p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AuthProvider>
  );
}
