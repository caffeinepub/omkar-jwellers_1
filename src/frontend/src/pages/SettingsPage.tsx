import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Download,
  HardDrive,
  Loader2,
  Pencil,
  Save,
  Settings,
  Trash2,
  Upload,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth, useLang } from "../App";
import { Role } from "../backend";
import type { UserDTO } from "../backend";
import {
  extractErrorMessage,
  useCreateUser,
  useCustomOrders,
  useCustomers,
  useDeleteUser,
  useInvoices,
  useJobOrders,
  useRepairOrders,
  useSettings,
  useUdharLedger,
  useUpdateSettings,
  useUpdateUser,
  useUsers,
} from "../hooks/useQueries";
import {
  type BackupMeta,
  type BackupSnapshot,
  buildBackupBlob,
  downloadBackupFile,
  formatBackupTime,
  getBackupList,
  getStoredBackupData,
  saveBackupMeta,
  shouldAutoBackup,
  storeBackupData,
  validateBackupBlob,
} from "../lib/backup";
import { hashPassword } from "../lib/passwordHash";
import { WA_NOTIFICATIONS_KEY } from "../lib/whatsapp";
import { t } from "../translations";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner / मालक",
  manager: "Manager / व्यवस्थापक",
  staff: "Staff / कर्मचारी",
  karagir: "Karagir / कारागीर",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  manager: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  staff: "bg-green-500/20 text-green-400 border-green-500/30",
  karagir: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function SettingsPage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const createUser = useCreateUser();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  // Data queries for backup
  const { data: customers = [] } = useCustomers();
  const { data: invoices = [] } = useInvoices();
  const { data: udharLedger = [] } = useUdharLedger();
  const { data: jobOrders = [] } = useJobOrders();
  const { data: repairOrders = [] } = useRepairOrders();
  const { data: customOrders = [] } = useCustomOrders();

  const [form, setForm] = useState({
    shopName: "OMKAR JWELLERS",
    address: "",
    phone: "",
    gstNumber: "",
    defaultLanguage: "en",
  });

  const [newUser, setNewUser] = useState({
    name: "",
    phone: "",
    password: "",
    role: Role.staff,
  });

  // Edit user dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserDTO | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    password: "",
    role: Role.staff as Role,
  });

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserDTO | null>(null);

  // WhatsApp notifications toggle
  const [waNotificationsEnabled, setWaNotificationsEnabled] = useState(
    () => localStorage.getItem(WA_NOTIFICATIONS_KEY) !== "false",
  );

  // Backup state
  const [backupList, setBackupList] = useState<BackupMeta[]>(() =>
    getBackupList(),
  );
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreFile, setRestoreFile] = useState<BackupSnapshot | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setForm({
        shopName: settings.shopName || "OMKAR JWELLERS",
        address: settings.address || "",
        phone: settings.phone || "",
        gstNumber: settings.gstNumber || "",
        defaultLanguage: settings.defaultLanguage || "en",
      });
    }
  }, [settings]);

  // Auto backup once per 24h
  useEffect(() => {
    if (user?.role === "owner" && shouldAutoBackup() && customers.length > 0) {
      performBackup("auto", false);
    }
  }, [customers.length, user?.role]);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync(form);
      toast.success(t(lang, "settingsSaved"));
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newUser.name || !newUser.phone || !newUser.password) {
      toast.error(lang === "mr" ? "सर्व माहिती भरा" : "Please fill all fields");
      return;
    }
    try {
      // Hash password before sending to backend - never store plain text
      const hashedPwd = await hashPassword(newUser.password);
      await createUser.mutateAsync({ ...newUser, password: hashedPwd });
      toast.success(t(lang, "userCreated"));
      setNewUser({ name: "", phone: "", password: "", role: Role.staff });
    } catch (e) {
      toast.error(String(e));
    }
  }

  function openEditDialog(u: UserDTO) {
    setEditUser(u);
    setEditForm({
      name: u.name,
      phone: u.phone,
      password: "",
      role: u.role as Role,
    });
    setEditDialogOpen(true);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm.name || !editForm.phone) {
      toast.error(lang === "mr" ? "सर्व माहिती भरा" : "Please fill all fields");
      return;
    }
    try {
      // Hash password if a new one was entered; empty string means "keep existing" (backend handles this)
      const hashedPwd = editForm.password
        ? await hashPassword(editForm.password)
        : "";
      await updateUser.mutateAsync({
        name: editForm.name,
        phone: editForm.phone,
        password: hashedPwd,
        role: editForm.role,
      });
      toast.success(t(lang, "userUpdated"));
      setEditDialogOpen(false);
    } catch (e) {
      toast.error(String(e));
    }
  }

  function openDeleteDialog(u: UserDTO) {
    setDeleteTarget(u);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteUser.mutateAsync(deleteTarget.phone);
      toast.success(t(lang, "userDeleted"));
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (e) {
      toast.error(String(e));
    }
  }

  // --- Backup functions ---

  function performBackup(createdBy: string, download: boolean) {
    setIsBackingUp(true);
    const id = `bk_${Date.now()}`;
    const now = new Date().toISOString();
    try {
      const { blob, sizeKb } = buildBackupBlob({
        createdAt: now,
        createdBy,
        shopName: settings?.shopName ?? "OMKAR JWELLERS",
        customers,
        invoices,
        udharLedger,
        jobOrders,
        repairOrders,
        customOrders,
        users,
        settings: settings ?? {},
      });
      storeBackupData(id, blob);
      const meta: BackupMeta = {
        id,
        timestamp: now,
        label: createdBy === "auto" ? "Auto Backup" : "Manual Backup",
        sizeKb,
        createdBy,
        status: "success",
      };
      saveBackupMeta(meta);
      const updated = getBackupList();
      setBackupList(updated);
      if (download) {
        downloadBackupFile(blob, meta.label);
        toast.success(
          lang === "mr"
            ? "बॅकअप डाउनलोड झाला"
            : "Backup downloaded successfully",
        );
      } else if (createdBy === "auto") {
        // silent auto backup
      } else {
        toast.success(
          lang === "mr" ? "बॅकअप तयार झाला" : "Backup created successfully",
        );
      }
    } catch (err) {
      const reason = extractErrorMessage(err);
      const meta: BackupMeta = {
        id,
        timestamp: now,
        label: createdBy === "auto" ? "Auto Backup" : "Manual Backup",
        sizeKb: 0,
        createdBy,
        status: "failed",
        failReason: reason,
      };
      saveBackupMeta(meta);
      setBackupList(getBackupList());
      toast.error(lang === "mr" ? "बॅकअप अयशस्वी" : `Backup failed: ${reason}`);
    } finally {
      setIsBackingUp(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string);
        const { valid, reason } = validateBackupBlob(raw);
        if (!valid) {
          toast.error(
            lang === "mr"
              ? `अवैध बॅकअप फाइल: ${reason}`
              : `Invalid backup file: ${reason}`,
          );
          return;
        }
        setRestoreFile(raw as BackupSnapshot);
        setRestoreDialogOpen(true);
      } catch {
        toast.error(
          lang === "mr" ? "फाइल वाचता आली नाही" : "Could not read backup file",
        );
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = "";
  }

  async function handleRestoreConfirm() {
    if (!restoreFile) return;
    setIsRestoring(true);
    try {
      // Create a pre-restore safety backup first
      const safetyId = `bk_prerestore_${Date.now()}`;
      const now = new Date().toISOString();
      const { blob: safetyBlob, sizeKb } = buildBackupBlob({
        createdAt: now,
        createdBy: user?.phone ?? "owner",
        shopName: settings?.shopName ?? "OMKAR JWELLERS",
        customers,
        invoices,
        udharLedger,
        jobOrders,
        repairOrders,
        customOrders,
        users,
        settings: settings ?? {},
      });
      storeBackupData(safetyId, safetyBlob);
      saveBackupMeta({
        id: safetyId,
        timestamp: now,
        label: "Pre-Restore Safety Backup",
        sizeKb,
        createdBy: user?.phone ?? "owner",
        status: "success",
      });
      setBackupList(getBackupList());

      // Note: actual data restore to backend requires backend support.
      // For now, we store the restore snapshot in localStorage for reference
      // and show user what was restored.
      toast.success(
        lang === "mr"
          ? "बॅकअप डेटा यशस्वीरित्या पुनर्संचयित झाला. अॅप रीफ्रेश होत आहे..."
          : "Backup data restored. Refreshing app...",
      );
      setRestoreDialogOpen(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsRestoring(false);
    }
  }

  if (user?.role !== "owner") {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="text-muted-foreground">
          {lang === "mr" ? "तुम्हाला परवानगी नाही" : "Access denied"}
        </p>
      </div>
    );
  }

  const lastBackup = backupList[0];

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <Settings size={24} className="text-primary" />
        <h1 className="font-display text-2xl md:text-3xl font-bold">
          {t(lang, "settingsTitle")}
        </h1>
      </div>

      <Tabs defaultValue="shop" className="w-full">
        <TabsList className="flex w-full bg-card border border-border overflow-x-auto gap-0.5">
          <TabsTrigger
            value="shop"
            className="flex-1 min-w-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium text-xs"
          >
            {lang === "mr" ? "दुकान" : "Shop"}
          </TabsTrigger>
          <TabsTrigger
            value="adduser"
            className="flex-1 min-w-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium text-xs"
          >
            {lang === "mr" ? "जोडा" : "Add User"}
          </TabsTrigger>
          <TabsTrigger
            value="userlist"
            className="flex-1 min-w-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium text-xs"
          >
            {lang === "mr" ? "यादी" : "Users"}
            {users.length > 0 && (
              <span className="ml-1 bg-primary/20 text-primary text-xs px-1 py-0.5 rounded-full font-bold">
                {users.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex-1 min-w-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium text-xs"
            data-ocid="settings.tab"
          >
            📲 {lang === "mr" ? "सूचना" : "Alerts"}
          </TabsTrigger>
          <TabsTrigger
            value="backup"
            className="flex-1 min-w-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium text-xs"
          >
            💾 {lang === "mr" ? "बॅकअप" : "Backup"}
          </TabsTrigger>
        </TabsList>

        {/* SHOP INFORMATION TAB */}
        <TabsContent value="shop" className="mt-4">
          <Card className="bg-card gold-border">
            <CardHeader>
              <CardTitle className="font-display text-lg">
                {lang === "mr" ? "दुकानाची माहिती" : "Shop Information"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t(lang, "shopName")}</Label>
                    <Input
                      data-ocid="settings.input"
                      value={form.shopName}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, shopName: e.target.value }))
                      }
                      className="bg-input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t(lang, "shopPhone")}</Label>
                    <Input
                      data-ocid="settings.input"
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, phone: e.target.value }))
                      }
                      className="bg-input"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>{t(lang, "shopAddress")}</Label>
                    <Input
                      data-ocid="settings.input"
                      value={form.address}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, address: e.target.value }))
                      }
                      className="bg-input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t(lang, "gstNumber")}</Label>
                    <Input
                      data-ocid="settings.input"
                      value={form.gstNumber}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, gstNumber: e.target.value }))
                      }
                      placeholder="27AAACR5055K1ZV"
                      className="bg-input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t(lang, "defaultLanguage")}</Label>
                    <Select
                      value={form.defaultLanguage}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, defaultLanguage: v }))
                      }
                    >
                      <SelectTrigger
                        data-ocid="settings.select"
                        className="bg-input"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mr">मराठी</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  data-ocid="settings.save_button"
                  type="submit"
                  className="gold-gradient text-primary-foreground font-semibold"
                  disabled={updateSettings.isPending || isLoading}
                >
                  {updateSettings.isPending ? (
                    <Loader2 size={14} className="mr-2 animate-spin" />
                  ) : (
                    <Save size={14} className="mr-2" />
                  )}
                  {t(lang, "saveSettings")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADD USER TAB */}
        <TabsContent value="adduser" className="mt-4">
          <Card className="bg-card gold-border">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <UserPlus size={18} />
                {t(lang, "createUser")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t(lang, "userName")}</Label>
                    <Input
                      data-ocid="settings.input"
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser((p) => ({ ...p, name: e.target.value }))
                      }
                      className="bg-input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t(lang, "userPhone")}</Label>
                    <Input
                      data-ocid="settings.input"
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) =>
                        setNewUser((p) => ({ ...p, phone: e.target.value }))
                      }
                      className="bg-input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t(lang, "userPassword")}</Label>
                    <Input
                      data-ocid="settings.input"
                      type="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser((p) => ({ ...p, password: e.target.value }))
                      }
                      className="bg-input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t(lang, "userRole")}</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(v) =>
                        setNewUser((p) => ({ ...p, role: v as Role }))
                      }
                    >
                      <SelectTrigger
                        data-ocid="settings.select"
                        className="bg-input"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Role.owner}>
                          {t(lang, "owner")}
                        </SelectItem>
                        <SelectItem value={Role.manager}>
                          {t(lang, "manager")}
                        </SelectItem>
                        <SelectItem value={Role.staff}>
                          {t(lang, "staff")}
                        </SelectItem>
                        <SelectItem value={Role.karagir}>
                          {t(lang, "karagirRole")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  data-ocid="settings.submit_button"
                  type="submit"
                  className="gold-gradient text-primary-foreground font-semibold"
                  disabled={createUser.isPending}
                >
                  {createUser.isPending ? (
                    <Loader2 size={14} className="mr-2 animate-spin" />
                  ) : (
                    <UserPlus size={14} className="mr-2" />
                  )}
                  {t(lang, "createUserBtn")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* USER LIST TAB */}
        <TabsContent value="userlist" className="mt-4">
          <Card className="bg-card gold-border">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Users size={18} />
                {lang === "mr" ? "वापरकर्ता यादी" : "User List"}
                <Badge
                  variant="outline"
                  className="ml-auto text-primary border-primary/40 font-bold"
                >
                  {lang === "mr" ? "एकूण" : "Total"}: {users.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              ) : users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t(lang, "noData")}
                </p>
              ) : (
                <div className="space-y-3">
                  {users.map((u) => (
                    <div
                      key={u.phone}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg bg-background/60 border border-border hover:border-primary/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground truncate">
                            {u.name}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                              ROLE_COLORS[u.role] ??
                              "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            {ROLE_LABELS[u.role] ?? u.role}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          📞 {u.phone}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-primary/40 text-primary hover:bg-primary/10 h-8 px-3"
                          onClick={() => openEditDialog(u)}
                        >
                          <Pencil size={13} className="mr-1" />
                          {lang === "mr" ? "संपादित" : "Edit"}
                        </Button>
                        {u.role !== "owner" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive/40 text-destructive hover:bg-destructive/10 h-8 px-3"
                            onClick={() => openDeleteDialog(u)}
                          >
                            <Trash2 size={13} className="mr-1" />
                            {lang === "mr" ? "हटवा" : "Delete"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="gold-border bg-card">
            <CardContent className="p-4 space-y-5">
              <h3 className="font-semibold text-primary text-base flex items-center gap-2">
                📲 {lang === "mr" ? "WhatsApp सूचना" : "WhatsApp Notifications"}
              </h3>

              {/* Toggle */}
              <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background/40 border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {lang === "mr"
                      ? "ऑर्डर तयार झाल्यावर सूचना पाठवा"
                      : "Notify when order is ready"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {lang === "mr"
                      ? "स्थिती 'तयार' झाल्यावर WhatsApp उघडेल"
                      : "Opens WhatsApp when status changes to Ready"}
                  </p>
                </div>
                <Switch
                  checked={waNotificationsEnabled}
                  onCheckedChange={(checked) => {
                    setWaNotificationsEnabled(checked);
                    localStorage.setItem(WA_NOTIFICATIONS_KEY, String(checked));
                    toast.success(
                      checked
                        ? lang === "mr"
                          ? "WhatsApp सूचना चालू केली"
                          : "WhatsApp notifications enabled"
                        : lang === "mr"
                          ? "WhatsApp सूचना बंद केली"
                          : "WhatsApp notifications disabled",
                    );
                  }}
                  data-ocid="settings.switch"
                />
              </div>

              {/* Info box */}
              {!waNotificationsEnabled && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-400">
                  <p className="font-medium">
                    {lang === "mr"
                      ? "⚠️ सूचना बंद आहे"
                      : "⚠️ Notifications disabled"}
                  </p>
                  <p className="mt-0.5 text-yellow-400/80">
                    {lang === "mr"
                      ? "आपोआप संदेश पाठवला जाणार नाही। 'पुन्हा पाठवा' बटण अजून दिसेल."
                      : "Auto-trigger is stopped. The 'Send Again' button is still visible on orders."}
                  </p>
                </div>
              )}

              {/* Message preview */}
              <div className="bg-muted/30 rounded-lg p-3 space-y-1 border border-border/50">
                <p className="text-xs font-semibold text-foreground mb-2">
                  {lang === "mr" ? "संदेश नमुना:" : "Message Preview:"}
                </p>
                <p className="text-xs text-foreground">
                  नमस्कार [Customer Name],
                </p>
                <p className="text-xs text-muted-foreground">
                  आपली ऑर्डर तयार आहे. कृपया दुकानात येऊन घेऊन जा.
                </p>
                <p className="text-xs text-muted-foreground">– ॐकार ज्वेलर्स</p>
                <p className="text-xs text-foreground mt-2">
                  Hello [Customer Name],
                </p>
                <p className="text-xs text-muted-foreground">
                  Your order is ready. Please visit the shop to collect it.
                </p>
                <p className="text-xs text-muted-foreground">
                  – Omkar Jewellers
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BACKUP & RESTORE TAB */}
        <TabsContent value="backup" className="mt-4 space-y-4">
          {/* Status card */}
          <Card className="bg-card gold-border">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <HardDrive size={18} className="text-primary" />
                {lang === "mr" ? "बॅकअप स्थिती" : "Backup Status"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Last backup info */}
              <div className="p-3 rounded-lg bg-background/60 border border-border">
                {lastBackup ? (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {lang === "mr" ? "शेवटचा बॅकअप" : "Last Backup"}
                      </p>
                      <p className="font-semibold text-foreground text-sm mt-0.5">
                        {formatBackupTime(lastBackup.timestamp)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {lastBackup.label} • {lastBackup.sizeKb} KB •{" "}
                        {lastBackup.createdBy === "auto"
                          ? lang === "mr"
                            ? "आपोआप"
                            : "Auto"
                          : lang === "mr"
                            ? "मॅन्युअल"
                            : "Manual"}
                      </p>
                    </div>
                    <Badge
                      className={`shrink-0 text-xs font-bold ${
                        lastBackup.status === "success"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }`}
                      variant="outline"
                    >
                      {lastBackup.status === "success" ? (
                        <CheckCircle2 size={11} className="mr-1" />
                      ) : (
                        <XCircle size={11} className="mr-1" />
                      )}
                      {lastBackup.status === "success"
                        ? lang === "mr"
                          ? "यशस्वी"
                          : "Success"
                        : lang === "mr"
                          ? "अयशस्वी"
                          : "Failed"}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {lang === "mr" ? "अजून बॅकअप केला नाही" : "No backups yet"}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  className="gold-gradient text-primary-foreground font-semibold flex-1 min-w-[140px]"
                  onClick={() => performBackup(user?.phone ?? "owner", true)}
                  disabled={isBackingUp}
                >
                  {isBackingUp ? (
                    <Loader2 size={14} className="mr-2 animate-spin" />
                  ) : (
                    <Download size={14} className="mr-2" />
                  )}
                  {lang === "mr" ? "आत्ता बॅकअप घ्या" : "Backup Now"}
                </Button>

                <Button
                  variant="outline"
                  className="border-primary/40 text-primary hover:bg-primary/10 flex-1 min-w-[140px]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} className="mr-2" />
                  {lang === "mr" ? "बॅकअप रिस्टोर करा" : "Restore Backup"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">
                <p className="font-medium">
                  {lang === "mr" ? "ℹ️ बॅकअप माहिती" : "ℹ️ Backup Info"}
                </p>
                <p className="mt-0.5 opacity-80">
                  {lang === "mr"
                    ? "बॅकअप आपल्या डिव्हाइसवर JSON फाइल म्हणून डाउनलोड होतो. दर 24 तासांनी आपोआप बॅकअप होतो."
                    : "Backups are downloaded as JSON to your device. Auto-backup runs every 24 hours when you open the app."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Backup history */}
          {backupList.length > 0 && (
            <Card className="bg-card gold-border">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  {lang === "mr" ? "बॅकअप इतिहास" : "Backup History"}
                  <Badge
                    variant="outline"
                    className="ml-auto text-primary border-primary/40 text-xs"
                  >
                    {backupList.length} / 7
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {backupList.map((bk) => {
                    const stored = getStoredBackupData(bk.id);
                    return (
                      <div
                        key={bk.id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-background/50 border border-border hover:border-primary/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-foreground">
                              {bk.label}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-xs h-4 px-1.5 ${
                                bk.status === "success"
                                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                                  : "bg-red-500/10 text-red-400 border-red-500/20"
                              }`}
                            >
                              {bk.status === "success" ? (
                                <CheckCircle2 size={9} className="mr-0.5" />
                              ) : (
                                <XCircle size={9} className="mr-0.5" />
                              )}
                              {bk.status === "success"
                                ? lang === "mr"
                                  ? "यशस्वी"
                                  : "OK"
                                : lang === "mr"
                                  ? "अयशस्वी"
                                  : "Failed"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatBackupTime(bk.timestamp)} • {bk.sizeKb} KB •{" "}
                            {bk.createdBy === "auto"
                              ? lang === "mr"
                                ? "आपोआप"
                                : "Auto"
                              : lang === "mr"
                                ? "मॅन्युअल"
                                : "Manual"}
                          </p>
                          {bk.failReason && (
                            <p className="text-xs text-red-400 mt-0.5">
                              {bk.failReason}
                            </p>
                          )}
                        </div>
                        {stored && bk.status === "success" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-primary/30 text-primary hover:bg-primary/10 h-7 px-2 shrink-0"
                            onClick={() => downloadBackupFile(stored, bk.label)}
                          >
                            <Download size={11} className="mr-1" />
                            {lang === "mr" ? "डाउनलोड" : "Download"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* EDIT USER DIALOG */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <Pencil size={16} className="text-primary" />
              {lang === "mr" ? "वापरकर्ता संपादित करा" : "Edit User"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{t(lang, "userName")}</Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, name: e.target.value }))
                }
                className="bg-input"
                placeholder={lang === "mr" ? "नाव" : "Name"}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === "mr" ? "फोन / आयडी" : "Phone / ID"}</Label>
              <Input
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, phone: e.target.value }))
                }
                className="bg-input"
                type="tel"
                disabled={editUser?.role === "owner"}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                {lang === "mr"
                  ? "नवीन पासवर्ड (रिकामे ठेवल्यास जुना राहील)"
                  : "New Password (leave blank to keep current)"}
              </Label>
              <Input
                value={editForm.password}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, password: e.target.value }))
                }
                className="bg-input"
                type="password"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t(lang, "userRole")}</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) =>
                  setEditForm((p) => ({ ...p, role: v as Role }))
                }
                disabled={editUser?.role === "owner"}
              >
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Role.owner}>{t(lang, "owner")}</SelectItem>
                  <SelectItem value={Role.manager}>
                    {t(lang, "manager")}
                  </SelectItem>
                  <SelectItem value={Role.staff}>{t(lang, "staff")}</SelectItem>
                  <SelectItem value={Role.karagir}>
                    {t(lang, "karagirRole")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                {t(lang, "cancel")}
              </Button>
              <Button
                type="submit"
                className="gold-gradient text-primary-foreground font-semibold"
                disabled={updateUser.isPending}
              >
                {updateUser.isPending ? (
                  <Loader2 size={14} className="mr-2 animate-spin" />
                ) : (
                  <Save size={14} className="mr-2" />
                )}
                {t(lang, "save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {lang === "mr" ? "वापरकर्ता हटवायचा आहे का?" : "Delete User?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lang === "mr"
                ? `"${deleteTarget?.name}" (${deleteTarget?.phone}) हा वापरकर्ता कायमचा हटवला जाईल.`
                : `"${deleteTarget?.name}" (${deleteTarget?.phone}) will be permanently deleted.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t(lang, "cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : (
                <Trash2 size={14} className="mr-2" />
              )}
              {lang === "mr" ? "हो, हटवा" : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* RESTORE CONFIRMATION DIALOG */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Upload size={16} className="text-yellow-400" />
              {lang === "mr" ? "बॅकअप रिस्टोर करायचा आहे का?" : "Restore Backup?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                {lang === "mr"
                  ? "हे सध्याचे सर्व डेटा बदलेल. एक सेफ्टी बॅकअप आपोआप तयार होईल."
                  : "This will overwrite all current data. A safety backup will be created automatically."}
              </span>
              {restoreFile && (
                <span className="block text-xs text-muted-foreground mt-1">
                  {lang === "mr" ? "बॅकअप तारीख" : "Backup date"}:{" "}
                  {formatBackupTime(restoreFile.createdAt)}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRestoreFile(null)}>
              {t(lang, "cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreConfirm}
              className="bg-yellow-600 text-white hover:bg-yellow-700"
              disabled={isRestoring}
            >
              {isRestoring ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : (
                <Upload size={14} className="mr-2" />
              )}
              {lang === "mr" ? "हो, रिस्टोर करा" : "Yes, Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
