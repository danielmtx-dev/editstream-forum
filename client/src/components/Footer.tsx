/**
 * Footer - Simple footer with centered text
 */
export default function Footer() {
  return (
    <footer className="border-t border-border/30 py-6 mt-auto" style={{ background: "oklch(0.12 0.02 250)" }}>
      <div className="container text-center">
        <p className="text-sm text-muted-foreground">
          EditStream Pro | Fórum da Comunidade
        </p>
      </div>
    </footer>
  );
}
