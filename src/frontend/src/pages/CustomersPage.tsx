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
import {
  ChevronRight,
  Loader2,
  MapPin,
  Phone,
  Search,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLang } from "../App";
import { Variant_paid_locked_draft_partial } from "../backend";
import {
  extractErrorMessage,
  useAddCustomer,
  useCustomers,
  useInvoicesByCustomer,
} from "../hooks/useQueries";
import { t } from "../translations";

function CustomerHistoryPanel({
  phone,
  lang,
}: { phone: string; lang: "en" | "mr" }) {
  const { data: invoices = [], isLoading } = useInvoicesByCustomer(phone);

  if (isLoading) return <Skeleton className="h-24" />;

  const totalPurchases = invoices.reduce((s, inv) => s + inv.totalAmount, 0);
  const totalUdhar = invoices.reduce((s, inv) => s + inv.udhar, 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            {t(lang, "totalPurchases")}
          </p>
          <p className="font-bold text-primary">
            ₹{totalPurchases.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-secondary rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            {t(lang, "udharAmount")}
          </p>
          <p
            className={`font-bold ${totalUdhar > 0 ? "text-yellow-400" : "text-green-400"}`}
          >
            ₹{totalUdhar.toLocaleString("en-IN")}
          </p>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {t(lang, "purchaseHistory")}
        </p>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t(lang, "noData")}</p>
        ) : (
          <div className="space-y-2">
            {invoices.slice(0, 5).map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{inv.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(
                      Number(inv.createdAt) / 1_000_000,
                    ).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    ₹{inv.totalAmount.toLocaleString("en-IN")}
                  </span>
                  {inv.status === Variant_paid_locked_draft_partial.paid ? (
                    <Badge className="bg-green-500/20 text-green-400 text-xs">
                      PAID
                    </Badge>
                  ) : inv.udhar > 0 ? (
                    <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                      ₹{inv.udhar.toLocaleString("en-IN")} UDHAR
                    </Badge>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const { lang } = useLang();
  const {
    data: customers = [],
    isLoading,
    error: customersError,
  } = useCustomers();
  const addCustomer = useAddCustomer();

  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newCust, setNewCust] = useState({ name: "", phone: "", address: "" });
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const filtered = customers.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );

  async function handleAdd() {
    if (!newCust.name || !newCust.phone) {
      toast.error(
        lang === "mr" ? "नाव आणि फोन आवश्यक" : "Name and phone are required",
      );
      return;
    }
    try {
      await addCustomer.mutateAsync(newCust);
      setAddOpen(false);
      setNewCust({ name: "", phone: "", address: "" });
      toast.success(
        lang === "mr" ? "ग्राहक जोडला" : "Customer added successfully",
      );
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl md:text-3xl font-bold">
          {t(lang, "customersTitle")}
        </h1>
        <Button
          data-ocid="customers.open_modal_button"
          className="gold-gradient text-primary-foreground font-semibold"
          onClick={() => setAddOpen(true)}
        >
          <UserPlus size={16} className="mr-2" />
          {t(lang, "addCustomer")}
        </Button>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          data-ocid="customers.search_input"
          placeholder={t(lang, "searchCustomer")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-input"
        />
      </div>

      {customersError ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-destructive font-medium">
            {lang === "mr"
              ? "ग्राहक लोड करता आले नाही"
              : "Could not load customers"}
          </p>
          <p className="text-xs text-muted-foreground font-mono bg-secondary p-2 rounded">
            {extractErrorMessage(customersError)}
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div data-ocid="customers.empty_state" className="text-center py-16">
          <UserPlus
            size={40}
            className="mx-auto mb-3 text-muted-foreground opacity-40"
          />
          <p className="text-muted-foreground">{t(lang, "noCustomers")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((customer, idx) => (
            <Card
              key={customer.phone}
              data-ocid={`customers.item.${idx + 1}`}
              className="bg-card gold-border hover:border-primary/60 transition-colors cursor-pointer"
              onClick={() => {
                setSelectedPhone(customer.phone);
                setHistoryOpen(true);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{customer.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Phone size={11} />
                      <span>{customer.phone}</span>
                    </div>
                    {customer.address && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin size={11} />
                        <span className="truncate">{customer.address}</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-muted-foreground flex-shrink-0 mt-0.5"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add customer modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent
          data-ocid="customers.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              {t(lang, "addCustomer")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t(lang, "name")}</Label>
              <Input
                data-ocid="customers.input"
                value={newCust.name}
                onChange={(e) =>
                  setNewCust((p) => ({ ...p, name: e.target.value }))
                }
                className="bg-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t(lang, "phoneNo")}</Label>
              <Input
                data-ocid="customers.input"
                type="tel"
                value={newCust.phone}
                onChange={(e) =>
                  setNewCust((p) => ({ ...p, phone: e.target.value }))
                }
                className="bg-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t(lang, "address")}</Label>
              <Input
                data-ocid="customers.input"
                value={newCust.address}
                onChange={(e) =>
                  setNewCust((p) => ({ ...p, address: e.target.value }))
                }
                className="bg-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="customers.cancel_button"
              variant="outline"
              onClick={() => setAddOpen(false)}
            >
              {t(lang, "cancel")}
            </Button>
            <Button
              data-ocid="customers.confirm_button"
              className="gold-gradient text-primary-foreground"
              onClick={handleAdd}
              disabled={addCustomer.isPending}
            >
              {addCustomer.isPending ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : null}
              {t(lang, "saveCustomer")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer history modal */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent
          data-ocid="customers.dialog"
          className="bg-card border-border max-w-lg"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              {customers.find((c) => c.phone === selectedPhone)?.name ??
                t(lang, "viewHistory")}
            </DialogTitle>
          </DialogHeader>
          {selectedPhone && (
            <CustomerHistoryPanel phone={selectedPhone} lang={lang} />
          )}
          <DialogFooter>
            <Button
              data-ocid="customers.close_button"
              variant="outline"
              onClick={() => setHistoryOpen(false)}
            >
              {t(lang, "close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
