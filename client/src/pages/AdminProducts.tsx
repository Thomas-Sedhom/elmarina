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
import { api, type Product, type ProductInput } from "@/lib/api";
import {
  Edit3,
  Eye,
  ImageIcon,
  Loader2,
  Package,
  Plus,
  Search,
  Sparkles,
  Star,
  Tag,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link } from "wouter";

type ProductFormState = {
  id?: string;
  name: string;
  price: string;
  description: string;
  images: Array<{ imageUrl: string; publicId: string; isPrimary: boolean }>;
};

const emptyProductForm = (): ProductFormState => ({
  name: "",
  price: "",
  description: "",
  images: [],
});

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyProductForm());
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = api.useUtils();
  const products = api.products.list.useQuery({ search: search.trim() || undefined });

  const uploadImageMutation = api.products.uploadImage.useMutation();

  const createMutation = api.products.create.useMutation({
    onSuccess: () => {
      setModalOpen(false);
      setForm(emptyProductForm());
      utils.products.list.invalidate();
    },
  });

  const updateMutation = api.products.update.useMutation({
    onSuccess: () => {
      setModalOpen(false);
      setForm(emptyProductForm());
      utils.products.list.invalidate();
    },
  });

  const deleteMutation = api.products.delete.useMutation({
    onSuccess: () => {
      setDeleteProduct(null);
      utils.products.list.invalidate();
    },
  });

  const isEditing = Boolean(form.id);
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;

  const openAdd = () => {
    setForm(emptyProductForm());
    setModalOpen(true);
  };

  const openEdit = (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setForm({
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description || "",
      images: product.images.map(img => ({
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
      // Ensure at least one image is primary if available
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

    if (form.id) {
      updateMutation.mutate({ ...payload, id: form.id });
    } else {
      createMutation.mutate(payload);
    }
  };

  const totalProducts = products.data?.length ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-l from-[#201b17] via-[#2c241f] to-[#201b17] p-6 text-[#f9f2e7] shadow-xl md:flex-row md:items-center md:justify-between lg:p-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#c69a5d]/20 px-3 py-1 text-xs font-semibold text-[#c69a5d]">
              <Sparkles size={13} />
              <span>كتالوج مشغولات ومصنوعات الورشة</span>
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-white lg:text-4xl">
              جميع المنتجات والمعروضات
            </h1>
            <p className="text-sm text-[#c7b8a8] max-w-xl">
              إدارة وعرض كافة منتجات وموديلات الورشة (حلقان، سلاسل، خواتم، غوايش) مع الأسعار والصور.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={openAdd}
              className="h-12 rounded-2xl bg-[#c69a5d] px-6 text-sm font-bold text-[#201b17] shadow-lg transition hover:bg-[#d8ab6d] cursor-pointer"
            >
              <Plus size={18} className="ml-1.5" />
              إضافة منتج جديد
            </Button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm border border-[#e5ded4] md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8d7c6a]" />
            <Input
              type="text"
              placeholder="ابحث باسم المنتج أو الوصف..."
              className="h-11 rounded-xl bg-[#faf8f5] pr-10 pl-4 text-sm text-[#201b17] border border-[#e5ded4] focus:border-black focus:ring-1 focus:ring-black"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8d7c6a] hover:text-black"
              >
                مسح
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#8d7c6a]">
            <span>إجمالي المنتجات:</span>
            <span className="font-sans-num font-bold text-sm text-[#201b17] bg-[#f0e9df] px-2.5 py-0.5 rounded-lg">
              {totalProducts}
            </span>
          </div>
        </div>

        {/* Products Grid */}
        {products.isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-white p-12 border border-[#e5ded4]">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#c69a5d]" />
              <p className="mt-3 text-sm text-[#8d7c6a]">جاري تحميل المنتجات...</p>
            </div>
          </div>
        ) : products.data && products.data.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.data.map(product => {
              const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
              return (
                <div
                  key={product.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-[#e5ded4] shadow-sm transition hover:shadow-xl hover:border-[#c69a5d]/60"
                >
                  {/* Image Container */}
                  <div className="relative aspect-square w-full overflow-hidden bg-[#f0e9df]">
                    {primaryImage ? (
                      <img
                        src={primaryImage.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#8d7c6a]/60">
                        <Package size={48} strokeWidth={1.2} />
                      </div>
                    )}

                    {/* Image count pill */}
                    {product.images.length > 1 && (
                      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-lg bg-black/65 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
                        <ImageIcon size={12} />
                        <span className="font-sans-num">{product.images.length} صور</span>
                      </div>
                    )}

                    {/* Price Pill */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-xl bg-[#201b17]/90 px-3 py-1.5 text-xs font-bold text-[#c69a5d] shadow-md backdrop-blur-xs font-sans-num">
                      <span>{Number(product.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                      <span className="text-[10px] font-normal text-white/80 font-sans">ج.م</span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-bold text-base text-[#201b17] line-clamp-1 group-hover:text-[#c69a5d] transition">
                      {product.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-[#8d7c6a] line-clamp-2 min-h-[32px] leading-relaxed">
                      {product.description || "لا يوجد وصف إضافي للمنتج."}
                    </p>

                    {/* Card Actions */}
                    <div className="mt-4 flex items-center justify-between border-t border-[#f0e9df] pt-3 gap-2">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-[#faf8f5] py-2 text-xs font-bold text-[#201b17] border border-[#e5ded4] hover:bg-[#f0e9df] transition"
                      >
                        <Eye size={14} className="text-[#8d7c6a]" />
                        <span>التفاصيل</span>
                      </Link>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={e => openEdit(product, e)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-black text-black hover:bg-black hover:text-white transition cursor-pointer"
                          title="تعديل المنتج"
                        >
                          <Edit3 size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteProduct(product)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition cursor-pointer"
                          title="حذف المنتج"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl bg-white p-12 text-center border border-[#e5ded4]">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#faf8f5] text-[#8d7c6a] border border-[#e5ded4]">
              <Package size={32} strokeWidth={1.5} />
            </div>
            <h3 className="mt-4 font-serif text-xl font-bold text-[#201b17]">لا توجد منتجات مسجلة</h3>
            <p className="mt-1 text-sm text-[#8d7c6a] max-w-sm">
              {search ? "لم يتم العثور على أية منتجات مطابقة لكلمة البحث." : "ابدأ بإضافة أول منتج أو مشغول للورشة الآن."}
            </p>
            <Button
              onClick={openAdd}
              className="mt-5 rounded-xl bg-[#201b17] px-6 text-sm font-bold text-white hover:bg-[#3a3028] shadow-md transition cursor-pointer"
            >
              <Plus size={16} className="ml-1.5" />
              إضافة منتج جديد
            </Button>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <Dialog open={modalOpen} onOpenChange={open => !open && setModalOpen(false)}>
        <DialogContent
          dir="rtl"
          className="bg-white rounded-3xl p-6 border border-[#e5ded4] shadow-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader className="text-right border-b border-[#f0e9df] pb-4">
            <DialogTitle className="font-serif text-2xl text-[#201b17]">
              {isEditing ? "تعديل بيانات المنتج" : "إضافة منتج أو مشغول جديد"}
            </DialogTitle>
            <p className="text-xs text-[#8d7c6a]">
              قم بإدخال بيانات المنتج ورفع صوره من خلال Cloudinary.
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
                  يمكنك رفع أكثر من صورة وتحديد الصورة الرئيسية
                </span>
              </div>

              {/* Upload Drop Area */}
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
                      اضغط لاختيار الصور من جهازك
                    </p>
                    <p className="text-[11px] text-[#8d7c6a] mt-0.5">
                      JPG, PNG, WEBP (يتم التحسين والرفع تلقائياً)
                    </p>
                  </>
                )}
              </div>

              {/* Uploaded Images Preview Gallery */}
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

                      {/* Primary Badge or Set Primary Button */}
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

                      {/* Remove Button */}
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

            {saveError && (
              <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-100">
                تعذر حفظ المنتج. يرجى التأكد من صحة البيانات والمحاولة مجدداً.
              </div>
            )}

            <Button
              disabled={isSaving || uploadingImage}
              className="w-full h-11 rounded-xl bg-[#201b17] text-white hover:bg-[#3a3028] font-bold text-sm shadow-md transition cursor-pointer mt-2"
            >
              {isSaving ? <Loader2 className="animate-spin" /> : isEditing ? "حفظ التعديلات" : "إضافة المنتج الآن"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={deleteProduct !== null} onOpenChange={open => !open && setDeleteProduct(null)}>
        <AlertDialogContent dir="rtl" className="bg-white rounded-2xl p-6 border border-[#e5ded4] shadow-2xl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle className="font-serif text-2xl text-[#201b17]">حذف المنتج؟</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#8d7c6a] mt-2 leading-relaxed">
              هل أنت متأكد من حذف منتج ({deleteProduct?.name})؟ سيتم حذف المنتج وإخفاؤه من كتالوج المعروضات.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:justify-start mt-4">
            <AlertDialogCancel className="rounded-xl border-[#e2d9cd] hover:bg-[#faf8f5]">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm font-semibold"
              onClick={() => deleteProduct && deleteMutation.mutate({ id: deleteProduct.id })}
            >
              {deleteMutation.isPending ? <Loader2 className="animate-spin" /> : "تأكيد الحذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
