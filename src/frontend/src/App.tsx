import { Toaster } from "@/components/ui/sonner";
import React, {
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

// ---------------------------------------------------------------------------
// SYNCHRONOUS token extraction — runs ONCE at module load time, BEFORE React
// initialises. This prevents the race condition where useActor.ts tries to
// read the token from the hash at the same time App.tsx tries to set the hash
// to a route, resulting in a black screen.
// ---------------------------------------------------------------------------
(function extractAdminTokenEarly() {
  try {
    const rawHash = window.location.hash.replace("#", "");
    if (rawHash && !rawHash.startsWith("/")) {
      // The entire hash looks like a param string (e.g. caffeineAdminToken=xxx),
      // not a path-based route.
      const params = new URLSearchParams(rawHash);
      const token = params.get("caffeineAdminToken");
      if (token) {
        try {
          sessionStorage.setItem("caffeineAdminToken", token);
        } catch {
          // sessionStorage may be unavailable in some privacy modes
        }
      }
      // Redirect to the correct route SYNCHRONOUSLY before React mounts
      const hasAuth =
        !!localStorage.getItem("omkar_auth") &&
        !!localStorage.getItem("omkar_creds");
      const targetRoute = hasAuth ? "/dashboard" : "/login";
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname + window.location.search}#${targetRoute}`,
      );
    }
  } catch {
    // Never let this block React from mounting
  }
})();

// ---------------------------------------------------------------------------
// Error boundary — catches render errors and shows a recovery screen instead
// of a blank/black page.
// ---------------------------------------------------------------------------
interface ErrorBoundaryState {
  error: Error | null;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: "#0a0a0a",
            color: "#d4af37",
            fontFamily: "sans-serif",
            flexDirection: "column",
            gap: "16px",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", margin: 0 }}>ॐकार ज्वेलर्स</h2>
          <p style={{ color: "#888", margin: 0 }}>
            काहीतरी चूक झाली. कृपया पृष्ठ रिफ्रेश करा.
          </p>
          <p style={{ color: "#555", fontSize: "0.75rem", margin: 0 }}>
            Something went wrong. Please refresh the page.
          </p>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("omkar_auth");
              window.location.hash = "/login";
              window.location.reload();
            }}
            style={{
              padding: "10px 20px",
              background: "#d4af37",
              color: "#000",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.9rem",
            }}
          >
            Login Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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

/**
 * Parse the current URL hash into a clean route.
 * Handles special cases:
 *   - Caffeine admin token: #caffeineAdminToken=... → redirect to /dashboard
 *     (the IIFE above already cleaned up this URL before we get here)
 *   - Empty hash → /dashboard
 *   - Normal hash: #/billing → /billing
 */
function getHash(): string {
  const raw = window.location.hash.replace("#", "");
  // If hash still looks like a token string (shouldn't happen after IIFE, but guard anyway)
  if (!raw || !raw.startsWith("/")) {
    return "/dashboard";
  }
  return raw;
}

function parseInvoiceRoute(hash: string): string | null {
  const match = hash.match(/^\/invoice\/(.+)$/);
  return match ? match[1] : null;
}

function AppInner() {
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
    // Listen for hash changes so the app reacts to navigation
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

export default function App() {
  return (
    <AppErrorBoundary>
      <AppInner />
    </AppErrorBoundary>
  );
}
