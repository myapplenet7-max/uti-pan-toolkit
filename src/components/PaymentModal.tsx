import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  deviceId: string;
  serviceType: string;
  onSuccess: () => void;
  onClose: () => void;
}

const PACK_OPTIONS = [
  { label: "₹100", amount: 100, uses: 12, description: "12 uses" },
  { label: "₹200", amount: 200, uses: 25, description: "25 uses" },
  { label: "₹500", amount: 500, uses: 70, description: "70 uses" },
];

const UPI_ID = "9014860890@kotakbank";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ background: copied ? "#1a7a3a" : "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
      {copied ? "✓" : "Copy"}
    </button>
  );
}

export default function PaymentModal({ deviceId, serviceType, onSuccess, onClose }: Props) {
  const [step, setStep] = useState<"select" | "pay" | "submit" | "done">("select");
  const [selected, setSelected] = useState(0);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [utr, setUtr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ uniqueCode: string } | null>(null);
  const [whatsappNum, setWhatsappNum] = useState("");

  useEffect(() => {
    fetch("/api/config").then(r => r.json()).then(d => setWhatsappNum((d.whatsappNumber || "").replace(/\D/g, ""))).catch(() => {});
  }, []);

  const getAmount = () => useCustom ? (parseInt(customAmount) || 0) : PACK_OPTIONS[selected].amount;
  const getUses = () => useCustom ? null : PACK_OPTIONS[selected].uses;

  const handleSubmit = async () => {
    setError("");
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!/^\d{10}$/.test(mobile.trim())) { setError("Enter a valid 10-digit mobile number."); return; }
    if (utr.trim().length < 6) { setError("Enter a valid UTR / transaction reference number."); return; }
    const amount = getAmount();
    if (amount < 10) { setError("Minimum amount is ₹10."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/payment/upi-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, serviceType, amount, name: name.trim(), mobile: mobile.trim(), utr: utr.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setResult({ uniqueCode: data.uniqueCode });
      setStep("done");
    } catch (err: any) {
      setError(err.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const whatsappAdminMsg = result
    ? encodeURIComponent(`Hi, I paid ₹${getAmount()} for UTI PAN Toolkit.\nName: ${name}\nMobile: ${mobile}\nUTR: ${utr}\nCode: ${result.uniqueCode}\nPlease approve.`)
    : "";

  if (step === "done" && result) {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <div style={{ textAlign: "center", padding: "6px 0 12px" }}>
            <div style={{ fontSize: 40 }}>⏳</div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a3a6b", margin: "8px 0 4px" }}>Payment Submitted!</h2>
            <p style={{ fontSize: 12, color: "#666", margin: 0 }}>Admin will verify and credit your uses shortly.</p>
          </div>

          <div style={{ background: "#f0f7f0", border: "1.5px solid #a5d6a7", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
            <p style={{ fontSize: 11, color: "#555", margin: "0 0 4px" }}>Your Unique Code:</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#1a3a6b", letterSpacing: 2, flex: 1 }}>{result.uniqueCode}</span>
              <CopyButton text={result.uniqueCode} />
            </div>
          </div>

          <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#7a5a00", marginBottom: 12 }}>
            💡 After approval, find your uses at <b>/my-coupons</b> using your <b>mobile or UTR</b>.
          </div>

          {/* WhatsApp notify admin — prominent CTA */}
          {whatsappNum && (
            <a href={`https://wa.me/${whatsappNum}?text=${whatsappAdminMsg}`}
              target="_blank" rel="noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#25D366", color: "#fff", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontWeight: 800, textDecoration: "none", marginBottom: 10, boxShadow: "0 3px 10px rgba(37,211,102,0.3)" }}>
              💬 Notify Admin on WhatsApp
              <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.9 }}>— speeds up approval</span>
            </a>
          )}

          <button onClick={onClose} style={primaryBtnStyle}>Close</button>
        </div>
      </div>
    );
  }

  if (step === "submit") {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1a3a6b" }}>📝 Submit Payment Details</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>×</button>
          </div>
          <div style={{ background: "#eef1f7", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#1a3a6b", fontWeight: 600, marginBottom: 14 }}>
            ₹{getAmount()} {getUses() ? `→ ${getUses()} uses` : "(custom)"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            <Field label="Your Name *" value={name} onChange={setName} placeholder="As per UPI account" />
            <Field label="Mobile Number *" value={mobile} onChange={v => setMobile(v.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile" inputMode="numeric" hint="Used to retrieve uses later" />
            <Field label="UTR / Transaction Reference *" value={utr} onChange={setUtr} placeholder="From UPI payment history" hint="UPI app → History → Copy UTR number" />
          </div>
          {error && <ErrorBox msg={error} />}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setStep("pay"); setError(""); }} style={{ flex: 1, padding: "11px", borderRadius: 9, border: "1.5px solid #dde", background: "#fff", fontWeight: 700, cursor: "pointer" }}>← Back</button>
            <button onClick={handleSubmit} disabled={loading} style={{ ...primaryBtnStyle, flex: 2, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "⏳ Submitting..." : "✅ Submit"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "pay") {
    const amount = getAmount();
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=UTI%20PAN%20Toolkit&am=${amount}&cu=INR`;
    const qrValue = upiLink;
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1a3a6b" }}>📱 Pay ₹{amount} via UPI</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>×</button>
          </div>
          <div style={{ background: "#f8f9ff", border: "2px dashed #c0c8e0", borderRadius: 10, padding: "14px 12px", textAlign: "center", marginBottom: 12 }}>
            {/* QR Code */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              <div style={{ background: "#fff", padding: 10, borderRadius: 12, border: "2px solid #dde", display: "inline-block" }}>
                <QRCodeSVG value={qrValue} size={150} bgColor="#ffffff" fgColor="#1a3a6b" level="M" />
              </div>
            </div>
            <p style={{ fontSize: 11, color: "#888", margin: "0 0 8px" }}>📷 Scan with any UPI app</p>
            <p style={{ fontSize: 11, color: "#555", margin: "0 0 8px" }}>— or pay to UPI ID —</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#fff", border: "2px solid #1a3a6b", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
              <span style={{ fontWeight: 900, fontSize: 13, color: "#1a3a6b", flex: 1 }}>{UPI_ID}</span>
              <CopyButton text={UPI_ID} />
            </div>
            <p style={{ fontSize: 11, color: "#888", margin: "0 0 10px" }}>Pay exactly <b style={{ color: "#1a3a6b" }}>₹{amount}</b></p>
            <a href={upiLink} style={{ display: "block", background: "linear-gradient(135deg,#00b386,#00854f)", color: "#fff", borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
              🚀 Open UPI App — Pay ₹{amount}
            </a>
          </div>
          <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#7a5a00", marginBottom: 12 }}>
            After paying, note your UTR number then click below.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setStep("select"); setError(""); }} style={{ flex: 1, padding: "11px", borderRadius: 9, border: "1.5px solid #dde", background: "#fff", fontWeight: 700, cursor: "pointer" }}>← Back</button>
            <button onClick={() => setStep("submit")} style={{ ...primaryBtnStyle, flex: 2 }}>✅ I've Paid →</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1a3a6b" }}>💳 Buy Coupon Pack</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {PACK_OPTIONS.map((opt, i) => (
            <button key={i} onClick={() => { setSelected(i); setUseCustom(false); }}
              style={{
                padding: "11px 14px", borderRadius: 9,
                border: (!useCustom && selected === i) ? "2px solid #1a3a6b" : "2px solid #dde",
                background: (!useCustom && selected === i) ? "#1a3a6b" : "#fff",
                color: (!useCustom && selected === i) ? "#fff" : "#333",
                fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
              <span>{opt.label}</span>
              <span style={{ fontSize: 12, opacity: 0.85 }}>{opt.description}</span>
            </button>
          ))}
          <div onClick={() => setUseCustom(true)}
            style={{ padding: "10px 14px", borderRadius: 9, border: useCustom ? "2px solid #1a3a6b" : "2px solid #dde", background: useCustom ? "#eef1f7" : "#fff", cursor: "pointer" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1a3a6b", marginBottom: useCustom ? 8 : 0 }}>🎯 Custom Amount</div>
            {useCustom && (
              <input autoFocus value={customAmount} onChange={e => setCustomAmount(e.target.value.replace(/\D/g, ""))}
                placeholder="₹ amount (min ₹10)" inputMode="numeric"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1.5px solid #dde", fontSize: 14, boxSizing: "border-box", outline: "none" }}
                onClick={e => e.stopPropagation()} />
            )}
          </div>
        </div>

        <div style={{ background: "#eef1f7", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#555", marginBottom: 12 }}>
          📌 Pay UPI → Submit UTR → Admin verifies → Uses credited (within 2 hrs)
        </div>

        {error && <ErrorBox msg={error} />}

        <button onClick={() => {
          if (useCustom && (!customAmount || parseInt(customAmount) < 10)) { setError("Enter a valid amount (min ₹10)"); return; }
          setError(""); setStep("pay");
        }} style={primaryBtnStyle}>Continue →</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, hint, inputMode }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; hint?: string; inputMode?: any }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#555", display: "block", marginBottom: 3 }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode}
        style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1.5px solid #dde", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
      {hint && <p style={{ fontSize: 10, color: "#aaa", margin: "3px 0 0" }}>{hint}</p>}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return <div style={{ background: "#fee", border: "1px solid #fcc", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#c00", marginBottom: 10 }}>⚠️ {msg}</div>;
}

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999,
  display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
};
const modalStyle: React.CSSProperties = {
  background: "#fff", borderRadius: 14, padding: 20, width: "100%", maxWidth: 380,
  maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
};
const primaryBtnStyle: React.CSSProperties = {
  width: "100%", padding: "13px", borderRadius: 10, border: "none",
  background: "linear-gradient(135deg, #1a3a6b, #2557a7)", color: "#fff",
  fontWeight: 800, fontSize: 15, cursor: "pointer",
};
