/**
 * Home Page - EditStream Pro Forum Style
 * Inspired by iptvapps.net - categories grouped by sections
 * Shows threads count, messages count, and last post info
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import Footer from "@/components/Footer";
import { MessageCircle, Heart, ChevronRight, Zap, Users, TrendingUp, Settings } from "lucide-react";
import { useCustomAuth } from "@/hooks/useCustomAuth";

interface CategorySection {
  section: string;
  categories: any[];
}

export default function Home() {
  const { isAdmin } = useCustomAuth();
  const { data: categories } = trpc.categories.list.useQuery();
  const [groupedCategories, setGroupedCategories] = useState<CategorySection[]>([]);

  useEffect(() => {
    if (categories) {
      // Agrupar categorias por seção
      const grouped = categories.reduce((acc: Record<string, any[]>, cat: any) => {
        const section = cat.section || "Geral";
        if (!acc[section]) acc[section] = [];
        acc[section].push(cat);
        return acc;
      }, {});

      // Converter para array de seções
      setGroupedCategories(
        Object.entries(grouped).map(([section, cats]) => ({
          section,
          categories: cats as any[],
        })) as CategorySection[]
      );
    }
  }, [categories]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <HeroBanner />

      <main className="flex-1">
        <div className="container py-6 sm:py-8">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="rounded-lg border border-border/30 p-4 text-center" style={{ background: "oklch(0.14 0.02 250)" }}>
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-xs text-muted-foreground mt-1">Membros</div>
            </div>
            <div className="rounded-lg border border-border/30 p-4 text-center" style={{ background: "oklch(0.14 0.02 250)" }}>
              <div className="text-2xl font-bold text-primary">{categories?.length || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Categorias</div>
            </div>
            <div className="rounded-lg border border-border/30 p-4 text-center" style={{ background: "oklch(0.14 0.02 250)" }}>
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-xs text-muted-foreground mt-1">Tópicos</div>
            </div>
            <div className="rounded-lg border border-border/30 p-4 text-center" style={{ background: "oklch(0.14 0.02 250)" }}>
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-xs text-muted-foreground mt-1">Mensagens</div>
            </div>
          </div>

          {/* Categories by Section */}
          <div className="space-y-8">
            {groupedCategories.length > 0 ? (
              groupedCategories.map((section) => (
                <div key={section.section}>
                  {/* Section Header */}
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/30">
                    <Zap className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">{section.section}</h2>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {section.categories.length} categoria{section.categories.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Categories Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {section.categories.map((category) => (
                      <Link key={category.id} href={`/forum/${category.id}`}>
                        <Card className="p-5 hover:bg-accent/50 transition cursor-pointer h-full flex flex-col">
                          {/* Category Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-foreground mb-1">
                                {category.name}
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {category.description}
                              </p>
                            </div>
                            {category.isPinned && (
                              <Badge className="bg-primary/20 text-primary text-[10px] ml-2 flex-shrink-0">
                                <Zap className="w-2.5 h-2.5 mr-1" />
                                Fixado
                              </Badge>
                            )}
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 mt-auto pt-3 border-t border-border/20 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>0 tópicos</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>0 msgs</span>
                            </div>
                          </div>

                          {/* Last Post Info */}
                          <div className="mt-3 pt-3 border-t border-border/20 text-[11px] text-muted-foreground">
                            <p>Nenhum tópico ainda</p>
                          </div>

                          {/* View Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 w-full gap-1 text-xs"
                            asChild
                          >
                            <div>
                              Ver Tópicos <ChevronRight className="w-3 h-3" />
                            </div>
                          </Button>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma categoria disponível ainda</p>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary hover:underline"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Criar categorias no painel admin
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
