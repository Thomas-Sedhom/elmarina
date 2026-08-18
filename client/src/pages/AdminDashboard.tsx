import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { ArrowLeft, Eye, EyeOff, Loader2, Plus, Search, UserPlus, Users, Weight } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", password: "" });
  const brokers = api.brokers.list.useQuery({ search }, { staleTime: 10_000 });
  const create = api.brokers.create.useMutation({
    onSuccess: () => {
      setOpen(false);
      setForm({ name: "", phone: "", password: "" });
      brokers.refetch();
    },
  });
  const toggleBlock = api.brokers.toggleBlock.useMutation({
    onSuccess: () => {
      brokers.refetch();
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-bold text-[#ad7d3f]">إدارة الحسابات</p>
            <h1 className="font-serif text-4xl">جميع العملاء</h1>
            <p className="mt-2 text-[#8d7c6a]">تابع حسابات الأبونيهات وحركاتهم من مكان واحد.</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-[#201b17] text-white hover:bg-[#3a3028] shadow-md transition">
                <Plus size={18} className="ml-2" />
                إضافة أبونيه
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="bg-white rounded-2xl sm:max-w-md p-6 border border-[#e5ded4] shadow-2xl">
              <DialogHeader className="text-right border-b border-[#eee7de] pb-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7f0e7] text-[#ad7d3f]">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <DialogTitle className="font-serif text-2xl text-[#201b17]">إضافة أبونيه جديد</DialogTitle>
                    <p className="text-xs text-[#8d7c6a] mt-0.5">أنشئ حساباً جديداً للأبونيه للبدء بتسجيل الحركات</p>
                  </div>
                </div>
              </DialogHeader>

              <form
                className="space-y-4 pt-2"
                onSubmit={e => {
                  e.preventDefault();
                  create.mutate(form);
                }}
              >
                <div className="space-y-1.5 text-right">
                  <Label className="text-xs font-semibold text-[#201b17]">اسم الأبونيه</Label>
                  <Input
                    required
                    placeholder="مثال: ورشة الأهرام"
                    className="h-11 rounded-xl bg-white !border !border-black text-sm text-[#201b17] placeholder:text-[#8d7c6a] focus:border-black focus:ring-1 focus:ring-black"
                    style={{ borderColor: "#000000" }}
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <Label className="text-xs font-semibold text-[#201b17]">رقم الهاتف (اسم المستخدم)</Label>
                  <Input
                    required
                    dir="ltr"
                    inputMode="tel"
                    placeholder="01012345678"
                    className="h-11 rounded-xl bg-white !border !border-black text-sm text-[#201b17] placeholder:text-[#8d7c6a] focus:border-black focus:ring-1 focus:ring-black font-sans-num"
                    style={{ borderColor: "#000000" }}
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <Label className="text-xs font-semibold text-[#201b17]">كلمة المرور</Label>
                  <Input
                    required
                    minLength={8}
                    dir="ltr"
                    type="password"
                    placeholder="••••••••"
                    className="h-11 rounded-xl bg-white !border !border-black text-sm text-[#201b17] placeholder:text-[#8d7c6a] focus:border-black focus:ring-1 focus:ring-black"
                    style={{ borderColor: "#000000" }}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                  <p className="text-[11px] text-[#8d7c6a]">8 أحرف أو أرقام على الأقل</p>
                </div>

                {create.error && (
                  <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-100">
                    تعذر إنشاء الحساب. تأكد أن رقم الهاتف غير مسجل مسبقاً.
                  </div>
                )}

                <Button
                  disabled={create.isPending}
                  className="w-full h-11 rounded-xl bg-[#ad7d3f] text-white hover:bg-[#94662f] font-semibold text-sm shadow-md transition mt-2"
                >
                  {create.isPending ? <Loader2 className="animate-spin" /> : "حفظ وإنشاء الحساب"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e5ded4] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-[#8d7c6a]">عدد الأبونيهات</span>
              <Users size={19} className="text-[#ad7d3f]" />
            </div>
            <p className="font-sans-num font-bold text-3xl tracking-tight text-[#201b17]">{brokers.data?.length ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-[#e5ded4] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-[#8d7c6a]">إجمالي الوزن</span>
              <Weight size={19} className="text-[#ad7d3f]" />
            </div>
            <p className="font-sans-num font-bold text-3xl tracking-tight text-[#201b17]">
              {brokers.data?.reduce((sum, b) => sum + Number(b.totalWeight), 0).toFixed(3)}{" "}
              <span className="text-sm font-normal font-sans text-[#8d7c6a]">جرام</span>
            </p>
          </div>
          <div className="rounded-2xl border border-[#e5ded4] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-[#8d7c6a]">إجمالي النقدية</span>
              <span className="text-lg text-[#ad7d3f]">ج.م</span>
            </div>
            <p className="font-sans-num font-bold text-3xl tracking-tight text-[#201b17]">
              {brokers.data?.reduce((sum, b) => sum + Number(b.totalCash), 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e5ded4] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#eee7de] p-5">
            <div>
              <h2 className="font-serif text-xl">حسابات الأبونيهات</h2>
              <p className="mt-1 text-sm text-[#8d7c6a]">اختر حساباً لعرض دفتر الشغل.</p>
            </div>
            <div className="relative w-64">
              <Search className="absolute right-3 top-2.5 text-[#a18f7d]" size={17} />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الهاتف"
                className="pr-9 rounded-xl bg-[#faf8f5] border-[#e2d9cd]"
              />
            </div>
          </div>

          {brokers.isLoading ? (
            <div className="flex justify-center p-14">
              <Loader2 className="animate-spin text-[#ad7d3f]" />
            </div>
          ) : brokers.error ? (
            <div className="p-14 text-center">
              <p className="font-serif text-xl">تعذر تحميل الحسابات</p>
              <p className="mt-2 text-sm text-red-600">تحقق من الاتصال ثم حاول مرة أخرى.</p>
              <Button variant="outline" className="mt-5 rounded-xl" onClick={() => brokers.refetch()}>
                إعادة المحاولة
              </Button>
            </div>
          ) : brokers.data?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-[#fcfaf7] text-xs text-[#8d7c6a]">
                  <tr>
                    <th className="px-5 py-4 font-medium">الاسم</th>
                    <th className="px-5 py-4 font-medium">رقم الهاتف</th>
                    <th className="px-5 py-4 font-medium">إجمالي الوزن</th>
                    <th className="px-5 py-4 font-medium">إجمالي النقدية</th>
                    <th className="px-5 py-4 font-medium text-center">رؤية الحساب</th>
                    <th className="px-5 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {brokers.data.map(b => (
                    <tr key={b.id} className="border-t border-[#eee7de] transition hover:bg-[#fcfaf7]">
                      <td className="px-5 py-4 font-semibold">{b.name}</td>
                      <td className="px-5 py-4 text-left font-sans-num" dir="ltr">
                        {b.phone}
                      </td>
                      <td className="px-5 py-4 font-sans-num font-bold">{Number(b.totalWeight).toFixed(3)} <span className="font-normal font-sans text-xs text-[#8d7c6a]">جم</span></td>
                      <td className="px-5 py-4 font-sans-num font-bold">{Number(b.totalCash).toFixed(2)} <span className="font-normal font-sans text-xs text-[#8d7c6a]">ج.م</span></td>
                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          disabled={toggleBlock.isPending}
                          onClick={() => toggleBlock.mutate({ id: b.id, isBlocked: !b.isBlocked })}
                          title={b.isBlocked ? "الحساب محظور من رؤية الأرقام - اضغط للإظهار" : "الحساب يرى أرقامه - اضغط للإخفاء"}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition border cursor-pointer ${
                            b.isBlocked
                              ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          {b.isBlocked ? (
                            <>
                              <EyeOff size={13} className="text-rose-600" />
                              <span>محظور (مخفي)</span>
                            </>
                          ) : (
                            <>
                              <Eye size={13} className="text-emerald-600" />
                              <span>مفعل (ظاهر)</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-left">
                        <Link href={`/admin/brokers/${b.id}`} className="inline-flex items-center gap-1 font-bold text-[#ad7d3f] hover:text-[#8e622b]">
                          فتح الحساب <ArrowLeft size={15} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-14 text-center">
              <p className="font-serif text-xl">لا توجد حسابات بعد</p>
              <p className="mt-2 text-sm text-[#8d7c6a]">ابدأ بإضافة أول أبونيه إلى النظام.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
