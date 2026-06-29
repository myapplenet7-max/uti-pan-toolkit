import { useState } from "react";

interface Props {
  deviceId: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function RecoveryModal({ deviceId, onSuccess, onClose }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<{ usesRemaining: number; transactionId: string } | null>(null);

  const handleRecover = async () => {
    if (!code.trim()) {
      setError("Please enter your unique code");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/access/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueCode: code.trim().toUpperCase(), newDeviceId: deviceId }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error((e as any).error || "Recovery failed");
      }
      const data = await res.json();
      setResult(data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Recovery failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#15233D" }}>🔑 Recover Access</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>×</button>
        </div>

        {!success ? (
          <>
            <p style={{ fontSize: 12, color: "#555", marginBottom: 14, lineHeight: 1.6 }}>
              Changed device? Enter the unique code you received after payment to transfer your remaining uses to this device.
            </p>

            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="Enter code e.g. AB3X7Q2P"
              maxLength={12}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 9, border: "2px solid #dde",
                fontSize: 16, fontWeight: 700, letterSpacing: 3, textAlign: "center",
                marginBottom: 12, outline: "none", boxSizing: "border-box",
                textTransform: "uppercase",
              }}
            />

            {error && (
              <div style={{ background: "#fee", border: "1px solid #fcc", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#c00", marginBottom: 12 }}>
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleRecover}
              disabled={loading}
              style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #15233D, #3D5A73)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "⏳ Recovering..." : "🔑 Recover Access"}
            </button>

            <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
              Your uses will be transferred to this device. The code can be used from only one device at a time.
            </p>
          </>
        ) : (
          <>
            <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
              <div style={{ fontSize: 40 }}>✅</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1E7145", margin: "8px 0 4px" }}>Access Restored!</h3>
              <p style={{ fontSize: 12, color: "#666" }}>
                {result?.usesRemaining} uses transferred to this device.
              </p>
            </div>
            <button onClick={onSuccess} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #1E7145, #2e9e55)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
              ▶ Continue Using Toolkit
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999,
  display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
};

const modalStyle: React.CSSProperties = {
  background: "#fff", borderRadius: 14, padding: 20, width: "100%", maxWidth: 360,
  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
};
