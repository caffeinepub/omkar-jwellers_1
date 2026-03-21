import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  FileText,
  Loader2,
  PlusCircle,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth, useLang } from "../App";
import { Variant_paid_locked_draft_partial } from "../backend";
import { useCustomers, useInvoices, useReports } from "../hooks/useQueries";
import { t } from "../translations";

export default function DashboardPage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const { data: reports, isLoading: reportsLoading } = useReports();
  const { data: invoices } = useInvoices();
  const { data: customers } = useCustomers();

  const recentInvoices = [...(invoices ?? [])]
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .slice(0, 6);

  const stats = [
    {
      key: "totalSales",
      value: `₹${(reports?.totalSales ?? 0).toLocaleString("en-IN")}`,
      icon: <TrendingUp size={20} />,
      color: "text-chart-1",
    },
    {
      key: "totalCustomers",
      value: (customers ?? []).length.toString(),
      icon: <Users size={20} />,
      color: "text-chart-2",
    },
    {
      key: "pendingUdhar",
      value: `₹${(reports?.totalUdhar ?? 0).toLocaleString("en-IN")}`,
      icon: <BookOpen size={20} />,
      color: "text-destructive",
    },
    {
      key: "totalInvoices",
      value: Number(reports?.counts?.total ?? 0n).toString(),
      icon: <FileText size={20} />,
      color: "text-chart-4",
    },
  ];

  function getStatusBadge(status: Variant_paid_locked_draft_partial) {
    if (status === Variant_paid_locked_draft_partial.paid)
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          PAID
        </Badge>
      );
    if (status === Variant_paid_locked_draft_partial.partial)
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          PARTIAL
        </Badge>
      );
    if (status === Variant_paid_locked_draft_partial.locked)
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          LOCKED
        </Badge>
      );
    return <Badge className="bg-muted text-muted-foreground">DRAFT</Badge>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">
            {t(lang, "dashboard")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {lang === "mr" ? `नमस्कार, ${user?.name}` : `Welcome, ${user?.name}`}
          </p>
        </div>
        <Button
          data-ocid="dashboard.primary_button"
          onClick={() => {
            window.location.hash = "/billing";
          }}
          className="gold-gradient text-primary-foreground font-semibold"
        >
          <PlusCircle size={16} className="mr-2" />
          {t(lang, "billing")}
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="bg-card gold-border card-glow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`${stat.color} bg-current/10 p-2 rounded-md`}
                  >
                    <span className={stat.color}>{stat.icon}</span>
                  </span>
                </div>
                {reportsLoading ? (
                  <Loader2
                    size={16}
                    className="animate-spin text-muted-foreground"
                  />
                ) : (
                  <p className="text-xl font-bold font-display">{stat.value}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {t(lang, stat.key)}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent invoices */}
      <Card className="bg-card gold-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg">
            {t(lang, "recentInvoices")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentInvoices.length === 0 ? (
            <div
              data-ocid="dashboard.empty_state"
              className="text-center py-8 text-muted-foreground"
            >
              <FileText size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t(lang, "noData")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentInvoices.map((inv, idx) => (
                <div
                  key={inv.id}
                  data-ocid={`dashboard.item.${idx + 1}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold">{inv.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(
                        Number(inv.createdAt) / 1_000_000,
                      ).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-primary">
                      ₹{inv.totalAmount.toLocaleString("en-IN")}
                    </p>
                    {getStatusBadge(inv.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => {
                        window.location.hash = `/view-invoice/${inv.id}`;
                      }}
                    >
                      {t(lang, "viewInvoice")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
