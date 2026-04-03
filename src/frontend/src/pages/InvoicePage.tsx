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
          className="print-invoice bg-white text-gray-900 rounded-xl shadow-lg overflow-hidden"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #1a1200, #3d2b00, #1a1200)",
              padding: "12px 20px",
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/uploads/untitled_design-019d2110-b3c6-757d-b95e-8bd41c35b147-1.png"
                  alt="OMKAR JWELLERS"
                  className="w-10 h-10 object-contain"
                />
                <div>
                  <h1
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#D4AF37",
                      margin: 0,
                    }}
                  >
                    {t(invLang, "appName")}
                  </h1>
                  <p
                    style={{
                      color: "#B8962E",
                      fontSize: "9px",
                      marginTop: "2px",
                    }}
                  >
                    {t(invLang, "tagline")}
                  </p>
                  {settings && (
                    <div
                      style={{
                        color: "#a08020",
                        fontSize: "9px",
                        marginTop: "3px",
                      }}
                    >
                      <p>{settings.address}</p>
                      <p>{settings.phone}</p>
                      {invoice.gst && settings.gstNumber && (
                        <p>GST: {settings.gstNumber}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                {/* TAX INVOICE label — shown only when GST is enabled */}
                {invoice.gst && (
                  <div
                    style={{
                      display: "inline-block",
                      background: "rgba(212,175,55,0.15)",
                      border: "1px solid #D4AF37",
                      borderRadius: "4px",
                      padding: "2px 8px",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        color: "#D4AF37",
                        fontWeight: 700,
                        fontSize: "9px",
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                      }}
                    >
                      TAX INVOICE
                    </span>
                  </div>
                )}
                <p
                  style={{
                    fontSize: "9px",
                    color: "#a08020",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginTop: invoice.gst ? "0" : undefined,
                  }}
                >
                  {t(invLang, "invoiceNo")}
                </p>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#D4AF37",
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  {invoice.id}
                </p>
                <p
                  style={{
                    fontSize: "9px",
                    color: "#a08020",
                    marginTop: "4px",
                  }}
                >
                  {t(invLang, "date")}: {dateStr}
                </p>
                <p style={{ fontSize: "9px", color: "#a08020" }}>
                  {t(invLang, "time")}: {timeStr}
                </p>
                {isPaid && (
                  <div
                    style={{
                      marginTop: "6px",
                      background: "rgba(22,163,74,0.2)",
                      border: "2px solid #16a34a",
                      borderRadius: "6px",
                      padding: "3px 8px",
                      display: "inline-block",
                    }}
                  >
                    <span
                      style={{
                        color: "#4ade80",
                        fontWeight: 700,
                        fontSize: "11px",
                      }}
                    >
                      ✓ PAID
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Udhar warning */}
          {isUdhar && !isPaid && (
            <div
              style={{
                background: "#FEF3C7",
                border: "1px solid #F59E0B",
                padding: "6px 20px",
              }}
            >
              <p style={{ color: "#92400E", fontSize: "9px", margin: 0 }}>
                ⚠️ {t(invLang, "udharWarningEn")}
              </p>
            </div>
          )}

          <div style={{ padding: "12px 20px" }}>
            {/* Customer details */}
            <div
              style={{
                background: "#F9F7F0",
                borderRadius: "8px",
                padding: "8px 10px",
                marginBottom: "10px",
              }}
            >
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "10px",
                  color: "#78600A",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "6px",
                }}
              >
                {t(invLang, "customerDetails")}
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px",
                }}
              >
                <div>
                  <p style={{ fontSize: "9px", color: "#9CA3AF" }}>
                    {t(invLang, "customerName")}
                  </p>
                  <p
                    style={{ fontSize: "11px", fontWeight: 600, color: "#111" }}
                  >
                    {customer?.name ?? invoice.customerId}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: "9px", color: "#9CA3AF" }}>
                    {t(invLang, "customerPhone")}
                  </p>
                  <p
                    style={{ fontSize: "11px", fontWeight: 600, color: "#111" }}
                  >
                    {customer?.phone ?? invoice.customerId}
                  </p>
                </div>
                {customer?.address && (
                  <div style={{ gridColumn: "span 2" }}>
                    <p style={{ fontSize: "9px", color: "#9CA3AF" }}>
                      {t(invLang, "customerAddress")}
                    </p>
                    <p style={{ fontSize: "10px", color: "#333" }}>
                      {customer.address}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Items table */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "8px",
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
                    t(invLang, "srNo"),
                    t(invLang, "itemDescription"),
                    t(invLang, "purity"),
                    t(invLang, "weight"),
                    t(invLang, "rate"),
                    t(invLang, "total"),
                  ].map((h, hIdx) => (
                    <th
                      key={h}
                      style={{
                        padding: "6px 8px",
                        textAlign:
                          hIdx === 0 ? "center" : hIdx >= 3 ? "right" : "left",
                        fontSize: "9px",
                        fontWeight: 600,
                        letterSpacing: "0.5px",
                      }}
                    >
                      {h}
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
                        padding: "5px 8px",
                        textAlign: "center",
                        fontSize: "10px",
                        color: "#111111",
                      }}
                    >
                      {itemIdx + 1}
                    </td>
                    <td
                      style={{
                        padding: "5px 8px",
                        fontSize: "10px",
                        fontWeight: 500,
                        color: "#111111",
                      }}
                    >
                      {item.description}
                    </td>
                    <td
                      style={{
                        padding: "5px 8px",
                        fontSize: "10px",
                        color: "#111111",
                      }}
                    >
                      {item.purity}K
                    </td>
                    <td
                      style={{
                        padding: "5px 8px",
                        textAlign: "right",
                        fontSize: "10px",
                        color: "#111111",
                      }}
                    >
                      {item.weight}g
                    </td>
                    <td
                      style={{
                        padding: "5px 8px",
                        textAlign: "right",
                        fontSize: "10px",
                        color: "#111111",
                      }}
                    >
                      ₹{item.rate.toLocaleString("en-IN")}
                    </td>
                    <td
                      style={{
                        padding: "5px 8px",
                        textAlign: "right",
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "#111111",
                      }}
                    >
                      ₹{item.total.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Majuri note */}
            <p
              style={{
                fontSize: "10px",
                color: "#555",
                marginBottom: "6px",
                fontStyle: "italic",
              }}
            >
              * मजुरीसह
            </p>

            {/* Totals */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  minWidth: "280px",
                  background: "#F9F7F0",
                  borderRadius: "8px",
                  padding: "8px 10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                    fontSize: "10px",
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
                        marginBottom: "4px",
                        fontSize: "10px",
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
                        marginBottom: "4px",
                        fontSize: "10px",
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
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 0",
                    borderTop: "2px solid #D4AF37",
                    fontWeight: 700,
                    fontSize: "12px",
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
                    marginTop: "4px",
                    fontSize: "10px",
                    color: "#555",
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
                      marginTop: "4px",
                      fontWeight: 600,
                      fontSize: "10px",
                      color: "#B45309",
                      background: "#FEF3C7",
                      padding: "4px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    <span>{t(invLang, "udharBalance")}</span>
                    <span>₹{invoice.udhar.toLocaleString("en-IN")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Amount in words */}
            <div
              style={{
                background: "#F0EDD8",
                border: "1px solid #D4AF37",
                borderRadius: "8px",
                padding: "8px 10px",
                marginBottom: "12px",
              }}
            >
              <p
                style={{
                  fontSize: "9px",
                  color: "#9CA3AF",
                  marginBottom: "2px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {t(invLang, "amountInWords")}
              </p>
              <p
                style={{ fontSize: "10px", fontWeight: 600, color: "#3D2B00" }}
              >
                {numberToWords(invoice.totalAmount, invLang)}
              </p>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div style={{ marginBottom: "12px" }}>
                <p
                  style={{
                    fontSize: "9px",
                    color: "#9CA3AF",
                    marginBottom: "2px",
                  }}
                >
                  Notes
                </p>
                <p style={{ fontSize: "10px", color: "#555" }}>
                  {invoice.notes}
                </p>
              </div>
            )}

            {/* Signatures */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
                marginTop: "16px",
              }}
            >
              <div>
                <div
                  style={{
                    borderBottom: "1px dashed #D4AF37",
                    height: "28px",
                    marginBottom: "6px",
                  }}
                />
                <p
                  style={{
                    fontSize: "9px",
                    color: "#9CA3AF",
                    textAlign: "center",
                  }}
                >
                  {t(invLang, "shopSignature")}
                </p>
                <p
                  style={{
                    fontSize: "9px",
                    fontWeight: 600,
                    color: "#555",
                    textAlign: "center",
                  }}
                >
                  {settings?.shopName ?? "OMKAR JWELLERS"}
                </p>
              </div>
              <div>
                <div
                  style={{
                    borderBottom: "1px dashed #D4AF37",
                    height: "28px",
                    marginBottom: "6px",
                  }}
                />
                <p
                  style={{
                    fontSize: "9px",
                    color: "#9CA3AF",
                    textAlign: "center",
                  }}
                >
                  {t(invLang, "customerSignature")}
                </p>
                <p
                  style={{
                    fontSize: "9px",
                    fontWeight: 600,
                    color: "#555",
                    textAlign: "center",
                  }}
                >
                  {customer?.name ?? ""}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                marginTop: "10px",
                paddingTop: "8px",
                borderTop: "1px solid #E5E7EB",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "9px", color: "#9CA3AF" }}>
                Thank you for your business! •{" "}
                {settings?.shopName ?? "OMKAR JWELLERS"}
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
