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
import { api, type BrokerRequest } from "@/lib/api";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  ImageIcon,
  Inbox,
  Loader2,
  MessageCircle,
  Phone,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";

function formatRelativeTime(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays === 1) return "أمس";
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString.slice(0, 10);
  }
}

export default function AdminRequests() {
  const [deleteRequest, setDeleteRequest] = useState<BrokerRequest | null>(null);
  const [lightbox, setLightbox] = useState<{
    request: BrokerRequest;
    index: number;
  } | null>(null);

  const utils = api.useUtils();
  const requests = api.requests.list.useQuery();

  const deleteMutation = api.requests.delete.useMutation({
    onSuccess: () => {
      setDeleteRequest(null);
      utils.requests.list.invalidate();
    },
  });

  const totalRequests = requests.data?.length ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-l from-[#201b17] via-[#2c241f] to-[#201b17] p-6 text-[#f9f2e7] shadow-xl md:flex-row md:items-center md:justify-between lg:p-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#c69a5d]/20 px-3 py-1 text-xs font-semibold text-[#c69a5d]">
              <Sparkles size={13} />
              <span>صندوق الوارد والطلبات الخاصة</span>
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-white lg:text-4xl">
              طلبات المشغولات الجديدة
            </h1>
            <p className="text-sm text-[#c7b8a8] max-w-xl">
              استقبل طلبات الأبونيهات المخصصة واستفسارات المشغولات مع صور الشغل وتفاصيل التواصل المباشر.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-xs">
            <Inbox size={20} className="text-[#c69a5d]" />
            <div className="text-right">
              <span className="text-[11px] text-[#c7b8a8] block">إجمالي الطلبات</span>
              <span className="font-sans-num font-bold text-lg text-white">
                {totalRequests} طلب
              </span>
            </div>
          </div>
        </div>

        {/* Requests Feed */}
        {requests.isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-white p-12 border border-[#e5ded4]">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#c69a5d]" />
              <p className="mt-3 text-sm text-[#8d7c6a]">جاري تحميل الطلبات الواردة...</p>
            </div>
          </div>
        ) : requests.data && requests.data.length > 0 ? (
          <div className="space-y-4">
            {requests.data.map(req => {
              const cleanPhone = req.brokerPhone?.replace(/[^0-9]/g, "") || "";
              const whatsappUrl = cleanPhone
                ? `https://wa.me/${cleanPhone.startsWith("0") ? "2" + cleanPhone : cleanPhone}`
                : "";

              return (
                <div
                  key={req.id}
                  className="rounded-3xl bg-white p-6 border border-[#e5ded4] shadow-sm transition hover:shadow-md hover:border-[#c69a5d]/50"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    {/* Right Info Section (In RTL) */}
                    <div className="space-y-3 flex-1">
                      {/* Broker Details Bar */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 rounded-xl bg-[#faf8f5] px-3.5 py-1.5 border border-[#e5ded4]">
                          <User size={15} className="text-[#c69a5d]" />
                          <span className="font-bold text-sm text-[#201b17]">
                            {req.brokerName || "أبونيه بدون اسم"}
                          </span>
                        </div>

                        {req.brokerPhone && (
                          <div className="flex items-center gap-1.5 text-xs text-[#8d7c6a] font-sans-num" dir="ltr">
                            <Phone size={13} className="text-[#8d7c6a]" />
                            <span>{req.brokerPhone}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-[11px] text-[#8d7c6a]">
                          <Clock size={12} />
                          <span>{formatRelativeTime(req.createdAt)}</span>
                        </div>
                      </div>

                      {/* Request Content */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-[#8d7c6a]">اسم الشغل المطلوب:</span>
                          <h3 className="font-serif text-lg font-bold text-[#201b17]">
                            {req.productName}
                          </h3>
                        </div>

                        {req.description && (
                          <div className="rounded-2xl bg-[#faf8f5] p-4 text-sm text-[#201b17] border border-[#f0e9df] leading-relaxed whitespace-pre-line">
                            {req.description}
                          </div>
                        )}
                      </div>

                      {/* Image Thumbnails Gallery */}
                      {req.images.length > 0 && (
                        <div className="space-y-1.5 pt-2">
                          <span className="text-xs font-semibold text-[#8d7c6a] flex items-center gap-1">
                            <ImageIcon size={13} />
                            <span>صور الشغل المرفقة ({req.images.length}) - اضغط للتكبير:</span>
                          </span>
                          <div className="flex flex-wrap gap-2.5 pt-1">
                            {req.images.map((img, idx) => (
                              <button
                                key={img.id || idx}
                                type="button"
                                onClick={() => setLightbox({ request: req, index: idx })}
                                className="group relative h-20 w-20 overflow-hidden rounded-xl border border-[#e5ded4] shadow-xs hover:border-[#c69a5d] transition cursor-pointer"
                              >
                                <img
                                  src={img.imageUrl}
                                  alt=""
                                  className="h-full w-full object-cover transition group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                  <ExternalLink size={14} />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Left Actions (In RTL) */}
                    <div className="flex items-center gap-2 border-t border-[#f0e9df] pt-3 lg:border-t-0 lg:pt-0 lg:flex-col lg:items-end">
                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-50 px-4 text-xs font-bold text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition shadow-xs"
                        >
                          <MessageCircle size={15} className="text-emerald-700" />
                          <span>تواصل واتساب</span>
                        </a>
                      )}

                      {req.brokerPhone && (
                        <a
                          href={`tel:${cleanPhone}`}
                          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#faf8f5] px-4 text-xs font-bold text-[#201b17] border border-[#e5ded4] hover:bg-[#f0e9df] transition shadow-xs"
                        >
                          <Phone size={14} />
                          <span>اتصال</span>
                        </a>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDeleteRequest(req)}
                        className="h-10 rounded-xl border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 font-bold text-xs gap-1.5 transition cursor-pointer"
                      >
                        <Trash2 size={14} />
                        <span>حذف الطلب</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl bg-white p-12 text-center border border-[#e5ded4]">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#faf8f5] text-[#8d7c6a] border border-[#e5ded4]">
              <Inbox size={32} strokeWidth={1.5} />
            </div>
            <h3 className="mt-4 font-serif text-xl font-bold text-[#201b17]">لا توجد طلبات جديدة حالياً</h3>
            <p className="mt-1 text-sm text-[#8d7c6a] max-w-sm">
              عندما يقوم أي أبونيه بإرسال طلب شغل أو استفسار مخصص، ستظهر كافة بياناته وصوره هنا مباشرة.
            </p>
          </div>
        )}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={lightbox !== null} onOpenChange={open => !open && setLightbox(null)}>
        <DialogContent
          dir="rtl"
          className="bg-[#201b17] text-white rounded-3xl p-4 border border-white/10 shadow-2xl sm:max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {lightbox && (
            <div className="space-y-3">
              <DialogHeader className="text-right border-b border-white/10 pb-2">
                <DialogTitle className="font-serif text-lg font-bold text-white">
                  {lightbox.request.productName} ({lightbox.index + 1} من {lightbox.request.images.length})
                </DialogTitle>
                <p className="text-xs text-[#c7b8a8]">
                  طلب من: {lightbox.request.brokerName || "أبونيه"}
                </p>
              </DialogHeader>

              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black/40 flex items-center justify-center">
                <img
                  src={lightbox.request.images[lightbox.index]?.imageUrl}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                />

                {lightbox.request.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setLightbox(prev =>
                          prev
                            ? {
                                ...prev,
                                index:
                                  prev.index === 0
                                    ? prev.request.images.length - 1
                                    : prev.index - 1,
                              }
                            : null
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-black/70 text-white hover:bg-black transition"
                    >
                      <ChevronRight size={22} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setLightbox(prev =>
                          prev
                            ? {
                                ...prev,
                                index:
                                  (prev.index + 1) % prev.request.images.length,
                              }
                            : null
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-black/70 text-white hover:bg-black transition"
                    >
                      <ChevronLeft size={22} />
                    </button>
                  </>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLightbox(null)}
                  className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs font-semibold"
                >
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={deleteRequest !== null} onOpenChange={open => !open && setDeleteRequest(null)}>
        <AlertDialogContent dir="rtl" className="bg-white rounded-2xl p-6 border border-[#e5ded4] shadow-2xl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle className="font-serif text-2xl text-[#201b17]">حذف هذا الطلب؟</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#8d7c6a] mt-2 leading-relaxed">
              هل أنت متأكد من حذف طلب ({deleteRequest?.productName}) من ({deleteRequest?.brokerName})؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:justify-start mt-4">
            <AlertDialogCancel className="rounded-xl border-[#e2d9cd] hover:bg-[#faf8f5]">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm font-semibold"
              onClick={() => deleteRequest && deleteMutation.mutate({ id: deleteRequest.id })}
            >
              {deleteMutation.isPending ? <Loader2 className="animate-spin" /> : "تأكيد الحذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
