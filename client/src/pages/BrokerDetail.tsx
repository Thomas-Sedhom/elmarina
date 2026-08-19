import DashboardLayout from "@/components/DashboardLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { ArrowRight, CheckCircle2, Edit3, Eye, EyeOff, FileSpreadsheet, KeyRound, Loader2, Plus, Trash2, Wallet, Weight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";

type FormState = {
  id?: string;
  businessDate: string;
  weight: string;
  description: string;
  cash: string;
  notes: string;
  type: "work" | "breakage";
};

const emptyForm = (): FormState => ({
  businessDate: new Date().toISOString().slice(0, 10),
  weight: "",
  description: "",
  cash: "",
  notes: "",
  type: "work",
});

export default function BrokerDetail() {
  const [, params] = useRoute("/admin/brokers/:id");
  const [, navigate] = useLocation();
  const id = params?.id || "";
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const utils = api.useUtils();
  const account = api.brokers.get.useQuery({ id }, { enabled: Boolean(id) });
  const entries = api.entries.list.useQuery({ brokerAccountId: id }, { enabled: Boolean(id) });

  const create = api.entries.create.useMutation({
    onSuccess: () => {
      setFormOpen(false);
      utils.brokers.get.invalidate({ id });
      utils.entries.list.invalidate({ brokerAccountId: id });
    },
  });

  const update = api.entries.update.useMutation({
    onSuccess: () => {
      setFormOpen(false);
      utils.brokers.get.invalidate({ id });
      utils.entries.list.invalidate({ brokerAccountId: id });
    },
  });

  const remove = api.entries.delete.useMutation({
    onSuccess: () => {
      setDeleteId(null);
      utils.brokers.get.invalidate({ id });
      utils.entries.list.invalidate({ brokerAccountId: id });
    },
  });

  const toggleBlock = api.brokers.toggleBlock.useMutation({
    onSuccess: () => {
      utils.brokers.get.invalidate({ id });
    },
  });

  const deleteBroker = api.brokers.delete.useMutation({
    onSuccess: () => {
      utils.brokers.list.invalidate();
      navigate("/admin");
    },
  });

  const updatePasswordMutation = api.brokers.updatePassword.useMutation({
    onSuccess: () => {
      setNewPassword("");
      setPasswordSuccess(true);
      setTimeout(() => {
        setPasswordSuccess(false);
        setPasswordModalOpen(false);
      }, 1500);
    },
  });

  const loading = account.isLoading || entries.isLoading;
  const mutationError = create.error || update.error;
  const totalEntries = useMemo(() => entries.data?.length ?? 0, [entries.data]);

  const openAdd = () => {
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (entry: NonNullable<typeof entries.data>[number]) =>
    setForm({
      id: entry.id,
      businessDate: new Date(entry.businessDate).toISOString().slice(0, 10),
      weight: String(entry.weight),
      description: entry.description,
      cash: String(entry.cash),
      notes: entry.notes ?? "",
      type: entry.type,
    });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const input = {
      brokerAccountId: id,
      businessDate: new Date(`${form.businessDate}T00:00:00.000Z`).toISOString(),
      weight: form.weight,
      description: form.description,
      cash: form.cash,
      notes: form.notes || null,
      type: form.type,
    };
    if (form.id) update.mutate({ ...input, id: form.id });
    else create.mutate(input);
  };

  return (
    <DashboardLayout>
      <div className="space-y-7">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-[#ad7d3f] transition hover:text-[#94662f]">
          <ArrowRight size={17} />
          العودة إلى جميع العملاء
        </Link>

        {loading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="animate-spin text-[#ad7d3f]" />
          </div>
        ) : account.error || entries.error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-10 text-center">
            <p className="font-serif text-xl text-red-800">تعذر تحميل حساب الأبونيه</p>
            <p className="mt-2 text-sm text-red-700">تحقق من الاتصال أو صلاحيات الحساب ثم حاول مرة أخرى.</p>
            <Button
              variant="outline"
              className="mt-5 rounded-xl"
              onClick={() => {
                account.refetch();
                entries.refetch();
              }}
            >
              إعادة المحاولة
            </Button>
          </div>
        ) : (
          account.data && (
            <>
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-bold text-[#ad7d3f]">حساب الأبونيه</p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        account.data.isBlocked
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {account.data.isBlocked ? (
                        <>
                          <EyeOff size={12} />
                          <span>رؤية الأرقام محظورة</span>
                        </>
                      ) : (
                        <>
                          <Eye size={12} />
                          <span>رؤية الأرقام مفعلة</span>
                        </>
                      )}
                    </span>
                  </div>
                  <h1 className="font-serif text-4xl">{account.data.name}</h1>
                  <p className="mt-2 text-left text-[#8d7c6a] font-sans-num" dir="ltr">
                    {account.data.phone}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={toggleBlock.isPending}
                    onClick={() => toggleBlock.mutate({ id: account.data!.id, isBlocked: !account.data!.isBlocked })}
                    className={`h-11 rounded-xl font-bold text-xs gap-1.5 transition cursor-pointer ${
                      account.data.isBlocked
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        : "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"
                    }`}
                  >
                    {account.data.isBlocked ? (
                      <>
                        <Eye size={15} className="text-emerald-700" />
                        <span>إلغاء الحظر (إظهار الأرقام للأبونيه)</span>
                      </>
                    ) : (
                      <>
                        <EyeOff size={15} className="text-rose-700" />
                        <span>حظر الحساب (إخفاء الأرقام بالأبونيه)</span>
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPasswordModalOpen(true)}
                    className="h-11 rounded-xl border-[#e5ded4] bg-white text-[#201b17] hover:bg-[#faf8f5] font-bold text-xs gap-1.5 transition cursor-pointer"
                  >
                    <KeyRound size={15} className="text-[#c69a5d]" />
                    <span>تغيير كلمة المرور</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDeleteAccountOpen(true)}
                    className="h-11 rounded-xl border-red-200 bg-red-50/90 text-red-700 hover:bg-red-100 hover:border-red-300 font-bold text-xs gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 size={15} className="text-red-600" />
                    <span>حذف الحساب</span>
                  </Button>
                  <Button onClick={openAdd} className="h-11 rounded-xl bg-[#201b17] text-white hover:bg-[#3a3028] shadow-md transition font-bold text-sm cursor-pointer">
                    <Plus size={18} className="ml-1.5" />
                    إضافة حركة
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#201b17] p-6 text-[#f9f2e7] shadow-lg">
                  <div className="mb-8 flex items-center justify-between">
                    <span className="text-sm text-[#c7b8a8]">إجمالي الوزن</span>
                    <Weight className="text-[#c69a5d]" size={21} />
                  </div>
                  <p className="font-sans-num font-bold text-4xl tracking-tight text-[#f9f2e7]">
                    {Number(account.data.totalWeight).toFixed(3)}{" "}
                    <span className="font-sans text-base font-normal text-[#c7b8a8]">جرام</span>
                  </p>
                </div>
                <div className="rounded-2xl bg-[#c69a5d] p-6 text-[#201b17] shadow-lg">
                  <div className="mb-8 flex items-center justify-between">
                    <span className="text-sm text-[#5c452b]">إجمالي النقدية</span>
                    <Wallet className="text-[#201b17]" size={21} />
                  </div>
                  <p className="font-sans-num font-bold text-4xl tracking-tight text-[#201b17]">
                    {Number(account.data.totalCash).toFixed(2)}{" "}
                    <span className="font-sans text-base font-normal text-[#5c452b]">ج.م</span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#e5ded4] bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-[#eee7de] p-5">
                  <div>
                    <h2 className="font-serif text-xl">دفتر الشغل</h2>
                    <p className="mt-1 text-sm text-[#8d7c6a]">{totalEntries} حركة مسجلة</p>
                  </div>
                  <span className="rounded-full bg-[#f7f0e7] px-3 py-1 text-xs font-bold text-[#ad7d3f]">شغل ورشة</span>
                </div>

                {entries.data?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-right text-sm">
                      <thead className="bg-[#fcfaf7] text-xs text-[#8d7c6a]">
                        <tr>
                          <th className="px-5 py-4">التاريخ</th>
                          <th className="px-5 py-4">الوزن</th>
                          <th className="px-5 py-4">الشغل</th>
                          <th className="px-5 py-4">النقدية</th>
                          <th className="px-5 py-4">ملاحظات</th>
                          <th className="px-5 py-4">النوع</th>
                          <th className="px-5 py-4">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.data.map(entry => {
                          const isBreakage = entry.type === "breakage";
                          return (
                            <tr
                              key={entry.id}
                              className={`border-t transition ${
                                isBreakage
                                  ? "bg-rose-50/70 border-rose-100 hover:bg-rose-100/70 text-rose-950"
                                  : "border-[#eee7de] hover:bg-[#fcfaf7]"
                              }`}
                            >
                              <td className="px-5 py-4">{new Date(entry.businessDate).toLocaleDateString("ar-EG")}</td>
                              <td className={`px-5 py-4 font-semibold ${isBreakage ? "text-rose-700" : ""}`}>
                                {isBreakage ? `-${Number(entry.weight).toFixed(3)}` : Number(entry.weight).toFixed(3)}
                              </td>
                              <td className="px-5 py-4 font-medium">{entry.description}</td>
                              <td className={`px-5 py-4 ${isBreakage ? "text-rose-700 font-medium" : ""}`}>
                                {isBreakage ? `-${Number(entry.cash).toFixed(2)}` : Number(entry.cash).toFixed(2)} ج.م
                              </td>
                              <td className={`max-w-[180px] truncate px-5 py-4 ${isBreakage ? "text-rose-800/80" : "text-[#8d7c6a]"}`}>
                                {entry.notes || "—"}
                              </td>
                              <td className="px-5 py-4">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    isBreakage
                                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  }`}
                                >
                                  {isBreakage ? "كسر (-)" : "شغل (+)"}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    aria-label="تعديل"
                                    className="h-8 w-8 rounded-lg border border-[#e2d9cd] bg-white text-[#5c4d3e] hover:bg-[#f7f0e7] hover:border-[#ad7d3f] hover:text-[#ad7d3f] cursor-pointer shadow-xs transition"
                                    onClick={() => {
                                      openEdit(entry);
                                      setFormOpen(true);
                                    }}
                                  >
                                    <Edit3 size={15} />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    aria-label="حذف"
                                    className="h-8 w-8 rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 cursor-pointer shadow-xs transition"
                                    onClick={() => setDeleteId(entry.id)}
                                  >
                                    <Trash2 size={15} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-14 text-center">
                    <p className="font-serif text-xl">الدفتر فارغ</p>
                    <p className="mt-2 text-sm text-[#8d7c6a]">أضف أول حركة لهذا الحساب لبدء المتابعة.</p>
                    <Button onClick={openAdd} variant="outline" className="mt-5 rounded-xl">
                      إضافة أول حركة
                    </Button>
                  </div>
                )}
              </div>
            </>
          )
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent dir="rtl" className="bg-white rounded-2xl sm:max-w-lg p-6 border border-[#e5ded4] shadow-2xl">
          <DialogHeader className="text-right border-b border-[#eee7de] pb-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7f0e7] text-[#ad7d3f]">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <DialogTitle className="font-serif text-2xl text-[#201b17]">
                  {form.id ? "تعديل الحركة" : "إضافة حركة جديدة"}
                </DialogTitle>
                <p className="text-xs text-[#8d7c6a] mt-0.5">
                  {form.id ? "تعديل بيانات حركة مسجلة مسبقاً في الدفتر" : "تسجيل حركة شغل أو كسر جديدة في حساب الأبونيه"}
                </p>
              </div>
            </div>
          </DialogHeader>

          <form className="grid gap-4 sm:grid-cols-2 pt-2" onSubmit={submit}>
            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-semibold text-[#201b17]">التاريخ</Label>
              <Input
                required
                type="date"
                className="h-11 rounded-xl bg-white !border !border-black text-sm text-[#201b17] focus:border-black focus:ring-1 focus:ring-black font-sans-num"
                style={{ borderColor: "#000000" }}
                value={form.businessDate}
                onChange={e => setForm({ ...form, businessDate: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-semibold text-[#201b17]">نوع الحركة</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["work", "breakage"] as const).map(type => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setForm({ ...form, type })}
                    className={`h-11 rounded-xl border-2 text-sm font-bold transition cursor-pointer ${
                      form.type === type
                        ? type === "work"
                          ? "border-black bg-[#201b17] text-white shadow-xs"
                          : "border-black bg-rose-600 text-white shadow-xs"
                        : "border-black bg-white text-[#201b17] hover:bg-[#faf8f5]"
                    }`}
                    style={{ borderColor: "#000000" }}
                  >
                    {type === "work" ? "شغل (+)" : "كسر (-)"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-semibold text-[#201b17]">الوزن بالجرام</Label>
              <Input
                required
                min="0"
                step="0.001"
                type="number"
                dir="ltr"
                placeholder="0.000"
                className="h-11 rounded-xl bg-white !border !border-black text-sm text-[#201b17] placeholder:text-[#8d7c6a] focus:border-black focus:ring-1 focus:ring-black font-sans-num"
                style={{ borderColor: "#000000" }}
                value={form.weight}
                onChange={e => setForm({ ...form, weight: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-semibold text-[#201b17]">النقدية (ج.م)</Label>
              <Input
                required
                min="0"
                step="0.01"
                type="number"
                dir="ltr"
                placeholder="0.00"
                className="h-11 rounded-xl bg-white !border !border-black text-sm text-[#201b17] placeholder:text-[#8d7c6a] focus:border-black focus:ring-1 focus:ring-black font-sans-num"
                style={{ borderColor: "#000000" }}
                value={form.cash}
                onChange={e => setForm({ ...form, cash: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2 text-right">
              <Label className="text-xs font-semibold text-[#201b17]">وصف الشغل (اختياري)</Label>
              <Input
                placeholder="مثال: غوايش عيار 21 / كسر خاتم (اختياري)"
                className="h-11 rounded-xl bg-white !border !border-black text-sm text-[#201b17] placeholder:text-[#8d7c6a] focus:border-black focus:ring-1 focus:ring-black"
                style={{ borderColor: "#000000" }}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2 text-right">
              <Label className="text-xs font-semibold text-[#201b17]">ملاحظات (اختياري)</Label>
              <Textarea
                placeholder="أية تفاصيل أو ملاحظات إضافية..."
                className="rounded-xl bg-white !border !border-black text-sm text-[#201b17] placeholder:text-[#8d7c6a] focus:border-black focus:ring-1 focus:ring-black min-h-[70px]"
                style={{ borderColor: "#000000" }}
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            {mutationError && (
              <div className="sm:col-span-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-100">
                تعذر حفظ الحركة. راجع البيانات وحاول مرة أخرى.
              </div>
            )}

            <Button
              disabled={create.isPending || update.isPending}
              className="sm:col-span-2 h-11 rounded-xl bg-[#201b17] text-white hover:bg-[#3a3028] font-semibold text-sm shadow-md transition mt-2"
            >
              {create.isPending || update.isPending ? <Loader2 className="animate-spin" /> : "حفظ الحركة"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent dir="rtl" className="bg-white rounded-2xl p-6 border border-[#e5ded4] shadow-2xl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle className="font-serif text-2xl text-[#201b17]">حذف الحركة؟</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#8d7c6a] mt-2">
              سيتم حذف الحركة وعكس تأثيرها على إجمالي الوزن والنقدية في الحساب. لا يمكن التراجع عن هذه العملية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:justify-start mt-4">
            <AlertDialogCancel className="rounded-xl border-[#e2d9cd] hover:bg-[#faf8f5]">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.isPending}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm"
              onClick={() => deleteId && remove.mutate({ id: deleteId })}
            >
              {remove.isPending ? <Loader2 className="animate-spin" /> : "تأكيد الحذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <AlertDialogContent dir="rtl" className="bg-white rounded-2xl p-6 border border-[#e5ded4] shadow-2xl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle className="font-serif text-2xl text-[#201b17]">حذف حساب الأبونيه؟</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#8d7c6a] mt-2 leading-relaxed">
              هل أنت متأكد من حذف حساب الأبونيه ({account.data?.name})؟ سيتم حذف الحساب بشكل مؤقت (Soft Delete) وإخفاؤه من قائمة العملاء النشطين.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:justify-start mt-4">
            <AlertDialogCancel className="rounded-xl border-[#e2d9cd] hover:bg-[#faf8f5]">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteBroker.isPending}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm font-semibold"
              onClick={() => deleteBroker.mutate({ id })}
            >
              {deleteBroker.isPending ? <Loader2 className="animate-spin" /> : "تأكيد حذف الحساب"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Broker Change Password Dialog */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent dir="rtl" className="bg-white rounded-3xl p-6 border border-[#e5ded4] shadow-2xl sm:max-w-md">
          <DialogHeader className="text-right border-b border-[#f0e9df] pb-3">
            <DialogTitle className="font-serif text-xl font-bold text-[#201b17] flex items-center gap-2">
              <KeyRound size={18} className="text-[#c69a5d]" />
              <span>تغيير كلمة مرور ({account.data?.name})</span>
            </DialogTitle>
          </DialogHeader>

          {passwordSuccess ? (
            <div className="py-6 text-center space-y-2">
              <CheckCircle2 size={40} className="mx-auto text-emerald-600" />
              <p className="font-bold text-base text-[#201b17]">تم تغيير كلمة المرور بنجاح!</p>
            </div>
          ) : (
            <form
              onSubmit={e => {
                e.preventDefault();
                if (newPassword.length < 8) return;
                updatePasswordMutation.mutate({ id, newPassword });
              }}
              className="space-y-4 pt-2"
            >
              <div className="space-y-1.5 text-right">
                <Label className="text-xs font-semibold text-[#201b17]">كلمة المرور الجديدة للأبونيه</Label>
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d7c6a] hover:text-black cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-[#8d7c6a]">8 أحرف أو أرقام على الأقل</p>
              </div>

              {updatePasswordMutation.error && (
                <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-100">
                  تعذر تغيير كلمة المرور. يرجى المحاولة مجدداً.
                </div>
              )}

              <Button
                disabled={updatePasswordMutation.isPending || newPassword.length < 8}
                className="w-full h-11 rounded-xl bg-[#201b17] text-white hover:bg-[#3a3028] font-bold text-sm shadow-md transition cursor-pointer"
              >
                {updatePasswordMutation.isPending ? <Loader2 className="animate-spin" /> : "حفظ كلمة المرور"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
