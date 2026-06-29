import { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
}

export default function LegalLayout({ title, children }: Props) {
  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1a3a6b,#2557a7)", padding: "16px 20px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, textDecoration: "none", fontWeight: 600 }}>
            ← Back to Toolkit
          </a>
          <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: 0 }}>{title}</h1>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 48px" }}>
        <div style={{
          background: "#fff", borderRadius: 12, padding: "24px 28px",
          boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
          lineHeight: 1.75, color: "#333", fontSize: 14,
        }}>
          <style>{`
            h2 { font-size: 16px; font-weight: 800; color: #1a3a6b; margin: 20px 0 8px; }
            h2:first-child { margin-top: 0; }
            p { margin: 0 0 12px; }
            ul, ol { margin: 0 0 12px; padding-left: 20px; }
            li { margin-bottom: 6px; }
            a { color: #1a5a8b; }
            strong { font-weight: 700; }
            table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
            th { background: #1a3a6b; color: #fff; padding: 8px 12px; text-align: left; }
            td { padding: 8px 12px; border-bottom: 1px solid #eee; }
            tr:nth-child(even) td { background: #f8f9ff; }
          `}</style>

          <p style={{ fontSize: 12, color: "#999", marginBottom: 20 }}>Last updated: June 2025</p>

          {children}
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Footer() {
  const links = [
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms & Conditions" },
    { href: "/refund", label: "Refund Policy" },
  ];
  return (
    <div style={{ background: "#1a3a6b", color: "rgba(255,255,255,0.65)", textAlign: "center", padding: "20px 16px", fontSize: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", justifyContent: "center", marginBottom: 8 }}>
        {links.map(l => (
          <a key={l.href} href={l.href} style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none", fontWeight: 600 }}>{l.label}</a>
        ))}
      </div>
      <p style={{ margin: 0 }}>We are not affiliated with UTIITSL, NSDL, or the Government of India.</p>
    </div>
  );
}
