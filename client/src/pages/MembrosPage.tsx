/**
 * MembrosPage - Public members list
 * Shows registered users with their Telegram verification status
 */
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Users, CheckCircle, Send, Shield, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function MembrosPage() {
  const { data: members, isLoading } = trpc.customAuth.publicMembers.useQuery(undefined, {
    staleTime: 30_000,
    retry: false,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-6">
          {/* Back link */}
          <Link href="/">
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </span>
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.35 0.15 240)" }}>
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Membros</h1>
              <p className="text-sm text-muted-foreground">
                {members ? `${members.length} membros registrados` : "Carregando..."}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "oklch(0.17 0.02 250)" }} />
              ))}
            </div>
          ) : !members || members.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum membro registrado ainda.</p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden border border-border/30" style={{ background: "oklch(0.14 0.02 250)" }}>
              {members.map((member: any, index: number) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-border/20 last:border-b-0 hover:bg-secondary/40 transition-colors"
                  style={{
                    animationDelay: `${index * 30}ms`,
                    animation: "fadeSlideIn 0.3s ease-out forwards",
                    opacity: 0,
                  }}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: `oklch(0.45 0.15 ${(index * 37) % 360})` }}>
                    {(member.displayName || member.username || "?").charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {member.displayName || member.username}
                      </span>
                      {member.role === "admin" && (
                        <span className="flex items-center gap-0.5 text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>@{member.username}</span>
                      {member.telegramVerified && (
                        <span className="flex items-center gap-0.5 text-[oklch(0.7_0.12_200)]">
                          <Send className="w-3 h-3" />
                          Telegram
                        </span>
                      )}
                      {member.isGroupMember && (
                        <span className="flex items-center gap-0.5 text-emerald-400">
                          <CheckCircle className="w-3 h-3" />
                          Membro do grupo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Join date */}
                  <div className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(member.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>


      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <Footer />
    </div>
  );
}
