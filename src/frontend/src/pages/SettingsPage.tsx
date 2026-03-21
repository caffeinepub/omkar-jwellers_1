import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Settings, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth, useLang } from "../App";
import { Role } from "../backend";
import {
  useCreateUser,
  useSettings,
  useUpdateSettings,
} from "../hooks/useQueries";
import { t } from "../translations";

export default function SettingsPage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const createUser = useCreateUser();

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
    } catch {
      toast.error(t(lang, "error"));
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
    } catch {
      toast.error(t(lang, "error"));
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
    <div className="p-4 md:p-6 space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3">
        <Settings size={24} className="text-primary" />
        <h1 className="font-display text-2xl md:text-3xl font-bold">
          {t(lang, "settingsTitle")}
        </h1>
      </div>

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

      <Separator className="bg-border" />

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
    </div>
  );
}
