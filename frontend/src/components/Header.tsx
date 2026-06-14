"use client";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-border-subtle flex justify-between items-center h-16 px-margin-desktop w-full shadow-sm">
      <div className="flex items-center gap-4">
        <h2 className="font-display text-headline-md font-bold text-primary">{title}</h2>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative hidden lg:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            className="pl-10 pr-4 py-1.5 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="Cari penilaian/ujian..."
            type="text"
          />
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-status-failed rounded-full border-2 border-surface"></span>
          </button>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}
