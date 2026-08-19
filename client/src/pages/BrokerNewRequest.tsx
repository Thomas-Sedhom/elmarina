import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { api, type CreateRequestInput } from "@/lib/api";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ImageIcon,
  Inbox,
  Loader2,
  Plus,
  Send,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link, useLocation } from "wouter";

export default function BrokerNewRequest() {
  const [, navigate] = useLocation();
  const { user } = useAuth({ redirectPath: "/login" });
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<Array<{ imageUrl: string; publicId: string }>>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = api.useUtils();
  const myRequests = api.requests.list.useQuery();

  const uploadImageMutation = api.requests.uploadImage.useMutation();

  const createMutation = api.requests.create.useMutation({
    onSuccess: () => {
      setProductName("");
      setDescription("");
      setImages([]);
      setSuccessBanner(true);
      utils.requests.list.invalidate();
      setTimeout(() => setSuccessBanner(false), 6000);
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const base64Data = await base64Promise;
        const res = await uploadImageMutation.mutateAsync({ image: base64Data });

        setImages(prev => [
          ...prev,
          { imageUrl: res.imageUrl, publicId: res.publicId },
        ]);
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    createMutation.mutate({
      productName: productName.trim(),
      description: description.trim(),
      images,
    });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f4ef] text-[#201b17] pb-16 antialiased selection:bg-[#ad7d3f]/20">
      {/* Top Mobile Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#e8dfd3] shadow-xs">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/portal"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5ded4] bg-[#faf8f5] text-[#5c4d3e] hover:bg-white active:scale-95 transition"
              title="العودة للحساب"
            >
              <ArrowRight size={18} />
            </Link>

            <div>
              <h1 className="font-serif text-base font-bold leading-tight text-[#201b17]">
                طلب شغل جديد للورشة
              </h1>
              <p className="text-[11px] font-medium text-[#ad7d3f]">إرسال استفسار أو طلب تصنيع مخصص</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-4 sm:px-6 space-y-6">
        {/* Intro Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#201b17] via-[#2d241d] to-[#1e1915] p-5 text-[#f9f2e7] shadow-lg">
          <div className="flex items-center gap-2 text-[#c69a5d] text-xs font-semibold">
            <Sparkles size={14} />
            <span>طلب شغل أو استفسار مخصص</span>
          </div>
          <h2 className="font-serif text-xl font-bold text-white mt-1">
            أرسل مواصفات وصور الشغل المطلوب
          </h2>
          <p className="text-xs text-[#c7b8a8] mt-1.5 leading-relaxed">
            يمكنك كتابة اسم ومواصفات الشغل الذي تحتاجه وإرفاق صوره ليصل مباشرة لإدارة الورشة مع بياناتك.
          </p>
        </div>

        {successBanner && (
          <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-900 border border-emerald-200 flex items-center gap-3 shadow-xs animate-in fade-in">
            <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-sm">تم إرسال طلبك بنجاح للورشة!</p>
              <p className="text-emerald-700 mt-0.5">ستقوم إدارة الورشة بمراجعة طلبك والتواصل معك.</p>
            </div>
          </div>
        )}

        {/* Request Submission Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white p-5 sm:p-6 border border-[#e5ded4] shadow-sm space-y-4"
        >
          <h3 className="font-serif text-lg font-bold text-[#201b17] border-b border-[#f0e9df] pb-3">
            بيانات الشغل المطلوب
          </h3>

          <div className="space-y-1.5 text-right">
            <Label className="text-xs font-semibold text-[#201b17]">اسم الشغل المطلوب</Label>
            <Input
              required
              placeholder="مثال: حلق نص جرام عيار 18 / سلسلة كوين"
              className="h-11 rounded-xl bg-white !border !border-black text-sm text-[#201b17] placeholder:text-[#8d7c6a] focus:border-black focus:ring-1 focus:ring-black"
              style={{ borderColor: "#000000" }}
              value={productName}
              onChange={e => setProductName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5 text-right">
            <Label className="text-xs font-semibold text-[#201b17]">الوصف والمواصفات (اختياري)</Label>
            <Textarea
              placeholder="أدخل أية تفاصيل أخرى مثل المقاس، العيار، العدد المطلوب، أو استفسار..."
              className="rounded-xl bg-white !border !border-black text-sm text-[#201b17] placeholder:text-[#8d7c6a] focus:border-black focus:ring-1 focus:ring-black min-h-[85px]"
              style={{ borderColor: "#000000" }}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Photo Uploader */}
          <div className="space-y-2 text-right">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-[#201b17]">صور الشغل المطلوب</Label>
              <span className="text-[11px] text-[#8d7c6a]">يمكنك رفع أكثر من صورة من الكاميرا أو المعرض</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />

            <div
              onClick={() => !uploadingImage && fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#c69a5d]/70 bg-[#faf8f5] p-5 text-center transition cursor-pointer hover:bg-[#f5efe6] ${
                uploadingImage ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              {uploadingImage ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-7 w-7 animate-spin text-[#c69a5d]" />
                  <span className="mt-2 text-xs font-semibold text-[#201b17]">جاري رفع الصور...</span>
                </div>
              ) : (
                <>
                  <UploadCloud className="h-8 w-8 text-[#c69a5d]" />
                  <p className="mt-2 text-xs font-bold text-[#201b17]">اضغط لاختيار أو تصوير الشغل</p>
                  <p className="text-[11px] text-[#8d7c6a] mt-0.5">JPG, PNG, WEBP</p>
                </>
              )}
            </div>

            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-[#e5ded4] bg-white shadow-xs"
                  >
                    <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 left-1 grid h-6 w-6 place-items-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {createMutation.error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-100">
              تعذر إرسال الطلب. يرجى مراجعة البيانات والمحاولة مرة أخرى.
            </div>
          )}

          <Button
            disabled={createMutation.isPending || uploadingImage || !productName.trim()}
            className="w-full h-12 rounded-2xl bg-[#201b17] text-white hover:bg-[#3a3028] font-bold text-sm shadow-md transition cursor-pointer gap-2 mt-3"
          >
            {createMutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Send size={16} />
                <span>إرسال الطلب للورشة</span>
              </>
            )}
          </Button>
        </form>

        {/* Previous Requests List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-[#201b17] flex items-center gap-2">
              <Inbox size={16} className="text-[#ad7d3f]" />
              <span>طلباتي السابقة</span>
            </h3>
            <span className="text-xs text-[#8d7c6a] font-sans-num">
              {myRequests.data?.length ?? 0} طلب
            </span>
          </div>

          {myRequests.isLoading ? (
            <div className="flex min-h-[120px] items-center justify-center rounded-2xl bg-white p-6 border border-[#e5ded4]">
              <Loader2 className="h-6 w-6 animate-spin text-[#ad7d3f]" />
            </div>
          ) : myRequests.data && myRequests.data.length > 0 ? (
            <div className="space-y-3">
              {myRequests.data.map(req => (
                <div
                  key={req.id}
                  className="rounded-2xl bg-white p-4 border border-[#e5ded4] shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-[#201b17]">{req.productName}</h4>
                      <div className="flex items-center gap-1 text-[11px] text-[#8d7c6a] mt-0.5">
                        <Clock size={11} />
                        <span>{new Date(req.createdAt).toLocaleDateString("ar-EG")}</span>
                      </div>
                    </div>

                    <span className="inline-flex items-center rounded-full bg-[#faf8f5] px-2.5 py-0.5 text-[10px] font-semibold text-[#8a5d24] border border-[#e5ded4]">
                      تم الإرسال للورشة
                    </span>
                  </div>

                  {req.description && (
                    <p className="text-xs text-[#5c4d3e] bg-[#faf8f5] p-2.5 rounded-xl border border-[#f0e9df] leading-relaxed whitespace-pre-line">
                      {req.description}
                    </p>
                  )}

                  {req.images.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pt-1">
                      {req.images.map((img, idx) => (
                        <div
                          key={img.id || idx}
                          className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#e5ded4]"
                        >
                          <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-6 text-center border border-[#e5ded4] text-xs text-[#8d7c6a]">
              لم تقم بإرسال أية طلبات سابقة بعد.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
