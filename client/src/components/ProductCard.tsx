/**
 * ProductCard - Displays a product in the Telegram-style list
 * Shows image, title, price, category, payment methods (PIX only, no boleto)
 */
import { Link } from "wouter";
import type { Product } from "../../../drizzle/schema";
import {
  Download,
  Eye,
  Pin,
  QrCode,
  Gift,
  Image as ImageIcon,
  ExternalLink,
  FileDown,
} from "lucide-react";

interface ProductCardProps {
  product: Product & { images?: any[]; files?: any[] };
  index: number;
  categoryName?: string;
  categoryIcon?: string;
}

function formatPrice(cents: number): string {
  if (cents === 0) return "Grátis";
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export default function ProductCard({ product, index, categoryName, categoryIcon }: ProductCardProps) {
  const hasFiles = product.fileKey || (product.files && product.files.length > 0);
  let hasExternalLinks = false;
  try {
    if (product.externalLinks && typeof product.externalLinks === "string") {
      const parsed = JSON.parse(product.externalLinks);
      hasExternalLinks = Array.isArray(parsed) && parsed.length > 0;
    }
  } catch { hasExternalLinks = false; }
  const extraImages = product.images ? product.images.length : 0;

  return (
    <Link href={`/produto/${product.id}`}>
      <div
        className="group flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-3.5 border-b border-border/30 last:border-b-0 hover:bg-secondary/60 transition-all duration-200 cursor-pointer"
        style={{
          animationDelay: `${index * 40}ms`,
          animation: "fadeSlideIn 0.3s ease-out forwards",
          opacity: 0,
        }}
      >
        {/* Product Image */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden flex-shrink-0 bg-secondary relative">
          {product.imageUrl ? (
            <>
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {extraImages > 0 && (
                <div className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] px-1 rounded">
                  +{extraImages}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ImageIcon className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {product.isPinned && (
              <Pin className="w-3 h-3 text-primary flex-shrink-0" />
            )}
            <h3 className="text-[15px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
              {product.title}
            </h3>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
            {product.description}
          </p>

          <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5">
            {/* Category badge - clickable */}
            {categoryName && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                {categoryIcon} {categoryName}
              </span>
            )}

            {/* Payment method */}
            {product.isFree ? (
              <span className="flex items-center gap-0.5 text-[10px] text-emerald-400">
                <Gift className="w-3 h-3" />
                Grátis
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <QrCode className="w-3 h-3" />
                PIX
              </span>
            )}

            {/* File indicators */}
            {hasFiles && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <FileDown className="w-3 h-3" />
                Arquivo
              </span>
            )}
            {hasExternalLinks && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <ExternalLink className="w-3 h-3" />
                Links
              </span>
            )}
          </div>
        </div>

        {/* Right side - Price & Stats */}
        <div className="flex-shrink-0 text-right">
          <div
            className={`text-sm font-bold mb-1 ${
              product.isFree ? "text-emerald-400" : "text-primary"
            }`}
          >
            {formatPrice(product.priceCents)}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground justify-end">
            <div className="flex items-center gap-0.5">
              <Eye className="w-3 h-3" />
              {product.viewCount}
            </div>
            {(hasFiles || hasExternalLinks) && (
              <div className="flex items-center gap-0.5">
                <Download className="w-3 h-3" />
                {product.downloadCount}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
