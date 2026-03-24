import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  ChevronDown,
  Edit2,
  Loader2,
  PlusCircle,
  Trash2,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useLang } from "../App";
import type { InvoiceItem } from "../backend";
import {
  useAddCustomer,
  useCreateInvoice,
  useCustomers,
  useGoldRates,
  useUpdateGoldRates,
} from "../hooks/useQueries";
import { t } from "../translations";

interface BillingItem extends InvoiceItem {
  tempId: string;
  makingCharges: number;
  makingChargeType: "fixed" | "percent";
}

interface EditingState {
  tempId: string;
  description: string;
  purity: string;
  weight: string;
  rate: string;
}

const PURITY_OPTIONS = [
  { label: "24K", key: "gold24k" },
  { label: "22K", key: "gold22k" },
  { label: "18K", key: "gold18k" },
  { label: "Silver", key: "silver" },
];

export default function BillingPage() {
  const { lang } = useLang();
  const { data: customers = [] } = useCustomers();
  const { data: goldRatesData } = useGoldRates();
  const createInvoice = useCreateInvoice();
  const addCustomer = useAddCustomer();
  const updateGoldRates = useUpdateGoldRates();

  const goldRates = goldRatesData ?? {
    gold24k: 0,
    gold22k: 0,
    gold18k: 0,
    silver: 0,
  };

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [invoiceLang, setInvoiceLang] = useState<"en" | "mr">(lang);
  const [items, setItems] = useState<BillingItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditingState | null>(null);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [cgstPct, setCgstPct] = useState("1.5");
  const [sgstPct, setSgstPct] = useState("1.5");
  const [amountPaid, setAmountPaid] = useState("0");
  const [notes, setNotes] = useState("");
  const [_generatedInvoiceId, setGeneratedInvoiceId] = useState<string | null>(
    null,
  );

  // Gold rate editing
  const [editingRates, setEditingRates] = useState(false);
  const [rateInputs, setRateInputs] = useState({
    gold24k: "",
    gold22k: "",
    gold18k: "",
    silver: "",
  });

  // Add item modal
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    description: "",
    purity: "22K",
    weight: "",
    rate: String(goldRates.gold22k || ""),
    makingCharges: "",
    makingChargeType: "fixed" as "fixed" | "percent",
  });

  // Add customer modal
  const [addCustOpen, setAddCustOpen] = useState(false);
  const [newCust, setNewCust] = useState({ name: "", phone: "", address: "" });

  // Customer filter
  const [custSearch, setCustSearch] = useState("");
  const [custDropOpen, setCustDropOpen] = useState(false);

  const subtotal = items.reduce((sum, it) => sum + it.total, 0);
  const cgstAmount = gstEnabled
    ? (subtotal * (Number.parseFloat(cgstPct) || 0)) / 100
    : 0;
  const sgstAmount = gstEnabled
    ? (subtotal * (Number.parseFloat(sgstPct) || 0)) / 100
    : 0;
  const grandTotal = Math.round(subtotal + cgstAmount + sgstAmount);
  const paidAmt = Number.parseFloat(amountPaid) || 0;
  const udharBalance = Math.max(0, grandTotal - paidAmt);

  const generateTempId = () =>
    `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  function getRateForPurity(purity: string): number {
    if (purity === "24K") return goldRates.gold24k || 0;
    if (purity === "22K") return goldRates.gold22k || 0;
    if (purity === "18K") return goldRates.gold18k || 0;
    if (purity === "Silver") return goldRates.silver || 0;
    return 0;
  }

  function handlePurityChange(purity: string) {
    const rate = getRateForPurity(purity);
    setNewItem((p) => ({
      ...p,
      purity,
      rate: rate > 0 ? String(rate) : p.rate,
    }));
  }

  function addItem() {
    const weight = Number.parseFloat(newItem.weight);
    const rate = Number.parseFloat(newItem.rate);
    if (
      !newItem.description ||
      Number.isNaN(weight) ||
      weight <= 0 ||
      Number.isNaN(rate) ||
      rate <= 0
    ) {
      toast.error(
        lang === "mr" ? "कृपया सर्व माहिती भरा" : "Please fill all item details",
      );
      return;
    }
    const baseAmount = weight * rate;
    const mc = Number.parseFloat(newItem.makingCharges) || 0;
    const makingChargesAmount =
      newItem.makingChargeType === "percent" ? (baseAmount * mc) / 100 : mc;
    const item: BillingItem = {
      tempId: generateTempId(),
      description: newItem.description,
      purity: Number.parseFloat(newItem.purity) || 22,
      weight,
      rate,
      makingCharges: makingChargesAmount,
      makingChargeType: newItem.makingChargeType,
      total: baseAmount + makingChargesAmount,
    };
    setItems((prev) => [...prev, item]);
    setNewItem({
      description: "",
      purity: "22K",
      weight: "",
      rate: String(goldRates.gold22k || ""),
      makingCharges: "",
      makingChargeType: "fixed",
    });
    setAddItemOpen(false);
  }

  function startEdit(item: BillingItem) {
    setEditingId(item.tempId);
    setEditState({
      tempId: item.tempId,
      description: item.description,
      purity: item.purity.toString(),
      weight: item.weight.toString(),
      rate: item.rate.toString(),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditState(null);
  }

  function saveEdit() {
    if (!editState) return;
    const weight = Number.parseFloat(editState.weight);
    const rate = Number.parseFloat(editState.rate);
    if (!editState.description || Number.isNaN(weight) || Number.isNaN(rate)) {
      toast.error(
        lang === "mr" ? "कृपया सर्व माहिती भरा" : "Please fill all fields",
      );
      return;
    }
    setItems((prev) =>
      prev.map((it) =>
        it.tempId === editState.tempId
          ? {
              ...it,
              description: editState.description,
              purity: Number.parseFloat(editState.purity) || 22,
              weight,
              rate,
              total: weight * rate,
            }
          : it,
      ),
    );
    cancelEdit();
  }

  function deleteItem(tempId: string) {
    setItems((prev) => prev.filter((it) => it.tempId !== tempId));
  }

  const handleUpdateGoldRates = useCallback(async () => {
    const rates = {
      gold24k: Number.parseFloat(rateInputs.gold24k) || goldRates.gold24k,
      gold22k: Number.parseFloat(rateInputs.gold22k) || goldRates.gold22k,
      gold18k: Number.parseFloat(rateInputs.gold18k) || goldRates.gold18k,
      silver: Number.parseFloat(rateInputs.silver) || goldRates.silver,
    };
    try {
      await updateGoldRates.mutateAsync(rates);
      setEditingRates(false);
      toast.success(lang === "mr" ? "सोन्याचे दर अपडेट केले" : "Gold rates updated");
    } catch {
      toast.error(lang === "mr" ? "काहीतरी चुकले" : "Failed to update rates");
    }
  }, [rateInputs, goldRates, updateGoldRates, lang]);

  async function handleAddCustomer() {
    if (!newCust.name || !newCust.phone) {
      toast.error(
        lang === "mr" ? "नाव आणि फोन आवश्यक आहे" : "Name and phone are required",
      );
      return;
    }
    try {
      const id = await addCustomer.mutateAsync(newCust);
      setSelectedCustomerId(id);
      setAddCustOpen(false);
      setNewCust({ name: "", phone: "", address: "" });
      toast.success(lang === "mr" ? "ग्राहक जोडला" : "Customer added");
    } catch {
      toast.error(t(lang, "error"));
    }
  }

  async function handleSaveDraft() {
    if (!selectedCustomerId) {
      toast.error(lang === "mr" ? "ग्राहक निवडा" : "Please select a customer");
      return;
    }
    if (items.length === 0) {
      toast.error(
        lang === "mr" ? "किमान एक वस्तू जोडा" : "Add at least one item",
      );
      return;
    }
    try {
      const id = await createInvoice.mutateAsync({
        customerId: selectedCustomerId,
        items: items.map(
          ({ tempId: _t, makingCharges: _mc, makingChargeType: _mct, ...it }) =>
            it,
        ),
        gst: gstEnabled,
        gstPercent: gstEnabled
          ? (Number.parseFloat(cgstPct) || 0) +
            (Number.parseFloat(sgstPct) || 0)
          : 0,
        language: invoiceLang,
        notes,
        partialPayment: paidAmt,
      });
      toast.success(lang === "mr" ? "मसुदा जतन केला" : "Draft saved");
      setGeneratedInvoiceId(id);
    } catch {
      toast.error(t(lang, "error"));
    }
  }

  async function handleGenerateInvoice() {
    if (!selectedCustomerId) {
      toast.error(lang === "mr" ? "ग्राहक निवडा" : "Please select a customer");
      return;
    }
    if (items.length === 0) {
      toast.error(
        lang === "mr" ? "किमान एक वस्तू जोडा" : "Add at least one item",
      );
      return;
    }
    try {
      const id = await createInvoice.mutateAsync({
        customerId: selectedCustomerId,
        items: items.map(
          ({ tempId: _t, makingCharges: _mc, makingChargeType: _mct, ...it }) =>
            it,
        ),
        gst: gstEnabled,
        gstPercent: gstEnabled
          ? (Number.parseFloat(cgstPct) || 0) +
            (Number.parseFloat(sgstPct) || 0)
          : 0,
        language: invoiceLang,
        notes,
        partialPayment: paidAmt,
      });
      toast.success(lang === "mr" ? "पावती तयार केली!" : "Invoice generated!");
      setGeneratedInvoiceId(id);
      window.location.hash = `/view-invoice/${id}`;
    } catch {
      toast.error(t(lang, "error"));
    }
  }

  const filteredCustomers = customers.filter(
    (c) =>
      !custSearch ||
      c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
      c.phone.includes(custSearch),
  );
  const selectedCustomer = customers.find(
    (c) => c.phone === selectedCustomerId,
  );

  return (
    <div className="p-4 md:p-6 pb-32 md:pb-6 space-y-5 animate-fade-in">
      <h1 className="font-display text-2xl md:text-3xl font-bold">
        {t(lang, "newInvoice")}
      </h1>

      {/* Customer + Gold Rates row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer */}
        <div className="space-y-1.5">
          <Label>{t(lang, "selectCustomer")}</Label>
          <div className="relative">
            <button
              data-ocid="billing.select"
              type="button"
              onClick={() => setCustDropOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-md border border-border bg-input text-sm hover:border-primary/50 transition-colors"
            >
              <span
                className={
                  selectedCustomer ? "text-foreground" : "text-muted-foreground"
                }
              >
                {selectedCustomer
                  ? `${selectedCustomer.name} (${selectedCustomer.phone})`
                  : t(lang, "selectCustomer")}
              </span>
              <ChevronDown size={16} className="text-muted-foreground" />
            </button>
            {custDropOpen && (
              <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
                <div className="p-2">
                  <Input
                    placeholder={t(lang, "searchCustomer")}
                    value={custSearch}
                    onChange={(e) => setCustSearch(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setAddCustOpen(true);
                      setCustDropOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm text-primary hover:bg-muted/30 font-medium"
                  >
                    {t(lang, "addNewCustomer")}
                  </button>
                  {filteredCustomers.map((c) => (
                    <button
                      type="button"
                      key={c.phone}
                      onClick={() => {
                        setSelectedCustomerId(c.phone);
                        setCustDropOpen(false);
                        setCustSearch("");
                      }}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/30 transition-colors"
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted-foreground ml-2">
                        {c.phone}
                      </span>
                    </button>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <p className="px-3 py-3 text-sm text-muted-foreground">
                      {t(lang, "noCustomers")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gold Rates Panel */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>
              {lang === "mr"
                ? "सोने/चांदी दर (₹/ग्रॅम)"
                : "Gold/Silver Rates (₹/g)"}
            </Label>
            {!editingRates && (
              <Button
                data-ocid="billing.edit_button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-primary px-2"
                onClick={() => {
                  setRateInputs({
                    gold24k: String(goldRates.gold24k || ""),
                    gold22k: String(goldRates.gold22k || ""),
                    gold18k: String(goldRates.gold18k || ""),
                    silver: String(goldRates.silver || ""),
                  });
                  setEditingRates(true);
                }}
              >
                {t(lang, "editRate")}
              </Button>
            )}
          </div>
          {editingRates ? (
            <div className="bg-card border border-border rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {PURITY_OPTIONS.map((p) => (
                  <div key={p.key} className="space-y-1">
                    <Label className="text-xs">{p.label}</Label>
                    <Input
                      type="number"
                      value={rateInputs[p.key as keyof typeof rateInputs]}
                      onChange={(e) =>
                        setRateInputs((prev) => ({
                          ...prev,
                          [p.key]: e.target.value,
                        }))
                      }
                      placeholder="₹/g"
                      className="h-8 bg-input text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={handleUpdateGoldRates}
                  disabled={updateGoldRates.isPending}
                  className="gold-gradient text-primary-foreground flex-1"
                >
                  {updateGoldRates.isPending ? (
                    <Loader2 size={14} className="animate-spin mr-1" />
                  ) : (
                    <Check size={14} className="mr-1" />
                  )}
                  {lang === "mr" ? "जतन करा" : "Save Rates"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingRates(false)}
                >
                  <X size={14} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {PURITY_OPTIONS.map((p) => (
                <div
                  key={p.key}
                  className="bg-card border border-border rounded-md px-2 py-1.5 text-center"
                >
                  <p className="text-xs text-muted-foreground">{p.label}</p>
                  <p className="text-sm font-bold text-primary">
                    {goldRates[p.key as keyof typeof goldRates] > 0 ? (
                      `₹${Number(goldRates[p.key as keyof typeof goldRates]).toLocaleString("en-IN")}`
                    ) : (
                      <span className="text-muted-foreground text-xs">--</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Items table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{t(lang, "itemsTable")}</h2>
          <Button
            data-ocid="billing.primary_button"
            size="sm"
            className="gold-gradient text-primary-foreground"
            onClick={() => {
              setNewItem((prev) => ({
                ...prev,
                rate: String(goldRates.gold22k || ""),
              }));
              setAddItemOpen(true);
            }}
          >
            <PlusCircle size={14} className="mr-1.5" />
            {t(lang, "addItem")}
          </Button>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground w-10">
                    {t(lang, "srNo")}
                  </th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">
                    {t(lang, "itemDescription")}
                  </th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground w-20">
                    {t(lang, "purity")}
                  </th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground w-24">
                    {t(lang, "weight")}
                  </th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground w-28">
                    {t(lang, "rate")}
                  </th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground w-28">
                    {t(lang, "total")}
                  </th>
                  <th className="px-3 py-2.5 w-24" />
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      <p data-ocid="billing.empty_state">
                        {t(lang, "noItems")}
                      </p>
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr
                      key={item.tempId}
                      data-ocid={`billing.item.${idx + 1}`}
                      className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      {editingId === item.tempId && editState ? (
                        <>
                          <td className="px-3 py-2 text-muted-foreground">
                            {idx + 1}
                          </td>
                          <td className="px-2 py-1.5">
                            <Input
                              value={editState.description}
                              onChange={(e) =>
                                setEditState((s) =>
                                  s ? { ...s, description: e.target.value } : s,
                                )
                              }
                              className="h-8 text-sm bg-secondary"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <Input
                              value={editState.purity}
                              onChange={(e) =>
                                setEditState((s) =>
                                  s ? { ...s, purity: e.target.value } : s,
                                )
                              }
                              className="h-8 text-sm w-16 bg-secondary"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <Input
                              type="number"
                              value={editState.weight}
                              onChange={(e) =>
                                setEditState((s) =>
                                  s ? { ...s, weight: e.target.value } : s,
                                )
                              }
                              className="h-8 text-sm w-20 bg-secondary text-right"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <Input
                              type="number"
                              value={editState.rate}
                              onChange={(e) =>
                                setEditState((s) =>
                                  s ? { ...s, rate: e.target.value } : s,
                                )
                              }
                              className="h-8 text-sm w-24 bg-secondary text-right"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-primary">
                            ₹
                            {(
                              (Number.parseFloat(editState.weight) || 0) *
                              (Number.parseFloat(editState.rate) || 0)
                            ).toLocaleString("en-IN")}
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="flex gap-1">
                              <Button
                                data-ocid={`billing.save_button.${idx + 1}`}
                                size="icon"
                                className="h-7 w-7 bg-green-600 hover:bg-green-700"
                                onClick={saveEdit}
                              >
                                <Check size={12} />
                              </Button>
                              <Button
                                data-ocid={`billing.cancel_button.${idx + 1}`}
                                size="icon"
                                variant="outline"
                                className="h-7 w-7"
                                onClick={cancelEdit}
                              >
                                <X size={12} />
                              </Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2.5 font-medium">
                            {item.description}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {item.purity}K
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {item.weight}g
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            ₹{item.rate.toLocaleString("en-IN")}
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold text-primary">
                            ₹{item.total.toLocaleString("en-IN")}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex gap-1 justify-end">
                              <Button
                                data-ocid={`billing.edit_button.${idx + 1}`}
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 hover:text-primary"
                                onClick={() => startEdit(item)}
                              >
                                <Edit2 size={12} />
                              </Button>
                              <Button
                                data-ocid={`billing.delete_button.${idx + 1}`}
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 hover:text-destructive"
                                onClick={() => deleteItem(item.tempId)}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* GST + Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3 bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <Switch
              data-ocid="billing.toggle"
              checked={gstEnabled}
              onCheckedChange={setGstEnabled}
              id="gst-switch"
            />
            <Label htmlFor="gst-switch" className="font-semibold">
              {gstEnabled ? t(lang, "gstOn") : t(lang, "gstOff")}
            </Label>
          </div>
          {gstEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t(lang, "cgst")} %</Label>
                <Input
                  type="number"
                  value={cgstPct}
                  onChange={(e) => setCgstPct(e.target.value)}
                  className="h-8 bg-input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t(lang, "sgst")} %</Label>
                <Input
                  type="number"
                  value={sgstPct}
                  onChange={(e) => setSgstPct(e.target.value)}
                  className="h-8 bg-input"
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2 bg-card rounded-lg border border-border p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t(lang, "subtotal")}</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          {gstEnabled && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t(lang, "cgst")} ({cgstPct}%)
                </span>
                <span>₹{cgstAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t(lang, "sgst")} ({sgstPct}%)
                </span>
                <span>₹{sgstAmount.toLocaleString("en-IN")}</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-bold text-base border-t border-border pt-2">
            <span>{t(lang, "grandTotal")}</span>
            <span className="text-primary">
              ₹{grandTotal.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t(lang, "amountPaid")}</Label>
            <Input
              data-ocid="billing.input"
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="h-8 bg-input text-sm"
            />
          </div>
          {udharBalance > 0 && (
            <div className="flex justify-between font-semibold text-sm text-yellow-400 bg-yellow-500/10 rounded px-2 py-1.5">
              <span>{t(lang, "udharBalance")}</span>
              <span>₹{udharBalance.toLocaleString("en-IN")}</span>
            </div>
          )}
        </div>
      </div>

      {udharBalance > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-yellow-500/10 border border-yellow-500/40 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40">
              {t(lang, "tempInvoice")}
            </Badge>
          </div>
          <p className="text-sm text-yellow-300/80">
            {t(lang, "udharWarningEn")}
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t(lang, "notes")}</Label>
          <Textarea
            data-ocid="billing.textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              lang === "mr" ? "अतिरिक्त नोट्स..." : "Additional notes..."
            }
            className="bg-input resize-none h-20"
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t(lang, "invoiceLang")}</Label>
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              type="button"
              onClick={() => setInvoiceLang("mr")}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${invoiceLang === "mr" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              मराठी
            </button>
            <button
              type="button"
              onClick={() => setInvoiceLang("en")}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${invoiceLang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              English
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:static md:flex gap-3 bg-background/95 backdrop-blur-sm border-t border-border md:border-0 md:bg-transparent p-4 md:p-0 z-20 no-print">
        <Button
          data-ocid="billing.secondary_button"
          variant="outline"
          className="w-full md:w-auto border-border"
          onClick={handleSaveDraft}
          disabled={createInvoice.isPending}
        >
          {createInvoice.isPending ? (
            <Loader2 size={14} className="mr-2 animate-spin" />
          ) : null}
          {t(lang, "saveDraft")}
        </Button>
        <Button
          data-ocid="billing.primary_button"
          className="w-full md:w-auto gold-gradient text-primary-foreground font-semibold"
          onClick={handleGenerateInvoice}
          disabled={createInvoice.isPending}
        >
          {createInvoice.isPending ? (
            <Loader2 size={14} className="mr-2 animate-spin" />
          ) : null}
          {t(lang, "generateInvoice")}
        </Button>
      </div>

      {/* Add item modal */}
      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">
              {t(lang, "addItem")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t(lang, "itemDescription")}</Label>
              <Input
                data-ocid="billing.input"
                value={newItem.description}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, description: e.target.value }))
                }
                placeholder={
                  lang === "mr" ? "उदा: सोन्याची अंगठी" : "e.g. Gold Ring 22K"
                }
                className="bg-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t(lang, "purity")}</Label>
                <Select
                  value={newItem.purity}
                  onValueChange={handlePurityChange}
                >
                  <SelectTrigger className="bg-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PURITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.key} value={opt.label}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t(lang, "weight")}</Label>
                <Input
                  type="number"
                  value={newItem.weight}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, weight: e.target.value }))
                  }
                  placeholder="0.00"
                  className="bg-input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t(lang, "rate")}</Label>
              <Input
                type="number"
                value={newItem.rate}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, rate: e.target.value }))
                }
                className="bg-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                {lang === "mr" ? "मजुरी (Making Charges)" : "Making Charges"}
              </Label>
              <div className="flex gap-2">
                <div className="flex rounded-md overflow-hidden border border-border">
                  <button
                    type="button"
                    onClick={() =>
                      setNewItem((p) => ({ ...p, makingChargeType: "fixed" }))
                    }
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${newItem.makingChargeType === "fixed" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-muted"}`}
                  >
                    ₹ Fixed
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewItem((p) => ({ ...p, makingChargeType: "percent" }))
                    }
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${newItem.makingChargeType === "percent" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-muted"}`}
                  >
                    % Rate
                  </button>
                </div>
                <Input
                  type="number"
                  value={newItem.makingCharges}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, makingCharges: e.target.value }))
                  }
                  placeholder={
                    newItem.makingChargeType === "fixed" ? "₹ 0" : "0%"
                  }
                  className="bg-input flex-1"
                />
              </div>
            </div>
            {newItem.weight && newItem.rate && (
              <div className="bg-secondary rounded-md px-3 py-2 flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {t(lang, "total")}
                </span>
                <span className="font-bold text-primary">
                  ₹{(() => {
                    const base =
                      (Number.parseFloat(newItem.weight) || 0) *
                      (Number.parseFloat(newItem.rate) || 0);
                    const mc = Number.parseFloat(newItem.makingCharges) || 0;
                    const mcAmt =
                      newItem.makingChargeType === "percent"
                        ? (base * mc) / 100
                        : mc;
                    return (base + mcAmt).toLocaleString("en-IN");
                  })()}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItemOpen(false)}>
              {t(lang, "cancel")}
            </Button>
            <Button
              data-ocid="billing.confirm_button"
              className="gold-gradient text-primary-foreground"
              onClick={addItem}
            >
              {t(lang, "addItem")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add customer modal */}
      <Dialog open={addCustOpen} onOpenChange={setAddCustOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">
              {t(lang, "addCustomer")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t(lang, "name")}</Label>
              <Input
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
                value={newCust.address}
                onChange={(e) =>
                  setNewCust((p) => ({ ...p, address: e.target.value }))
                }
                className="bg-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCustOpen(false)}>
              {t(lang, "cancel")}
            </Button>
            <Button
              data-ocid="customers.confirm_button"
              className="gold-gradient text-primary-foreground"
              onClick={handleAddCustomer}
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
    </div>
  );
}
