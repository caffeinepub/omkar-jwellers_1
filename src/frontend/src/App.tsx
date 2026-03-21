import { Toaster } from "@/components/ui/sonner";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import Layout from "./components/Layout";
import BillingPage from "./pages/BillingPage";
import CustomersPage from "./pages/CustomersPage";
import DashboardPage from "./pages/DashboardPage";
import InvoicePage from "./pages/InvoicePage";
import KaragirPage from "./pages/KaragirPage";
import LoginPage from "./pages/LoginPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import UdharPage from "./pages/UdharPage";
import type { Lang } from "./translations";

export interface AuthUser {
  name: string;
  phone: string;
  role: "owner" | "manager" | "staff" | "karagir";
}

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
});

export const LangContext = createContext<LangContextType>({
  lang: "mr",
  setLang: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useLang() {
  return useContext(LangContext);
}

function getHash(): string {
  return window.location.hash.replace("#", "") || "/dashboard";
}

function parseInvoiceRoute(hash: string): string | null {
  const match = hash.match(/^\/invoice\/(.+)$/);
  return match ? match[1] : null;
}

export default function App() {
  const [user, setUserState] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("omkar_auth");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("omkar_lang") as Lang) ?? "mr";
  });

  const [currentRoute, setCurrentRoute] = useState<string>(getHash);

  useEffect(() => {
    const handler = () => setCurrentRoute(getHash());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const setUser = useCallback((u: AuthUser | null) => {
    setUserState(u);
    if (u) localStorage.setItem("omkar_auth", JSON.stringify(u));
    else localStorage.removeItem("omkar_auth");
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    window.location.hash = "/login";
  }, [setUser]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("omkar_lang", l);
  }, []);

  // Public invoice route — no auth required
  const invoiceId = parseInvoiceRoute(currentRoute);
  if (invoiceId) {
    return (
      <LangContext.Provider value={{ lang, setLang }}>
        <AuthContext.Provider value={{ user, setUser, logout }}>
          <InvoicePage invoiceId={invoiceId} isPublic />
          <Toaster richColors position="top-right" />
        </AuthContext.Provider>
      </LangContext.Provider>
    );
  }

  // Auth gate
  if (!user) {
    return (
      <LangContext.Provider value={{ lang, setLang }}>
        <AuthContext.Provider value={{ user, setUser, logout }}>
          <LoginPage />
          <Toaster richColors position="top-right" />
        </AuthContext.Provider>
      </LangContext.Provider>
    );
  }

  function renderPage() {
    if (currentRoute === "/dashboard" || currentRoute === "/")
      return <DashboardPage />;
    if (currentRoute === "/billing") return <BillingPage />;
    if (currentRoute === "/customers") return <CustomersPage />;
    if (currentRoute === "/udhar") return <UdharPage />;
    if (currentRoute === "/reports") return <ReportsPage />;
    if (currentRoute === "/karagir") return <KaragirPage />;
    if (currentRoute === "/settings") return <SettingsPage />;
    // Handle /billing?invoiceId=xxx for viewing generated invoice
    if (currentRoute.startsWith("/view-invoice/")) {
      const id = currentRoute.replace("/view-invoice/", "");
      return <InvoicePage invoiceId={id} isPublic={false} />;
    }
    return <DashboardPage />;
  }

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <AuthContext.Provider value={{ user, setUser, logout }}>
        <Layout currentRoute={currentRoute}>{renderPage()}</Layout>
        <Toaster richColors position="top-right" />
      </AuthContext.Provider>
    </LangContext.Provider>
  );
}
