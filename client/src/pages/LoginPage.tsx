/**
 * Login Page - Estilo iptvapps.net
 * Campo de usuário, senha com "Mostrar", checkbox "Permanecer conectado",
 * botão "Conecte-se", link "Cadastre-se", Telegram Login Widget oficial
 */
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { Eye, EyeOff, LogIn, ArrowLeft, AlertTriangle, Ban, Clock } from "lucide-react";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login, loginLoading, isAuthenticated } = useCustomAuth();
  const [loginStr, setLoginStr] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banType, setBanType] = useState<"permanent" | "temp" | null>(null);

  // Check for error from Telegram redirect (query param)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    if (errorParam) {
      const decoded = decodeURIComponent(errorParam);
      if (decoded.includes("BAN_PERMANENT")) {
        setBanType("permanent");
        setError(decoded.replace("BAN_PERMANENT|", ""));
      } else if (decoded.includes("BAN_TEMP")) {
        setBanType("temp");
        setError(decoded.replace("BAN_TEMP|", ""));
      } else {
        setError(decoded);
      }
      // Clean URL
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBanType(null);
    try {
      await login(loginStr, password, rememberMe);
      navigate("/");
    } catch (err: any) {
      const msg = err?.message || "Erro ao fazer login";
      // Never show SQL errors
      if (msg.includes("Failed query") || msg.includes("INSERT") || msg.includes("SELECT") || msg.includes("SQL")) {
        setError("Erro ao fazer login. Tente novamente.");
      } else if (msg.includes("banida permanentemente") || msg.includes("permanentemente") || msg.includes("BAN_PERMANENT")) {
        setBanType("permanent");
        setError(msg.replace("BAN_PERMANENT|", ""));
      } else if (msg.includes("temporariamente") || msg.includes("banida até") || msg.includes("BAN_TEMP")) {
        setBanType("temp");
        setError(msg.replace("BAN_TEMP|", ""));
      } else {
        setError(msg);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "oklch(0.12 0.02 250)" }}>
      {/* Back button */}
      <Link href="/" className="absolute top-4 left-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar</span>
      </Link>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/">
            <h1 className="text-2xl font-bold text-foreground hover:text-primary transition-colors">
              EditStream Pro
            </h1>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">Fórum da Comunidade</p>
        </div>

        {/* Login Card */}
        <div className="rounded-xl border border-border/30 p-6 space-y-5" style={{ background: "oklch(0.16 0.02 250)" }}>
          {/* Ban Error Messages */}
          {error && banType === "permanent" && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <Ban className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-300">
                <p className="font-semibold mb-1">Conta Banida Permanentemente</p>
                <p>{error}</p>
              </div>
            </div>
          )}
          {error && banType === "temp" && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-300">
                <p className="font-semibold mb-1">Conta Temporariamente Banida</p>
                <p>{error}</p>
              </div>
            </div>
          )}
          {error && !banType && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-300">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username/Email field */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">
                Seu nome ou endereço de e-mail:
              </label>
              <input
                type="text"
                value={loginStr}
                onChange={(e) => setLoginStr(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border/50 bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                placeholder="Usuário ou e-mail"
                required
                autoFocus
              />
            </div>

            {/* Password field with show/hide */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">
                Senha:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-24 rounded-lg border border-border/50 bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  placeholder="Sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-white/5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showPassword ? "Ocultar" : "Mostrar"}</span>
                </button>
              </div>
            </div>

            {/* Remember me checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-border/50 bg-background/50 text-primary focus:ring-primary/50 accent-[oklch(0.7_0.15_200)]"
              />
              <span className="text-sm text-muted-foreground">Permanecer conectado</span>
            </label>

            {/* Login button */}
            <button
              type="submit"
              disabled={loginLoading || !loginStr || !password}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "oklch(0.55 0.15 200)" }}
              onMouseOver={(e) => !loginLoading && (e.currentTarget.style.background = "oklch(0.6 0.15 200)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "oklch(0.55 0.15 200)")}
            >
              <LogIn className="w-4 h-4" />
              {loginLoading ? "Conectando..." : "Conecte-se"}
            </button>
          </form>

          {/* Register link */}
          <div className="text-center">
            <span className="text-sm text-muted-foreground">Não tem uma conta? </span>
            <Link href="/registro" className="text-sm font-medium transition-colors" style={{ color: "oklch(0.7 0.15 200)" }}>
              Cadastre-se agora.
            </Link>
          </div>


        </div>
      </div>
    </div>
  );
}
