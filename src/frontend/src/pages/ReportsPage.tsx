import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileCheck, FileMinus, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useLang } from "../App";
import { Variant_paid_locked_draft_partial } from "../backend";
import { useInvoices, useReports } from "../hooks/useQueries";
import { t } from "../translations";

type Period = "today" | "week" | "month" | "year";

function isInPeriod(timestampNs: bigint, period: Period): boolean {
  const ms = Number(timestampNs) / 1_000_000;
  const now = new Date();
  const d = new Date(ms);
  if (period === "today") {
    return d.toDateString() === now.toDateString();
  }
  if (period === "week") {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  }
  if (period === "month") {
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }
  return d.getFullYear() === now.getFullYear();
}

export default function ReportsPage() {
  const { lang } = useLang();
  const [period, setPeriod] = useState<Period>("month");
  const { isLoading } = useReports();
  const { data: invoices = [] } = useInvoices();

  const periodInvoices = invoices.filter((inv) =>
    isInPeriod(inv.createdAt, period),
  );
  const periodSales = periodInvoices.reduce((s, inv) => s + inv.totalAmount, 0);
  const periodPaid = periodInvoices.filter(
    (inv) => inv.status === Variant_paid_locked_draft_partial.paid,
  ).length;
  const periodUnpaid = periodInvoices.filter(
    (inv) => inv.status !== Variant_paid_locked_draft_partial.paid,
  ).length;
  const periodUdhar = periodInvoices.reduce((s, inv) => s + inv.udhar, 0);

  const statCards = [
    {
      key: "totalSales",
      value: `₹${periodSales.toLocaleString("en-IN")}`,
      icon: <TrendingUp size={22} />,
      color: "text-chart-1",
      bg: "bg-chart-1/10",
    },
    {
      key: "pendingUdhar",
      value: `₹${periodUdhar.toLocaleString("en-IN")}`,
      icon: <BookOpen size={22} />,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
    },
    {
      key: "paidInvoices",
      value: periodPaid.toString(),
      icon: <FileCheck size={22} />,
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      key: "unpaidInvoices",
      value: periodUnpaid.toString(),
      icon: <FileMinus size={22} />,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl md:text-3xl font-bold">
        {t(lang, "reportsTitle")}
      </h1>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <TabsList className="bg-secondary">
          <TabsTrigger data-ocid="reports.tab" value="today">
            {t(lang, "today")}
          </TabsTrigger>
          <TabsTrigger data-ocid="reports.tab" value="week">
            {t(lang, "thisWeek")}
          </TabsTrigger>
          <TabsTrigger data-ocid="reports.tab" value="month">
            {t(lang, "thisMonth")}
          </TabsTrigger>
          <TabsTrigger data-ocid="reports.tab" value="year">
            {t(lang, "thisYear")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat) => (
          <Card key={stat.key} className="bg-card gold-border">
            <CardContent className="p-4">
              <div
                className={`${stat.bg} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}
              >
                <span className={stat.color}>{stat.icon}</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-24 mb-1" />
              ) : (
                <p className="text-xl font-bold font-display">{stat.value}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {t(lang, stat.key)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary table */}
      <Card className="bg-card gold-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg">
            {t(lang, "salesSummary")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                    {t(lang, "invoiceNo")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                    {t(lang, "date")}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">
                    {t(lang, "grandTotal")}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">
                    {t(lang, "udharBalance")}
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">
                    {t(lang, "status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {periodInvoices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {t(lang, "noData")}
                    </td>
                  </tr>
                ) : (
                  periodInvoices.slice(0, 20).map((inv, idx) => (
                    <tr
                      key={inv.id}
                      data-ocid={`reports.item.${idx + 1}`}
                      className="border-b border-border last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-4 py-3 font-medium text-primary">
                        {inv.id}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(
                          Number(inv.createdAt) / 1_000_000,
                        ).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        ₹{inv.totalAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right text-yellow-400">
                        {inv.udhar > 0
                          ? `₹${inv.udhar.toLocaleString("en-IN")}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {inv.status ===
                        Variant_paid_locked_draft_partial.paid ? (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                            PAID
                          </span>
                        ) : inv.status ===
                          Variant_paid_locked_draft_partial.partial ? (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                            PARTIAL
                          </span>
                        ) : (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            {(typeof inv.status === "string"
                              ? inv.status
                              : (Object.keys(inv.status as object)[0] ?? "")
                            ).toUpperCase()}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
