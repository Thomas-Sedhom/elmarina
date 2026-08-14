import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Users, X } from "lucide-react";
import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout, logoutPending } = useAuth({ redirectPath: "/login" });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  if (!user) return <div className="min-h-screen bg-[#f7f4ef]" />;

  const nav = [{ href: "/admin", label: "جميع العملاء", icon: Users }];
  const sidebar = (
    <aside className="flex h-full flex-col bg-[#201b17] p-5 text-[#f9f2e7]">
      <div className="mb-10 flex items-center gap-3 border-b border-white/10 pb-6">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#c69a5d] text-lg font-black text-[#201b17]">ذ</div>
        <div><p className="font-serif text-lg">ورشة سيدهم</p><p className="text-xs text-[#c7b8a8]">إدارة حسابات الذهب</p></div>
      </div>
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#a99783]">لوحة التحكم</p>
      <nav className="space-y-2">
        {nav.map(item => {
          const Icon = item.icon;
          const active = location === item.href;
          return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${active ? "bg-[#c69a5d] font-bold text-[#201b17]" : "text-[#dbcbbb] hover:bg-white/10"}`}><Icon size={18} />{item.label}</Link>;
        })}
      </nav>
      <div className="mt-auto rounded-2xl bg-white/5 p-4">
        <p className="text-sm font-semibold">{user.name ?? "مدير النظام"}</p><p className="mt-1 text-xs text-[#c7b8a8]">مدير النظام</p>
        <Button disabled={logoutPending} onClick={() => logout()} variant="ghost" className="mt-4 w-full justify-start gap-2 px-0 text-[#dbcbbb] hover:bg-transparent hover:text-white"><LogOut size={16} />تسجيل الخروج</Button>
      </div>
    </aside>
  );

  return <div dir="rtl" className="min-h-screen bg-[#f7f4ef] text-[#201b17]">
    <div className="fixed inset-y-0 right-0 z-40 hidden w-72 lg:block">{sidebar}</div>
    {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="إغلاق القائمة" className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} /><div className="relative h-full w-72">{sidebar}<button className="absolute left-4 top-5 text-white" onClick={() => setMobileOpen(false)}><X /></button></div></div>}
    <div className="lg:pr-72"><header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#e5ded4] bg-[#f7f4ef]/90 px-5 backdrop-blur lg:px-10"><Button variant="ghost" className="lg:hidden" onClick={() => setMobileOpen(true)}><Menu /></Button><div className="mr-auto text-right"><p className="text-xs text-[#8d7c6a]">مرحبًا بك</p><p className="font-serif text-xl">أهلاً {(user.name ?? "مدير النظام").split(" ")[0]}</p></div></header><main className="mx-auto max-w-7xl p-5 lg:p-10">{children}</main></div>
  </div>;
}
