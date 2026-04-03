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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Pencil,
  Save,
  Settings,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth, useLang } from "../App";
import { Role } from "../backend";
import type { UserDTO } from "../backend";
import {
  extractErrorMessage,
  useCreateUser,
  useDeleteUser,
  useSettings,
  useUpdateSettings,
  useUpdateUser,
  useUsers,
} from "../hooks/useQueries";
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
      await createUser.mutateAsync(newUser);
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
      await updateUser.mutateAsync({
        name: editForm.name,
        phone: editForm.phone,
        password: editForm.password,
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

  if (user?.role !== "owner") {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="text-muted-foreground">
          {lang === "mr" ? "तुम्हाला परवानगी नाही" : "Access denied"}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <Settings size={24} className="text-primary" />
        <h1 className="font-display text-2xl md:text-3xl font-bold">
          {t(lang, "settingsTitle")}
        </h1>
      </div>

      <Tabs defaultValue="shop" className="w-full">
        <TabsList className="grid grid-cols-3 w-full bg-card border border-border">
          <TabsTrigger
            value="shop"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium"
          >
            {lang === "mr" ? "दुकान" : "Shop"}
          </TabsTrigger>
          <TabsTrigger
            value="adduser"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium"
          >
            {lang === "mr" ? "वापरकर्ता जोडा" : "Add User"}
          </TabsTrigger>
          <TabsTrigger
            value="userlist"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium"
          >
            {lang === "mr" ? "यादी" : "User List"}
            {users.length > 0 && (
              <span className="ml-1.5 bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full font-bold">
                {users.length}
              </span>
            )}
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
    </div>
  );
}
