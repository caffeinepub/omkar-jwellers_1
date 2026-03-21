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
import { Calendar, Hammer, Loader2, PlusCircle, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth, useLang } from "../App";
import { Variant_pending_completed_inProgress } from "../backend";
import {
  useCreateJobOrder,
  useJobOrders,
  useUpdateJobOrder,
} from "../hooks/useQueries";
import { t } from "../translations";

export default function KaragirPage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const { data: jobs = [], isLoading } = useJobOrders();
  const createJob = useCreateJobOrder();
  const updateJob = useUpdateJobOrder();

  const [createOpen, setCreateOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [newJob, setNewJob] = useState({
    customerName: "",
    description: "",
    assignedKaragir: "",
    dueDate: "",
  });
  const [updateState, setUpdateState] = useState({
    status: Variant_pending_completed_inProgress.pending,
    notes: "",
  });

  const canCreate = user?.role === "owner" || user?.role === "manager";

  const myJobs =
    user?.role === "karagir"
      ? jobs.filter(
          (j) =>
            j.assignedKaragir === user.name || j.assignedKaragir === user.phone,
        )
      : jobs;

  async function handleCreate() {
    if (!newJob.customerName || !newJob.description) {
      toast.error(
        lang === "mr" ? "क्ृपया सर्व माहिती भरा" : "Please fill required fields",
      );
      return;
    }
    try {
      await createJob.mutateAsync({
        customerName: newJob.customerName,
        description: newJob.description,
        assignedKaragir: newJob.assignedKaragir,
        dueDate: newJob.dueDate
          ? BigInt(new Date(newJob.dueDate).getTime() * 1_000_000)
          : 0n,
      });
      toast.success(lang === "mr" ? "काम ऑर्डर तयार केला" : "Job order created");
      setCreateOpen(false);
      setNewJob({
        customerName: "",
        description: "",
        assignedKaragir: "",
        dueDate: "",
      });
    } catch {
      toast.error(t(lang, "error"));
    }
  }

  async function handleUpdate() {
    if (!selectedJobId) return;
    try {
      await updateJob.mutateAsync({
        id: selectedJobId,
        status: updateState.status,
        notes: updateState.notes,
      });
      toast.success(lang === "mr" ? "अपडेट केले" : "Updated successfully");
      setUpdateOpen(false);
    } catch {
      toast.error(t(lang, "error"));
    }
  }

  function getStatusBadge(status: Variant_pending_completed_inProgress) {
    if (status === Variant_pending_completed_inProgress.completed)
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          {t(lang, "statusCompleted")}
        </Badge>
      );
    if (status === Variant_pending_completed_inProgress.inProgress)
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          {t(lang, "statusInProgress")}
        </Badge>
      );
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        {t(lang, "statusPending")}
      </Badge>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl md:text-3xl font-bold">
          {t(lang, "karagirTitle")}
        </h1>
        {canCreate && (
          <Button
            data-ocid="karagir.open_modal_button"
            className="gold-gradient text-primary-foreground font-semibold"
            onClick={() => setCreateOpen(true)}
          >
            <PlusCircle size={16} className="mr-2" />
            {t(lang, "addJobOrder")}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : myJobs.length === 0 ? (
        <div data-ocid="karagir.empty_state" className="text-center py-16">
          <Hammer size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground">{t(lang, "noJobs")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myJobs.map((job, idx) => (
            <Card
              key={job.id}
              data-ocid={`karagir.item.${idx + 1}`}
              className="bg-card gold-border"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {getStatusBadge(job.status)}
                      <span className="text-sm font-semibold">
                        {job.customerName}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {job.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {job.assignedKaragir && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User size={11} />
                          <span>{job.assignedKaragir}</span>
                        </div>
                      )}
                      {job.dueDate && Number(job.dueDate) > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar size={11} />
                          <span>
                            {new Date(
                              Number(job.dueDate) / 1_000_000,
                            ).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                      )}
                    </div>
                    {job.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {job.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    data-ocid={`karagir.edit_button.${idx + 1}`}
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={() => {
                      setSelectedJobId(job.id);
                      setUpdateState({
                        status: job.status,
                        notes: job.notes || "",
                      });
                      setUpdateOpen(true);
                    }}
                  >
                    {t(lang, "updateStatus")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create job modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent
          data-ocid="karagir.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              {t(lang, "createJob")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t(lang, "customerName")}</Label>
              <Input
                data-ocid="karagir.input"
                value={newJob.customerName}
                onChange={(e) =>
                  setNewJob((p) => ({ ...p, customerName: e.target.value }))
                }
                className="bg-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t(lang, "jobDescription")}</Label>
              <Textarea
                data-ocid="karagir.textarea"
                value={newJob.description}
                onChange={(e) =>
                  setNewJob((p) => ({ ...p, description: e.target.value }))
                }
                className="bg-input resize-none h-20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t(lang, "assignedTo")}</Label>
                <Input
                  value={newJob.assignedKaragir}
                  onChange={(e) =>
                    setNewJob((p) => ({
                      ...p,
                      assignedKaragir: e.target.value,
                    }))
                  }
                  className="bg-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t(lang, "dueDate")}</Label>
                <Input
                  type="date"
                  value={newJob.dueDate}
                  onChange={(e) =>
                    setNewJob((p) => ({ ...p, dueDate: e.target.value }))
                  }
                  className="bg-input"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="karagir.cancel_button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              {t(lang, "cancel")}
            </Button>
            <Button
              data-ocid="karagir.confirm_button"
              className="gold-gradient text-primary-foreground"
              onClick={handleCreate}
              disabled={createJob.isPending}
            >
              {createJob.isPending ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : null}
              {t(lang, "createJob")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update status modal */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent
          data-ocid="karagir.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              {t(lang, "updateStatus")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t(lang, "jobStatus")}</Label>
              <Select
                value={updateState.status}
                onValueChange={(v) =>
                  setUpdateState((s) => ({
                    ...s,
                    status: v as Variant_pending_completed_inProgress,
                  }))
                }
              >
                <SelectTrigger data-ocid="karagir.select" className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value={Variant_pending_completed_inProgress.pending}
                  >
                    {t(lang, "statusPending")}
                  </SelectItem>
                  <SelectItem
                    value={Variant_pending_completed_inProgress.inProgress}
                  >
                    {t(lang, "statusInProgress")}
                  </SelectItem>
                  <SelectItem
                    value={Variant_pending_completed_inProgress.completed}
                  >
                    {t(lang, "statusCompleted")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t(lang, "addNotes")}</Label>
              <Textarea
                data-ocid="karagir.textarea"
                value={updateState.notes}
                onChange={(e) =>
                  setUpdateState((s) => ({ ...s, notes: e.target.value }))
                }
                className="bg-input resize-none h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="karagir.cancel_button"
              variant="outline"
              onClick={() => setUpdateOpen(false)}
            >
              {t(lang, "cancel")}
            </Button>
            <Button
              data-ocid="karagir.confirm_button"
              className="gold-gradient text-primary-foreground"
              onClick={handleUpdate}
              disabled={updateJob.isPending}
            >
              {updateJob.isPending ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : null}
              {t(lang, "save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
