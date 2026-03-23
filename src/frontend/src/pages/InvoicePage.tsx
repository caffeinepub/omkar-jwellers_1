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
      {/* Action bar (hidden on print) */}
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

      {/* Invoice document */}
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
              padding: "32px 40px",
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <img
                  src="/assets/generated/omkar-jwellers-logo-transparent.dim_200x200.png"
                  alt="OMKAR JWELLERS"
                  className="w-16 h-16 object-contain"
                />
                <div>
                  <h1
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "28px",
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
                      fontSize: "12px",
                      marginTop: "4px",
                    }}
                  >
                    {t(invLang, "tagline")}
                  </p>
                  {settings && (
                    <div
                      style={{
                        color: "#a08020",
                        fontSize: "11px",
                        marginTop: "6px",
                      }}
                    >
                      <p>{settings.address}</p>
                      <p>{settings.phone}</p>
                      {settings.gstNumber && <p>GST: {settings.gstNumber}</p>}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#a08020",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  {t(invLang, "invoiceNo")}
                </p>
                <p
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "#D4AF37",
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  {invoice.id}
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#a08020",
                    marginTop: "8px",
                  }}
                >
                  {t(invLang, "date")}: {dateStr}
                </p>
                <p style={{ fontSize: "11px", color: "#a08020" }}>
                  {t(invLang, "time")}: {timeStr}
                </p>
                {isPaid && (
                  <div
                    style={{
                      marginTop: "8px",
                      background: "rgba(22,163,74,0.2)",
                      border: "2px solid #16a34a",
                      borderRadius: "6px",
                      padding: "4px 12px",
                      display: "inline-block",
                    }}
                  >
                    <span
                      style={{
                        color: "#4ade80",
                        fontWeight: 700,
                        fontSize: "14px",
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
                padding: "12px 40px",
              }}
            >
              <p style={{ color: "#92400E", fontSize: "12px", margin: 0 }}>
                ⚠️ {t(invLang, "udharWarningEn")}
              </p>
            </div>
          )}

          <div style={{ padding: "32px 40px" }}>
            {/* Customer details */}
            <div
              style={{
                background: "#F9F7F0",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "24px",
              }}
            >
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "14px",
                  color: "#78600A",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "12px",
                }}
              >
                {t(invLang, "customerDetails")}
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}
              >
                <div>
                  <p style={{ fontSize: "11px", color: "#9CA3AF" }}>
                    {t(invLang, "customerName")}
                  </p>
                  <p
                    style={{ fontSize: "14px", fontWeight: 600, color: "#111" }}
                  >
                    {customer?.name ?? invoice.customerId}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: "11px", color: "#9CA3AF" }}>
                    {t(invLang, "customerPhone")}
                  </p>
                  <p
                    style={{ fontSize: "14px", fontWeight: 600, color: "#111" }}
                  >
                    {customer?.phone ?? invoice.customerId}
                  </p>
                </div>
                {customer?.address && (
                  <div style={{ gridColumn: "span 2" }}>
                    <p style={{ fontSize: "11px", color: "#9CA3AF" }}>
                      {t(invLang, "customerAddress")}
                    </p>
                    <p style={{ fontSize: "13px", color: "#333" }}>
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
                marginBottom: "24px",
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
                        padding: "10px 12px",
                        textAlign:
                          hIdx === 0 ? "center" : hIdx >= 3 ? "right" : "left",
                        fontSize: "11px",
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
                        padding: "10px 12px",
                        textAlign: "center",
                        fontSize: "13px",
                        color: "#111111",
                      }}
                    >
                      {itemIdx + 1}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#111111",
                      }}
                    >
                      {item.description}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontSize: "13px",
                        color: "#111111",
                      }}
                    >
                      {item.purity}K
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontSize: "13px",
                        color: "#111111",
                      }}
                    >
                      {item.weight}g
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontSize: "13px",
                        color: "#111111",
                      }}
                    >
                      ₹{item.rate.toLocaleString("en-IN")}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontSize: "13px",
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
                fontSize: "12px",
                color: "#555",
                marginBottom: "16px",
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
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  minWidth: "280px",
                  background: "#F9F7F0",
                  borderRadius: "8px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                    fontSize: "13px",
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
                        marginBottom: "8px",
                        fontSize: "13px",
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
                        marginBottom: "8px",
                        fontSize: "13px",
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
                    padding: "10px 0",
                    borderTop: "2px solid #D4AF37",
                    fontWeight: 700,
                    fontSize: "16px",
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
                    marginTop: "8px",
                    fontSize: "13px",
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
                      marginTop: "8px",
                      fontWeight: 600,
                      fontSize: "13px",
                      color: "#B45309",
                      background: "#FEF3C7",
                      padding: "6px 8px",
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
                padding: "12px 16px",
                marginBottom: "32px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  color: "#9CA3AF",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {t(invLang, "amountInWords")}
              </p>
              <p
                style={{ fontSize: "13px", fontWeight: 600, color: "#3D2B00" }}
              >
                {numberToWords(invoice.totalAmount, invLang)}
              </p>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div style={{ marginBottom: "32px" }}>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#9CA3AF",
                    marginBottom: "4px",
                  }}
                >
                  Notes
                </p>
                <p style={{ fontSize: "13px", color: "#555" }}>
                  {invoice.notes}
                </p>
              </div>
            )}

            {/* Signatures */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "48px",
                marginTop: "48px",
              }}
            >
              <div>
                <div
                  style={{
                    borderBottom: "1px dashed #D4AF37",
                    height: "48px",
                    marginBottom: "8px",
                  }}
                />
                <p
                  style={{
                    fontSize: "12px",
                    color: "#9CA3AF",
                    textAlign: "center",
                  }}
                >
                  {t(invLang, "shopSignature")}
                </p>
                <p
                  style={{
                    fontSize: "12px",
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
                    height: "48px",
                    marginBottom: "8px",
                  }}
                />
                <p
                  style={{
                    fontSize: "12px",
                    color: "#9CA3AF",
                    textAlign: "center",
                  }}
                >
                  {t(invLang, "customerSignature")}
                </p>
                <p
                  style={{
                    fontSize: "12px",
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
                marginTop: "32px",
                paddingTop: "16px",
                borderTop: "1px solid #E5E7EB",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "11px", color: "#9CA3AF" }}>
                Thank you for your business! •{" "}
                {settings?.shopName ?? "OMKAR JWELLERS"}
              </p>
            </div>
          </div>
        </div>

        {/* Caffeine attribution */}
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
