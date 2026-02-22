/**
 * Register Page - Verificação via Bot Telegram
 * 
 * Fluxo de 3 etapas:
 * 1. Informar @username do Telegram → bot envia mensagem no grupo
 * 2. Digitar código de 6 dígitos recebido no privado do bot
 * 3. Definir usuário e senha para finalizar cadastro
 */
import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { trpc } from "@/lib/trpc";
import {
  Eye, EyeOff, UserPlus, ArrowLeft, AlertTriangle,
  Send, CheckCircle2, Loader2, ShieldCheck, AtSign,
} from "lucide-react";
import { toast } from "sonner";

type Step = "telegram" | "code" | "account";

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { register, registerLoading, isAuthenticated } = useCustomAuth();

  // Step management
  const [step, setStep] = useState<Step>("telegram");

  // Step 1: Telegram username
  const [telegramUsername, setTelegramUsername] = useState("");
  const [sendingVerification, setSendingVerification] = useState(false);

  // Step 2: Verification code
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verifiedTelegramName, setVerifiedTelegramName] = useState("");

  // Step 3: Account
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [verificationCode, setVerificationCode] = useState(""); // stored from step 2

  const [error, setError] = useState<string | null>(null);

  const sendVerification = trpc.customAuth.sendTelegramVerification.useMutation();
  const verifyCode = trpc.customAuth.verifyTelegramCode.useMutation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null;

  // ===== Step 1: Send verification to group =====
  const handleSendVerification = async () => {
    setError(null);
    const cleaned = telegramUsername.replace(/^@/, "").trim();
    if (!cleaned) {
      setError("Informe seu @username do Telegram");
      return;
    }
    setSendingVerification(true);
    try {
      await sendVerification.mutateAsync({ telegramUsername: cleaned });
      toast.success("Mensagem enviada no grupo! Verifique o grupo @editstreampro");
      setStep("code");
    } catch (err: any) {
      setError(err?.message || "Falha ao enviar verificação.");
    } finally {
      setSendingVerification(false);
    }
  };

  // ===== Step 2: Verify 6-digit code =====
  const handleCodeInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // only digits
    const newDigits = [...codeDigits];
    newDigits[index] = value.slice(-1); // only last char
    setCodeDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    const fullCode = newDigits.join("");
    if (fullCode.length === 6) {
      handleVerifyCode(fullCode);
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newDigits = pasted.split("");
      setCodeDigits(newDigits);
      codeInputRefs.current[5]?.focus();
      handleVerifyCode(pasted);
    }
  };

  const handleVerifyCode = async (code: string) => {
    setError(null);
    setVerifyingCode(true);
    try {
      const result = await verifyCode.mutateAsync({ code });
      if (result.valid) {
        setVerificationCode(code);
        setVerifiedTelegramName(result.telegramFirstName || result.telegramUsername || "");
        toast.success("Identidade confirmada! Agora crie sua conta.");
        setStep("account");
      }
    } catch (err: any) {
      setError(err?.message || "Código inválido ou expirado.");
      setCodeDigits(["", "", "", "", "", ""]);
      codeInputRefs.current[0]?.focus();
    } finally {
      setVerifyingCode(false);
    }
  };

  // ===== Step 3: Create account =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    try {
      await register({ username, password, verificationCode });
      toast.success("Conta criada com sucesso!");
      navigate("/");
    } catch (err: any) {
      setError(err?.message || "Erro ao criar conta");
    }
  };

  // ===== Step indicator =====
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[
        { key: "telegram", label: "Telegram", num: 1 },
        { key: "code", label: "Código", num: 2 },
        { key: "account", label: "Conta", num: 3 },
      ].map((s, i) => {
        const isActive = step === s.key;
        const isDone =
          (s.key === "telegram" && (step === "code" || step === "account")) ||
          (s.key === "code" && step === "account");
        return (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className="w-8 h-0.5 rounded-full transition-colors"
                style={{ background: isDone || isActive ? "oklch(0.55 0.15 200)" : "oklch(0.25 0.02 250)" }}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: isDone ? "oklch(0.55 0.15 160)" : isActive ? "oklch(0.55 0.15 200)" : "oklch(0.25 0.02 250)",
                  color: isDone || isActive ? "white" : "oklch(0.5 0.02 250)",
                }}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <span
                className="text-xs font-medium hidden sm:inline"
                style={{ color: isActive ? "oklch(0.85 0.05 200)" : "oklch(0.5 0.02 250)" }}
              >
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "oklch(0.12 0.02 250)" }}>
      {/* Back button */}
      <Link
        href="/login"
        className="absolute top-4 left-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
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
          <p className="text-lg font-semibold text-foreground mt-2">Criar Conta</p>
          <p className="text-sm text-muted-foreground mt-1">Cadastre-se no EditStream Pro</p>
        </div>

        <StepIndicator />

        {/* Card */}
        <div
          className="rounded-xl border border-border/30 p-6 space-y-5"
          style={{ background: "oklch(0.16 0.02 250)" }}
        >
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-300">{error}</span>
            </div>
          )}

          {/* ===== STEP 1: Telegram Username ===== */}
          {step === "telegram" && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center" style={{ background: "oklch(0.25 0.08 200)" }}>
                  <AtSign className="w-6 h-6" style={{ color: "oklch(0.7 0.15 200)" }} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Informe seu <strong>@username do Telegram</strong>. O bot enviará uma mensagem no grupo{" "}
                  <a
                    href="https://t.me/editstreampro"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    style={{ color: "oklch(0.7 0.15 200)" }}
                  >
                    @editstreampro
                  </a>{" "}
                  para confirmar sua identidade.
                </p>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">
                  Username do Telegram:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                  <input
                    type="text"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value.replace(/^@/, ""))}
                    className="w-full pl-8 pr-4 py-3 rounded-lg border border-border/50 bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                    placeholder="seu_username"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendVerification}
                disabled={sendingVerification || !telegramUsername.replace(/^@/, "").trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "oklch(0.55 0.15 200)" }}
                onMouseOver={(e) => !sendingVerification && (e.currentTarget.style.background = "oklch(0.6 0.15 200)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "oklch(0.55 0.15 200)")}
              >
                {sendingVerification ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sendingVerification ? "Enviando..." : "Enviar Verificação"}
              </button>

              <p className="text-xs text-center text-muted-foreground">
                Você precisa ser membro do grupo{" "}
                <a
                  href="https://t.me/editstreampro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: "oklch(0.7 0.15 200)" }}
                >
                  @editstreampro
                </a>{" "}
                para se cadastrar.
              </p>
            </div>
          )}

          {/* ===== STEP 2: Enter Code ===== */}
          {step === "code" && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center" style={{ background: "oklch(0.25 0.08 160)" }}>
                  <ShieldCheck className="w-6 h-6" style={{ color: "oklch(0.7 0.15 160)" }} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Mensagem enviada no grupo! Clique em{" "}
                  <strong>"✅ Confirmar Cadastro"</strong> no grupo e depois digite o{" "}
                  <strong>código de 6 dígitos</strong> que o bot enviou no seu privado.
                </p>
              </div>

              {/* 6-digit code input */}
              <div className="flex justify-center gap-2" onPaste={handleCodePaste}>
                {codeDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { codeInputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeInput(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    autoFocus={i === 0}
                    disabled={verifyingCode}
                    className="w-12 h-14 text-center text-xl font-mono font-bold rounded-lg border border-border/50 bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50"
                    style={{ letterSpacing: "0.1em" }}
                  />
                ))}
              </div>

              {verifyingCode && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando código...
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setStep("telegram"); setError(null); setCodeDigits(["", "", "", "", "", ""]); }}
                  className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleSendVerification}
                  disabled={sendingVerification}
                  className="text-sm underline transition-colors"
                  style={{ color: "oklch(0.7 0.15 200)" }}
                >
                  {sendingVerification ? "Reenviando..." : "Reenviar verificação"}
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 3: Create Account ===== */}
          {step === "account" && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center" style={{ background: "oklch(0.25 0.08 160)" }}>
                  <CheckCircle2 className="w-6 h-6" style={{ color: "oklch(0.7 0.15 160)" }} />
                </div>
                <p className="text-sm text-foreground font-medium">
                  Identidade confirmada{verifiedTelegramName ? `, ${verifiedTelegramName}` : ""}!
                </p>
                <p className="text-sm text-muted-foreground">
                  Agora defina seu usuário e senha para acessar o site.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">
                    Nome de usuário:
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-border/50 bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                    placeholder="Escolha um nome de usuário"
                    required
                    minLength={3}
                    autoFocus
                  />
                </div>

                {/* Password */}
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
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
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

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">
                    Confirmar senha:
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-24 rounded-lg border border-border/50 bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                      placeholder="Repita a senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-white/5"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span>{showConfirm ? "Ocultar" : "Mostrar"}</span>
                    </button>
                  </div>
                </div>

                {/* Register button */}
                <button
                  type="submit"
                  disabled={registerLoading || !username || !password || !confirmPassword}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "oklch(0.55 0.15 200)" }}
                  onMouseOver={(e) => !registerLoading && (e.currentTarget.style.background = "oklch(0.6 0.15 200)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "oklch(0.55 0.15 200)")}
                >
                  <UserPlus className="w-4 h-4" />
                  {registerLoading ? "Criando conta..." : "Cadastre-se"}
                </button>
              </form>
            </div>
          )}

          {/* Login link */}
          <div className="text-center">
            <span className="text-sm text-muted-foreground">Já tem uma conta? </span>
            <Link
              href="/login"
              className="text-sm font-medium transition-colors"
              style={{ color: "oklch(0.7 0.15 200)" }}
            >
              Conecte-se.
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
