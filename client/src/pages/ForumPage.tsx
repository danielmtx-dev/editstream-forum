import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { Heart, MessageCircle, Share2, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ForumPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { user } = useAuth();
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const { data: threads, isLoading } = trpc.forum.getThreadsByCategory.useQuery({
    categoryId: parseInt(categoryId || "0"),
    limit,
    offset,
  });

  // TODO: Get category name from backend
  const categoryIdNum = parseInt(categoryId || "0");
  const currentCategory = { name: `Categoria ${categoryIdNum}`, description: "Discussões desta categoria" };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{currentCategory?.name || "Tópicos"}</h1>
          <p className="text-muted-foreground">{currentCategory?.description}</p>
          {user && (
            <Button className="mt-4" onClick={() => {
              // TODO: Open create thread dialog
              toast.info("Criar novo tópico em breve");
            }}>
              + Novo Tópico
            </Button>
          )}
        </div>

        {/* Threads List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : threads && threads.length > 0 ? (
            threads.map((thread: any) => (
              <Card key={thread.id} className="p-4 hover:bg-accent/50 transition cursor-pointer">
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {thread.author?.profilePhotoUrl ? (
                      <img
                        src={thread.author.profilePhotoUrl}
                        alt={thread.author.displayName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{thread.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Por <span className="font-medium">{thread.author?.displayName || thread.author?.username}</span>
                          {" "} • {new Date(thread.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                        <p className="text-sm line-clamp-2">{thread.content}</p>
                      </div>
                      {thread.tag && (
                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-medium rounded whitespace-nowrap">
                          {thread.tag}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex-shrink-0 flex gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{thread.commentCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{thread.likeCount || 0}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">Nenhum tópico nesta categoria</div>
          )}
        </div>

        {/* Pagination */}
        {threads && threads.length === limit && (
          <div className="mt-6 flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              ← Anterior
            </Button>
            <span className="px-4 py-2 text-sm text-muted-foreground">
              {Math.floor(offset / limit) + 1}
            </span>
            <Button
              variant="outline"
              onClick={() => setOffset(offset + limit)}
            >
              Próximo →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
