'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, History, GraduationCap } from 'lucide-react';

export default function NavigationLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'History',
      href: '/history',
      icon: History,
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-200 bg-white shadow-sm">
        {/* Sidebar Header */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
          <GraduationCap className="h-5 w-5 text-slate-900" />
          <span className="text-sm font-semibold tracking-tight text-slate-900 uppercase">
            Control Center
          </span>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50/50">
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="h-8 w-8 rounded-md bg-slate-900 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              RE
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">Recruitment Assessor</p>
              <p className="text-[10px] text-slate-500 font-medium">Evaluation Platform</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center border-b border-slate-200 bg-white px-8 shadow-sm">
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              {pathname === '/' ? 'Dashboard Control Center' : pathname === '/history' ? 'Saved Data History' : 'Session View'}
            </h1>
            <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Enterprise Pipeline Active
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
