import { Toaster } from "@/components/ui/sonner";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import Layout from "./components/Layout";
import SessionRestorer from "./components/SessionRestorer";
import BillingPage from "./pages/BillingPage";
import CompletedOrdersPage from "./pages/CompletedOrdersPage";
import CustomOrdersPage from "./pages/CustomOrdersPage";
import CustomersPage from "./pages/CustomersPage";
import DashboardPage from "./pages/DashboardPage";
import InvoicePage from "./pages/InvoicePage";
import KaragirPage from "./pages/KaragirPage";
import LoginPage from "./pages/LoginPage";
import RepairPage from "./pages/RepairPage";
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
      if (!stored) return null;
      // If there's no omkar_creds, the session can't be re-established.
      // Force the user to log in again so creds are stored properly.
      const creds = localStorage.getItem("omkar_creds");
      if (!creds) {
        localStorage.removeItem("omkar_auth");
        return null;
      }
      return JSON.parse(stored) as AuthUser;
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
    localStorage.removeItem("omkar_creds");
    window.location.hash = "/login";
  }, [setUser]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("omkar_lang", l);
  }, []);

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
    if (currentRoute === "/repair") return <RepairPage />;
    if (currentRoute === "/custom-orders") return <CustomOrdersPage />;
    if (currentRoute === "/completed") return <CompletedOrdersPage />;
    if (currentRoute === "/settings") return <SettingsPage />;
    if (currentRoute.startsWith("/view-invoice/")) {
      const id = currentRoute.replace("/view-invoice/", "");
      return <InvoicePage invoiceId={id} isPublic={false} />;
    }
    return <DashboardPage />;
  }

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <AuthContext.Provider value={{ user, setUser, logout }}>
        <SessionRestorer />
        <Layout currentRoute={currentRoute}>{renderPage()}</Layout>
        <Toaster richColors position="top-right" />
      </AuthContext.Provider>
    </LangContext.Provider>
  );
}
