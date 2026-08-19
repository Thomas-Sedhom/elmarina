import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { CheckCircle2, Eye, EyeOff, Inbox, KeyRound, Loader2, LogOut, Menu, Package, Users, X } from "lucide-react";
import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [, navigate] = useLocation();
  const { user, logout, logoutPending } = useAuth({ redirectPath: "/login" });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [location] = useLocation();

  const changePasswordMutation = api.auth.changePassword.useMutation({
    onSuccess: () => {
      setNewPassword("");
      setSuccessMessage(true);
      setTimeout(() => {
        setSuccessMessage(false);
        setPasswordModalOpen(false);
      }, 1500);
    },
  });

  if (user && user.role === "broker") {
    navigate("/portal");
    return <div className="min-h-screen bg-[#f7f4ef]" />;
  }

  if (!user) return <div className="min-h-screen bg-[#f7f4ef]" />;

  const nav = [
    { href: "/admin", label: "جميع العملاء", icon: Users },
    { href: "/admin/products", label: "جميع المنتجات", icon: Package },
    { href: "/admin/requests", label: "طلبات جديدة", icon: Inbox },
  ];

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) return;
    changePasswordMutation.mutate({ newPassword });
  };

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
      <div className="mt-auto rounded-2xl bg-white/5 p-4 space-y-2">
        <div>
          <p className="text-sm font-semibold">{user.name ?? "مدير النظام"}</p>
          <p className="mt-0.5 text-xs text-[#c7b8a8]">مدير النظام</p>
        </div>
        <Button
          type="button"
          onClick={() => setPasswordModalOpen(true)}
          variant="ghost"
          className="w-full justify-start gap-2 px-0 text-xs text-[#c69a5d] hover:bg-transparent hover:text-[#d8ab6d] cursor-pointer"
        >
          <KeyRound size={14} />
          تغيير كلمة المرور
        </Button>
        <Button disabled={logoutPending} onClick={() => logout()} variant="ghost" className="w-full justify-start gap-2 px-0 text-xs text-[#dbcbbb] hover:bg-transparent hover:text-white cursor-pointer">
          <LogOut size={14} />
          تسجيل الخروج
        </Button>
      </div>
    </aside>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f4ef] text-[#201b17]">
      <div className="fixed inset-y-0 right-0 z-40 hidden w-72 lg:block">{sidebar}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="إغلاق القائمة" className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-72">
            {sidebar}
            <button className="absolute left-4 top-5 text-white" onClick={() => setMobileOpen(false)}>
              <X />
            </button>
          </div>
        </div>
      )}
      <div className="lg:pr-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#e5ded4] bg-[#f7f4ef]/90 px-5 backdrop-blur lg:px-10">
          <Button variant="ghost" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu />
          </Button>
          <div className="mr-auto flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPasswordModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border-[#e5ded4] bg-white text-xs font-semibold text-[#201b17] hover:bg-[#faf8f5] shadow-xs cursor-pointer"
            >
              <KeyRound size={13} className="text-[#c69a5d]" />
              <span>تغيير كلمة مرور الإدارة</span>
            </Button>
            <div className="text-right">
              <p className="text-xs text-[#8d7c6a]">مرحبًا بك</p>
              <p className="font-serif text-xl">أهلاً {(user.name ?? "مدير النظام").split(" ")[0]}</p>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-5 lg:p-10">{children}</main>
      </div>

      {/* Admin Change Password Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent dir="rtl" className="bg-white rounded-3xl p-6 border border-[#e5ded4] shadow-2xl sm:max-w-md">
          <DialogHeader className="text-right border-b border-[#f0e9df] pb-3">
            <DialogTitle className="font-serif text-xl font-bold text-[#201b17] flex items-center gap-2">
              <KeyRound size={18} className="text-[#c69a5d]" />
              <span>تغيير كلمة مرور حساب الإدارة</span>
            </DialogTitle>
          </DialogHeader>

          {successMessage ? (
            <div className="py-6 text-center space-y-2">
              <CheckCircle2 size={40} className="mx-auto text-emerald-600" />
              <p className="font-bold text-base text-[#201b17]">تم تغيير كلمة المرور بنجاح!</p>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5 text-right">
                <Label className="text-xs font-semibold text-[#201b17]">كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Input
                    required
                    minLength={8}
                    dir="ltr"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-11 rounded-xl bg-white !border !border-black pl-10 text-sm text-[#201b17] placeholder:text-[#8d7c6a] focus:border-black focus:ring-1 focus:ring-black"
                    style={{ borderColor: "#000000" }}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d7c6a] hover:text-black"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-[#8d7c6a]">8 أحرف أو أرقام على الأقل</p>
              </div>

              {changePasswordMutation.error && (
                <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-100">
                  تعذر تغيير كلمة المرور. يرجى المحاولة مجدداً.
                </div>
              )}

              <Button
                disabled={changePasswordMutation.isPending || newPassword.length < 8}
                className="w-full h-11 rounded-xl bg-[#201b17] text-white hover:bg-[#3a3028] font-bold text-sm shadow-md transition cursor-pointer"
              >
                {changePasswordMutation.isPending ? <Loader2 className="animate-spin" /> : "حفظ كلمة المرور الجديدة"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
