import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Diamond,
  FileText,
  Globe,
  Hammer,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useAuth, useLang } from "../App";
import { t } from "../translations";

interface NavItem {
  key: string;
  route: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    key: "dashboard",
    route: "/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  { key: "billing", route: "/billing", icon: <FileText size={18} /> },
  { key: "customers", route: "/customers", icon: <Users size={18} /> },
  { key: "udhar", route: "/udhar", icon: <BookOpen size={18} /> },
  { key: "reports", route: "/reports", icon: <BarChart3 size={18} /> },
  {
    key: "karagir",
    route: "/karagir",
    icon: <Hammer size={18} />,
    roles: ["karagir", "owner", "manager"],
  },
  {
    key: "repair",
    route: "/repair",
    icon: <Wrench size={18} />,
    roles: ["owner", "manager", "staff"],
  },
  {
    key: "customOrders",
    route: "/custom-orders",
    icon: <Sparkles size={18} />,
    roles: ["owner", "manager", "staff"],
  },
  {
    key: "completedOrders",
    route: "/completed",
    icon: <CheckCircle2 size={18} />,
    roles: ["owner", "manager", "staff"],
  },
  {
    key: "settings",
    route: "/settings",
    icon: <Settings size={18} />,
    roles: ["owner"],
  },
];

export default function Layout({
  children,
  currentRoute,
}: { children: React.ReactNode; currentRoute: string }) {
  const { user, logout } = useAuth();
  const { lang, setLang } = useLang();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = (route: string) => {
    window.location.hash = route;
    setSidebarOpen(false);
  };

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role ?? ""),
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img
            src="/assets/uploads/untitled_design-019d2110-b3c6-757d-b95e-8bd41c35b147-1.png"
            alt="OMKAR JWELLERS"
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="font-display text-sm font-bold text-primary leading-tight">
              {t(lang, "appName")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t(lang, "tagline")}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1" aria-label="Main navigation">
        {visibleItems.map((item) => {
          const active =
            currentRoute === item.route ||
            (currentRoute === "/" && item.route === "/dashboard");
          return (
            <button
              type="button"
              key={item.key}
              data-ocid={`nav.${item.key}.link`}
              onClick={() => navigate(item.route)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-primary text-primary-foreground shadow-gold"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              {item.icon}
              {t(lang, item.key)}
            </button>
          );
        })}
      </nav>

      {/* User + Controls */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        {/* Lang toggle */}
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-muted-foreground" />
          <div className="flex rounded-md overflow-hidden border border-border">
            <button
              type="button"
              onClick={() => setLang("mr")}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                lang === "mr"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              मराठी
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                lang === "en"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* User info */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">
              {user?.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{user?.name}</p>
            <Badge
              variant="outline"
              className="text-xs px-1 py-0 border-primary/40 text-primary"
            >
              {t(
                lang,
                user?.role === "karagir"
                  ? "karagirRole"
                  : (user?.role ?? "staff"),
              )}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            data-ocid="nav.logout.button"
            onClick={logout}
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
          >
            <LogOut size={14} />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — hidden on print */}
      <aside className="no-print hidden md:flex w-64 flex-shrink-0 flex-col bg-sidebar border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile overlay — hidden on print */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="no-print fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="no-print fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border z-50 md:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header — hidden on print */}
        <header className="no-print md:hidden flex items-center justify-between px-4 py-3 bg-sidebar border-b border-border">
          <button
            type="button"
            data-ocid="nav.menu.button"
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md hover:bg-muted"
          >
            <Menu size={20} />
          </button>
          <img
            src="/assets/uploads/untitled_design-019d2110-b3c6-757d-b95e-8bd41c35b147-1.png"
            alt="OMKAR JWELLERS"
            className="h-8 object-contain"
          />
          <div className="flex rounded-md overflow-hidden border border-border">
            <button
              type="button"
              onClick={() => setLang("mr")}
              className={`px-2 py-1 text-xs ${lang === "mr" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              मर
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-2 py-1 text-xs ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              EN
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>

        {/* Footer — hidden on print */}
        <footer className="no-print hidden md:flex items-center justify-center py-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
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
        </footer>
      </div>
    </div>
  );
}
