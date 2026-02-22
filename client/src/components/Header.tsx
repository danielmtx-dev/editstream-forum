/**
 * Header - EditStream Pro Store
 * Features: Logo, nav links (Membros, Categorias), Telegram contact, auth
 */
import { Search, Users, Package, Menu, X, LogIn, LogOut, Settings, User, Send } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { FORUM_STATS } from "@/lib/forumData";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { trpc } from "@/lib/trpc";

const DEFAULT_LOGO = "https://private-us-east-1.manuscdn.com/sessionFile/GU2vQC0SCGeBAaQ3gZdiwt/sandbox/KiQBhGJmSEKiOV0brg3oXc-img-2_1771195601000_na1fn_ZWRpdHN0cmVhbS1sb2dv.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvR1UydlFDMFNDR2VCQWFRM2daZGl3dC9zYW5kYm94L0tpUUJoR0ptU0VLaU9WMGJyZzNvWGMtaW1nLTJfMTc3MTE5NTYwMTAwMF9uYTFmbl9aV1JwZEhOMGNtVmhiUzFzYjJkdi5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=sWekqs8-cPqMPUhzzu1XN26yyK8cbp~diOSZbgKPLAiGBDCKOtYgWGXKWV9Odv5gjHE-h8skPn7mivHiswc6w4yUOPOckXmCnz4hKA1-4FA6L2vzI0lO5dtDvpo08Vxq1ZT1YiJv6fZcZ19fWqJQdhVQqvcYmeduHYe-~NqNQnU~uz9ZXFnGvqBQsMIHOD885DNx8NgkCZ06bFhFQryFRvju9RY2ZIGh~H792Hn8PNQN26~8P2eHgD8HYCvMMb~JypYBPF7RitTxGHfw8bD8jK2CCh2DKkHKaiES-O5Uw5jzvwz50MNbUlepB4dVC1mwL9eNW2qaJQQK49HqwAm0ug__";

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useCustomAuth();

  // Get contact info and logos from admin settings
  const { data: contactInfo } = trpc.admin.getContactInfo.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  });
  const { data: logos } = trpc.admin.getLogos.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  });
  const contactTelegram = contactInfo?.contactTelegram || "@Danielssh";
  const telegramUrl = `https://t.me/${contactTelegram.replace("@", "")}`;
  const logoUrl = logos?.header || DEFAULT_LOGO;

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/50" style={{ background: "oklch(0.14 0.02 250 / 0.95)", backdropFilter: "blur(12px)" }}>
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img
                src={logoUrl}
                alt="EditStream Pro"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-[oklch(0.65_0.15_240)] ring-offset-2 ring-offset-background transition-all duration-300 group-hover:ring-offset-4"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-bold text-foreground tracking-tight">EditStream Pro</h1>
                <svg className="w-4 h-4 text-[oklch(0.65_0.15_240)]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">{FORUM_STATS.members} membros</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-3">
            <Link href="/membros" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
              <Users className="w-4 h-4" />
              <span>Membros</span>
            </Link>
            <Link href="/categorias" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
              <Package className="w-4 h-4" />
              <span>Categorias</span>
            </Link>

            {/* Telegram Contact */}
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-[oklch(0.7_0.12_200)] hover:text-[oklch(0.8_0.12_200)] transition-colors px-2 py-1 rounded-lg hover:bg-[oklch(0.7_0.12_200)]/10"
            >
              <Send className="w-4 h-4" />
              <span>Contato</span>
            </a>

            {/* Admin Link */}
            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors px-2 py-1 rounded-lg hover:bg-amber-400/10">
                <Settings className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}

            {/* Auth */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link href="/minha-conta" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
                  <User className="w-4 h-4" />
                  <span className="max-w-[100px] truncate">{user?.displayName || user?.username || "Conta"}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded-lg hover:bg-red-400/10"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-1.5 text-sm font-medium text-white px-3 py-1.5 rounded-lg transition-colors" style={{ background: "oklch(0.45 0.15 240)" }}>
                <LogIn className="w-4 h-4" />
                <span>Entrar</span>
              </Link>
            )}

            {/* Search */}
            <div className="relative">
              {searchOpen ? (
                <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-200">
                  <input
                    type="text"
                    placeholder="Buscar produtos..."
                    className="w-64 h-9 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                    autoFocus
                    onBlur={() => setSearchOpen(false)}
                  />
                  <button onClick={() => setSearchOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-2 h-9 px-3 text-sm text-muted-foreground bg-secondary rounded-lg border border-border hover:border-primary/50 transition-all duration-200"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 animate-in slide-in-from-top-2 duration-200 space-y-2">
            <Link href="/membros" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5" onClick={() => setMobileMenuOpen(false)}>
              <Users className="w-4 h-4" />
              Membros
            </Link>
            <Link href="/categorias" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5" onClick={() => setMobileMenuOpen(false)}>
              <Package className="w-4 h-4" />
              Categorias
            </Link>
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm text-[oklch(0.7_0.12_200)] rounded-lg hover:bg-[oklch(0.7_0.12_200)]/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Send className="w-4 h-4" />
              Contato via Telegram ({contactTelegram})
            </a>
            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-sm text-amber-400 rounded-lg hover:bg-amber-400/10" onClick={() => setMobileMenuOpen(false)}>
                <Settings className="w-4 h-4" />
                Painel Admin
              </Link>
            )}
            {isAuthenticated ? (
              <>
                <Link href="/minha-conta" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5" onClick={() => setMobileMenuOpen(false)}>
                  <User className="w-4 h-4" />
                  {user?.displayName || user?.username || "Minha Conta"}
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 rounded-lg hover:bg-red-400/10 w-full text-left">
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </>
            ) : (
              <Link href="/login" className="flex items-center gap-2 px-3 py-2 text-sm text-primary rounded-lg hover:bg-primary/10" onClick={() => setMobileMenuOpen(false)}>
                <LogIn className="w-4 h-4" />
                Entrar
              </Link>
            )}
            <input
              type="text"
              placeholder="Buscar produtos..."
              className="w-full h-9 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
        )}
      </div>
    </header>
  );
}
