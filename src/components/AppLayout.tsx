import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Calculator, BookMarked, LogOut, User, Menu, Globe, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import pedflowLogo from "@/assets/pedflow-logo.png.asset.json";
import { AppInfoButton } from "@/components/AppInfoButton";
import { clearGateState } from "@/lib/app-config";
import { ExportCountBadge } from "@/common/exports/ExportCountBadge";
import { useExportQuota } from "@/common/exports/useExportQuota";


const LANGS = [
  { code: "it", label: "Italiano" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const quota = useExportQuota();


  const navItems = [
    { to: "/calcolatore", icon: Calculator, label: t("nav.calculator") },
    { to: "/registro", icon: BookMarked, label: t("nav.registry") },
    { to: "/databases", icon: Database, label: t("nav.databases") },
  ];

  const handleSignOut = async () => {
    clearGateState();
    await signOut();
    navigate("/auth", { replace: true });
  };

  const currentLang = LANGS.find((l) => l.code === i18n.language.slice(0, 2)) ?? LANGS[0];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b-2 border-border bg-card">
        <div className="flex h-16 items-center gap-2 px-4 lg:px-6">
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden h-11 w-11" onClick={() => setOpen(true)} aria-label="Menu">
              <Menu className="h-6 w-6" />
            </Button>
            <Link to="/calcolatore" className="flex items-center gap-2">
              <img src={pedflowLogo.url} alt="PedFlow" className="h-10 w-10 rounded-lg object-contain bg-white" />
              <span className="hidden sm:inline text-xl font-bold text-foreground">{t("app.name")}</span>
            </Link>
          </div>

          <nav className="hidden lg:flex min-w-0 flex-1 items-center justify-end gap-2">
            <ExportCountBadge remaining={quota.remaining} loading={quota.loading} className="shrink-0" />
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.to);
              return (
                <Link key={item.to} to={item.to} aria-current={isActive ? "page" : undefined} className="shrink-0">
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "gap-2 h-11 px-3 text-base font-semibold whitespace-nowrap",
                      isActive && "bg-primary/15 text-primary border-2 border-primary/40 hover:bg-primary/20"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Button>
                </Link>

              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2 ml-auto lg:ml-2">
            <ExportCountBadge remaining={quota.remaining} loading={quota.loading} className="lg:hidden" />
            <AppInfoButton />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-11 gap-2" aria-label={t("nav.language")}>
                  <Globe className="h-4 w-4" />
                  <span className="uppercase text-sm font-bold">{currentLang.code}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {LANGS.map((l) => (
                  <DropdownMenuItem key={l.code} onClick={() => i18n.changeLanguage(l.code)} className={cn(i18n.language.startsWith(l.code) && "font-bold")}>
                    {l.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              className="h-11 gap-2 shrink-0 whitespace-nowrap font-bold"
              onClick={handleSignOut}
              title={user?.email ?? undefined}
              aria-label={t("nav.logout")}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">{t("nav.logout")}</span>
            </Button>
          </div>
        </div>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b border-border p-4">
            <SheetTitle className="flex items-center gap-2">
              <img src={pedflowLogo.url} alt="PedFlow" className="h-10 w-10 rounded-lg object-contain bg-white" />
              {t("app.name")}
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.to);
              return (
                <Link key={item.to} to={item.to} onClick={() => setOpen(false)}>
                  <Button variant={isActive ? "secondary" : "ghost"} className={cn("w-full justify-start gap-3 h-12 text-base", isActive && "bg-accent text-accent-foreground")}>
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            <Button variant="outline" className="w-full justify-start gap-3 h-12 text-base" onClick={() => { setOpen(false); handleSignOut(); }}>
              <LogOut className="h-5 w-5" /> {t("nav.logout")}
            </Button>
          </nav>
        </SheetContent>
      </Sheet>

      <main className="mx-auto max-w-6xl px-4 py-6 lg:px-6">{children}</main>
    </div>
  );
}