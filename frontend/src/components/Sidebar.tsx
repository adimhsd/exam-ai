"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "AS";

  const userRoleLabel = user?.role === "admin" ? "Admin Utama" : "Dosen";
 
  const menuItems = [
    { name: "Dasbor", href: "/", icon: "dashboard" },
    { name: "Mata Kuliah & Ujian", href: "/courses", icon: "school" },
  ];
 
  return (
    <aside className="hidden lg:flex w-sidebar-width h-screen fixed left-0 top-0 bg-background flex flex-col py-margin-desktop px-4 border-r border-border-subtle z-50">
      <div className="mb-10 px-2">
        <h1 className="font-display text-headline-md font-extrabold text-primary tracking-tight">exam-ai</h1>
        <p className="text-on-surface-variant font-sans text-xs opacity-70 uppercase tracking-widest">Penilaian Akademik</p>
      </div>
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 transition-all cursor-pointer group rounded ${
                isActive
                  ? "font-bold border-r-4 border-primary text-primary bg-surface-container"
                  : "text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className="font-sans text-body-md">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="pt-4 border-t border-border-subtle flex flex-col gap-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-primary-fixed-dim text-on-primary-fixed flex items-center justify-center font-bold text-xs shrink-0">
            {userInitials}
          </div>
          <div className="overflow-hidden">
            <p className="font-sans text-body-sm font-semibold truncate">{user?.name || "Dr. Aris Setiawan"}</p>
            <p className="text-[10px] text-on-surface-variant truncate uppercase tracking-widest">{userRoleLabel}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 text-status-failed hover:bg-status-failed/10 rounded transition-all font-sans text-body-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <span>Keluar Sesi</span>
        </button>
      </div>
    </aside>
  );
}
