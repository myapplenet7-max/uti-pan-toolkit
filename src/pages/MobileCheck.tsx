export default function MobileCheck() {
  return (
    <div style={{ minHeight: "100vh", background: "#eef1f7", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #1a3a6b, #2557a7)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: 0 }}>📊 My Account</h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: 1.5 }}>UTI PAN Toolkit</p>
        </div>
        <a href="/" style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 700, textDecoration: "none", background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "7px 14px" }}>← Toolkit</a>
      </div>

      <div style={{ maxWidth: 440, margin: "40px auto", padding: "0 16px", textAlign: "center" }}>
        <div style={{ background: "#fff", borderRadius: 18, padding: "40px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🔐</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a3a6b", margin: "0 0 10px" }}>Sign In to View Your Wallet</h2>
          <p style={{ fontSize: 13, color: "#888", margin: "0 0 28px", lineHeight: 1.6 }}>
            Log in with your mobile number and password to view your remaining uses, coupon codes, and purchase history.
          </p>
          <a href="/login" style={{ display: "block", padding: "14px", borderRadius: 12, background: "linear-gradient(135deg,#1a3a6b,#2557a7)", color: "#fff", fontWeight: 800, fontSize: 15, textDecoration: "none", marginBottom: 12 }}>
            🔐 Sign In / Register
          </a>
          <a href="/my-coupons" style={{ display: "block", padding: "13px", borderRadius: 12, background: "#eef1f7", color: "#1a3a6b", fontWeight: 700, fontSize: 14, textDecoration: "none", marginBottom: 12 }}>
            💰 My Coupons (by code/UTR)
          </a>
          <a href="/coupons" style={{ display: "block", padding: "13px", borderRadius: 12, background: "#eef1f7", color: "#1a3a6b", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            🎟️ Buy Coupons
          </a>
        </div>
      </div>
    </div>
  );
}
