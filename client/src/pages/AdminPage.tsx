/**
 * AdminPage - Full admin panel exclusively for @Danielssh
 * Tabs: Dashboard, Produtos, Categorias, Usuários, Pedidos, Configurações
 */
import { useState, useRef } from "react";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, Pin, Package, FolderOpen,
  BarChart3, Download, Loader2, Upload, Image as ImageIcon, FileIcon,
  Save, Users, ShoppingBag, CheckCircle, XCircle, Clock, Shield,
  DollarSign, UserCheck, UserX, CreditCard, Settings, Ban, Send,
  AlertTriangle, ExternalLink, X, Zap,
} from "lucide-react";
import { RolesManagement } from "@/components/RolesManagement";

type Tab = "dashboard" | "products" | "categories" | "users" | "orders" | "settings" | "roles";

function formatPrice(cents: number): string {
  if (cents === 0) return "Grátis";
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

// ============================================
// Product Form with multiple images, files, external links, PIX only
// ============================================
interface ProductFormProps {
  product?: any;
  categories: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function ProductForm({ product, categories, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const [title, setTitle] = useState(product?.title || "");
  const [description, setDescription] = useState(product?.description || "");
  const [priceCents, setPriceCents] = useState(product?.priceCents || 0);
  const [priceDisplay, setPriceDisplay] = useState(
    product?.priceCents ? (product.priceCents / 100).toFixed(2) : "0.00"
  );
  const [isFree, setIsFree] = useState(product?.isFree ?? false);
  const [categoryId, setCategoryId] = useState(product?.categoryId || (categories[0]?.id ?? 0));
  const [pixKey, setPixKey] = useState(product?.pixKey || "");
  const [paymentInstructions, setPaymentInstructions] = useState(product?.paymentInstructions || "");
  const [isPinned, setIsPinned] = useState(product?.isPinned ?? false);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.imageUrl || null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(product?.fileName || null);
  const [fileSize, setFileSize] = useState<number | null>(product?.fileSize || null);
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // External links
  const [externalLinks, setExternalLinks] = useState<{ label: string; url: string }[]>(() => {
    try {
      if (product?.externalLinks) {
        const parsed = typeof product.externalLinks === "string" ? JSON.parse(product.externalLinks) : product.externalLinks;
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {}
    return [];
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Imagem muito grande (máx 10MB)"); return; }
    setImageMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => { const r = reader.result as string; setImagePreview(r); setImageData(r.split(",")[1]); };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 150 * 1024 * 1024) { toast.error("Arquivo muito grande (máx 150MB)"); return; }
    setFileName(file.name); setFileSize(file.size);
    setFileMimeType(file.type || "application/octet-stream");
    const reader = new FileReader();
    reader.onload = () => { setFileData((reader.result as string).split(",")[1]); };
    reader.readAsDataURL(file);
  };

  const addExternalLink = () => setExternalLinks([...externalLinks, { label: "", url: "" }]);
  const removeExternalLink = (i: number) => setExternalLinks(externalLinks.filter((_, idx) => idx !== i));
  const updateExternalLink = (i: number, field: "label" | "url", value: string) => {
    const updated = [...externalLinks];
    updated[i] = { ...updated[i], [field]: value };
    setExternalLinks(updated);
  };

  const handleSubmit = () => {
    if (!title.trim()) { toast.error("Título é obrigatório"); return; }
    if (!description.trim()) { toast.error("Descrição é obrigatória"); return; }
    if (!categoryId) { toast.error("Selecione uma categoria"); return; }
    const data: any = {
      title: title.trim(), description: description.trim(),
      priceCents: isFree ? 0 : priceCents, isFree, categoryId,
      paymentMethods: isFree ? "" : "pix",
      pixKey: !isFree ? pixKey : undefined,
      paymentInstructions: paymentInstructions || undefined,
      isPinned, isActive,
      externalLinks: JSON.stringify(externalLinks.filter(l => l.url.trim())),
    };
    if (imageData) { data.imageData = imageData; data.imageMimeType = imageMimeType; }
    if (fileData) { data.fileData = fileData; data.fileMimeType = fileMimeType; data.fileName = fileName; data.fileSize = fileSize; }
    if (product?.id) data.id = product.id;
    onSubmit(data);
  };

  return (
    <div className="space-y-4">
      {/* Image */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Imagem Principal</label>
        <div className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/30 transition-colors" onClick={() => imageRef.current?.click()}>
          <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          {imagePreview ? <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-cover" /> : <div><ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-xs text-muted-foreground">Clique para selecionar imagem</p></div>}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Imagens adicionais podem ser adicionadas após criar o produto.</p>
      </div>
      {/* Title */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Título *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full h-10 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground" placeholder="Nome do produto..." />
      </div>
      {/* Description */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Descrição *</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-32 px-3 py-2 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground resize-none" placeholder="Descreva o produto..." />
      </div>
      {/* Category */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Categoria *</label>
        <select value={categoryId} onChange={(e) => setCategoryId(parseInt(e.target.value))} className="w-full h-10 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground">
          {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
        </select>
      </div>
      {/* Free toggle */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} className="w-4 h-4 rounded border-border accent-primary" />
          <span className="text-sm text-foreground">Produto Gratuito</span>
        </label>
      </div>
      {/* Price - PIX only */}
      {!isFree && (
        <>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Preço (R$)</label>
            <input value={priceDisplay} onChange={(e) => { const val = e.target.value.replace(/[^0-9.,]/g, "").replace(",", "."); setPriceDisplay(val); const cents = Math.round(parseFloat(val || "0") * 100); setPriceCents(isNaN(cents) ? 0 : cents); }} className="w-full h-10 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground" placeholder="0.00" />
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <CreditCard className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="text-xs text-blue-400">Pagamento via PIX (Mercado Pago)</span>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Chave PIX (opcional)</label>
            <input value={pixKey} onChange={(e) => setPixKey(e.target.value)} className="w-full h-10 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground" placeholder="Sua chave PIX..." />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Instruções de Pagamento</label>
            <textarea value={paymentInstructions} onChange={(e) => setPaymentInstructions(e.target.value)} className="w-full h-20 px-3 py-2 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground resize-none" placeholder="Instruções adicionais..." />
          </div>
        </>
      )}
      {/* File upload */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Arquivo para Download (até 150MB)</label>
        <div className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/30 transition-colors" onClick={() => fileRef.current?.click()}>
          <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
          {fileName ? <div className="flex items-center gap-2 justify-center"><FileIcon className="w-5 h-5 text-primary" /><span className="text-sm text-foreground">{fileName}</span>{fileSize && <span className="text-xs text-muted-foreground">({(fileSize / (1024 * 1024)).toFixed(1)} MB)</span>}</div> : <div><Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-xs text-muted-foreground">Clique para selecionar arquivo (até 150MB)</p></div>}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Arquivos adicionais podem ser adicionados após criar o produto.</p>
      </div>
      {/* External Links */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Links Externos de Download</label>
        <p className="text-[10px] text-muted-foreground mb-2">Para arquivos maiores que 150MB, adicione links externos (Google Drive, Mega, etc.)</p>
        {externalLinks.map((link, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <input value={link.label} onChange={(e) => updateExternalLink(i, "label", e.target.value)} className="w-1/3 h-9 px-2 text-xs bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground" placeholder="Nome..." />
            <input value={link.url} onChange={(e) => updateExternalLink(i, "url", e.target.value)} className="flex-1 h-9 px-2 text-xs bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground" placeholder="https://..." />
            <button onClick={() => removeExternalLink(i)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><X className="w-4 h-4" /></button>
          </div>
        ))}
        <button onClick={addExternalLink} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar link externo</button>
      </div>
      {/* Toggles */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="w-4 h-4 rounded border-border accent-primary" /><span className="text-sm text-foreground">Fixado</span></label>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-border accent-primary" /><span className="text-sm text-foreground">Ativo</span></label>
      </div>
      {/* Buttons */}
      <div className="flex gap-2 pt-2">
        <Button onClick={handleSubmit} disabled={isLoading} className="gap-2">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{product?.id ? "Atualizar" : "Criar Produto"}</Button>
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}

// ============================================
// Category Form
// ============================================
function CategoryForm({ category, onSubmit, onCancel, isLoading }: { category?: any; onSubmit: (data: any) => void; onCancel: () => void; isLoading: boolean; }) {
  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [icon, setIcon] = useState(category?.icon || "📦");
  const [description, setDescription] = useState(category?.description || "");
  const [sortOrder, setSortOrder] = useState(category?.sortOrder || 0);

  const handleSubmit = () => {
    if (!name.trim()) { toast.error("Nome é obrigatório"); return; }
    const data: any = { name: name.trim(), slug: slug.trim() || name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""), icon, description: description || undefined, sortOrder, isActive: true };
    if (category?.id) data.id = category.id;
    onSubmit(data);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <div><label className="text-sm font-medium text-foreground mb-1.5 block">Ícone</label><input value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full h-10 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground text-center" /></div>
        <div className="col-span-3"><label className="text-sm font-medium text-foreground mb-1.5 block">Nome *</label><input value={name} onChange={(e) => { setName(e.target.value); if (!category?.id) setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")); }} className="w-full h-10 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground" placeholder="Nome da categoria..." /></div>
      </div>
      <div><label className="text-sm font-medium text-foreground mb-1.5 block">Slug</label><input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full h-10 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground" /></div>
      <div><label className="text-sm font-medium text-foreground mb-1.5 block">Descrição</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-20 px-3 py-2 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground resize-none" /></div>
      <div><label className="text-sm font-medium text-foreground mb-1.5 block">Ordem</label><input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} className="w-24 h-10 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground" /></div>
      <div className="flex gap-2 pt-2">
        <Button onClick={handleSubmit} disabled={isLoading} className="gap-2">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{category?.id ? "Atualizar" : "Criar Categoria"}</Button>
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}

// ============================================
// Status helpers
// ============================================
const orderStatusMap: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
  approved: { label: "Aprovado", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle },
  rejected: { label: "Rejeitado", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
  refunded: { label: "Reembolsado", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: XCircle },
  cancelled: { label: "Cancelado", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: XCircle },
};

const banStatusMap: Record<string, { label: string; color: string }> = {
  active: { label: "Ativo", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  restricted: { label: "Restrito", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  temp_banned: { label: "Ban Temporário", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  banned: { label: "Banido", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

// ============================================
// Main Admin Page
// ============================================
export default function AdminPage() {
  const { user, loading, isAuthenticated, isAdmin } = useCustomAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  // Ban dialog
  const [banDialog, setBanDialog] = useState<{ userId: number; username: string } | null>(null);
  const [banAction, setBanAction] = useState<"active" | "restricted" | "temp_banned" | "banned">("active");
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState(24);
  // Grant access dialog
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [grantUserId, setGrantUserId] = useState("");
  const [grantProductId, setGrantProductId] = useState("");
  const [grantMaxDownloads, setGrantMaxDownloads] = useState(5);
  // Edit user dialog
  const [editUserDialog, setEditUserDialog] = useState<any>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editIsGroupMember, setEditIsGroupMember] = useState(false);
  // Reset password dialog
  const [resetPwDialog, setResetPwDialog] = useState<{ userId: number; username: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  // Logo upload
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const utils = trpc.useUtils();

  // Queries
  const { data: stats } = trpc.products.stats.useQuery(undefined, { enabled: isAdmin });
  const { data: allProducts, isLoading: prodsLoading } = trpc.products.listAll.useQuery(undefined, { enabled: isAdmin });
  const { data: allCategories, isLoading: catsLoading } = trpc.categories.listAll.useQuery(undefined, { enabled: isAdmin });
  const { data: allUsers, isLoading: usersLoading } = trpc.admin.users.useQuery(undefined, { enabled: isAdmin });
  const { data: allOrders, isLoading: ordersLoading } = trpc.orders.listAll.useQuery(undefined, { enabled: isAdmin });
  const { data: mpStatus } = trpc.admin.mpStatus.useQuery(undefined, { enabled: isAdmin });
  const { data: adminSettings } = trpc.admin.getSettings.useQuery(undefined, { enabled: isAdmin && activeTab === "settings" });

  // Mutations
  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => { toast.success("Produto criado!"); utils.products.listAll.invalidate(); utils.products.stats.invalidate(); utils.products.counts.invalidate(); setShowProductForm(false); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const updateProductMut = trpc.products.update.useMutation({
    onSuccess: () => { toast.success("Produto atualizado!"); utils.products.listAll.invalidate(); utils.products.stats.invalidate(); setEditingProduct(null); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const deleteProductMut = trpc.products.delete.useMutation({
    onSuccess: () => { toast.success("Produto removido!"); utils.products.listAll.invalidate(); utils.products.stats.invalidate(); utils.products.counts.invalidate(); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const createCategory = trpc.categories.create.useMutation({
    onSuccess: () => { toast.success("Categoria criada!"); utils.categories.listAll.invalidate(); utils.categories.list.invalidate(); setShowCategoryForm(false); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const updateCategoryMut = trpc.categories.update.useMutation({
    onSuccess: () => { toast.success("Categoria atualizada!"); utils.categories.listAll.invalidate(); utils.categories.list.invalidate(); setEditingCategory(null); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const deleteCategoryMut = trpc.categories.delete.useMutation({
    onSuccess: () => { toast.success("Categoria removida!"); utils.categories.listAll.invalidate(); utils.categories.list.invalidate(); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const toggleGroupMember = trpc.admin.toggleGroupMember.useMutation({
    onSuccess: () => { toast.success("Atualizado!"); utils.admin.users.invalidate(); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const updateBanStatus = trpc.admin.updateBanStatus.useMutation({
    onSuccess: () => { toast.success("Status atualizado!"); utils.admin.users.invalidate(); setBanDialog(null); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const updateSettings = trpc.admin.updateSettings.useMutation({
    onSuccess: () => { toast.success("Configurações salvas!"); utils.admin.getSettings.invalidate(); utils.admin.mpStatus.invalidate(); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const grantAccess = trpc.admin.grantAccess.useMutation({
    onSuccess: () => { toast.success("Acesso liberado com sucesso!"); utils.orders.listAll.invalidate(); setShowGrantDialog(false); setGrantUserId(""); setGrantProductId(""); setGrantMaxDownloads(5); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const revokeAccess = trpc.admin.revokeAccess.useMutation({
    onSuccess: () => { toast.success("Acesso revogado!"); utils.orders.listAll.invalidate(); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const deleteUserMut = trpc.admin.deleteUser.useMutation({
    onSuccess: () => { toast.success("Usuário removido!"); utils.admin.users.invalidate(); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const editUserMut = trpc.admin.editUser.useMutation({
    onSuccess: () => { toast.success("Usuário atualizado!"); utils.admin.users.invalidate(); setEditUserDialog(null); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const resetPasswordMut = trpc.admin.resetPassword.useMutation({
    onSuccess: () => { toast.success("Senha redefinida!"); setResetPwDialog(null); setNewPassword(""); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const uploadLogoMut = trpc.admin.uploadLogo.useMutation({
    onSuccess: (data) => { toast.success("Logo atualizado!"); utils.admin.getLogos.invalidate(); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const { data: siteLogos } = trpc.admin.getLogos.useQuery(undefined, { enabled: isAdmin && activeTab === "settings" });

  // Auth check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-400/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Acesso Restrito</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Apenas o administrador @Danielssh pode acessar esta página.
            </p>
            <Link href="/" className="text-primary hover:underline text-sm">Voltar ao início</Link>
          </div>
        </div>

      </div>
    );
  }

  const totalRevenue = allOrders?.filter(o => o.status === "approved").reduce((sum, o) => sum + o.amountCents, 0) || 0;
  const pendingOrders = allOrders?.filter(o => o.status === "pending").length || 0;
  const approvedOrders = allOrders?.filter(o => o.status === "approved").length || 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="container py-4 sm:py-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Painel de Gerenciamento</h1>
          <Badge className="bg-primary/20 text-primary border-primary/30">Admin</Badge>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border/30 mb-6 overflow-x-auto">
          {([
            { key: "dashboard" as Tab, label: "Dashboard", icon: BarChart3 },
            { key: "products" as Tab, label: "Produtos", icon: Package },
            { key: "categories" as Tab, label: "Categorias", icon: FolderOpen },
            { key: "users" as Tab, label: "Usuários", icon: Users },
            { key: "orders" as Tab, label: "Pedidos", icon: ShoppingBag },
            { key: "roles" as Tab, label: "Cargos", icon: Zap },
            { key: "settings" as Tab, label: "Configurações", icon: Settings },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 -mb-px flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ============ Dashboard Tab ============ */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-border/30 p-5" style={{ background: "oklch(0.14 0.02 250)" }}>
                <Package className="w-5 h-5 text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">{stats?.totalProducts || 0}</p>
                <p className="text-xs text-muted-foreground">Produtos</p>
              </div>
              <div className="rounded-xl border border-border/30 p-5" style={{ background: "oklch(0.14 0.02 250)" }}>
                <Eye className="w-5 h-5 text-emerald-400 mb-2" />
                <p className="text-2xl font-bold text-foreground">{stats?.totalViews || 0}</p>
                <p className="text-xs text-muted-foreground">Visualizações</p>
              </div>
              <div className="rounded-xl border border-border/30 p-5" style={{ background: "oklch(0.14 0.02 250)" }}>
                <Download className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-2xl font-bold text-foreground">{stats?.totalDownloads || 0}</p>
                <p className="text-xs text-muted-foreground">Downloads</p>
              </div>
              <div className="rounded-xl border border-border/30 p-5" style={{ background: "oklch(0.14 0.02 250)" }}>
                <DollarSign className="w-5 h-5 text-yellow-400 mb-2" />
                <p className="text-2xl font-bold text-foreground">{formatPrice(totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">Receita Total</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border/30 p-5" style={{ background: "oklch(0.14 0.02 250)" }}>
                <Users className="w-5 h-5 text-purple-400 mb-2" />
                <p className="text-2xl font-bold text-foreground">{allUsers?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Usuários Cadastrados</p>
              </div>
              <div className="rounded-xl border border-border/30 p-5" style={{ background: "oklch(0.14 0.02 250)" }}>
                <CheckCircle className="w-5 h-5 text-green-400 mb-2" />
                <p className="text-2xl font-bold text-foreground">{approvedOrders}</p>
                <p className="text-xs text-muted-foreground">Pedidos Aprovados</p>
              </div>
              <div className="rounded-xl border border-border/30 p-5" style={{ background: "oklch(0.14 0.02 250)" }}>
                <Clock className="w-5 h-5 text-yellow-400 mb-2" />
                <p className="text-2xl font-bold text-foreground">{pendingOrders}</p>
                <p className="text-xs text-muted-foreground">Pedidos Pendentes</p>
              </div>
            </div>

            {/* Mercado Pago Status */}
            <div className="rounded-xl border border-border/30 p-5" style={{ background: "oklch(0.14 0.02 250)" }}>
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-foreground">Mercado Pago</p>
                  {mpStatus?.configured ? (
                    <p className="text-xs text-green-400">Configurado e ativo</p>
                  ) : (
                    <p className="text-xs text-yellow-400">Não configurado - vá em Configurações para adicionar o Access Token</p>
                  )}
                </div>
                <button onClick={() => setActiveTab("settings")} className="ml-auto text-xs text-primary hover:text-primary/80 transition-colors">
                  Configurar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============ Products Tab ============ */}
        {activeTab === "products" && (
          <div>
            {showProductForm || editingProduct ? (
              <div className="rounded-xl border border-border/30 p-4 sm:p-6" style={{ background: "oklch(0.14 0.02 250)" }}>
                <h3 className="text-lg font-bold text-foreground mb-4">{editingProduct ? "Editar Produto" : "Novo Produto"}</h3>
                <ProductForm
                  product={editingProduct}
                  categories={allCategories || []}
                  onSubmit={(data) => { if (data.id) { updateProductMut.mutate(data); } else { createProduct.mutate(data); } }}
                  onCancel={() => { setShowProductForm(false); setEditingProduct(null); }}
                  isLoading={createProduct.isPending || updateProductMut.isPending}
                />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">{allProducts?.length || 0} produtos</p>
                  <Button size="sm" onClick={() => setShowProductForm(true)} className="gap-1.5"><Plus className="w-4 h-4" /> Novo Produto</Button>
                </div>
                <div className="rounded-xl overflow-hidden border border-border/30" style={{ background: "oklch(0.14 0.02 250)" }}>
                  {prodsLoading ? (
                    <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                  ) : !allProducts || allProducts.length === 0 ? (
                    <div className="text-center py-12"><Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">Nenhum produto ainda.</p></div>
                  ) : (
                    allProducts.map((product) => (
                      <div key={product.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/30 last:border-b-0 hover:bg-secondary/40 transition-colors">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          {product.imageUrl ? <img src={product.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-5 h-5 text-muted-foreground/50" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {product.isPinned && <Pin className="w-3 h-3 text-primary" />}
                            {!product.isActive && <EyeOff className="w-3 h-3 text-destructive" />}
                            <h4 className="text-sm font-medium text-foreground truncate">{product.title}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground">{formatPrice(product.priceCents)} · {product.viewCount} views · {product.downloadCount} downloads</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Link href={`/produto/${product.id}`}>
                            <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Eye className="w-4 h-4" /></button>
                          </Link>
                          <button onClick={() => setEditingProduct(product)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => { if (confirm(`Remover "${product.title}"?`)) deleteProductMut.mutate({ id: product.id }); }} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ============ Categories Tab ============ */}
        {activeTab === "categories" && (
          <div>
            {showCategoryForm || editingCategory ? (
              <div className="rounded-xl border border-border/30 p-4 sm:p-6" style={{ background: "oklch(0.14 0.02 250)" }}>
                <h3 className="text-lg font-bold text-foreground mb-4">{editingCategory ? "Editar Categoria" : "Nova Categoria"}</h3>
                <CategoryForm
                  category={editingCategory}
                  onSubmit={(data) => { if (data.id) { updateCategoryMut.mutate(data); } else { createCategory.mutate(data); } }}
                  onCancel={() => { setShowCategoryForm(false); setEditingCategory(null); }}
                  isLoading={createCategory.isPending || updateCategoryMut.isPending}
                />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">{allCategories?.length || 0} categorias</p>
                  <Button size="sm" onClick={() => setShowCategoryForm(true)} className="gap-1.5"><Plus className="w-4 h-4" /> Nova Categoria</Button>
                </div>
                <div className="rounded-xl overflow-hidden border border-border/30" style={{ background: "oklch(0.14 0.02 250)" }}>
                  {catsLoading ? (
                    <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                  ) : !allCategories || allCategories.length === 0 ? (
                    <div className="text-center py-12"><FolderOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">Nenhuma categoria ainda.</p></div>
                  ) : (
                    allCategories.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/30 last:border-b-0 hover:bg-secondary/40 transition-colors">
                        <span className="text-xl">{cat.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground">{cat.name}</h4>
                          <p className="text-xs text-muted-foreground">{cat.slug} · ordem: {cat.sortOrder}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => setEditingCategory(cat)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => { if (confirm(`Remover "${cat.name}"?`)) deleteCategoryMut.mutate({ id: cat.id }); }} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ============ Users Tab with Ban/Restrict ============ */}
        {activeTab === "users" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">{allUsers?.length || 0} usuários cadastrados</p>
            </div>
            <div className="rounded-xl overflow-hidden border border-border/30" style={{ background: "oklch(0.14 0.02 250)" }}>
              {usersLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : !allUsers || allUsers.length === 0 ? (
                <div className="text-center py-12"><Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">Nenhum usuário cadastrado.</p></div>
              ) : (
                allUsers.map((u) => {
                  const ban = banStatusMap[u.banStatus || "active"] || banStatusMap.active;
                  return (
                    <div key={u.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/30 last:border-b-0 hover:bg-secondary/40 transition-colors">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: u.role === "admin" ? "oklch(0.45 0.15 240)" : u.banStatus === "banned" ? "oklch(0.35 0.15 25)" : "oklch(0.3 0.05 250)" }}>
                        {u.telegramPhotoUrl ? (
                          <img src={u.telegramPhotoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          (u.displayName || u.username || "U")[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono text-muted-foreground/60 bg-secondary/50 px-1.5 py-0.5 rounded cursor-pointer hover:text-foreground transition-colors" onClick={() => { navigator.clipboard.writeText(String(u.id)); toast.success(`ID #${u.id} copiado!`); }} title="Clique para copiar ID">#{u.id}</span>
                          <h4 className="text-sm font-medium text-foreground">{u.displayName || u.username}</h4>
                          <span className="text-xs text-muted-foreground">@{u.username}</span>
                          {u.role === "admin" && <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">Admin</Badge>}
                          <Badge className={ban.color + " text-[10px]"}>{ban.label}</Badge>
                          {u.telegramVerified && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
                              <Send className="w-2.5 h-2.5 mr-0.5" /> TG
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {u.email || u.phone || "Sem contato"}
                          {u.telegramUsername && ` · @${u.telegramUsername}`}
                          {` · Desde ${new Date(u.createdAt).toLocaleDateString("pt-BR")}`}
                        </p>
                        {u.banReason && <p className="text-[10px] text-red-400 mt-0.5">Motivo: {u.banReason}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                        {/* Group toggle */}
                        {u.isGroupMember ? (
                          <button
                            onClick={() => toggleGroupMember.mutate({ userId: u.id, isMember: false })}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                          >
                            <UserCheck className="w-3 h-3" /> Membro
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleGroupMember.mutate({ userId: u.id, isMember: true })}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <UserX className="w-3 h-3" /> Não membro
                          </button>
                        )}
                        {/* Edit user */}
                        {u.role !== "admin" && (
                          <button
                            onClick={() => {
                              setEditUserDialog(u);
                              setEditUsername(u.username);
                              setEditDisplayName(u.displayName || "");
                              setEditEmail(u.email || "");
                              setEditPhone(u.phone || "");
                              setEditIsGroupMember(u.isGroupMember);
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Edit className="w-3 h-3" /> Editar
                          </button>
                        )}
                        {/* Ban/Restrict button */}
                        {u.role !== "admin" && (
                          <button
                            onClick={() => { setBanDialog({ userId: u.id, username: u.username }); setBanAction(u.banStatus === "active" ? "restricted" : "active"); setBanReason(u.banReason || ""); }}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Ban className="w-3 h-3" /> Moderar
                          </button>
                        )}
                        {/* Delete user */}
                        {u.role !== "admin" && (
                          <button
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja APAGAR o usuário @${u.username}? Esta ação não pode ser desfeita.`)) {
                                deleteUserMut.mutate({ userId: u.id });
                              }
                            }}
                            disabled={deleteUserMut.isPending}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" /> Apagar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Edit User Dialog */}
            {editUserDialog && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditUserDialog(null)}>
                <div className="rounded-xl border border-border/30 p-6 w-full max-w-md" style={{ background: "oklch(0.14 0.02 250)" }} onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Edit className="w-5 h-5 text-blue-400" />
                    Editar @{editUserDialog.username}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Username</label>
                      <input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="w-full h-10 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Nome de Exibição</label>
                      <input value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} className="w-full h-10 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                      <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full h-10 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground" placeholder="Opcional" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Telefone</label>
                      <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full h-10 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground" placeholder="Opcional" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={editIsGroupMember} onChange={(e) => setEditIsGroupMember(e.target.checked)} id="editGroupMember" className="rounded" />
                      <label htmlFor="editGroupMember" className="text-sm text-foreground">Membro do Grupo</label>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => editUserMut.mutate({
                          userId: editUserDialog.id,
                          username: editUsername,
                          displayName: editDisplayName,
                          email: editEmail || undefined,
                          phone: editPhone || undefined,
                          isGroupMember: editIsGroupMember,
                        })}
                        disabled={editUserMut.isPending}
                        className="gap-1.5"
                      >
                        {editUserMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setResetPwDialog({ userId: editUserDialog.id, username: editUserDialog.username });
                          setEditUserDialog(null);
                        }}
                        className="gap-1.5 text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10"
                      >
                        <Shield className="w-4 h-4" /> Resetar Senha
                      </Button>
                      <Button variant="outline" onClick={() => setEditUserDialog(null)}>Cancelar</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reset Password Dialog */}
            {resetPwDialog && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setResetPwDialog(null)}>
                <div className="rounded-xl border border-border/30 p-6 w-full max-w-md" style={{ background: "oklch(0.14 0.02 250)" }} onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-yellow-400" />
                    Resetar Senha de @{resetPwDialog.username}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Nova Senha</label>
                      <input
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full h-10 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground"
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => resetPasswordMut.mutate({ userId: resetPwDialog.userId, newPassword })}
                        disabled={resetPasswordMut.isPending || newPassword.length < 6}
                        className="bg-yellow-600 hover:bg-yellow-700 gap-1.5"
                      >
                        {resetPasswordMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                        Confirmar
                      </Button>
                      <Button variant="outline" onClick={() => setResetPwDialog(null)}>Cancelar</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ban Dialog */}
            {banDialog && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setBanDialog(null)}>
                <div className="rounded-xl border border-border/30 p-6 w-full max-w-md" style={{ background: "oklch(0.14 0.02 250)" }} onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Ban className="w-5 h-5 text-red-400" />
                    Moderar @{banDialog.username}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Ação</label>
                      <select value={banAction} onChange={(e) => setBanAction(e.target.value as any)} className="w-full h-10 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground">
                        <option value="active">Desbanir (Ativo)</option>
                        <option value="restricted">Restringir</option>
                        <option value="temp_banned">Ban Temporário</option>
                        <option value="banned">Ban Permanente</option>
                      </select>
                    </div>
                    {banAction === "temp_banned" && (
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Duração (horas)</label>
                        <input type="number" value={banDuration} onChange={(e) => setBanDuration(parseInt(e.target.value) || 1)} className="w-full h-10 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground" />
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Motivo</label>
                      <textarea value={banReason} onChange={(e) => setBanReason(e.target.value)} className="w-full h-20 px-3 py-2 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground resize-none" placeholder="Motivo da ação..." />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => updateBanStatus.mutate({
                          userId: banDialog.userId,
                          banStatus: banAction,
                          banReason: banReason || undefined,
                          banDurationHours: banAction === "temp_banned" ? banDuration : undefined,
                        })}
                        disabled={updateBanStatus.isPending}
                        className={banAction === "banned" ? "bg-red-600 hover:bg-red-700" : banAction === "active" ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {updateBanStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                        Confirmar
                      </Button>
                      <Button variant="outline" onClick={() => setBanDialog(null)}>Cancelar</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ Orders Tab ============ */}
        {activeTab === "orders" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">{allOrders?.length || 0} pedidos</p>
              <Button onClick={() => setShowGrantDialog(true)} size="sm" className="gap-1.5" style={{ background: "oklch(0.45 0.15 240)" }}>
                <UserCheck className="w-4 h-4" /> Liberar Acesso Manual
              </Button>
            </div>
            <div className="rounded-xl overflow-hidden border border-border/30" style={{ background: "oklch(0.14 0.02 250)" }}>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : !allOrders || allOrders.length === 0 ? (
                <div className="text-center py-12"><ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p></div>
              ) : (
                allOrders.map((order) => {
                  const st = orderStatusMap[order.status] || orderStatusMap.pending;
                  const Icon = st.icon;
                  return (
                    <div key={order.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/30 last:border-b-0 hover:bg-secondary/40 transition-colors">
                      <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-foreground">Pedido #{order.id}</h4>
                          <Badge className={st.color + " text-[10px]"}>{st.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Usuário #{order.userId} · Produto #{order.productId} · {new Date(order.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 flex items-center gap-2">
                        <div>
                          <p className="text-sm font-bold text-foreground">{formatPrice(order.amountCents)}</p>
                          {order.downloadCount > 0 && (
                            <p className="text-[10px] text-muted-foreground">{order.downloadCount}/{order.maxDownloads} downloads</p>
                          )}
                          {order.paymentMethod === "manual" && (
                            <p className="text-[10px] text-blue-400">Manual</p>
                          )}
                        </div>
                        {order.status === "approved" && (
                          <button
                            onClick={() => revokeAccess.mutate({ orderId: order.id })}
                            disabled={revokeAccess.isPending}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            title="Revogar acesso"
                          >
                            <XCircle className="w-3 h-3" /> Revogar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Grant Access Dialog */}
            {showGrantDialog && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowGrantDialog(false)}>
                <div className="rounded-xl border border-border/30 p-6 w-full max-w-md" style={{ background: "oklch(0.14 0.02 250)" }} onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-green-400" />
                    Liberar Acesso Manual
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Libere o acesso a um produto pago para um usuário específico sem necessidade de pagamento.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">ID do Usuário</label>
                      <select
                        value={grantUserId}
                        onChange={(e) => setGrantUserId(e.target.value)}
                        className="w-full h-10 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground"
                      >
                        <option value="">Selecione um usuário...</option>
                        {allUsers?.map((u) => (
                          <option key={u.id} value={u.id}>#{u.id} - {u.displayName || u.username} (@{u.username})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Produto</label>
                      <select
                        value={grantProductId}
                        onChange={(e) => setGrantProductId(e.target.value)}
                        className="w-full h-10 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground"
                      >
                        <option value="">Selecione um produto...</option>
                        {allProducts?.filter(p => !p.isFree).map((p) => (
                          <option key={p.id} value={p.id}>#{p.id} - {p.title} ({formatPrice(p.priceCents)})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Máximo de Downloads</label>
                      <input
                        type="number"
                        value={grantMaxDownloads}
                        onChange={(e) => setGrantMaxDownloads(parseInt(e.target.value) || 1)}
                        min={1}
                        max={100}
                        className="w-full h-10 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => {
                          if (!grantUserId || !grantProductId) { toast.error("Selecione um usuário e um produto"); return; }
                          grantAccess.mutate({ userId: parseInt(grantUserId), productId: parseInt(grantProductId), maxDownloads: grantMaxDownloads });
                        }}
                        disabled={grantAccess.isPending || !grantUserId || !grantProductId}
                        className="bg-green-600 hover:bg-green-700 gap-1.5"
                      >
                        {grantAccess.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Liberar Acesso
                      </Button>
                      <Button variant="outline" onClick={() => setShowGrantDialog(false)}>Cancelar</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ Roles Tab ============ */}
        {activeTab === "roles" && (
          <RolesManagement />
        )}

        {/* ============ Settings Tab ============ */}
        {activeTab === "settings" && (
          <SettingsTab settings={adminSettings} onSave={(data) => updateSettings.mutate(data)} isSaving={updateSettings.isPending} siteLogos={siteLogos} onUploadLogo={(data: any) => uploadLogoMut.mutate(data)} isUploadingLogo={uploadLogoMut.isPending} />
        )}
      </div>
      <Footer />
    </div>
  );
}

// ============================================
// Settings Tab Component
// ============================================
function SettingsTab({ settings, onSave, isSaving, siteLogos, onUploadLogo, isUploadingLogo }: {
  settings: any; onSave: (data: any) => void; isSaving: boolean;
  siteLogos?: { header: string; banner: string; favicon: string };
  onUploadLogo?: (data: any) => void;
  isUploadingLogo?: boolean;
}) {
  const [mpAccessToken, setMpAccessToken] = useState("");
  const [mpPublicKey, setMpPublicKey] = useState(settings?.mpPublicKey || "");
  const [contactTelegram, setContactTelegram] = useState(settings?.contactTelegram || "@Danielssh");

  // Update when settings load
  useState(() => {
    if (settings) {
      setMpPublicKey(settings.mpPublicKey || "");
      setContactTelegram(settings.contactTelegram || "@Danielssh");
    }
  });

  const handleLogoUpload = async (logoType: "header" | "banner" | "favicon") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Imagem muito grande. Máximo 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        onUploadLogo?.({
          logoType,
          imageData: base64,
          mimeType: file.type,
          fileName: file.name,
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Site Logos */}
      <div className="rounded-xl border border-border/30 p-5" style={{ background: "oklch(0.14 0.02 250)" }}>
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-foreground">Logos do Site</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Faça upload das imagens do site. Máximo 5MB por imagem.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["header", "banner", "favicon"] as const).map((type) => {
            const labels = { header: "Logo Header", banner: "Banner", favicon: "Favicon" };
            const currentUrl = siteLogos?.[type];
            return (
              <div key={type} className="text-center">
                <p className="text-sm font-medium text-foreground mb-2">{labels[type]}</p>
                <div className="w-full h-24 rounded-lg border border-border/30 bg-secondary/50 flex items-center justify-center mb-2 overflow-hidden">
                  {currentUrl ? (
                    <img src={currentUrl} alt={labels[type]} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleLogoUpload(type)}
                  disabled={isUploadingLogo}
                  className="gap-1.5 text-xs w-full"
                >
                  {isUploadingLogo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {currentUrl ? "Trocar" : "Upload"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mercado Pago */}
      <div className="rounded-xl border border-border/30 p-5" style={{ background: "oklch(0.14 0.02 250)" }}>
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-foreground">Mercado Pago</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Configure as credenciais da API do Mercado Pago para receber pagamentos via PIX, Boleto e Cartão.
          Obtenha suas credenciais em{" "}
          <a href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            mercadopago.com.br/developers
          </a>
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Access Token</label>
            <input
              type="password"
              value={mpAccessToken}
              onChange={(e) => setMpAccessToken(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground"
              placeholder={settings?.mpAccessToken ? `Atual: ${settings.mpAccessToken}` : "APP_USR-..."}
            />
            <p className="text-[10px] text-muted-foreground mt-1">Deixe vazio para manter o token atual.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Public Key</label>
            <input
              value={mpPublicKey}
              onChange={(e) => setMpPublicKey(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground"
              placeholder="APP_USR-..."
            />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="rounded-xl border border-border/30 p-5" style={{ background: "oklch(0.14 0.02 250)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Send className="w-5 h-5 text-[oklch(0.7_0.12_200)]" />
          <h3 className="text-lg font-semibold text-foreground">Contato Telegram</h3>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Username do Telegram</label>
          <input
            value={contactTelegram}
            onChange={(e) => setContactTelegram(e.target.value)}
            className="w-full h-10 px-3 text-sm bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none text-foreground"
            placeholder="@Danielssh"
          />
        </div>
      </div>

      {/* Save */}
      <Button
        onClick={() => {
          const data: any = { contactTelegram };
          if (mpAccessToken.trim()) data.mpAccessToken = mpAccessToken;
          if (mpPublicKey.trim()) data.mpPublicKey = mpPublicKey;
          onSave(data);
        }}
        disabled={isSaving}
        className="gap-2"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Salvar Configurações
      </Button>
    </div>
  );
}

