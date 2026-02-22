/**
 * CategoriasPage - All categories with product counts
 * Clickable categories that filter products
 */
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Hash, ArrowLeft, Package, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function CategoriasPage() {
  const { data: categories, isLoading } = trpc.categories.list.useQuery();
  const { data: counts } = trpc.products.counts.useQuery();

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
              <Hash className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Categorias</h1>
              <p className="text-sm text-muted-foreground">
                {categories ? `${categories.length} categorias` : "Carregando..."}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "oklch(0.17 0.02 250)" }} />
              ))}
            </div>
          ) : !categories || categories.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Hash className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma categoria criada ainda.</p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden border border-border/30" style={{ background: "oklch(0.14 0.02 250)" }}>
              {categories.map((cat: any, index: number) => {
                const count = counts ? (counts as any)[cat.id] || 0 : 0;
                return (
                  <Link key={cat.id} href={`/?categoria=${cat.id}`}>
                    <div
                      className="flex items-center gap-4 px-4 py-4 border-b border-border/20 last:border-b-0 hover:bg-secondary/40 transition-colors cursor-pointer group"
                      style={{
                        animationDelay: `${index * 40}ms`,
                        animation: "fadeSlideIn 0.3s ease-out forwards",
                        opacity: 0,
                      }}
                    >
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: "oklch(0.2 0.03 250)" }}>
                        {cat.icon || "📁"}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors">
                          {cat.name}
                        </h3>
                        {cat.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {cat.description}
                          </p>
                        )}
                      </div>

                      {/* Count & Arrow */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Package className="w-4 h-4" />
                          <span>{count}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </Link>
                );
              })}
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
