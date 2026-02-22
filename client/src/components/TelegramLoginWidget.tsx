/**
 * Telegram Login Widget Component
 * 
 * Strategy:
 * 1. Try the official Telegram Login Widget first
 * 2. If widget fails (domain not configured), show a styled fallback button
 *    that opens a deep link to the bot with a login code
 * 3. Frontend polls the server to check if login was confirmed via bot
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface TelegramLoginWidgetProps {
  botName: string;
  authUrl: string;
  buttonSize?: "large" | "medium" | "small";
  cornerRadius?: number;
  showUserPhoto?: boolean;
  lang?: string;
  onLoginSuccess?: () => void;
}

export default function TelegramLoginWidget({
  botName,
  authUrl,
  buttonSize = "large",
  cornerRadius = 8,
  showUserPhoto = false,
  lang = "pt",
  onLoginSuccess,
}: TelegramLoginWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetFailed, setWidgetFailed] = useState(false);
  const [deepLinkCode, setDeepLinkCode] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [waitingConfirm, setWaitingConfirm] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // tRPC mutations for deep link login
  const generateCode = trpc.customAuth.generateTelegramCode.useMutation();
  const checkCode = trpc.customAuth.checkTelegramCode.useQuery(
    { code: deepLinkCode || "" },
    { enabled: polling && !!deepLinkCode, refetchInterval: polling ? 2000 : false }
  );

  // Handle successful code verification
  useEffect(() => {
    if (checkCode.data?.confirmed) {
      setPolling(false);
      if (pollingRef.current) clearInterval(pollingRef.current);
      // Redirect to set cookie
      window.location.href = `/api/auth/telegram-code?code=${deepLinkCode}`;
    }
  }, [checkCode.data, deepLinkCode]);

  // Official widget setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";
    setWidgetFailed(false);

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botName);
    script.setAttribute("data-size", buttonSize);
    script.setAttribute("data-radius", String(cornerRadius));
    script.setAttribute("data-auth-url", authUrl);
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-userpic", showUserPhoto ? "true" : "false");
    if (lang) script.setAttribute("data-lang", lang);

    script.onerror = () => setWidgetFailed(true);
    container.appendChild(script);

    const checkTimer = setTimeout(() => {
      if (!container) return;
      const iframe = container.querySelector("iframe");
      const errorText = container.textContent || "";
      if (!iframe || errorText.includes("Bot domain invalid") || errorText.includes("invalid")) {
        setWidgetFailed(true);
        container.innerHTML = "";
      }
    }, 3000);

    return () => {
      clearTimeout(checkTimer);
      container.innerHTML = "";
    };
  }, [botName, authUrl, buttonSize, cornerRadius, showUserPhoto, lang]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleDeepLink = useCallback(async () => {
    try {
      setWaitingConfirm(true);
      const result = await generateCode.mutateAsync({});
      const code = result.code;
      setDeepLinkCode(code);
      setPolling(true);
      
      // Open Telegram deep link
      window.open(`https://t.me/${botName}?start=login_${code}`, "_blank");
      
      // Auto-stop polling after 5 minutes
      setTimeout(() => {
        setPolling(false);
        setWaitingConfirm(false);
        setDeepLinkCode(null);
      }, 5 * 60 * 1000);
    } catch (err) {
      console.error("Failed to generate code:", err);
      setWaitingConfirm(false);
    }
  }, [botName, generateCode]);

  // Styled fallback with deep link
  if (widgetFailed) {
    return (
      <div className="flex flex-col items-center gap-3">
        {waitingConfirm ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium"
              style={{ background: "linear-gradient(135deg, #0088cc, #0077b5)" }}>
              <Loader2 className="w-5 h-5 animate-spin" />
              Aguardando confirmação no Telegram...
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Abra o Telegram e clique em "Start" no bot @{botName}. 
              Após confirmar, você será logado automaticamente.
            </p>
            <button
              type="button"
              onClick={() => { setWaitingConfirm(false); setPolling(false); setDeepLinkCode(null); }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleDeepLink}
            disabled={generateCode.isPending}
            className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-all hover:brightness-110 active:scale-95"
            style={{ background: "linear-gradient(135deg, #0088cc, #0077b5)" }}
          >
            {generateCode.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            Entrar com Telegram
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex justify-center min-h-[44px]" />
  );
}
