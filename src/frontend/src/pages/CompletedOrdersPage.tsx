import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Hammer, Sparkles, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { useLang } from "../App";
import { Variant_pending_completed_inProgress } from "../backend";
import type { Variant_delivered_inProgress_received_ready } from "../backend";
import { useImageUpload } from "../hooks/useImageUpload";
import {
  useCustomOrders,
  useJobOrders,
  useRepairOrders,
} from "../hooks/useQueries";

function getStatusKey(
  status: Variant_delivered_inProgress_received_ready,
): string {
  return Object.keys(status)[0] ?? "received";
}

function ImagePreview({
  hash,
  getImageUrl,
}: { hash: string; getImageUrl: (h: string) => Promise<string> }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    getImageUrl(hash).then(setUrl);
  }, [hash, getImageUrl]);
  if (!url) return null;
  return (
    <img
      src={url}
      alt="Reference"
      className="mt-2 rounded-lg w-full max-w-xs object-cover border border-border"
      style={{ maxHeight: 160 }}
    />
  );
}

export default function CompletedOrdersPage() {
  const { lang } = useLang();
  const { data: repairOrders = [] } = useRepairOrders();
  const { data: customOrders = [] } = useCustomOrders();
  const { data: jobOrders = [] } = useJobOrders();
  const { getImageUrl } = useImageUpload();

  const completedRepairs = repairOrders
    .filter((o) => getStatusKey(o.status) === "delivered")
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

  const completedCustom = customOrders
    .filter((o) => getStatusKey(o.status) === "delivered")
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

  const completedKaragir = jobOrders
    .filter((j) => j.status === Variant_pending_completed_inProgress.completed)
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

  function formatDate(ts: bigint) {
    return new Date(Number(ts) / 1_000_000).toLocaleDateString(
      lang === "mr" ? "mr-IN" : "en-IN",
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
          <CheckCircle2 size={18} className="text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-primary">
            {lang === "mr" ? "पूर्ण झालेले ऑर्डर" : "Completed Orders"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {completedRepairs.length +
              completedCustom.length +
              completedKaragir.length}{" "}
            {lang === "mr" ? "पूर्ण ऑर्डर" : "completed orders"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="repair" className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-4">
          <TabsTrigger
            value="repair"
            data-ocid="completed.repair.tab"
            className="gap-1.5"
          >
            <Wrench size={14} />
            {lang === "mr" ? "दुरुस्ती" : "Repair"}
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
              {completedRepairs.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="custom"
            data-ocid="completed.custom.tab"
            className="gap-1.5"
          >
            <Sparkles size={14} />
            {lang === "mr" ? "कस्टम" : "Custom"}
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
              {completedCustom.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="karagir"
            data-ocid="completed.karagir.tab"
            className="gap-1.5"
          >
            <Hammer size={14} />
            {lang === "mr" ? "कारागीर" : "Karagir"}
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
              {completedKaragir.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Repair Tab */}
        <TabsContent value="repair">
          {completedRepairs.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 gap-4"
              data-ocid="completed.repair.empty_state"
            >
              <CheckCircle2 size={48} className="text-muted-foreground" />
              <p className="text-muted-foreground">
                {lang === "mr"
                  ? "कोणतेही पूर्ण दुरुस्ती ऑर्डर नाहीत"
                  : "No completed repair orders yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedRepairs.map((order, idx) => (
                <Card
                  key={order.id}
                  className="gold-border bg-card"
                  data-ocid={`completed.repair.item.${idx + 1}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {order.customerName}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {order.itemDescription}
                        </p>
                        {order.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            {order.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </span>
                          {order.estimatedCost > 0 && (
                            <span className="text-xs font-medium text-primary">
                              ₹{order.estimatedCost.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 shrink-0">
                        {lang === "mr" ? "पूर्ण" : "Delivered"}
                      </Badge>
                    </div>
                    {order.referenceImageHash && (
                      <ImagePreview
                        hash={order.referenceImageHash}
                        getImageUrl={getImageUrl}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Custom Orders Tab */}
        <TabsContent value="custom">
          {completedCustom.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 gap-4"
              data-ocid="completed.custom.empty_state"
            >
              <CheckCircle2 size={48} className="text-muted-foreground" />
              <p className="text-muted-foreground">
                {lang === "mr"
                  ? "कोणतेही पूर्ण कस्टम ऑर्डर नाहीत"
                  : "No completed custom orders yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedCustom.map((order, idx) => (
                <Card
                  key={order.id}
                  className="gold-border bg-card"
                  data-ocid={`completed.custom.item.${idx + 1}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {order.customerName}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {order.itemDescription}
                        </p>
                        {order.designNotes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            {order.designNotes}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </span>
                          {order.estimatedCost > 0 && (
                            <span className="text-xs font-medium text-primary">
                              ₹{order.estimatedCost.toLocaleString("en-IN")}
                            </span>
                          )}
                          {order.advancePaid > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {lang === "mr" ? "आगाऊ" : "Advance"}: ₹
                              {order.advancePaid.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 shrink-0">
                        {lang === "mr" ? "पूर्ण" : "Delivered"}
                      </Badge>
                    </div>
                    {order.referenceImageHash && (
                      <ImagePreview
                        hash={order.referenceImageHash}
                        getImageUrl={getImageUrl}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Karagir Tab */}
        <TabsContent value="karagir">
          {completedKaragir.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 gap-4"
              data-ocid="completed.karagir.empty_state"
            >
              <CheckCircle2 size={48} className="text-muted-foreground" />
              <p className="text-muted-foreground">
                {lang === "mr"
                  ? "कोणतेही पूर्ण कारागीर काम नाहीत"
                  : "No completed karagir jobs yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedKaragir.map((job, idx) => (
                <Card
                  key={job.id}
                  className="gold-border bg-card"
                  data-ocid={`completed.karagir.item.${idx + 1}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {job.customerName}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {job.description}
                        </p>
                        {job.assignedKaragir && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {lang === "mr" ? "कारागीर" : "Karagir"}:{" "}
                            {job.assignedKaragir}
                          </p>
                        )}
                        {job.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            {job.notes}
                          </p>
                        )}
                        <span className="text-xs text-muted-foreground mt-2 block">
                          {formatDate(job.createdAt)}
                        </span>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 shrink-0">
                        {lang === "mr" ? "पूर्ण" : "Completed"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
