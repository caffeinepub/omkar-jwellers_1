import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Diamond,
  Download,
  MessageCircle,
  Printer,
} from "lucide-react";
import { useRef } from "react";
import { useLang } from "../App";
import { Variant_paid_locked_draft_partial } from "../backend";
import { useCustomers, useInvoice, useSettings } from "../hooks/useQueries";
import { t } from "../translations";
import type { Lang } from "../translations";
import { numberToWords } from "../utils/numberToWords";

interface InvoicePageProps {
  invoiceId: string;
  isPublic: boolean;
}

export default function InvoicePage({ invoiceId, isPublic }: InvoicePageProps) {
  const { lang } = useLang();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const { data: settings } = useSettings();
  const { data: customers = [] } = useCustomers();

  const customer = customers.find((c) => c.phone === invoice?.customerId);
  const invLang = (invoice?.language ?? lang) as Lang;

  function handlePrint() {
    window.print();
  }

  function handleWhatsApp() {
    if (!invoice) return;
    const invoiceUrl = `${window.location.origin}/#/invoice/${invoice.id}`;
    const customerName = customer?.name ?? "Customer";
    const amount = invoice.totalAmount.toLocaleString("en-IN");
    const udharText =
      invoice.udhar > 0
        ? invLang === "mr"
          ? `\nउधार: ₹${invoice.udhar.toLocaleString("en-IN")}`
          : `\nUdhar: ₹${invoice.udhar.toLocaleString("en-IN")}`
        : "";

    let message: string;
    if (invLang === "mr") {
      message = `नमस्कार ${customerName}, तुमची OMKAR JWELLERS ची पावती तयार आहे.\nपावती क्र: ${invoice.id}\nरक्कम: ₹${amount}${udharText}\nपावती पाहा: ${invoiceUrl}`;
    } else {
      message = `Hello ${customerName}, your invoice from OMKAR JWELLERS is ready.\nInvoice No: ${invoice.id}\nAmount: ₹${amount}${udharText}\nView Invoice: ${invoiceUrl}`;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Diamond size={48} className="text-primary mb-4" />
        <h2 className="font-display text-xl font-bold">{t(lang, "appName")}</h2>
        <p className="text-muted-foreground mt-2">
          {lang === "mr" ? "पावती सापडली नाही" : "Invoice not found"}
        </p>
      </div>
    );
  }

  const createdDate = new Date(Number(invoice.createdAt) / 1_000_000);
  const dateStr = createdDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = createdDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const cgstAmt = invoice.gst
    ? (invoice.totalAmount * (invoice.gstPercent / 2)) / 100
    : 0;
  const sgstAmt = cgstAmt;
  const subtotalCalc = invoice.items.reduce((s, it) => s + it.total, 0);
  const isUdhar = invoice.udhar > 0;
  const isPaid = invoice.status === Variant_paid_locked_draft_partial.paid;

  // Shopname for invoice
  const shopName = settings?.shopName ?? "ॐकार ज्वेलर्स";

  return (
    <div
      className={`min-h-screen ${isPublic ? "bg-gray-50" : "bg-background"}`}
    >
      {/* Action bar — hidden on print */}
      <div className="no-print sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          {!isPublic && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft size={16} className="mr-1" />
              {t(lang, "back")}
            </Button>
          )}
          <div className="flex-1 flex items-center gap-2">
            <span className="font-semibold text-sm">{invoice.id}</span>
            {invoice.gst && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                TAX INVOICE
              </Badge>
            )}
            {isPaid && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                PAID
              </Badge>
            )}
            {isUdhar && !isPaid && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40">
                {t(invLang, "tempInvoice")}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              data-ocid="invoice.secondary_button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
            >
              <Printer size={14} className="mr-1.5" />
              <span className="hidden sm:inline">
                {t(lang, "printInvoice")}
              </span>
            </Button>
            <Button
              data-ocid="invoice.secondary_button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
            >
              <Download size={14} className="mr-1.5" />
              <span className="hidden sm:inline">{t(lang, "downloadPDF")}</span>
            </Button>
            <Button
              data-ocid="invoice.primary_button"
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleWhatsApp}
            >
              <MessageCircle size={14} className="mr-1.5" />
              <span className="hidden sm:inline">
                {t(lang, "shareWhatsApp")}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice document — this is the ONLY thing printed */}
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div
          ref={printRef}
          className="print-invoice bg-white text-gray-900 rounded-xl shadow-lg"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            width: "210mm",
            minHeight: "148.5mm",
            maxHeight: "148.5mm",
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          {/* ── HEADER ─────────────────────────────────────────────── */}
          <div
            style={{
              background: "linear-gradient(135deg, #1a1200, #3d2b00, #1a1200)",
              padding: "6px 14px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {/* Left: logo + shop info */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <img
                  src="/assets/uploads/untitled_design-019d2110-b3c6-757d-b95e-8bd41c35b147-1.png"
                  alt="OMKAR JWELLERS"
                  style={{
                    width: "32px",
                    height: "32px",
                    objectFit: "contain",
                  }}
                />
                <div>
                  <h1
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#D4AF37",
                      margin: 0,
                      lineHeight: 1.1,
                    }}
                  >
                    {t(invLang, "appName")}
                  </h1>
                  <p
                    style={{
                      color: "#B8962E",
                      fontSize: "7.5px",
                      margin: "1px 0 0",
                    }}
                  >
                    {t(invLang, "tagline")}
                  </p>
                  {settings && (
                    <p
                      style={{
                        color: "#a08020",
                        fontSize: "7px",
                        margin: "1px 0 0",
                      }}
                    >
                      {settings.address} | {settings.phone}
                      {invoice.gst && settings.gstNumber
                        ? ` | GST: ${settings.gstNumber}`
                        : ""}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: invoice meta */}
              <div style={{ textAlign: "right" }}>
                {invoice.gst && (
                  <div
                    style={{
                      display: "inline-block",
                      background: "rgba(212,175,55,0.15)",
                      border: "1px solid #D4AF37",
                      borderRadius: "3px",
                      padding: "1px 6px",
                      marginBottom: "3px",
                    }}
                  >
                    <span
                      style={{
                        color: "#D4AF37",
                        fontWeight: 700,
                        fontSize: "7px",
                        letterSpacing: "1px",
                      }}
                    >
                      TAX INVOICE
                    </span>
                  </div>
                )}
                <p
                  style={{
                    fontSize: "7px",
                    color: "#a08020",
                    letterSpacing: "0.5px",
                    margin: 0,
                  }}
                >
                  {t(invLang, "invoiceNo")}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#D4AF37",
                    fontFamily: "'Playfair Display', serif",
                    margin: "1px 0",
                    lineHeight: 1,
                  }}
                >
                  {invoice.id}
                </p>
                <p style={{ fontSize: "7px", color: "#a08020", margin: 0 }}>
                  {dateStr} {timeStr}
                </p>
                {isPaid && (
                  <div
                    style={{
                      marginTop: "3px",
                      background: "rgba(22,163,74,0.2)",
                      border: "1.5px solid #16a34a",
                      borderRadius: "4px",
                      padding: "1px 6px",
                      display: "inline-block",
                    }}
                  >
                    <span
                      style={{
                        color: "#4ade80",
                        fontWeight: 700,
                        fontSize: "9px",
                      }}
                    >
                      ✓ PAID
                    </span>
                  </div>
                )}
                {isUdhar && !isPaid && (
                  <div
                    style={{
                      marginTop: "3px",
                      background: "rgba(245,158,11,0.2)",
                      border: "1px solid #F59E0B",
                      borderRadius: "4px",
                      padding: "1px 6px",
                      display: "inline-block",
                    }}
                  >
                    <span
                      style={{
                        color: "#FBBF24",
                        fontWeight: 700,
                        fontSize: "8px",
                      }}
                    >
                      {t(invLang, "tempInvoice")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── CUSTOMER + INVOICE DETAILS ROW ─────────────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "8px",
              padding: "5px 14px",
              background: "#F9F7F0",
              borderBottom: "1px solid #E5DFC5",
            }}
          >
            {/* Customer */}
            <div>
              <p
                style={{
                  fontSize: "7px",
                  color: "#78600A",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  fontWeight: 700,
                  margin: "0 0 2px",
                }}
              >
                {t(invLang, "customerDetails")}
              </p>
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#111",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {customer?.name ?? invoice.customerId}
              </p>
              <p
                style={{ fontSize: "8.5px", color: "#444", margin: "1px 0 0" }}
              >
                {customer?.phone ?? invoice.customerId}
                {customer?.address ? ` | ${customer.address}` : ""}
              </p>
            </div>
            {/* Invoice ref */}
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  fontSize: "7px",
                  color: "#78600A",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  fontWeight: 700,
                  margin: "0 0 2px",
                }}
              >
                {t(invLang, "date")}
              </p>
              <p
                style={{
                  fontSize: "9px",
                  fontWeight: 600,
                  color: "#333",
                  margin: 0,
                }}
              >
                {dateStr}
              </p>
            </div>
          </div>

          <div style={{ padding: "5px 14px" }}>
            {/* ── ITEMS TABLE ──────────────────────────────────────────── */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "4px",
                fontSize: "8.5px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "linear-gradient(135deg, #1a1200, #3d2b00)",
                    color: "#D4AF37",
                  }}
                >
                  {[
                    {
                      label: t(invLang, "srNo"),
                      align: "center",
                      width: "24px",
                    },
                    { label: t(invLang, "itemDescription"), align: "left" },
                    {
                      label: t(invLang, "purity"),
                      align: "center",
                      width: "36px",
                    },
                    {
                      label: t(invLang, "weight"),
                      align: "right",
                      width: "46px",
                    },
                    {
                      label: t(invLang, "rate"),
                      align: "right",
                      width: "52px",
                    },
                    {
                      label: t(invLang, "total"),
                      align: "right",
                      width: "58px",
                    },
                  ].map((col) => (
                    <th
                      key={col.label}
                      style={{
                        padding: "4px 5px",
                        textAlign: col.align as "center" | "left" | "right",
                        fontSize: "7.5px",
                        fontWeight: 600,
                        letterSpacing: "0.3px",
                        width: col.width,
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, itemIdx) => (
                  <tr
                    key={item.description + String(item.weight)}
                    style={{
                      borderBottom: "1px solid #E5E7EB",
                      background: itemIdx % 2 === 0 ? "#FAFAFA" : "#FFFFFF",
                    }}
                  >
                    <td
                      style={{
                        padding: "3px 5px",
                        textAlign: "center",
                        color: "#111",
                      }}
                    >
                      {itemIdx + 1}
                    </td>
                    <td
                      style={{
                        padding: "3px 5px",
                        fontWeight: 600,
                        color: "#111",
                      }}
                    >
                      {item.description}
                    </td>
                    <td
                      style={{
                        padding: "3px 5px",
                        textAlign: "center",
                        color: "#111",
                      }}
                    >
                      {item.purity}K
                    </td>
                    <td
                      style={{
                        padding: "3px 5px",
                        textAlign: "right",
                        color: "#111",
                      }}
                    >
                      {item.weight}g
                    </td>
                    <td
                      style={{
                        padding: "3px 5px",
                        textAlign: "right",
                        color: "#111",
                      }}
                    >
                      ₹{item.rate.toLocaleString("en-IN")}
                    </td>
                    <td
                      style={{
                        padding: "3px 5px",
                        textAlign: "right",
                        fontWeight: 700,
                        color: "#111",
                      }}
                    >
                      ₹{item.total.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
                {/* Empty filler rows for consistent table height (max 3 items) */}
                {invoice.items.length < 1 && (
                  <tr
                    key="filler-0"
                    style={{
                      borderBottom: "1px solid #E5E7EB",
                      background: "#FAFAFA",
                    }}
                  >
                    <td style={{ padding: "3px 5px" }}>&nbsp;</td>
                    <td style={{ padding: "3px 5px" }} />
                    <td style={{ padding: "3px 5px" }} />
                    <td style={{ padding: "3px 5px" }} />
                    <td style={{ padding: "3px 5px" }} />
                    <td style={{ padding: "3px 5px" }} />
                  </tr>
                )}
                {invoice.items.length < 2 && (
                  <tr
                    key="filler-1"
                    style={{
                      borderBottom: "1px solid #E5E7EB",
                      background: "#FFFFFF",
                    }}
                  >
                    <td style={{ padding: "3px 5px" }}>&nbsp;</td>
                    <td style={{ padding: "3px 5px" }} />
                    <td style={{ padding: "3px 5px" }} />
                    <td style={{ padding: "3px 5px" }} />
                    <td style={{ padding: "3px 5px" }} />
                    <td style={{ padding: "3px 5px" }} />
                  </tr>
                )}
                {invoice.items.length < 3 && (
                  <tr
                    key="filler-2"
                    style={{
                      borderBottom: "1px solid #E5E7EB",
                      background: "#FAFAFA",
                    }}
                  >
                    <td style={{ padding: "3px 5px" }}>&nbsp;</td>
                    <td style={{ padding: "3px 5px" }} />
                    <td style={{ padding: "3px 5px" }} />
                    <td style={{ padding: "3px 5px" }} />
                    <td style={{ padding: "3px 5px" }} />
                    <td style={{ padding: "3px 5px" }} />
                  </tr>
                )}
              </tbody>
            </table>

            {/* Majuri note */}
            <p
              style={{
                fontSize: "7.5px",
                color: "#666",
                margin: "0 0 4px",
                fontStyle: "italic",
              }}
            >
              * मजुरीसह
            </p>

            {/* ── TOTALS + AMOUNT IN WORDS ─────────────────────────────── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "8px",
                alignItems: "start",
              }}
            >
              {/* Left: amount in words + udhar info */}
              <div>
                <div
                  style={{
                    background: "#F0EDD8",
                    border: "1px solid #D4AF37",
                    borderRadius: "5px",
                    padding: "4px 7px",
                    marginBottom: "4px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "6.5px",
                      color: "#9CA3AF",
                      margin: "0 0 1px",
                      textTransform: "uppercase",
                      letterSpacing: "0.4px",
                    }}
                  >
                    {t(invLang, "amountInWords")}
                  </p>
                  <p
                    style={{
                      fontSize: "8px",
                      fontWeight: 600,
                      color: "#3D2B00",
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {numberToWords(invoice.totalAmount, invLang)}
                  </p>
                </div>
                {isUdhar && (
                  <div
                    style={{
                      background: "#FEF3C7",
                      border: "1px solid #F59E0B",
                      borderRadius: "4px",
                      padding: "3px 7px",
                      fontSize: "8px",
                      color: "#92400E",
                    }}
                  >
                    ⚠️ {t(invLang, "udharWarningEn")}
                  </div>
                )}
                {invoice.notes && (
                  <p
                    style={{
                      fontSize: "7.5px",
                      color: "#555",
                      marginTop: "3px",
                    }}
                  >
                    <strong>Notes:</strong> {invoice.notes}
                  </p>
                )}
              </div>

              {/* Right: totals breakdown */}
              <div
                style={{
                  minWidth: "170px",
                  background: "#F9F7F0",
                  border: "1px solid #E5DFC5",
                  borderRadius: "5px",
                  padding: "5px 8px",
                  fontSize: "8.5px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "2px",
                    color: "#555",
                  }}
                >
                  <span>{t(invLang, "subtotal")}</span>
                  <span>₹{subtotalCalc.toLocaleString("en-IN")}</span>
                </div>
                {invoice.gst && (
                  <>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "2px",
                        color: "#555",
                      }}
                    >
                      <span>
                        {t(invLang, "cgst")} (
                        {(invoice.gstPercent / 2).toFixed(1)}%)
                      </span>
                      <span>₹{cgstAmt.toLocaleString("en-IN")}</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "2px",
                        color: "#555",
                      }}
                    >
                      <span>
                        {t(invLang, "sgst")} (
                        {(invoice.gstPercent / 2).toFixed(1)}%)
                      </span>
                      <span>₹{sgstAmt.toLocaleString("en-IN")}</span>
                    </div>
                  </>
                )}
                {(invoice as any).shopDiscount > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "2px",
                      color: "#16a34a",
                      fontWeight: 600,
                    }}
                  >
                    <span>Shop Discount</span>
                    <span>
                      - ₹
                      {((invoice as any).shopDiscount ?? 0).toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "4px 0 2px",
                    borderTop: "1.5px solid #D4AF37",
                    fontWeight: 700,
                    fontSize: "10px",
                    color: "#78600A",
                  }}
                >
                  <span>{t(invLang, "grandTotal")}</span>
                  <span>₹{invoice.totalAmount.toLocaleString("en-IN")}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#555",
                    marginTop: "2px",
                  }}
                >
                  <span>{t(invLang, "amountPaid")}</span>
                  <span>₹{invoice.amountPaid.toLocaleString("en-IN")}</span>
                </div>
                {isUdhar && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "2px",
                      fontWeight: 700,
                      color: "#B45309",
                      background: "#FEF3C7",
                      padding: "2px 4px",
                      borderRadius: "3px",
                    }}
                  >
                    <span>{t(invLang, "udharBalance")}</span>
                    <span>₹{invoice.udhar.toLocaleString("en-IN")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── SIGNATURES ─────────────────────────────────────────── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginTop: "8px",
                paddingTop: "6px",
                borderTop: "1px solid #E5E7EB",
              }}
            >
              <div>
                <div
                  style={{
                    borderBottom: "1px dashed #D4AF37",
                    height: "20px",
                    marginBottom: "3px",
                  }}
                />
                <p
                  style={{
                    fontSize: "7px",
                    color: "#9CA3AF",
                    textAlign: "center",
                    margin: 0,
                  }}
                >
                  {t(invLang, "shopSignature")}
                </p>
                <p
                  style={{
                    fontSize: "7.5px",
                    fontWeight: 600,
                    color: "#555",
                    textAlign: "center",
                    margin: 0,
                  }}
                >
                  {shopName}
                </p>
              </div>
              <div>
                <div
                  style={{
                    borderBottom: "1px dashed #D4AF37",
                    height: "20px",
                    marginBottom: "3px",
                  }}
                />
                <p
                  style={{
                    fontSize: "7px",
                    color: "#9CA3AF",
                    textAlign: "center",
                    margin: 0,
                  }}
                >
                  {t(invLang, "customerSignature")}
                </p>
                <p
                  style={{
                    fontSize: "7.5px",
                    fontWeight: 600,
                    color: "#555",
                    textAlign: "center",
                    margin: 0,
                  }}
                >
                  {customer?.name ?? ""}
                </p>
              </div>
            </div>

            {/* ── FOOTER ─────────────────────────────────────────────── */}
            <div
              style={{
                marginTop: "5px",
                paddingTop: "4px",
                borderTop: "1px solid #E5E7EB",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "7px", color: "#9CA3AF", margin: 0 }}>
                Thank you for your business! • {shopName}
              </p>
            </div>
          </div>
        </div>

        {/* Caffeine attribution — hidden on print */}
        <p className="text-center text-xs text-muted-foreground mt-6 no-print">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
