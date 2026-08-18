import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { api, type SheetEntry } from "@/lib/api";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  EyeOff,
  FileText,
  Filter,
  Gem,
  LogOut,
  RefreshCw,
  Search,
  Sparkles,
  User,
  Wallet,
  Weight,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

function formatWeight(value: string | number) {
  const num = Number(value);
  if (isNaN(num)) return "0.000";
  return num.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function formatCash(value: string | number) {
  const num = Number(value);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(isoString: string) {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoString.slice(0, 10);
  }
}

export default function BrokerPortal() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading, logout, logoutPending } = useAuth({ redirectPath: "/login" });
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "work" | "breakage">("all");

  const accountQuery = api.brokers.meAccount.useQuery({
    enabled: Boolean(user && user.role === "broker"),
  });

  const entriesQuery = api.entries.list.useQuery(
    { brokerAccountId: accountQuery.data?.id ?? "" },
    { enabled: Boolean(accountQuery.data?.id) }
  );

  const entries: SheetEntry[] = entriesQuery.data ?? [];
  const account = accountQuery.data;
  const isBlocked = Boolean(account?.isBlocked);

  const displayWeight = (val: string | number) => (isBlocked ? "•••.•••" : formatWeight(val));
  const displayCash = (val: string | number) => (isBlocked ? "•••.••" : formatCash(val));

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesType = filterType === "all" || entry.type === filterType;
      const normalizedSearch = search.trim().toLowerCase();
      if (!normalizedSearch) return matchesType;

      const matchesDesc = (entry.description || "").toLowerCase().includes(normalizedSearch);
      const matchesNotes = (entry.notes || "").toLowerCase().includes(normalizedSearch);
      const matchesDate = entry.businessDate.includes(normalizedSearch);
      const matchesWeight = String(entry.weight).includes(normalizedSearch);
      const matchesCash = String(entry.cash).includes(normalizedSearch);

      return matchesType && (matchesDesc || matchesNotes || matchesDate || matchesWeight || matchesCash);
    });
  }, [entries, filterType, search]);

  const stats = useMemo(() => {
    let workCount = 0;
    let breakageCount = 0;
    for (const e of entries) {
      if (e.type === "work") workCount++;
      if (e.type === "breakage") breakageCount++;
    }
    return { total: entries.length, workCount, breakageCount };
  }, [entries]);

  const handleRefresh = () => {
    accountQuery.refetch();
    if (accountQuery.data?.id) {
      entriesQuery.refetch();
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (authLoading || (user && user.role === "broker" && accountQuery.isLoading)) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#f7f4ef]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ad7d3f] text-white shadow-lg animate-pulse">
            <Gem size={28} />
          </div>
          <p className="text-sm font-medium text-[#8d7c6a]">جاري تحميل كشف الحساب...</p>
        </div>
      </div>
    );
  }

  const isRefreshing = accountQuery.isRefetching || entriesQuery.isRefetching;

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f4ef] text-[#201b17] pb-12 antialiased selection:bg-[#ad7d3f]/20">
      {/* Sticky Mobile App Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#e8dfd3] shadow-xs">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#201b17] text-[#ad7d3f] shadow-xs">
              <Gem size={18} />
            </div>
            <div>
              <h1 className="font-serif text-base font-bold leading-tight text-[#201b17]">Elmarina</h1>
              <p className="text-[11px] font-medium text-[#ad7d3f]">حساب الأبونيه</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="تحديث البيانات"
              aria-label="تحديث البيانات"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5ded4] bg-[#faf8f5] text-[#5c4d3e] hover:bg-white active:scale-95 transition"
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin text-[#ad7d3f]" : ""} />
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logoutPending}
              className="h-9 gap-1.5 rounded-xl border-[#e5ded4] bg-white text-xs font-semibold text-[#8d7c6a] hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition"
            >
              <LogOut size={14} />
              <span className="hidden xs:inline">خروج</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-4 sm:px-6 space-y-5">
        {/* Broker Welcome Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#201b17] via-[#2c241e] to-[#1a1613] p-5 sm:p-6 text-[#f9f2e7] shadow-xl">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#ad7d3f]/20 blur-2xl" />
          <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-[#ad7d3f]/10 blur-2xl" />

          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ad7d3f]/20 text-[#ad7d3f] border border-[#ad7d3f]/30">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#c7b8a8]">مرحبًا بك،</p>
                  <h2 className="text-lg font-bold text-white leading-snug">{account?.name || user?.name || "العميل"}</h2>
                </div>
              </div>
              {account?.phone && (
                <span className="rounded-full bg-white/10 px-3 py-1 font-sans-num text-xs text-[#d6c8b8] border border-white/10">
                  {account.phone}
                </span>
              )}
            </div>

            {/* Balances Display (Hero KPI) */}
            <div className="pt-2">
              <p className="text-[11px] font-semibold text-[#ad7d3f] uppercase tracking-wider flex items-center gap-1 mb-2.5">
                <Sparkles size={13} />
                صافي الحساب الحالي
              </p>

              <div className="grid grid-cols-2 gap-3">
                {/* Weight Balance Card */}
                <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm border border-white/10 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[#d6c8b8] mb-1.5">
                    <span className="text-xs font-medium">إجمالي الذهب</span>
                    <Weight size={16} className="text-[#ad7d3f]" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-sans-num text-2xl font-bold tracking-tight text-white">
                        {displayWeight(account?.totalWeight || "0")}
                      </span>
                      <span className="text-xs text-[#ad7d3f] font-semibold">جم</span>
                    </div>
                    <p className="text-[10px] text-[#c7b8a8] mt-1">الرصيد القائم</p>
                  </div>
                </div>

                {/* Cash Balance Card */}
                <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm border border-white/10 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[#d6c8b8] mb-1.5">
                    <span className="text-xs font-medium">إجمالي النقدية</span>
                    <Wallet size={16} className="text-[#ad7d3f]" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-sans-num text-2xl font-bold tracking-tight text-white">
                        {displayCash(account?.totalCash || "0")}
                      </span>
                      <span className="text-xs text-[#ad7d3f] font-semibold">ج.م</span>
                    </div>
                    <p className="text-[10px] text-[#c7b8a8] mt-1">الرصيد القائم</p>
                  </div>
                </div>
              </div>
            </div>

            {isBlocked && (
              <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 p-3 text-amber-200 text-xs backdrop-blur-xs">
                <EyeOff size={18} className="shrink-0 text-amber-400" />
                <p className="leading-relaxed">
                  تم حظر عرض الأرقام والمعاملات المالية مؤقتاً بواسطة الإدارة.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Search and Category Filter Pills */}
        <section className="space-y-3">
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8d7c6a]" size={17} />
            <Input
              type="text"
              placeholder="ابحث في الحركات أو الوصف أو التاريخ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-11 rounded-2xl bg-white border-[#e5ded4] pr-10 pl-4 text-sm text-[#201b17] placeholder:text-[#a18f7d] focus:border-[#ad7d3f] shadow-xs"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setFilterType("all")}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-2xs ${
                filterType === "all"
                  ? "bg-[#201b17] text-white"
                  : "bg-white text-[#5c4d3e] border border-[#e5ded4] hover:bg-[#faf8f5]"
              }`}
            >
              <span>الكل</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-sans-num ${
                filterType === "all" ? "bg-white/20 text-white" : "bg-[#f4efe8] text-[#8d7c6a]"
              }`}>
                {stats.total}
              </span>
            </button>

            <button
              onClick={() => setFilterType("work")}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-2xs ${
                filterType === "work"
                  ? "bg-[#ad7d3f] text-white"
                  : "bg-white text-[#7b582b] border border-[#e5ded4] hover:bg-amber-50/50"
              }`}
            >
              <ArrowUpRight size={13} className={filterType === "work" ? "text-white" : "text-[#ad7d3f]"} />
              <span>شغل (+)</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-sans-num ${
                filterType === "work" ? "bg-white/20 text-white" : "bg-amber-50 text-[#7b582b]"
              }`}>
                {stats.workCount}
              </span>
            </button>

            <button
              onClick={() => setFilterType("breakage")}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-2xs ${
                filterType === "breakage"
                  ? "bg-rose-700 text-white"
                  : "bg-white text-rose-800 border border-[#e5ded4] hover:bg-rose-50/50"
              }`}
            >
              <ArrowDownLeft size={13} className={filterType === "breakage" ? "text-white" : "text-rose-600"} />
              <span>كسر (-)</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-sans-num ${
                filterType === "breakage" ? "bg-white/20 text-white" : "bg-rose-50 text-rose-700"
              }`}>
                {stats.breakageCount}
              </span>
            </button>
          </div>
        </section>

        {/* Transaction History Section Header */}
        <div className="flex items-center justify-between pt-1">
          <h3 className="font-serif text-base font-bold text-[#201b17] flex items-center gap-2">
            <FileText size={18} className="text-[#ad7d3f]" />
            سجل الحركات والمعاملات
          </h3>
          <span className="text-xs text-[#8d7c6a] font-medium">
            {filteredEntries.length} {filteredEntries.length === 1 ? "حركة" : "حركات"}
          </span>
        </div>

        {/* Mobile Transaction Cards Feed */}
        {entriesQuery.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse rounded-2xl bg-white p-4 border border-[#e5ded4] shadow-xs space-y-3">
                <div className="h-4 w-28 bg-[#f0e9df] rounded-md" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-12 bg-[#faf7f2] rounded-xl" />
                  <div className="h-12 bg-[#faf7f2] rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="rounded-3xl border border-[#e5ded4] bg-white p-8 text-center shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f5] text-[#ad7d3f] border border-[#e5ded4] mb-3">
              <Filter size={24} />
            </div>
            <p className="font-serif text-lg font-bold text-[#201b17]">لا توجد حركات مطابقة</p>
            <p className="mt-1 text-xs text-[#8d7c6a]">
              {search ? "لم يتم العثور على نتائج تطابق معيار البحث الحالي." : "لم يتم تسجيل أية حركات على هذا الحساب بعد."}
            </p>
            {search && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearch("")}
                className="mt-4 rounded-xl border-[#e5ded4] text-xs font-semibold text-[#5c4d3e]"
              >
                مسح البحث
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map(entry => {
              const isBreakage = entry.type === "breakage";

              return (
                <article
                  key={entry.id}
                  className={`relative overflow-hidden rounded-2xl border p-4 transition shadow-xs ${
                    isBreakage
                      ? "bg-rose-50/70 border-rose-200"
                      : "bg-white border-[#e5ded4] hover:border-[#ad7d3f]/40"
                  }`}
                >
                  {/* Left Accent Stripe */}
                  <div
                    className={`absolute top-0 right-0 bottom-0 w-1.5 ${
                      isBreakage ? "bg-rose-500" : "bg-[#ad7d3f]"
                    }`}
                  />

                  <div className="space-y-3 pr-2">
                    {/* Header: Date + Type Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-[#705e4d] font-medium">
                        <Calendar size={14} className="text-[#ad7d3f]" />
                        <span>{formatDate(entry.businessDate)}</span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-bold ${
                          isBreakage
                            ? "bg-rose-100/90 text-rose-800 border border-rose-200"
                            : "bg-[#f5ede1] text-[#916328] border border-[#eadbca]"
                        }`}
                      >
                        {isBreakage ? (
                          <>
                            <ArrowDownLeft size={13} className="text-rose-600" />
                            <span>كسر (-)</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpRight size={13} className="text-[#ad7d3f]" />
                            <span>شغل (+)</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Weight and Cash Highlights in Cards */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div
                        className={`rounded-xl p-2.5 border ${
                          isBreakage
                            ? "bg-white/80 border-rose-100"
                            : "bg-[#faf8f5] border-[#ede5da]"
                        }`}
                      >
                        <span className="block text-[11px] font-semibold text-[#8d7c6a] mb-0.5">الوزن</span>
                        <div className="flex items-baseline gap-1">
                          <span
                            className={`font-sans-num text-base font-bold ${
                              isBreakage ? "text-rose-700" : "text-[#201b17]"
                            }`}
                          >
                            {isBreakage && !isBlocked ? `-${displayWeight(entry.weight)}` : displayWeight(entry.weight)}
                          </span>
                          <span className="text-[11px] font-semibold text-[#ad7d3f]">جم</span>
                        </div>
                      </div>

                      <div
                        className={`rounded-xl p-2.5 border ${
                          isBreakage
                            ? "bg-white/80 border-rose-100"
                            : "bg-[#faf8f5] border-[#ede5da]"
                        }`}
                      >
                        <span className="block text-[11px] font-semibold text-[#8d7c6a] mb-0.5">النقدية</span>
                        <div className="flex items-baseline gap-1">
                          <span
                            className={`font-sans-num text-base font-bold ${
                              isBreakage ? "text-rose-700" : "text-[#201b17]"
                            }`}
                          >
                            {isBreakage && !isBlocked ? `-${displayCash(entry.cash)}` : displayCash(entry.cash)}
                          </span>
                          <span className="text-[11px] font-semibold text-[#ad7d3f]">ج.م</span>
                        </div>
                      </div>
                    </div>

                    {/* Description and Notes */}
                    <div className="space-y-1 pt-0.5">
                      {entry.description ? (
                        <p className="text-xs font-semibold text-[#201b17] leading-relaxed">
                          {entry.description}
                        </p>
                      ) : (
                        <p className="text-xs italic text-[#a89989]">بدون وصف إضافي</p>
                      )}

                      {entry.notes && (
                        <div className="rounded-lg bg-black/5 p-2 text-[11px] text-[#5c4d3e] leading-snug">
                          <span className="font-semibold ml-1">ملاحظة:</span>
                          {entry.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
