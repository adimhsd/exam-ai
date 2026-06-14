"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

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
    <>
      <header className="sticky top-0 z-40 bg-surface border-b border-border-subtle flex justify-between items-center h-16 px-margin-mobile lg:px-margin-desktop w-full shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="lg:hidden p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all flex items-center justify-center cursor-pointer"
            title="Menu Utama"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h2 className="font-display text-headline-sm lg:text-headline-md font-bold text-primary truncate max-w-[180px] sm:max-w-none">{title}</h2>
        </div>
      </header>

      {/* Mobile Menu Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          ></div>
          
          {/* Drawer Panel */}
          <aside className="fixed top-0 left-0 bottom-0 w-64 bg-background flex flex-col py-margin-mobile px-4 border-r border-border-subtle z-55 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex justify-between items-center mb-8 px-2">
              <div>
                <h1 className="font-display text-headline-md font-extrabold text-primary tracking-tight">exam-ai</h1>
                <p className="text-on-surface-variant font-sans text-xs opacity-70 uppercase tracking-widest">Penilaian Akademik</p>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="p-1.5 hover:bg-surface-container-low rounded-full text-on-surface-variant"
                title="Tutup Menu"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            
            <nav className="flex-grow space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 transition-all cursor-pointer group rounded ${
                      isActive
                        ? "font-bold border-l-4 border-primary text-primary bg-surface-container pl-2"
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
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-status-failed hover:bg-status-failed/10 rounded transition-all font-sans text-body-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                <span>Keluar Sesi</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
