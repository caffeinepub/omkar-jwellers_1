import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Diamond, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth, useLang } from "../App";
import type { Role } from "../backend";
import { useActor } from "../hooks/useActor";
import { t } from "../translations";

export default function LoginPage() {
  const { lang } = useLang();
  const { setUser } = useAuth();
  const { actor } = useActor();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) {
      toast.error("Connecting to backend...");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await actor.login(phone.trim(), password);
      localStorage.setItem(
        "omkar_creds",
        JSON.stringify({ phone: phone.trim(), password }),
      );
      setUser({
        name: result.name,
        phone: result.phone,
        role: result.role as Role,
      });
      window.location.hash = "/dashboard";
    } catch {
      setError(t(lang, "loginError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gold-gradient mb-4 shadow-gold">
            <Diamond size={28} className="text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold gold-text">
            {t(lang, "appName")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t(lang, "tagline")}
          </p>
        </div>

        <Card className="bg-card gold-border card-glow">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              {t(lang, "loginTitle")}
            </CardTitle>
            <CardDescription>{t(lang, "loginSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">{t(lang, "phone")}</Label>
                <Input
                  id="phone"
                  data-ocid="login.input"
                  type="tel"
                  placeholder="मोबाइल नंबर"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-input border-border text-base"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t(lang, "password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    data-ocid="login.input"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-input border-border pr-10 text-base"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  data-ocid="login.error_state"
                  className="text-destructive text-sm bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2"
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                data-ocid="login.submit_button"
                className="w-full gold-gradient text-primary-foreground font-semibold h-11"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {loading ? t(lang, "loading") : t(lang, "loginBtn")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
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
      </motion.div>
    </div>
  );
}
