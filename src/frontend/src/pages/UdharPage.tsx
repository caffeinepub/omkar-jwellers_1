import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, CheckCircle2, Loader2, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLang } from "../App";
import { Variant_paid_locked_draft_partial } from "../backend";
import type { Invoice } from "../backend";
import {
  useCustomers,
  useInvoices,
  useReceivePayment,
  useUdharLedger,
} from "../hooks/useQueries";
import { t } from "../translations";

interface CustomerUdharSummary {
  customerId: string;
  customerName: string;
  customerPhone: string;
  totalUdhar: number;
  lastInvoice: Invoice | null;
  invoices: Invoice[];
}

export default function UdharPage() {
  const { lang } = useLang();
  const { data: udharInvoices = [], isLoading } = useUdharLedger();
  const { data: allInvoices = [] } = useInvoices();
  const { data: customers = [] } = useCustomers();
  const receivePayment = useReceivePayment();

  const [filter, setFilter] = useState<"all" | "pending" | "cleared">(
    "pending",
  );
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] =
    useState<CustomerUdharSummary | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentError, setPaymentError] = useState("");

  // Group udhar by customer
  const customerSummaries = (() => {
    const map = new Map<string, CustomerUdharSummary>();

    // Start with all invoices to detect cleared customers too
    const relevantInvoices = [
      ...udharInvoices,
      ...allInvoices.filter(
        (inv) =>
          inv.status === Variant_paid_locked_draft_partial.paid &&
          inv.udhar === 0,
      ),
    ];

    for (const inv of relevantInvoices) {
      const existing = map.get(inv.customerId);
      const customer = customers.find((c) => c.phone === inv.customerId);
      if (!existing) {
        map.set(inv.customerId, {
          customerId: inv.customerId,
          customerName: customer?.name ?? inv.customerId,
          customerPhone: customer?.phone ?? inv.customerId,
          totalUdhar: inv.udhar,
          lastInvoice: inv,
          invoices: [inv],
        });
      } else {
        existing.totalUdhar += inv.udhar;
        existing.invoices.push(inv);
        if (
          !existing.lastInvoice ||
          Number(inv.updatedAt) > Number(existing.lastInvoice.updatedAt)
        ) {
          existing.lastInvoice = inv;
        }
      }
    }
    return Array.from(map.values());
  })();

  const filtered = customerSummaries.filter((s) => {
    if (filter === "pending") return s.totalUdhar > 0;
    if (filter === "cleared") return s.totalUdhar === 0;
    return true;
  });

  const totalPendingUdhar = customerSummaries.reduce(
    (sum, s) => sum + s.totalUdhar,
    0,
  );

  function openPaymentModal(summary: CustomerUdharSummary) {
    setPaymentTarget(summary);
    setPaymentAmount("");
    setPaymentError("");
    setPaymentOpen(true);
  }

  async function handleReceivePayment() {
    if (!paymentTarget) return;
    const amount = Number.parseFloat(paymentAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setPaymentError(lang === "mr" ? "রक्कम ভরা" : "Enter a valid amount");
      return;
    }
    if (amount > paymentTarget.totalUdhar) {
      setPaymentError(
        lang === "mr" ? "রक्कम उधाরापেक्ষা তরাল" : "Amount exceeds udhar balance",
      );
      return;
    }

    // Find the latest unpaid invoice for this customer
    const unpaidInvoice = paymentTarget.invoices
      .filter(
        (inv) =>
          inv.udhar > 0 &&
          inv.status !== Variant_paid_locked_draft_partial.paid,
      )
      .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))[0];

    if (!unpaidInvoice) {
      toast.error(
        lang === "mr" ? "उधार पावती सापडली नाही" : "No unpaid invoice found",
      );
      return;
    }

    try {
      await receivePayment.mutateAsync({ invoiceId: unpaidInvoice.id, amount });
      toast.success(t(lang, "paymentSuccess"));
      setPaymentOpen(false);
    } catch {
      toast.error(t(lang, "error"));
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl md:text-3xl font-bold">
          {t(lang, "udharTitle")}
        </h1>
        <div className="bg-card border border-border rounded-lg px-4 py-2">
          <p className="text-xs text-muted-foreground">
            {t(lang, "totalUdhar")}
          </p>
          <p className="text-xl font-bold text-yellow-400">
            ₹{totalPendingUdhar.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as "all" | "pending" | "cleared")}
      >
        <TabsList className="bg-secondary">
          <TabsTrigger data-ocid="udhar.tab" value="all">
            {t(lang, "all")}
          </TabsTrigger>
          <TabsTrigger data-ocid="udhar.tab" value="pending">
            {t(lang, "pending")}
          </TabsTrigger>
          <TabsTrigger data-ocid="udhar.tab" value="cleared">
            {t(lang, "cleared")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div data-ocid="udhar.empty_state" className="text-center py-16">
          <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground">{t(lang, "noUdhar")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((summary, idx) => (
            <Card
              key={summary.customerId}
              data-ocid={`udhar.item.${idx + 1}`}
              className={`bg-card ${
                summary.totalUdhar > 0 ? "border-yellow-500/30" : "gold-border"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{summary.customerName}</p>
                      {summary.totalUdhar === 0 ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          <CheckCircle2 size={10} className="mr-1" />
                          {t(lang, "paidBadge")}
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                          {t(lang, "partialBadge")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {summary.customerPhone}
                    </p>
                    {summary.lastInvoice && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t(lang, "lastPayment")}:{" "}
                        {new Date(
                          Number(summary.lastInvoice.updatedAt) / 1_000_000,
                        ).toLocaleDateString("en-IN")}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {t(lang, "totalUdhar")}
                      </p>
                      <p
                        className={`text-lg font-bold ${
                          summary.totalUdhar > 0
                            ? "text-yellow-400"
                            : "text-green-400"
                        }`}
                      >
                        ₹{summary.totalUdhar.toLocaleString("en-IN")}
                      </p>
                    </div>

                    {summary.totalUdhar > 0 && (
                      <Button
                        data-ocid={`udhar.primary_button.${idx + 1}`}
                        size="sm"
                        className="gold-gradient text-primary-foreground font-semibold"
                        onClick={() => openPaymentModal(summary)}
                      >
                        <Wallet size={14} className="mr-1.5" />
                        {t(lang, "receivePayment")}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Mini invoice list */}
                {summary.invoices.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="space-y-1.5">
                      {summary.invoices.slice(0, 3).map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-muted-foreground">
                            {inv.id}
                          </span>
                          <div className="flex items-center gap-2">
                            {inv.udhar > 0 && (
                              <span className="text-yellow-400">
                                ₹{inv.udhar.toLocaleString("en-IN")} udhar
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 text-xs px-2"
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
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Receive Payment Modal */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent
          data-ocid="udhar.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              {t(lang, "receivePayment")}
            </DialogTitle>
          </DialogHeader>
          {paymentTarget && (
            <div className="space-y-4">
              <div className="bg-secondary rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t(lang, "customerName")}
                  </span>
                  <span className="font-semibold">
                    {paymentTarget.customerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t(lang, "totalUdhar")}
                  </span>
                  <span className="font-bold text-yellow-400">
                    ₹{paymentTarget.totalUdhar.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t(lang, "paymentAmount")}</Label>
                <Input
                  data-ocid="udhar.input"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => {
                    setPaymentAmount(e.target.value);
                    setPaymentError("");
                  }}
                  placeholder="0"
                  className="bg-input text-base"
                  max={paymentTarget.totalUdhar}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() =>
                      setPaymentAmount(String(paymentTarget.totalUdhar))
                    }
                  >
                    {lang === "mr" ? "पूर्ण रक्कम" : "Full Amount"}
                  </Button>
                </div>
                {paymentError && (
                  <p
                    data-ocid="udhar.error_state"
                    className="text-xs text-destructive"
                  >
                    {paymentError}
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              data-ocid="udhar.cancel_button"
              variant="outline"
              onClick={() => setPaymentOpen(false)}
            >
              {t(lang, "cancel")}
            </Button>
            <Button
              data-ocid="udhar.confirm_button"
              className="gold-gradient text-primary-foreground"
              onClick={handleReceivePayment}
              disabled={receivePayment.isPending}
            >
              {receivePayment.isPending ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : null}
              {t(lang, "submitPayment")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
