import { useState } from "react";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link, useLocation } from "wouter";
import {
  User, ShoppingBag, Download, CheckCircle, Clock, XCircle,
  LogOut, Users, ExternalLink, Send, Shield, AlertTriangle,
  ArrowLeft, Loader2, Eye, EyeOff, Key,
} from "lucide-react";
import { toast } from "sonner";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
  approved: { label: "Aprovado", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle },
  rejected: { label: "Rejeitado", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
  refunded: { label: "Reembolsado", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: XCircle },
  cancelled: { label: "Cancelado", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: XCircle },
};

export default function UserDashboard() {
  const { user, loading, isAuthenticated, logout } = useCustomAuth();
  const [, navigate] = useLocation();
  const { data: myOrders, isLoading: ordersLoading } = trpc.orders.myOrders.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isBanned = user?.banStatus === "banned" || user?.banStatus === "temp_banned";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="container py-4 sm:py-6 flex-1 max-w-4xl mx-auto px-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-6">Minha Conta</h1>

        {/* Ban Warning */}
        {isBanned && (
          <div className="rounded-xl border border-red-500/30 p-4 mb-6 bg-red-500/10">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="text-sm font-bold text-red-400">
                {user?.banStatus === "banned" ? "Conta Banida Permanentemente" : "Conta Banida Temporariamente"}
              </h3>
            </div>
            {user?.banReason && <p className="text-xs text-red-300 mb-1">Motivo: {user.banReason}</p>}
            {user?.banStatus === "temp_banned" && user?.banExpiresAt && (
              <p className="text-xs text-red-300">Expira em: {new Date(user.banExpiresAt).toLocaleString("pt-BR")}</p>
            )}
          </div>
        )}

        {/* User Info */}
        <div className="rounded-xl border border-border/30 p-5 sm:p-6 mb-6" style={{ background: "oklch(0.14 0.02 250)" }}>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0" style={{ background: "oklch(0.35 0.15 240)" }}>
              {user?.telegramPhotoUrl ? (
                <img src={user.telegramPhotoUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                (user?.displayName || user?.username || "U")[0].toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">{user?.displayName || user?.username}</h2>
                <span
                  className="text-[10px] font-mono text-muted-foreground/60 bg-secondary/50 px-1.5 py-0.5 rounded cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => { navigator.clipboard.writeText(String(user?.id)); }}
                  title="Clique para copiar seu ID"
                >
                  ID #{user?.id}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">@{user?.username}</p>
              {user?.email && <p className="text-xs text-muted-foreground mt-1">{user.email}</p>}
              {user?.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {user?.isGroupMember ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                    <Users className="w-3 h-3 mr-1" /> Membro do Grupo
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">
                    <Users className="w-3 h-3 mr-1" /> Não é membro
                  </Badge>
                )}
                {user?.telegramVerified ? (
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
                    <Send className="w-2.5 h-2.5 mr-1" /> Telegram Verificado
                  </Badge>
                ) : (
                  <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-[10px]">
                    <Send className="w-2.5 h-2.5 mr-1" /> Telegram não verificado
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-muted-foreground border-border/30 hover:text-foreground flex-shrink-0">
              <LogOut className="w-4 h-4 mr-1" /> Sair
            </Button>
          </div>

          {/* Change Password Section */}
          <div className="mt-5 pt-5 border-t border-border/30">
            <ChangePasswordSection />
          </div>
        </div>

        {/* Profile Photo Upload */}
        <ProfilePhotoUpload currentPhotoUrl={(user as any)?.profilePhotoUrl} />

        <div className="h-6" />

        {/* Telegram verification / Group join - separate card */}
        <div className="rounded-xl border border-border/30 p-5 sm:p-6 mb-6" style={{ background: "oklch(0.14 0.02 250)" }}>
          {!user?.isGroupMember && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm font-medium text-yellow-300 mb-1">Entre no grupo Telegram para baixar produtos gratuitos:</p>
              <a
                href="https://t.me/editstreampro"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm"
              >
                <ExternalLink className="w-3 h-3" /> t.me/editstreampro
              </a>
              <p className="text-[10px] text-muted-foreground mt-1">
                Após entrar, o admin confirmará sua participação.
              </p>
            </div>
          )}

          {!user?.telegramVerified && (
            <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm font-medium text-blue-300 mb-1">Verifique sua conta via Telegram:</p>
              <p className="text-xs text-muted-foreground">
                Para maior segurança, conecte sua conta ao Telegram. Entre em contato com{" "}
                <a href="https://t.me/Danielssh" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@Danielssh</a>
                {" "}para verificação.
              </p>
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="rounded-xl border border-border/30 overflow-hidden" style={{ background: "oklch(0.14 0.02 250)" }}>
          <div className="px-5 py-4 border-b border-border/30">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" /> Meus Pedidos
            </h3>
          </div>
          <div>
            {ordersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !myOrders || myOrders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">Nenhum pedido ainda</p>
                <Link href="/">
                  <Button variant="outline" size="sm" className="text-primary border-primary/30">
                    Ver Produtos
                  </Button>
                </Link>
              </div>
            ) : (
              myOrders.map((order) => {
                const st = statusMap[order.status] || statusMap.pending;
                const Icon = st.icon;
                return (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 px-4 py-3 border-b border-border/30 last:border-b-0 hover:bg-secondary/40 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-foreground">Pedido #{order.id}</h4>
                        <Badge className={st.color + " text-[10px]"}>{st.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Produto #{order.productId} · {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-foreground">
                        R$ {(order.amountCents / 100).toFixed(2).replace(".", ",")}
                      </span>
                      {order.status === "approved" && (
                        <Link href={`/produto/${order.productId}`}>
                          <Button size="sm" variant="outline" className="text-green-400 border-green-400/30 gap-1">
                            <Download className="w-3 h-3" /> Baixar
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
       </div>
      <Footer />
    </div>
  );
}

/** Change Password inline section */
function ChangePasswordSection() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changePasswordMut = trpc.customAuth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNew("");
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmNew) {
      setError("As senhas não coincidem");
      return;
    }
    if (newPassword.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }
    changePasswordMut.mutate({ currentPassword, newPassword });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Key className="w-4 h-4" />
        Alterar Senha
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Key className="w-4 h-4" /> Alterar Senha
      </h4>

      {error && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
          <span className="text-xs text-red-300">{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs text-muted-foreground mb-1">Senha atual:</label>
        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 pr-16 rounded-lg border border-border/50 bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
            placeholder="Sua senha atual"
            required
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1">Nova senha:</label>
        <div className="relative">
          <input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 pr-16 rounded-lg border border-border/50 bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1">Confirmar nova senha:</label>
        <input
          type={showNew ? "text" : "password"}
          value={confirmNew}
          onChange={(e) => setConfirmNew(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
          placeholder="Repita a nova senha"
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={changePasswordMut.isPending || !currentPassword || !newPassword || !confirmNew}
          className="gap-1"
        >
          {changePasswordMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Key className="w-3 h-3" />}
          Salvar
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => { setOpen(false); setError(null); setCurrentPassword(""); setNewPassword(""); setConfirmNew(""); }}
          className="text-muted-foreground"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
