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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarDays,
  ImageIcon,
  Loader2,
  MessageCircle,
  PlusCircle,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLang } from "../App";
import type { Variant_delivered_inProgress_received_ready } from "../backend";
import { useImageUpload } from "../hooks/useImageUpload";
import {
  extractErrorMessage,
  useCreateCustomOrder,
  useCustomOrders,
  useUpdateCustomOrder,
} from "../hooks/useQueries";
import {
  WA_NOTIFICATIONS_KEY,
  WA_SENT_PREFIX,
  buildWhatsAppUrl,
  triggerWhatsApp,
} from "../lib/whatsapp";
import { t } from "../translations";

const STATUS_LABELS: Record<string, { en: string; mr: string; color: string }> =
  {
    received: {
      en: "Received",
      mr: "प्राप्त",
      color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    },
    inProgress: {
      en: "In Progress",
      mr: "प्रगतीत",
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    ready: {
      en: "Ready",
      mr: "तयार",
      color: "bg-green-500/20 text-green-400 border-green-500/30",
    },
    delivered: {
      en: "Delivered",
      mr: "दिले",
      color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    },
  };

function getStatusKey(
  status: Variant_delivered_inProgress_received_ready,
): string {
  if (typeof status === "string") return status;
  return Object.keys(status as object)[0] ?? "received";
}

function ImagePreview({
  hash,
  getImageUrl,
}: { hash: string; getImageUrl: (h: string) => Promise<string> }) {
  const [url, setUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    getImageUrl(hash)
      .then(setUrl)
      .catch(() => {});
  }, [hash, getImageUrl]);
  if (!url)
    return (
      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
        <ImageIcon size={20} className="text-muted-foreground" />
      </div>
    );
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus:outline-none"
      >
        <img
          src={url}
          alt="Reference"
          className="w-20 h-20 object-cover rounded-lg border border-border hover:opacity-80 transition-opacity cursor-pointer"
        />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-lg p-2">
          <img
            src={url}
            alt="Reference"
            className="w-full rounded-lg object-contain max-h-[80vh]"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function CustomOrdersPage() {
  const { lang } = useLang();
  const { data: orders = [], isLoading } = useCustomOrders();
  const createOrder = useCreateCustomOrder();
  const updateOrder = useUpdateCustomOrder();
  const { uploadImage, getImageUrl, uploading } = useImageUpload();

  const [createOpen, setCreateOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageHash, setImageHash] = useState<string | undefined>(undefined);

  // WhatsApp sent tracking
  const [waSentIds, setWaSentIds] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(WA_SENT_PREFIX)) {
        s.add(key.slice(WA_SENT_PREFIX.length));
      }
    }
    return s;
  });

  const notificationsEnabled =
    localStorage.getItem(WA_NOTIFICATIONS_KEY) !== "false";

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    itemDescription: "",
    designNotes: "",
    estimatedCost: "",
    advancePaid: "",
    dueDate: "",
  });
  const [updateState, setUpdateState] = useState({
    status: "received" as string,
    designNotes: "",
  });

  const sorted = [...orders]
    .filter((o) => getStatusKey(o.status) !== "delivered")
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    setImageHash(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleCreate() {
    if (!form.customerName || !form.itemDescription) {
      toast.error(
        lang === "mr" ? "क्ृपया आवश्यक माहिती भरा" : "Please fill required fields",
      );
      return;
    }
    let finalHash = imageHash;
    if (imageFile && !imageHash) {
      finalHash = await uploadImage(imageFile);
      if (!finalHash) return;
      setImageHash(finalHash);
    }
    try {
      await createOrder.mutateAsync({
        customerName: form.customerName,
        phone: form.phone,
        itemDescription: form.itemDescription,
        designNotes: form.designNotes,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : 0,
        advancePaid: form.advancePaid ? Number(form.advancePaid) : 0,
        dueDate: form.dueDate
          ? BigInt(new Date(form.dueDate).getTime() * 1_000_000)
          : 0n,
        referenceImageHash: finalHash,
      });
      toast.success(
        lang === "mr" ? "कस्टम ऑर्डर तयार केला" : "Custom order created",
      );
      setCreateOpen(false);
      setForm({
        customerName: "",
        phone: "",
        itemDescription: "",
        designNotes: "",
        estimatedCost: "",
        advancePaid: "",
        dueDate: "",
      });
      clearImage();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  }

  async function handleUpdate() {
    if (!selectedId) return;
    // Capture previous status before update
    const prevOrder = orders.find((o) => o.id === selectedId);
    const prevStatus = prevOrder ? getStatusKey(prevOrder.status) : "";

    try {
      await updateOrder.mutateAsync({
        id: selectedId,
        status:
          updateState.status as unknown as Variant_delivered_inProgress_received_ready,
        designNotes: updateState.designNotes,
      });
      toast.success(lang === "mr" ? "अपडेट झाले" : "Updated successfully");
      setUpdateOpen(false);

      // Trigger WhatsApp only when transitioning TO "ready" for the first time
      if (updateState.status === "ready" && prevStatus !== "ready") {
        if (!prevOrder?.phone) {
          toast.warning(
            lang === "mr"
              ? "ग्राहकाचा फोन नंबर उपलब्ध नाही"
              : "Customer phone number not available",
          );
        } else if (notificationsEnabled) {
          const opened = triggerWhatsApp(
            prevOrder.phone,
            prevOrder.customerName,
            notificationsEnabled,
          );
          if (opened) {
            localStorage.setItem(WA_SENT_PREFIX + selectedId, "true");
            setWaSentIds((prev) => new Set([...prev, selectedId]));
          }
        }
      }
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
            <Sparkles size={18} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-primary">
              {lang === "mr" ? "कस्टम ऑर्डर" : "Custom Orders"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {orders.length} {lang === "mr" ? "एकूण" : "total"}
            </p>
          </div>
        </div>
        <Button
          className="gold-gradient text-primary-foreground"
          onClick={() => setCreateOpen(true)}
          data-ocid="custom.open_modal_button"
        >
          <PlusCircle size={16} className="mr-2" />
          {lang === "mr" ? "नवीन ऑर्डर" : "New Order"}
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3" data-ocid="custom.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 gap-4"
          data-ocid="custom.empty_state"
        >
          <Sparkles size={48} className="text-muted-foreground" />
          <p className="text-muted-foreground">
            {lang === "mr" ? "कोणतेही कस्टम ऑर्डर नाहीत" : "No custom orders yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((order, idx) => {
            const sk = getStatusKey(order.status);
            const sl = STATUS_LABELS[sk];
            const dueMs = Number(order.dueDate) / 1_000_000;
            const hasDue = dueMs > 0;
            return (
              <Card
                key={order.id}
                className="gold-border bg-card"
                data-ocid={`custom.item.${idx + 1}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-foreground">
                          {order.customerName}
                        </span>
                        <Badge className={`text-xs border ${sl?.color ?? ""}`}>
                          {sl?.[lang] ?? sk}
                        </Badge>
                      </div>
                      {order.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                          {order.phone}
                          {sk === "ready" && (
                            <MessageCircle
                              size={13}
                              className="text-green-400 shrink-0"
                            />
                          )}
                        </p>
                      )}
                      <p className="text-sm text-foreground mt-1">
                        {order.itemDescription}
                      </p>
                      {order.designNotes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {order.designNotes}
                        </p>
                      )}
                      <div className="flex gap-3 mt-2 flex-wrap items-center">
                        {order.estimatedCost > 0 && (
                          <span className="text-sm text-primary font-medium">
                            ₹{order.estimatedCost.toLocaleString()}
                          </span>
                        )}
                        {order.advancePaid > 0 && (
                          <span className="text-xs text-green-400">
                            {lang === "mr" ? "अॅडव्हान्स: " : "Advance: "}₹
                            {order.advancePaid.toLocaleString()}
                          </span>
                        )}
                        {hasDue && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarDays size={11} />
                            {new Date(dueMs).toLocaleDateString("en-IN")}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(
                            Number(order.createdAt) / 1_000_000,
                          ).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {order.referenceImageHash && (
                        <ImagePreview
                          hash={order.referenceImageHash}
                          getImageUrl={getImageUrl}
                        />
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/30 text-primary hover:bg-primary/10 text-xs"
                        onClick={() => {
                          setSelectedId(order.id);
                          setUpdateState({
                            status: sk,
                            designNotes: order.designNotes,
                          });
                          setUpdateOpen(true);
                        }}
                        data-ocid={`custom.edit_button.${idx + 1}`}
                      >
                        {lang === "mr" ? "अपडेट" : "Update"}
                      </Button>

                      {/* Send Again button — always visible when status is ready */}
                      {sk === "ready" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500/40 text-green-400 hover:bg-green-500/10 text-xs gap-1"
                          onClick={() => {
                            if (!order.phone) {
                              toast.warning(
                                lang === "mr"
                                  ? "ग्राहकाचा फोन नंबर उपलब्ध नाही"
                                  : "Customer phone number not available",
                              );
                              return;
                            }
                            window.open(
                              buildWhatsAppUrl(order.phone, order.customerName),
                              "_blank",
                            );
                            localStorage.setItem(
                              WA_SENT_PREFIX + order.id,
                              "true",
                            );
                            setWaSentIds(
                              (prev) => new Set([...prev, order.id]),
                            );
                          }}
                          data-ocid={`custom.secondary_button.${idx + 1}`}
                        >
                          <MessageCircle size={12} />
                          {lang === "mr" ? "पुन्हा पाठवा" : "Send Again"}
                        </Button>
                      )}

                      {/* Sent badge */}
                      {sk === "ready" && waSentIds.has(order.id) && (
                        <span className="text-xs text-green-400 flex items-center gap-1 font-medium">
                          <MessageCircle size={11} />
                          WhatsApp Sent ✓
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent
          className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto"
          data-ocid="custom.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-primary font-display">
              {lang === "mr" ? "नवीन कस्टम ऑर्डर" : "New Custom Order"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>
                {lang === "mr" ? "ग्राहकाचे नाव *" : "Customer Name *"}
              </Label>
              <Input
                className="mt-1"
                value={form.customerName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, customerName: e.target.value }))
                }
                data-ocid="custom.input"
              />
            </div>
            <div>
              <Label>{lang === "mr" ? "फोन" : "Phone"}</Label>
              <Input
                className="mt-1"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>
                {lang === "mr" ? "वस्तूचे वर्णन *" : "Item Description *"}
              </Label>
              <Textarea
                className="mt-1"
                rows={2}
                value={form.itemDescription}
                onChange={(e) =>
                  setForm((p) => ({ ...p, itemDescription: e.target.value }))
                }
                data-ocid="custom.textarea"
              />
            </div>
            <div>
              <Label>{lang === "mr" ? "अंदाजित किंमत" : "Estimated Cost"}</Label>
              <Input
                className="mt-1"
                type="number"
                value={form.estimatedCost}
                onChange={(e) =>
                  setForm((p) => ({ ...p, estimatedCost: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>{lang === "mr" ? "अॅडव्हान्स दिले" : "Advance Paid"}</Label>
              <Input
                className="mt-1"
                type="number"
                value={form.advancePaid}
                onChange={(e) =>
                  setForm((p) => ({ ...p, advancePaid: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>{lang === "mr" ? "डिझाईन नोट्स" : "Design Notes"}</Label>
              <Textarea
                className="mt-1"
                rows={3}
                placeholder={
                  lang === "mr"
                    ? "डिझाईन, रंग, आकार इ."
                    : "Design, color, size, etc."
                }
                value={form.designNotes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, designNotes: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>{lang === "mr" ? "देय तारीख" : "Due Date"}</Label>
              <Input
                className="mt-1"
                type="date"
                value={form.dueDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dueDate: e.target.value }))
                }
              />
            </div>
            {/* Image upload */}
            <div>
              <Label>{lang === "mr" ? "संदर्भ फोटो" : "Reference Photo"}</Label>
              <div className="mt-1">
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive flex items-center justify-center"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors"
                    data-ocid="custom.upload_button"
                  >
                    <Upload size={20} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {lang === "mr" ? "फोटो अपलोड करा" : "Upload photo"}
                    </span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              data-ocid="custom.cancel_button"
            >
              {t(lang, "cancel")}
            </Button>
            <Button
              className="gold-gradient text-primary-foreground"
              onClick={handleCreate}
              disabled={createOrder.isPending || uploading}
              data-ocid="custom.submit_button"
            >
              {createOrder.isPending || uploading ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : null}
              {lang === "mr" ? "तयार करा" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent
          className="bg-card border-border max-w-sm"
          data-ocid="custom.modal"
        >
          <DialogHeader>
            <DialogTitle className="text-primary font-display">
              {lang === "mr" ? "स्थिती अपडेट करा" : "Update Status"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>{lang === "mr" ? "स्थिती" : "Status"}</Label>
              <Select
                value={updateState.status}
                onValueChange={(v) =>
                  setUpdateState((p) => ({ ...p, status: v }))
                }
              >
                <SelectTrigger className="mt-1" data-ocid="custom.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v[lang]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{lang === "mr" ? "डिझाईन नोट्स" : "Design Notes"}</Label>
              <Textarea
                className="mt-1"
                rows={3}
                value={updateState.designNotes}
                onChange={(e) =>
                  setUpdateState((p) => ({
                    ...p,
                    designNotes: e.target.value,
                  }))
                }
                data-ocid="custom.textarea"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setUpdateOpen(false)}
              data-ocid="custom.cancel_button"
            >
              {t(lang, "cancel")}
            </Button>
            <Button
              className="gold-gradient text-primary-foreground"
              onClick={handleUpdate}
              disabled={updateOrder.isPending}
              data-ocid="custom.save_button"
            >
              {updateOrder.isPending ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : null}
              {lang === "mr" ? "जतन करा" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
