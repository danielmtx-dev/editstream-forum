/**
 * HeroBanner - Top section with group info and clickable stats
 * Design: Dark Telegram style with hero image overlay
 * All stats are clickable and navigate to relevant pages
 */
import { Users, MessageSquare, Hash, Package, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useMemo } from "react";

const DEFAULT_HERO = "https://private-us-east-1.manuscdn.com/sessionFile/GU2vQC0SCGeBAaQ3gZdiwt/sandbox/KiQBhGJmSEKiOV0brg3oXc-img-1_1771195606000_na1fn_ZWRpdHN0cmVhbS1oZXJvLWJhbm5lcg.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvR1UydlFDMFNDR2VCQWFRM2daZGl3dC9zYW5kYm94L0tpUUJoR0ptU0VLaU9WMGJyZzNvWGMtaW1nLTFfMTc3MTE5NTYwNjAwMF9uYTFmbl9aV1JwZEhOMGNtVmhiUzFvWlhKdkxXSmhibTVsY2cucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=W~UQ4~P1JcF0qWrOOk2ePQbkY4y2XEEvA8X9qyX5XVbeIgfjJ8qw28suCfyGOOrEAAG7MwLs5zCZSwVMyaYxcAhPsXQ2PfxQQneptNrDZ4T~cfCvRkl9~LS6NO1RjdAFKr-g3xgw5B0aekqO9-V5e-uVb3z4dRQO3vxRUPc2BhDDm0EThnHM95QT5Sm3GzdsIAQh1nLGydSm1N6LEQmo4QPp1HeBSVUWxjXrK7pPv5svwj9kulJGtdhEcXof~WeSeWmVnKGAQBSLcZbIumCcQLla9uBnlOVYgvts0jU0fqGzn85L5cY5GJNgt1XIzYXBUyWlpMra9q1MEFZi~MybuA__";

const DEFAULT_LOGO = "https://private-us-east-1.manuscdn.com/sessionFile/GU2vQC0SCGeBAaQ3gZdiwt/sandbox/KiQBhGJmSEKiOV0brg3oXc-img-2_1771195601000_na1fn_ZWRpdHN0cmVhbS1sb2dv.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvR1UydlFDMFNDR2VCQWFRM2daZGl3dC9zYW5kYm94L0tpUUJoR0ptU0VLaU9WMGJyZzNvWGMtaW1nLTJfMTc3MTE5NTYwMTAwMF9uYTFmbl9aV1JwZEhOMGNtVmhiUzFzYjJkdi5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=sWekqs8-cPqMPUhzzu1XN26yyK8cbp~diOSZbgKPLAiGBDCKOtYgWGXKWV9Odv5gjHE-h8skPn7mivHiswc6w4yUOPOckXmCnz4hKA1-4FA6L2vzI0lO5dtDvpo08Vxq1ZT1YiJv6fZcZ19fWqJQdhVQqvcYmeduHYe-~NqNQnU~uz9ZXFnGvqBQsMIHOD885DNx8NgkCZ06bFhFQryFRvju9RY2ZIGh~H792Hn8PNQN26~8P2eHgD8HYCvMMb~JypYBPF7RitTxGHfw8bD8jK2CCh2DKkHKaiES-O5Uw5jzvwz50MNbUlepB4dVC1mwL9eNW2qaJQQK49HqwAm0ug__";

export default function HeroBanner() {
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: productCounts } = trpc.products.counts.useQuery();
  const { data: members } = trpc.customAuth.publicMembers.useQuery(undefined, {
    staleTime: 60_000, retry: false,
  });
  const { data: logos } = trpc.admin.getLogos.useQuery(undefined, {
    staleTime: 60_000, retry: false,
  });
  const heroUrl = logos?.banner || DEFAULT_HERO;
  const logoUrl = logos?.header || DEFAULT_LOGO;

  const totalProducts = useMemo(() => {
    if (!productCounts) return 0;
    return Object.values(productCounts).reduce((sum, count) => sum + count, 0);
  }, [productCounts]);

  const stats = [
    { icon: Users, label: "Membros", value: members?.length || 0, href: "/membros" },
    { icon: Hash, label: "Categorias", value: categories?.length || 0, href: "/categorias" },
    { icon: Package, label: "Produtos", value: totalProducts, href: "/" },
    { icon: Send, label: "Grupo", value: "Telegram", href: "https://t.me/editstreampro", external: true },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroUrl}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, oklch(0.12 0.02 250 / 0.7), oklch(0.12 0.02 250 / 0.95))" }} />
      </div>

      {/* Content */}
      <div className="relative container py-8 sm:py-12 lg:py-16">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 mb-6 sm:mb-8">
          {/* Logo */}
          <div className="relative">
            <img
              src={logoUrl}
              alt="EditStream Pro"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-2xl ring-2 ring-[oklch(0.65_0.15_240)]/30"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-3 border-background flex items-center justify-center">
              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            </div>
          </div>

          {/* Group Info */}
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">EditStream Pro</h2>
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[oklch(0.65_0.15_240)]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <p className="text-sm sm:text-base text-white/70 max-w-lg">
              Loja de produtos digitais, scripts, IPTV, ferramentas e tutoriais. Produtos gratuitos e premium.
            </p>
            {/* Contact link */}
            <a
              href="https://t.me/Danielssh"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs text-[oklch(0.7_0.12_200)] hover:text-[oklch(0.8_0.12_200)] transition-colors"
            >
              <Send className="w-3 h-3" />
              Contato: @Danielssh
            </a>
          </div>
        </div>

        {/* Stats Grid - All Clickable */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat) => {
            const content = (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                style={{ background: "oklch(0.16 0.02 250 / 0.7)", backdropFilter: "blur(8px)", border: "1px solid oklch(0.25 0.02 250 / 0.5)" }}
              >
                <stat.icon className="w-5 h-5 text-[oklch(0.65_0.15_240)] flex-shrink-0" />
                <div>
                  <p className="text-lg font-bold text-white leading-tight">{stat.value}</p>
                  <p className="text-xs text-white/50">{stat.label}</p>
                </div>
              </div>
            );

            if ((stat as any).external) {
              return (
                <a key={stat.label} href={stat.href} target="_blank" rel="noopener noreferrer">
                  {content}
                </a>
              );
            }
            return (
              <Link key={stat.label} href={stat.href}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
