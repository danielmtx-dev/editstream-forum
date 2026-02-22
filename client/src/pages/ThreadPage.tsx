import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { Heart, ThumbsDown, Share2, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [userLikes, setUserLikes] = useState<Record<number, 1 | -1 | null>>({});

  const { data: thread, isLoading } = trpc.forum.getThread.useQuery(parseInt(threadId || "0"));
  const { data: comments } = trpc.forum.getComments.useQuery(parseInt(threadId || "0"));
  const createCommentMutation = trpc.forum.createComment.useMutation();
  const toggleLikeMutation = trpc.forum.toggleLike.useMutation();
  const { data: threadLikes } = trpc.forum.getLikes.useQuery({
    targetType: "thread",
    targetId: parseInt(threadId || "0"),
  });

  const handleSubmitComment = async () => {
    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }
    if (!commentText.trim()) return;

    try {
      await createCommentMutation.mutateAsync({
        threadId: parseInt(threadId || "0"),
        content: commentText,
      });
      setCommentText("");
      toast.success("Comentário adicionado!");
    } catch (error) {
      toast.error("Erro ao adicionar comentário");
    }
  };

  const handleToggleLike = async (targetType: "thread" | "comment", targetId: number, value: 1 | -1) => {
    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    try {
      const currentLike = userLikes[targetId];
      const newLike = currentLike === value ? null : value;
      
      setUserLikes(prev => ({
        ...prev,
        [targetId]: newLike as any,
      }));

      await toggleLikeMutation.mutateAsync({
        targetType,
        targetId,
        value: String(value) as "1" | "-1",
      });
    } catch (error) {
      toast.error("Erro ao registrar voto");
    }
  };

  if (isLoading) return <div className="text-center py-8">Carregando...</div>;
  if (!thread) return <div className="text-center py-8">Tópico não encontrado</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 max-w-4xl">
        {/* Main Thread */}
        <Card className="p-6 mb-6">
          <div className="flex gap-4 mb-6">
            {/* Avatar */}
            {thread.author?.profilePhotoUrl ? (
              <img
                src={thread.author.profilePhotoUrl}
                alt={thread.author.displayName}
                className="w-16 h-16 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8" />
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h1 className="text-2xl font-bold">{thread.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    Por <span className="font-medium">{thread.author?.displayName || thread.author?.username}</span>
                  </p>
                </div>
                {thread.tag && (
                  <span className="px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded">
                    {thread.tag}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(thread.createdAt).toLocaleDateString("pt-BR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="prose dark:prose-invert max-w-none mb-6">
            <p>{thread.content}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              onClick={() => handleToggleLike("thread", thread.id, 1)}
              className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-accent transition ${
                userLikes[thread.id] === 1 ? "text-green-500" : "text-muted-foreground"
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>{threadLikes?.likes || 0}</span>
            </button>
            <button
              onClick={() => handleToggleLike("thread", thread.id, -1)}
              className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-accent transition ${
                userLikes[thread.id] === -1 ? "text-red-500" : "text-muted-foreground"
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
              <span>{threadLikes?.dislikes || 0}</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded hover:bg-accent transition text-muted-foreground">
              <Share2 className="w-4 h-4" />
              Compartilhar
            </button>
          </div>
        </Card>

        {/* Comments Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Comentários ({comments?.length || 0})</h2>

          {/* Add Comment Form */}
          {user && (
            <Card className="p-4">
              <div className="flex gap-4">
                {user?.name ? (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1">
                  <Textarea
                    placeholder="Adicione um comentário..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="mb-2 resize-none"
                    rows={3}
                  />
                  <Button onClick={handleSubmitComment} disabled={!commentText.trim()}>
                    Comentar
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Comments List */}
          {comments && comments.length > 0 ? (
            comments.map((comment: any, index: number) => (
              <Card key={comment.id} className="p-4">
                <div className="flex gap-4">
                  {comment.author?.profilePhotoUrl ? (
                    <img
                      src={comment.author.profilePhotoUrl}
                      alt={comment.author.displayName}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="font-medium">{comment.author?.displayName || comment.author?.username}</p>
                        <p className="text-xs text-muted-foreground">
                          #{index + 1} • {new Date(comment.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm mb-2">{comment.content}</p>
                    <div className="flex gap-4 text-sm">
                      <button
                        onClick={() => handleToggleLike("comment", comment.id, 1)}
                        className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-accent transition ${
                          userLikes[comment.id] === 1 ? "text-green-500" : "text-muted-foreground"
                        }`}
                      >
                        <Heart className="w-3 h-3" />
                        <span>{comment.likeCount?.positive || 0}</span>
                      </button>
                      <button
                        onClick={() => handleToggleLike("comment", comment.id, -1)}
                        className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-accent transition ${
                          userLikes[comment.id] === -1 ? "text-red-500" : "text-muted-foreground"
                        }`}
                      >
                        <ThumbsDown className="w-3 h-3" />
                        <span>{comment.likeCount?.dislikes || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">Nenhum comentário ainda. Seja o primeiro!</div>
          )}
        </div>
      </div>
    </div>
  );
}
