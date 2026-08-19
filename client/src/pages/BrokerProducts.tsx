import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { api, type Product } from "@/lib/api";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Gem,
  ImageIcon,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function BrokerProducts() {
  const { user } = useAuth({ redirectPath: "/login" });
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const productsQuery = api.products.list.useQuery({
    search: search.trim() || undefined,
  });

  const openDetails = (product: Product) => {
    setSelectedProduct(product);
    setActiveImageIndex(0);
  };

  const handleNextImage = () => {
    if (!selectedProduct) return;
    setActiveImageIndex(prev => (prev + 1) % selectedProduct.images.length);
  };

  const handlePrevImage = () => {
    if (!selectedProduct) return;
    setActiveImageIndex(prev =>
      prev === 0 ? selectedProduct.images.length - 1 : prev - 1
    );
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f4ef] text-[#201b17] pb-16 antialiased selection:bg-[#ad7d3f]/20">
      {/* Mobile-first Header */}
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
                معروضات الورشة
              </h1>
              <p className="text-[11px] font-medium text-[#ad7d3f]">كتالوج المشغولات والموديلات</p>
            </div>
          </div>

          <button
            onClick={() => productsQuery.refetch()}
            disabled={productsQuery.isRefetching}
            title="تحديث المنتجات"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5ded4] bg-[#faf8f5] text-[#5c4d3e] hover:bg-white active:scale-95 transition cursor-pointer"
          >
            <RefreshCw size={16} className={productsQuery.isRefetching ? "animate-spin text-[#ad7d3f]" : ""} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-4 sm:px-6 space-y-4">
        {/* Intro banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#201b17] via-[#2d241d] to-[#1e1915] p-5 text-[#f9f2e7] shadow-lg">
          <div className="flex items-center gap-2 text-[#c69a5d] text-xs font-semibold">
            <Sparkles size={14} />
            <span>مشغولات الذهب والمصنوعات المتاحة</span>
          </div>
          <h2 className="font-serif text-xl font-bold text-white mt-1">
            أحدث موديلات ومشغولات الورشة
          </h2>
          <p className="text-xs text-[#c7b8a8] mt-1.5 leading-relaxed">
            استعرض كافة المشغولات والموديلات المصنعة بالورشة (حلقان، سلاسل، خواتم، غوايش) مع صورها وأسعارها.
          </p>
        </div>

        {/* Live Search */}
        <div className="relative">
          <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8d7c6a]" />
          <Input
            type="text"
            placeholder="ابحث عن موديل، حلق، سلسلة..."
            className="h-11 rounded-2xl bg-white pr-10 pl-4 text-sm text-[#201b17] border border-[#e5ded4] shadow-xs focus:border-black focus:ring-1 focus:ring-black"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8d7c6a] hover:text-black"
            >
              مسح
            </button>
          )}
        </div>

        {/* Products List / Grid */}
        {productsQuery.isLoading ? (
          <div className="flex min-h-[250px] items-center justify-center rounded-3xl bg-white p-8 border border-[#e5ded4]">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#c69a5d]" />
              <p className="mt-2 text-xs text-[#8d7c6a]">جاري تحميل الكتالوج...</p>
            </div>
          </div>
        ) : productsQuery.data && productsQuery.data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {productsQuery.data.map(product => {
              const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
              return (
                <div
                  key={product.id}
                  onClick={() => openDetails(product)}
                  className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-[#e8dfd3] shadow-xs transition hover:shadow-md active:scale-[0.99] cursor-pointer"
                >
                  {/* Image container */}
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-[#f0e9df]">
                    {primaryImage ? (
                      <img
                        src={primaryImage.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#8d7c6a]/50">
                        <Package size={40} />
                      </div>
                    )}

                    {product.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                        <ImageIcon size={11} />
                        <span className="font-sans-num">{product.images.length}</span>
                      </div>
                    )}

                    <div className="absolute top-2 left-2 rounded-lg bg-[#201b17]/90 px-2.5 py-1 text-xs font-bold text-[#c69a5d] shadow-xs backdrop-blur-xs font-sans-num">
                      {Number(product.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      <span className="text-[10px] text-white/80 font-sans mr-1">ج.م</span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-3.5 space-y-1">
                    <h3 className="font-bold text-sm text-[#201b17] line-clamp-1 group-hover:text-[#c69a5d] transition">
                      {product.name}
                    </h3>
                    <p className="text-xs text-[#8d7c6a] line-clamp-2 leading-relaxed min-h-[30px]">
                      {product.description || "مشغول ذهب مصنع لدى الورشة."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[250px] flex-col items-center justify-center rounded-3xl bg-white p-8 text-center border border-[#e5ded4]">
            <Package size={36} className="text-[#8d7c6a]/60" />
            <h3 className="mt-3 font-serif text-base font-bold text-[#201b17]">لا توجد معروضات</h3>
            <p className="mt-1 text-xs text-[#8d7c6a]">
              {search ? "لم يتم العثور على أية نتائج مطابقة." : "سيتم إضافة المعروضات قريباً."}
            </p>
          </div>
        )}
      </main>

      {/* Product Detail Dialog for Broker */}
      <Dialog open={selectedProduct !== null} onOpenChange={open => !open && setSelectedProduct(null)}>
        <DialogContent
          dir="rtl"
          className="bg-white rounded-3xl p-5 border border-[#e5ded4] shadow-2xl sm:max-w-lg max-h-[90vh] overflow-y-auto"
        >
          {selectedProduct && (
            <div className="space-y-4">
              <DialogHeader className="text-right border-b border-[#f0e9df] pb-3">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#c69a5d]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#c69a5d] w-fit">
                  <Sparkles size={11} />
                  <span>مشغولات الورشة</span>
                </div>
                <DialogTitle className="font-serif text-xl font-bold text-[#201b17] mt-1">
                  {selectedProduct.name}
                </DialogTitle>
              </DialogHeader>

              {/* Big Image Viewer with Next/Prev if multiple */}
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#f0e9df] border border-[#e5ded4]">
                {selectedProduct.images[activeImageIndex] ? (
                  <img
                    src={selectedProduct.images[activeImageIndex].imageUrl}
                    alt={selectedProduct.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#8d7c6a]">
                    <Package size={48} />
                  </div>
                )}

                {selectedProduct.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white shadow-md hover:bg-black transition"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white shadow-md hover:bg-black transition"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {selectedProduct.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selectedProduct.images.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition cursor-pointer ${
                        activeImageIndex === idx
                          ? "border-[#c69a5d] ring-2 ring-[#c69a5d]/40"
                          : "border-[#e5ded4] opacity-70"
                      }`}
                    >
                      <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Price Banner */}
              <div className="rounded-2xl bg-[#faf8f5] p-4 border border-[#e5ded4] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8d7c6a]">السعر / المصنعية:</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-sans-num text-2xl font-black text-[#201b17]">
                    {Number(selectedProduct.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-bold text-[#c69a5d]">ج.م</span>
                </div>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div className="space-y-1.5 bg-[#faf8f5]/60 p-4 rounded-xl border border-[#f0e9df]">
                  <span className="text-[11px] font-bold text-[#8d7c6a] uppercase">التفاصيل والمواصفات:</span>
                  <p className="text-xs text-[#201b17] leading-relaxed whitespace-pre-line">
                    {selectedProduct.description}
                  </p>
                </div>
              )}

              <Button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="w-full h-11 rounded-xl bg-[#201b17] text-white hover:bg-[#3a3028] font-bold text-xs shadow-md transition"
              >
                إغلاق
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
