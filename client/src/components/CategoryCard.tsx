/**
 * CategoryCard - Telegram-style channel list item
 * Design: Dark card with colored icon, name, preview message, timestamp, and badges
 */
import { Lock, CheckCheck, MessageSquare, Eye } from "lucide-react";
import { Link } from "wouter";
import type { ForumCategory } from "@/lib/forumData";
import { formatMessageCount } from "@/lib/forumData";

interface CategoryCardProps {
  category: ForumCategory;
  index: number;
  fileCount?: number;
}

export default function CategoryCard({ category, index, fileCount }: CategoryCardProps) {
  return (
    <Link href={`/categoria/${category.slug}`}>
      <div
        className="group flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-3.5 border-b border-border/30 hover:bg-secondary/60 transition-all duration-200 cursor-pointer"
        style={{
          animationDelay: `${index * 40}ms`,
          animation: "fadeSlideIn 0.3s ease-out forwards",
          opacity: 0,
        }}
      >
        {/* Category Icon */}
        <div
          className="flex-shrink-0 w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full flex items-center justify-center text-xl sm:text-2xl transition-transform duration-200 group-hover:scale-105"
          style={{ backgroundColor: category.iconBg }}
        >
          {category.icon === "#" ? (
            <span className="text-lg sm:text-xl font-bold" style={{ color: category.iconColor }}>#</span>
          ) : category.icon === "</>" ? (
            <span className="text-sm sm:text-base font-mono font-bold" style={{ color: category.iconColor }}>&lt;/&gt;</span>
          ) : (
            <span>{category.icon}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top row: name + timestamp */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="text-[15px] font-medium text-foreground truncate group-hover:text-primary transition-colors duration-200">
                {category.name}
              </h3>
              {category.isLocked && (
                <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
              {category.lastDate}
            </span>
          </div>

          {/* Bottom row: last message preview + badges */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground truncate">
              <span className="text-secondary-foreground font-medium">{category.lastAuthor}:</span>{" "}
              {category.lastMessage}
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              {category.isLocked && (
                <CheckCheck className="w-4 h-4 text-[oklch(0.65_0.15_240)]" />
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="w-3 h-3" />
                <span>{formatMessageCount(category.messageCount)}</span>
              </div>
              {fileCount && fileCount > 0 ? (
                <div className="flex items-center gap-1 text-xs text-[oklch(0.65_0.15_240)]">
                  <span>{fileCount} arquivo{fileCount > 1 ? 's' : ''}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
