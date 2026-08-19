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
import { api, type ProductInput } from "@/lib/api";
import {
  ArrowRight,
  Calendar,
  Edit3,
  ImageIcon,
  Loader2,
  Package,
  Sparkles,
  Star,
  Tag,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";

export default function AdminProductDetail() {
  const [, params] = useRoute("/admin/products/:id");
  const [, navigate] = useLocation();
  const id = params?.id || "";

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = api.useUtils();
  const product = api.products.get.useQuery({ id }, { enabled: Boolean(id) });

  const [form, setForm] = useState<{
    name: string;
    price: string;
    description: string;
    images: Array<{ imageUrl: string; publicId: string; isPrimary: boolean }>;
  }>({
    name: "",
    price: "",
    description: "",
    images: [],
  });

  const uploadImageMutation = api.products.uploadImage.useMutation();

  const updateMutation = api.products.update.useMutation({
    onSuccess: () => {
      setModalOpen(false);
      utils.products.get.invalidate({ id });
      utils.products.list.invalidate();
    },
  });

  const deleteMutation = api.products.delete.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      navigate("/admin/products");
    },
  });

  const openEdit = () => {
    if (!product.data) return;
    setForm({
      name: product.data.name,
      price: product.data.price,
      description: product.data.description || "",
      images: product.data.images.map(img => ({
        imageUrl: img.imageUrl,
        publicId: img.publicId,
        isPrimary: img.isPrimary,
      })),
    });
    setModalOpen(true);
  };

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

        setForm(prev => {
          const isFirst = prev.images.length === 0;
          return {
            ...prev,
            images: [
              ...prev.images,
              {
                imageUrl: res.imageUrl,
                publicId: res.publicId,
                isPrimary: isFirst,
              },
            ],
          };
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setForm(prev => {
      const filtered = prev.images.filter((_, idx) => idx !== index);
      if (filtered.length > 0 && !filtered.some(img => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return { ...prev, images: filtered };
    });
  };

  const setPrimaryImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.map((img, idx) => ({
        ...img,
        isPrimary: idx === index,
      })),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price.trim()) return;

    const payload: ProductInput = {
      name: form.name.trim(),
      price: form.price.trim(),
      description: form.description.trim(),
      images: form.images,
    };

    updateMutation.mutate({ ...payload, id });
  };

  if (product.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center rounded-3xl bg-white p-12 border border-[#e5ded4]">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#c69a5d]" />
            <p className="mt-3 text-sm text-[#8d7c6a]">جاري تحميل بيانات المنتج...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!product.data) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl bg-white p-12 text-center border border-[#e5ded4]">
          <Package size={40} className="text-[#8d7c6a]" />
          <h2 className="mt-4 font-serif text-2xl font-bold">المنتج غير موجود</h2>
          <p className="mt-2 text-sm text-[#8d7c6a]">قد يكون تم حذف المنتج أو الرابط غير صحيح.</p>
          <Link
            href="/admin/products"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#201b17] px-5 py-2.5 text-sm font-semibold text-white"
          >
            <ArrowRight size={16} />
            العودة لجميع المنتجات
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const p = product.data;
  const currentImage = p.images[activeImageIndex] || p.images[0];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Navigation Breadcrumb & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#201b17] border border-[#e5ded4] shadow-xs hover:bg-[#faf8f5] transition"
          >
            <ArrowRight size={15} />
            <span>العودة لجميع المنتجات</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              onClick={openEdit}
              className="h-10 rounded-xl bg-[#201b17] text-white hover:bg-[#3a3028] font-bold text-xs gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Edit3 size={14} />
              <span>تعديل المنتج</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setDeleteOpen(true)}
              className="h-10 rounded-xl border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 font-bold text-xs gap-1.5 transition cursor-pointer"
            >
              <Trash2 size={14} />
              <span>حذف</span>
            </Button>
          </div>
        </div>

        {/* Main Product Card */}
        <div className="grid grid-cols-1 gap-8 rounded-3xl bg-white p-6 border border-[#e5ded4] shadow-md lg:grid-cols-12 lg:p-8">
          {/* Gallery Section (Left in RTL, 6 cols) */}
          <div className="space-y-4 lg:col-span-6">
            {/* Active Big Image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#f0e9df] border border-[#e5ded4] shadow-xs">
              {currentImage ? (
                <img
                  src={currentImage.imageUrl}
                  alt={p.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-[#8d7c6a]">
                  <Package size={56} strokeWidth={1.2} />
                  <span className="mt-2 text-xs">لا توجد صور مرفوعة</span>
                </div>
              )}
            </div>

            {/* Thumbnails Gallery */}
            {p.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {p.images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition cursor-pointer ${
                      activeImageIndex === idx
                        ? "border-[#c69a5d] ring-2 ring-[#c69a5d]/40"
                        : "border-[#e5ded4] opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                    {img.isPrimary && (
                      <div className="absolute top-1 right-1 rounded-xs bg-[#c69a5d] p-0.5 text-[8px] font-bold text-[#201b17]">
                        ★
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section (Right in RTL, 6 cols) */}
          <div className="flex flex-col justify-between space-y-6 lg:col-span-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#c69a5d]/15 px-3 py-1 text-xs font-bold text-[#c69a5d]">
                <Sparkles size={13} />
                <span>مشغولات ومصنوعات الورشة</span>
              </div>

              <h1 className="font-serif text-3xl font-bold text-[#201b17] lg:text-4xl">
                {p.name}
              </h1>

              {/* Price Banner */}
              <div className="rounded-2xl bg-[#faf8f5] p-5 border border-[#e5ded4]">
                <span className="text-xs text-[#8d7c6a]">سعر القطعة / المصنعية</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-sans-num text-3xl font-black text-[#201b17]">
                    {Number(p.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-sm font-bold text-[#c69a5d]">جنيه مصري</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#8d7c6a] uppercase tracking-wider">
                  الوصف والمواصفات
                </h3>
                <p className="text-sm text-[#201b17] whitespace-pre-line leading-relaxed bg-[#faf8f5]/50 p-4 rounded-xl border border-[#f0e9df]">
                  {p.description || "لا يوجد وصف إضافي متوفر لهذا المشغول."}
                </p>
              </div>

              {/* Meta information */}
              <div className="flex items-center gap-4 text-xs text-[#8d7c6a] pt-2">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span>تاريخ الإضافة: {new Date(p.createdAt).toLocaleDateString("ar-EG")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ImageIcon size={14} />
                  <span className="font-sans-num">{p.images.length} صور مرفوعة</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#f0e9df]">
              <Button
                onClick={openEdit}
                className="w-full h-12 rounded-xl bg-[#201b17] text-white hover:bg-[#3a3028] font-bold text-sm shadow-md transition cursor-pointer"
              >
                <Edit3 size={16} className="ml-2" />
                تعديل بيانات المنتج والصور
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={open => !open && setModalOpen(false)}>
        <DialogContent
          dir="rtl"
          className="bg-white rounded-3xl p-6 border border-[#e5ded4] shadow-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader className="text-right border-b border-[#f0e9df] pb-4">
            <DialogTitle className="font-serif text-2xl text-[#201b17]">
              تعديل بيانات المنتج
            </DialogTitle>
            <p className="text-xs text-[#8d7c6a]">
              قم بتعديل بيانات المنتج وصوره ثم اضغط حفظ التعديلات.
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 text-right">
                <Label className="text-xs font-semibold text-[#201b17]">اسم المنتج / المشغول</Label>
                <Input
                  required
                  placeholder="مثال: حلق نص جرام عيار 18"
                  className="h-11 rounded-xl bg-white !border !border-black text-sm text-[#201b17] placeholder:text-[#8d7c6a] focus:border-black focus:ring-1 focus:ring-black"
                  style={{ borderColor: "#000000" }}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5 text-right">
                <Label className="text-xs font-semibold text-[#201b17]">السعر (ج.م)</Label>
                <Input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  dir="ltr"
                  placeholder="0.00"
                  className="h-11 rounded-xl bg-white !border !border-black text-sm text-[#201b17] placeholder:text-[#8d7c6a] focus:border-black focus:ring-1 focus:ring-black font-sans-num"
                  style={{ borderColor: "#000000" }}
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-semibold text-[#201b17]">وصف المنتج وتفاصيله (اختياري)</Label>
              <Textarea
                placeholder="أدخل مواصفات الموديل، العيار، أو أية تفاصيل أخرى..."
                className="rounded-xl bg-white !border !border-black text-sm text-[#201b17] placeholder:text-[#8d7c6a] focus:border-black focus:ring-1 focus:ring-black min-h-[75px]"
                style={{ borderColor: "#000000" }}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* Images Upload Section */}
            <div className="space-y-2 text-right">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-[#201b17]">صور المنتج</Label>
                <span className="text-[11px] text-[#8d7c6a]">
                  يمكنك رفع صور إضافية أو حذف الصور الحالية
                </span>
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
                    <span className="mt-2 text-xs font-semibold text-[#201b17]">
                      جاري رفع الصور إلى Cloudinary...
                    </span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="h-8 w-8 text-[#c69a5d]" />
                    <p className="mt-2 text-xs font-bold text-[#201b17]">
                      اضغط لاختيار صور جديدة
                    </p>
                  </>
                )}
              </div>

              {form.images.length > 0 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                  {form.images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`group relative aspect-square overflow-hidden rounded-xl border bg-white shadow-xs ${
                        img.isPrimary ? "border-[#c69a5d] ring-2 ring-[#c69a5d]/40" : "border-[#e5ded4]"
                      }`}
                    >
                      <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />

                      {img.isPrimary ? (
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded-md bg-[#c69a5d] px-1.5 py-0.5 text-[9px] font-bold text-[#201b17] shadow-xs">
                          <Star size={10} className="fill-current" />
                          <span>رئيسية</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(idx)}
                          className="absolute top-1.5 right-1.5 hidden rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white group-hover:block hover:bg-black"
                        >
                          تعيين كرئيسية
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute bottom-1.5 left-1.5 grid h-6 w-6 place-items-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 transition"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {updateMutation.error && (
              <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-100">
                تعذر حفظ التعديلات. يرجى مراجعة البيانات.
              </div>
            )}

            <Button
              disabled={updateMutation.isPending || uploadingImage}
              className="w-full h-11 rounded-xl bg-[#201b17] text-white hover:bg-[#3a3028] font-bold text-sm shadow-md transition cursor-pointer mt-2"
            >
              {updateMutation.isPending ? <Loader2 className="animate-spin" /> : "حفظ التعديلات"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent dir="rtl" className="bg-white rounded-2xl p-6 border border-[#e5ded4] shadow-2xl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle className="font-serif text-2xl text-[#201b17]">حذف المنتج؟</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#8d7c6a] mt-2 leading-relaxed">
              هل أنت متأكد من حذف منتج ({p.name})؟ سيتم حذف المنتج وإخفاؤه من كتالوج المعروضات.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:justify-start mt-4">
            <AlertDialogCancel className="rounded-xl border-[#e2d9cd] hover:bg-[#faf8f5]">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm font-semibold"
              onClick={() => deleteMutation.mutate({ id })}
            >
              {deleteMutation.isPending ? <Loader2 className="animate-spin" /> : "تأكيد الحذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
