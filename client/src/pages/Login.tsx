import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { ArrowLeft, Gem, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const login = api.auth.login.useMutation({ onSuccess: () => navigate("/admin") });

  useEffect(() => { if (!loading && user) navigate("/admin"); }, [loading, navigate, user]);

  return <main dir="rtl" className="min-h-screen bg-[#f7f4ef] text-[#201b17]">
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-[#201b17] lg:block" dir="ltr">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(198,154,93,.35),transparent_32%),radial-gradient(circle_at_85%_80%,rgba(198,154,93,.18),transparent_30%)]" />
        <div className="absolute left-[13%] top-[18%] h-72 w-72 rounded-full border border-[#c69a5d]/40" /><div className="absolute left-[20%] top-[25%] h-56 w-56 rounded-full border border-[#c69a5d]/30" />
        <div className="relative flex h-full flex-col justify-between p-14 text-[#f9f2e7]"><div><div className="mb-6 flex items-center gap-3"><Gem className="text-[#c69a5d]" /><span className="font-serif text-xl">Elmarina</span></div><div className="max-w-md"><p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-[#c69a5d]">Gold Workshop Ledger</p><h1 className="font-serif text-6xl leading-[1.05]">دفترٌ واحد،<br /><span className="text-[#c69a5d]">حسابٌ أوضح.</span></h1><p className="mt-8 max-w-sm text-lg leading-8 text-[#d6c8b8]">نظام أنيق وعملي لتنظيم حسابات الأبونيهات وحركات الورشة اليومية.</p></div></div><div className="flex items-center gap-3 text-sm text-[#c7b8a8]"><ShieldCheck size={18} className="text-[#c69a5d]" />بياناتك محفوظة بجلسة آمنة</div></div>
      </section>
      <section className="flex items-center justify-center p-6 sm:p-12"><div className="w-full max-w-md"><div className="mb-12 lg:hidden"><div className="mb-5 flex items-center gap-3"><Gem className="text-[#ad7d3f]" /><span className="font-serif text-xl">Elmarina</span></div><p className="text-sm text-[#8d7c6a]">إدارة ورشة الذهب بوضوح وهدوء.</p></div><div className="mb-9"><p className="mb-3 text-sm font-bold text-[#ad7d3f]">مرحبًا بعودتك</p><h2 className="font-serif text-4xl">تسجيل الدخول</h2><p className="mt-3 text-[#8d7c6a]">أدخل بياناتك للوصول إلى لوحة التحكم.</p></div><form className="space-y-5" onSubmit={e => { e.preventDefault(); login.mutate({ phone, password }); }}><div className="space-y-2"><Label htmlFor="phone">رقم الهاتف</Label><Input id="phone" dir="ltr" inputMode="tel" placeholder="01023999511" value={phone} onChange={e => setPhone(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="password">كلمة المرور</Label><Input id="password" dir="ltr" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} /></div>{login.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">رقم الهاتف أو كلمة المرور غير صحيحة.</p>}<Button disabled={login.isPending} className="h-12 w-full rounded-xl bg-[#201b17] text-base text-white hover:bg-[#3a3028]">{login.isPending ? <Loader2 className="animate-spin" /> : <>دخول إلى لوحة التحكم <ArrowLeft className="mr-2" size={18} /></>}</Button></form><p className="mt-10 text-center text-xs text-[#a18f7d]">هذه المنصة مخصصة لإدارة حسابات الورشة الداخلية.</p></div></section>
    </div>
  </main>;
}
