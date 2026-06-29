import { useState, useEffect } from "react";

interface AccessRecord {
  uniqueCode: string;
  serviceType: string;
  usesRemaining: number;
}

interface AccessInfo {
  hasAccess: boolean;
  usesRemaining: number;
  records: AccessRecord[];
}

export default function MyCouponsPage() {
  const [deviceId, setDeviceId] = useState("");
  const [access, setAccess] = useState<AccessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [whatsappNum, setWhatsappNum] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Recovery by unique code
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryResult, setRecoveryResult] = useState<{ uniqueCode: string; usesRemaining: number } | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    let id = localStorage.getItem("uti_device_id");
    if (!id) {
      id = "dev_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("uti_device_id", id);
    }
    setDeviceId(id);
    fetchAccess(id);
    fetch("/api/config").then(r => r.json()).then(d => setWhatsappNum((d.whatsappNumber || "").replace(/\D/g, ""))).catch(() => {});
    // Check login status
    const m = localStorage.getItem("uti_auth_mobile");
    const t = localStorage.getItem("uti_auth_token");
    if (m && t) setIsLoggedIn(true);
  }, []);

  const fetchAccess = async (dId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/access/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: dId }),
      });
      if (res.ok) setAccess(await res.json());
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  const handleRecover = async () => {
    setRecoveryError("");
    if (!recoveryCode.trim()) { setRecoveryError("Enter your unique code"); return; }
    setRecovering(true);
    try {
      const res = await fetch("/api/access/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueCode: recoveryCode.trim().toUpperCase(), newDeviceId: deviceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Recovery failed");
      setRecoveryResult({ uniqueCode: data.uniqueCode, usesRemaining: data.usesRemaining });
      fetchAccess(deviceId);
    } catch (err: any) {
      setRecoveryError(err.message || "Recovery failed");
    } finally {
      setRecovering(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#eef1f7", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #15233D, #3D5A73)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 800, fontSize: 16 }}>UTI PAN Toolkit</a>
        <a href="/coupons" style={{ color: "rgba(255,255,255,0.85)", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>+ Buy Coupons</a>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#15233D", marginBottom: 4 }}>🎟️ My Coupon Wallet</h1>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>Your available uses on this device</p>

        {/* Balance Card */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>⏳ Loading...</div>
        ) : (
          <div style={{
            background: access && access.usesRemaining > 0 ? "linear-gradient(135deg, #15233D, #3D5A73)" : "#64748b",
            borderRadius: 16, padding: "24px 20px", marginBottom: 20, textAlign: "center", color: "#fff",
            boxShadow: "0 4px 20px rgba(26,58,107,0.25)",
          }}>
            <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1 }}>{access?.usesRemaining ?? 0}</div>
            <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>uses remaining on this device</div>
            {access && access.usesRemaining > 0 && (
              <a href="/" style={{ display: "inline-block", marginTop: 14, background: "rgba(255,255,255,0.2)", color: "#fff", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                ▶ Go Use Now →
              </a>
            )}
          </div>
        )}

        {/* Active codes */}
        {access && access.records.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: "#555", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Active Coupon Codes</h3>
            {access.records.map(r => (
              <div key={r.uniqueCode} style={{ background: "#fff", borderRadius: 10, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                <div>
                  <code style={{ fontSize: 16, fontWeight: 900, color: "#15233D", letterSpacing: 2 }}>{r.uniqueCode}</code>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{r.serviceType === "new_pan" ? "PAN Application" : r.serviceType}</div>
                </div>
                <span style={{ background: "#e8f5e9", color: "#1E7145", padding: "4px 14px", borderRadius: 20, fontWeight: 800, fontSize: 14 }}>
                  {r.usesRemaining} uses
                </span>
              </div>
            ))}
          </div>
        )}

        {access && access.usesRemaining === 0 && (
          <a href="/coupons" style={{ display: "block", width: "100%", padding: "14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #15233D, #3D5A73)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", textDecoration: "none", textAlign: "center", marginBottom: 20, boxSizing: "border-box" }}>
            🎟️ Buy Coupon Pack →
          </a>
        )}

        {/* Find uses by Unique Code */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "18px 16px", marginBottom: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#15233D", margin: "0 0 6px" }}>🔍 Find My Uses</h3>
          <p style={{ fontSize: 12, color: "#888", margin: "0 0 14px" }}>Already paid? Activate uses on this device with your unique code.</p>

          {recoveryResult ? (
            <div style={{ background: "#e8f5e9", border: "1.5px solid #a5d6a7", borderRadius: 10, padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: 28 }}>✅</div>
              <p style={{ fontWeight: 800, color: "#1E7145", margin: "6px 0 4px", fontSize: 15 }}>Recovered! {recoveryResult.usesRemaining} uses on this device.</p>
              <a href="/" style={{ display: "inline-block", marginTop: 10, background: "#1E7145", color: "#fff", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                ▶ Use Now →
              </a>
            </div>
          ) : (
            <>
              <input
                value={recoveryCode}
                onChange={e => setRecoveryCode(e.target.value.toUpperCase())}
                placeholder="Unique Code (e.g. ABCD1234)"
                style={inputStyle}
              />
              <p style={{ fontSize: 10, color: "#aaa", margin: "4px 0 12px" }}>
                The 8-character code you received after payment approval.
              </p>
              {recoveryError && <ErrorBox msg={recoveryError} />}
              <button onClick={handleRecover} disabled={recovering}
                style={{ ...btnStyle, opacity: recovering ? 0.7 : 1, cursor: recovering ? "not-allowed" : "pointer" }}>
                {recovering ? "⏳ Recovering..." : "🔑 Recover Access"}
              </button>

              {whatsappNum && (
                <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 10 }}>
                  Lost your code?{" "}
                  <a href={`https://wa.me/${whatsappNum}?text=Hi%2C%20I%20paid%20but%20lost%20my%20unique%20code.`}
                    target="_blank" rel="noreferrer" style={{ color: "#25D366", fontWeight: 700 }}>
                    WhatsApp us
                  </a>
                </p>
              )}
            </>
          )}
        </div>

        {/* Device ID */}
        <div style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#888", margin: "0 0 4px" }}>📱 Device ID (for support)</p>
          <code style={{ fontSize: 9, color: "#aaa", wordBreak: "break-all" }}>{deviceId}</code>
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return <div style={{ background: "#fee", border: "1px solid #fcc", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#c00", marginBottom: 12 }}>⚠️ {msg}</div>;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 12px", borderRadius: 8, border: "1.5px solid #dde",
  fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 4,
};

const btnStyle: React.CSSProperties = {
  display: "block", width: "100%", padding: "13px", borderRadius: 10, border: "none",
  background: "linear-gradient(135deg, #15233D, #3D5A73)", color: "#fff",
  fontWeight: 800, fontSize: 14, cursor: "pointer", textAlign: "center",
};
