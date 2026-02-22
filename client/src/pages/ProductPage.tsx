/**
 * ProductPage - Product detail with multiple images, files, external links
 * Protected downloads: free=login+group, paid=after payment
 * Payment options: PIX, Boleto, Cartão de Crédito/Débito
 */
import { trpc } from "@/lib/trpc";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { useRoute, Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Download, Lock, QrCode, Gift, Eye, Send,
  ExternalLink, FileDown, Image as ImageIcon, ChevronLeft,
  ChevronRight, LogIn, Users, ShoppingCart, CheckCircle,
  AlertTriangle, Loader2, Pin, FileIcon, CreditCard, Banknote,
  Wallet, X, Ban, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import TelegramLoginWidget from "@/components/TelegramLoginWidget";

function formatPrice(cents: number): string {
  if (cents === 0) return "Grátis";
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

/** Button to re-check Telegram group membership */
function RecheckMembershipButton({ productId }: { productId: number }) {
  const recheckMutation = trpc.customAuth.recheckGroupMembership.useMutation();
  const utils = trpc.useUtils();

  const handleRecheck = async () => {
    try {
      const result = await recheckMutation.mutateAsync();
      if (result.isMember) {
        toast.success("Verificado! Você é membro do grupo. Atualizando...");
        // Invalidate canDownload to refresh the UI
        utils.downloads.canDownload.invalidate({ productId });
        utils.customAuth.me.invalidate();
      } else {
        if (result.status === "no_telegram") {
          toast.error("Conecte seu Telegram primeiro.");
        } else if (result.status === "left" || result.status === "kicked") {
          toast.error("Você não é membro do grupo. Entre no grupo e tente novamente.");
        } else {
          toast.error("Você não foi encontrado no grupo. Entre no grupo e tente novamente.");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao verificar.");
    }
  };

  return (
    <Button
      onClick={handleRecheck}
      disabled={recheckMutation.isPending}
      variant="outline"
      className="w-full"
    >
      {recheckMutation.isPending ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Users className="w-4 h-4 mr-2" />
      )}
      Verificar novamente
    </Button>
  );
}

export default function ProductPage() {
  const [, params] = useRoute("/produto/:id");
  const productId = Number(params?.id);
  const { user, isAuthenticated } = useCustomAuth();
  const [, navigate] = useLocation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  const { data: product, isLoading } = trpc.products.getById.useQuery(
    { id: productId },
    { enabled: !!productId }
  );
  const { data: images } = trpc.products.getImages.useQuery(
    { productId },
    { enabled: !!productId, retry: false }
  );
  const { data: productFiles } = trpc.products.getFiles.useQuery(
    { productId },
    { enabled: !!productId, retry: false }
  );
  const { data: canDownloadData } = trpc.downloads.canDownload.useQuery(
    { productId },
    { enabled: !!productId }
  );
  const { data: categories } = trpc.categories.list.useQuery();

  const trackView = trpc.products.trackView.useMutation();
  const requestDownload = trpc.downloads.requestDownload.useMutation();
  const createPayment = trpc.orders.createPayment.useMutation();

  useEffect(() => {
    if (productId) trackView.mutate({ id: productId });
  }, [productId]);

  // All images: main + additional
  const allImages: { url: string; id?: number }[] = [];
  if (product?.imageUrl) allImages.push({ url: product.imageUrl });
  if (images) images.forEach((img: any) => allImages.push({ url: img.imageUrl, id: img.id }));

  // External links
  let externalLinks: { label: string; url: string }[] = [];
  try {
    if (product?.externalLinks) {
      externalLinks = typeof product.externalLinks === "string"
        ? JSON.parse(product.externalLinks)
        : Array.isArray(product.externalLinks) ? product.externalLinks : [];
    }
  } catch {}

  const category = categories?.find((c: any) => c.id === product?.categoryId);
  const canDownload = canDownloadData?.canDownload;
  const downloadReason = canDownloadData?.reason;

  const handleDownload = async (fileId?: number) => {
    if (!isAuthenticated) {
      toast.error("Faça login para baixar");
      navigate("/login");
      return;
    }
    try {
      const result = await requestDownload.mutateAsync({ productId, fileId });
      window.open(result.downloadUrl, "_blank");
      toast.success("Download iniciado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao baixar arquivo");
    }
  };

  const handlePayment = async (method: "pix" | "boleto" | "card" | "all") => {
    if (!isAuthenticated) {
      toast.error("Faça login para comprar");
      navigate("/login");
      return;
    }
    try {
      const result = await createPayment.mutateAsync({
        productId,
        origin: window.location.origin,
        paymentMethod: method,
      });
      if (result.initPoint) {
        window.location.href = result.initPoint;
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar pagamento");
    }
    setShowPaymentOptions(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
      <Footer />
    </div>
  );
}

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-4">Produto não encontrado</p>
            <Link href="/">
              <Button variant="outline">Voltar ao início</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const hasFiles = product.fileKey || (productFiles && productFiles.length > 0);
  const hasExternalLinksForDownload = externalLinks.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-6 max-w-4xl">
          {/* Back */}
          <Link href="/">
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Images & Description */}
            <div className="lg:col-span-3">
              {/* Image Gallery */}
              {allImages.length > 0 ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden aspect-video" style={{ background: "oklch(0.14 0.02 250)" }}>
                    <img
                      src={allImages[currentImageIndex]?.url}
                      alt={product.title}
                      className="w-full h-full object-contain"
                    />
                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex(i => (i - 1 + allImages.length) % allImages.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex(i => (i + 1) % allImages.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {allImages.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setCurrentImageIndex(i)}
                              className={`w-2 h-2 rounded-full transition-colors ${i === currentImageIndex ? "bg-white" : "bg-white/40"}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {allImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {allImages.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImageIndex(i)}
                          className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                            i === currentImageIndex ? "border-primary" : "border-transparent"
                          }`}
                        >
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl aspect-video flex items-center justify-center" style={{ background: "oklch(0.14 0.02 250)" }}>
                  <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
                </div>
              )}

              {/* Description */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  {product.isPinned && <Pin className="w-4 h-4 text-primary" />}
                  <span className="text-xs text-muted-foreground">{formatDate(product.createdAt)}</span>
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-3">Descrição</h2>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed rounded-xl p-4" style={{ background: "oklch(0.14 0.02 250)" }}>
                  {product.description}
                </div>
              </div>
            </div>

            {/* Right: Info & Actions */}
            <div className="lg:col-span-2 space-y-4">
              {/* Title & Price */}
              <div className="rounded-xl p-5 border border-border/30" style={{ background: "oklch(0.14 0.02 250)" }}>
                {category && (
                  <Link href={`/?categoria=${category.id}`}>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mb-2 cursor-pointer hover:text-foreground">
                      {category.icon} {category.name}
                    </span>
                  </Link>
                )}
                <h1 className="text-xl font-bold text-foreground mb-3">{product.title}</h1>

                <div className={`text-2xl font-bold mb-4 ${product.isFree ? "text-emerald-400" : "text-primary"}`}>
                  {product.isFree ? (
                    <span className="flex items-center gap-2"><Gift className="w-6 h-6" /> Grátis</span>
                  ) : (
                    <span>{formatPrice(product.priceCents)}</span>
                  )}
                </div>

                {!product.isFree && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Wallet className="w-3.5 h-3.5" />
                    <span>PIX, Boleto ou Cartão</span>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {product.viewCount} views</span>
                  <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5" /> {product.downloadCount} downloads</span>
                </div>
              </div>

              {/* Files Info */}
              {hasFiles && (
                <div className="rounded-xl p-5 border border-border/30 space-y-2" style={{ background: "oklch(0.14 0.02 250)" }}>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Arquivos</h3>
                  {product.fileName && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                      <FileIcon className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-xs text-foreground truncate">{product.fileName}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{formatFileSize(product.fileSize)}</span>
                    </div>
                  )}
                  {productFiles?.map((f: any) => (
                    <div key={f.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                      <FileDown className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-xs text-foreground truncate">{f.fileName}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{formatFileSize(f.fileSize)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Restriction Warning */}
              {isAuthenticated && downloadReason === "restricted" && (
                <div className="rounded-xl p-5 border border-red-500/30 space-y-2" style={{ background: "oklch(0.14 0.02 250)" }}>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-400" />
                    <h3 className="text-sm font-semibold text-red-400">Conta Restrita</h3>
                  </div>
                  <p className="text-sm text-red-300/80">
                    Sua conta está restrita pelo administrador. Você pode navegar pelo site, mas não pode baixar arquivos ou realizar compras.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Entre em contato com <a href="https://t.me/Danielssh" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@Danielssh no Telegram</a> para mais informações.
                  </p>
                </div>
              )}

              {/* Download / Payment Actions */}
              <div className="rounded-xl p-5 border border-border/30 space-y-3" style={{ background: "oklch(0.14 0.02 250)" }}>
                <h3 className="text-sm font-semibold text-foreground">Ações</h3>

                {!isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-400/10 p-3 rounded-lg">
                      <LogIn className="w-4 h-4 flex-shrink-0" />
                      <span>Faça login para baixar ou comprar</span>
                    </div>
                    <Link href="/login">
                      <Button className="w-full" style={{ background: "oklch(0.45 0.15 240)" }}>
                        <LogIn className="w-4 h-4 mr-2" />
                        Entrar
                      </Button>
                    </Link>
                  </div>
                ) : downloadReason === "restricted" ? (
                  <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 p-3 rounded-lg">
                    <Ban className="w-4 h-4 flex-shrink-0" />
                    <span>Sua conta está restrita. Não é possível baixar ou comprar.</span>
                  </div>
                ) : product.isFree ? (
                  <div className="space-y-3">
                    {canDownload ? (
                      <>
                        {product.fileKey && (
                          <Button
                            onClick={() => handleDownload()}
                            disabled={requestDownload.isPending}
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                          >
                            {requestDownload.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4 mr-2" />
                            )}
                            Baixar Arquivo Principal
                          </Button>
                        )}
                        {productFiles?.map((f: any) => (
                          <Button
                            key={f.id}
                            onClick={() => handleDownload(f.id)}
                            variant="outline"
                            className="w-full justify-start"
                            disabled={requestDownload.isPending}
                          >
                            <FileDown className="w-4 h-4 mr-2" />
                            <span className="truncate">{f.fileName}</span>
                            <span className="ml-auto text-xs text-muted-foreground">{formatFileSize(f.fileSize)}</span>
                          </Button>
                        ))}
                        {/* External links for free products - show when can download */}
                        {hasExternalLinksForDownload && (
                          <div className="pt-2 border-t border-border/20 space-y-2">
                            <p className="text-xs text-muted-foreground">Links de download:</p>
                            {externalLinks.map((link: any, i: number) => (
                              <a
                                key={i}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors p-2 rounded-lg hover:bg-primary/5"
                              >
                                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{link.label || link.url}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </>
                    ) : downloadReason === "group_required" ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-2 text-sm text-amber-400 bg-amber-400/10 p-3 rounded-lg">
                          <Users className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div>
                            {user?.telegramVerified ? (
                              <>
                                <span className="block font-medium">Você precisa ser membro do grupo para baixar conteúdo gratuito.</span>
                                <span className="block text-xs text-amber-300/70 mt-1">Entre no grupo e depois clique em "Verificar novamente".</span>
                              </>
                            ) : (
                              <>
                                <span className="block font-medium">Conecte seu Telegram e entre no grupo para baixar.</span>
                                <span className="block text-xs text-amber-300/70 mt-1">Primeiro conecte seu Telegram, depois entre no grupo.</span>
                              </>
                            )}
                          </div>
                        </div>
                        <a
                          href={(canDownloadData as any)?.groupLink || "https://t.me/editstreampro"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                          style={{ background: "oklch(0.45 0.15 240)" }}
                        >
                          <Send className="w-4 h-4" />
                          Entrar no Grupo Telegram
                        </a>
                        {user?.telegramVerified ? (
                          <RecheckMembershipButton productId={productId} />
                        ) : (
                          <TelegramLoginWidget
                            botName="editstreampro_bot"
                            authUrl={`${window.location.origin}/api/auth/telegram`}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 p-3 rounded-lg">
                        <Lock className="w-4 h-4 flex-shrink-0" />
                        <span>Download não disponível</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {canDownload ? (
                      <>
                        <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-400/10 p-3 rounded-lg">
                          <CheckCircle className="w-4 h-4 flex-shrink-0" />
                          <div>
                            <span className="block">
                              {downloadReason === "admin_granted"
                                ? "Acesso liberado pelo administrador!"
                                : downloadReason === "admin"
                                ? "Acesso de administrador"
                                : "Pagamento confirmado!"}
                            </span>
                            {(canDownloadData as any)?.paymentMethod && downloadReason !== "admin" && (
                              <span className="text-xs text-emerald-300/70 mt-0.5 block">
                                {(canDownloadData as any).paymentMethod === "manual" ? "Liberado pelo Admin"
                                  : (canDownloadData as any).paymentMethod === "pix" ? "Pago via PIX"
                                  : (canDownloadData as any).paymentMethod === "boleto" ? "Pago via Boleto"
                                  : (canDownloadData as any).paymentMethod === "credit_card" || (canDownloadData as any).paymentMethod === "card" ? "Pago via Cartão"
                                  : (canDownloadData as any).paymentMethod === "debit_card" ? "Pago via Cartão de Débito"
                                  : `Pago via ${(canDownloadData as any).paymentMethod}`}
                              </span>
                            )}
                            <span className="text-xs text-emerald-300/70">Baixe seus arquivos abaixo.</span>
                          </div>
                        </div>
                        {product.fileKey && (
                          <Button
                            onClick={() => handleDownload()}
                            disabled={requestDownload.isPending}
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                          >
                            {requestDownload.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4 mr-2" />
                            )}
                            Baixar Arquivo Principal
                          </Button>
                        )}
                        {productFiles?.map((f: any) => (
                          <Button
                            key={f.id}
                            onClick={() => handleDownload(f.id)}
                            variant="outline"
                            className="w-full justify-start"
                            disabled={requestDownload.isPending}
                          >
                            <FileDown className="w-4 h-4 mr-2" />
                            <span className="truncate">{f.fileName}</span>
                            <span className="ml-auto text-xs text-muted-foreground">{formatFileSize(f.fileSize)}</span>
                          </Button>
                        ))}
                        {/* External links for paid products - show after payment */}
                        {hasExternalLinksForDownload && (
                          <div className="pt-2 border-t border-border/20 space-y-2">
                            <p className="text-xs text-muted-foreground">Links de download:</p>
                            {externalLinks.map((link: any, i: number) => (
                              <a
                                key={i}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors p-2 rounded-lg hover:bg-primary/5"
                              >
                                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{link.label || link.url}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </>
                    ) : downloadReason === "payment_required" ? (
                      <div className="space-y-3">
                        {/* Payment Button */}
                        <Button
                          onClick={() => setShowPaymentOptions(!showPaymentOptions)}
                          disabled={createPayment.isPending}
                          className="w-full text-base py-6 font-semibold"
                          style={{ background: "oklch(0.45 0.15 240)" }}
                        >
                          {createPayment.isPending ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          ) : (
                            <ShoppingCart className="w-5 h-5 mr-2" />
                          )}
                          Pagar {formatPrice(product.priceCents)}
                        </Button>

                        {/* Payment Options Dropdown */}
                        {showPaymentOptions && (
                          <div className="rounded-xl border border-border/30 overflow-hidden animate-in slide-in-from-top-2 duration-200" style={{ background: "oklch(0.16 0.02 250)" }}>
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
                              <span className="text-sm font-medium text-foreground">Escolha a forma de pagamento:</span>
                              <button onClick={() => setShowPaymentOptions(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="p-3 space-y-2">
                              {/* PIX */}
                              <button
                                onClick={() => handlePayment("pix")}
                                disabled={createPayment.isPending}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left group"
                              >
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                                  <QrCode className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">PIX</p>
                                  <p className="text-xs text-muted-foreground">Pagamento instantâneo via QR Code</p>
                                </div>
                              </button>

                              {/* Boleto */}
                              <button
                                onClick={() => handlePayment("boleto")}
                                disabled={createPayment.isPending}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left group"
                              >
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                                  <Banknote className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">Boleto Bancário</p>
                                  <p className="text-xs text-muted-foreground">Prazo de 1-3 dias úteis para compensar</p>
                                </div>
                              </button>

                              {/* Cartão */}
                              <button
                                onClick={() => handlePayment("card")}
                                disabled={createPayment.isPending}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left group"
                              >
                                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/20 transition-colors">
                                  <CreditCard className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">Cartão de Crédito ou Débito</p>
                                  <p className="text-xs text-muted-foreground">Aprovação imediata, parcele em até 12x</p>
                                </div>
                              </button>
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-center text-muted-foreground">
                          Pagamento seguro via Mercado Pago
                        </p>
                      </div>
                    ) : downloadReason === "download_limit" ? (
                      <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-400/10 p-3 rounded-lg">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>Limite de downloads atingido. Contate o administrador.</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 p-3 rounded-lg">
                        <Lock className="w-4 h-4 flex-shrink-0" />
                        <span>Download não disponível</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* External Links - always visible for info (not download) */}
              {externalLinks.length > 0 && !canDownload && (
                <div className="rounded-xl p-5 border border-border/30 space-y-3" style={{ background: "oklch(0.14 0.02 250)" }}>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Links de Download
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {product.isFree
                      ? "Faça login e seja membro do grupo para acessar os links."
                      : "Realize o pagamento para acessar os links de download."}
                  </p>
                </div>
              )}

              {/* Contact */}
              <div className="rounded-xl p-5 border border-border/30" style={{ background: "oklch(0.14 0.02 250)" }}>
                <h3 className="text-sm font-semibold text-foreground mb-3">Contato</h3>
                <a
                  href="https://t.me/Danielssh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[oklch(0.7_0.12_200)] hover:text-[oklch(0.8_0.12_200)] transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Fale com @Danielssh no Telegram</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
