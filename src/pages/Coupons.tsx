import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

const PACK_OPTIONS = [
  { label: "Starter", amount: 100, uses: 12, tag: "Most Popular", color: "#2557a7" },
  { label: "Standard", amount: 200, uses: 25, tag: "Best Value", color: "#1a7a3a" },
  { label: "Pro", amount: 500, uses: 70, tag: "Power User", color: "#7c3aed" },
];

const UPI_ID = "9014860890@kotakbank";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ background: copied ? "#1a7a3a" : "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

export default function CouponsPage() {
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
  const [deviceId, setDeviceId] = useState("");
  const [whatsappNum, setWhatsappNum] = useState("");

  useEffect(() => {
    let id = localStorage.getItem("uti_device_id");
    if (!id) {
      id = "dev_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("uti_device_id", id);
    }
    setDeviceId(id);
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
        body: JSON.stringify({ deviceId, serviceType: "new_pan", amount, name: name.trim(), mobile: mobile.trim(), utr: utr.trim() }),
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
    ? encodeURIComponent(`Hi, I paid ₹${getAmount()} for UTI PAN Toolkit coupons.\nName: ${name}\nMobile: ${mobile}\nUTR: ${utr}\nUnique Code: ${result.uniqueCode}\nPlease verify and approve.`)
    : "";

  if (step === "done" && result) {
    return (
      <PageWrapper whatsappNum={whatsappNum}>
        <div style={{ textAlign: "center", padding: "20px 0 12px" }}>
          <div style={{ fontSize: 52 }}>⏳</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a3a6b", margin: "10px 0 4px" }}>Payment Submitted!</h2>
          <p style={{ color: "#666", fontSize: 13 }}>Admin will verify and credit your uses shortly (usually within 2 hours).</p>
        </div>

        <div style={{ background: "#f0f7f0", border: "2px solid #a5d6a7", borderRadius: 12, padding: "14px 18px", marginBottom: 14 }}>
          <p style={{ fontSize: 12, color: "#555", margin: "0 0 6px" }}>Your Unique Code — <b>save this!</b></p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: "#1a3a6b", letterSpacing: 3, flex: 1 }}>{result.uniqueCode}</span>
            <CopyButton text={result.uniqueCode} />
          </div>
        </div>

        <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#7a5a00", marginBottom: 16 }}>
          <b>⚠️ After approval:</b> You can access your uses by entering your <b>mobile number or UTR</b> on the My Coupons page — no need to remember the code.
        </div>

        {/* WhatsApp notification to admin — primary CTA */}
        {whatsappNum && (
          <a href={`https://wa.me/${whatsappNum}?text=${whatsappAdminMsg}`}
            target="_blank" rel="noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#25D366", color: "#fff", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 800, textDecoration: "none", marginBottom: 12, boxShadow: "0 4px 14px rgba(37,211,102,0.35)" }}>
            <span style={{ fontSize: 22 }}>💬</span>
            <span>Notify Admin on WhatsApp<br /><span style={{ fontSize: 11, fontWeight: 400, opacity: 0.9 }}>Tap to send payment proof — speeds up approval</span></span>
          </a>
        )}

        <a href="/my-coupons" style={btnStyle}>🎟️ Check My Coupon Balance →</a>
        <a href="/" style={{ ...btnStyle, background: "none", color: "#1a3a6b", border: "2px solid #1a3a6b", marginTop: 10, boxSizing: "border-box" }}>← Back to Toolkit</a>
      </PageWrapper>
    );
  }

  if (step === "submit") {
    return (
      <PageWrapper whatsappNum={whatsappNum}>
        <button onClick={() => setStep("pay")} style={backBtnStyle}>← Back</button>
        <h2 style={sectionTitle}>📝 Submit Payment Details</h2>
        <div style={{ background: "#eef1f7", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#1a3a6b", fontWeight: 600, marginBottom: 16 }}>
          ₹{getAmount()} {getUses() ? `→ ${getUses()} uses` : "(custom — admin sets uses)"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <Field label="Your Full Name *" value={name} onChange={setName} placeholder="As shown in UPI app" />
          <Field label="Mobile Number *" value={mobile} onChange={v => setMobile(v.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile number" inputMode="numeric" hint="This is how you'll find your uses later" />
          <Field label="UTR / Transaction Reference Number *" value={utr} onChange={setUtr} placeholder="12-digit UTR from UPI payment history" hint="Open UPI app → Payment history → Copy UTR number" />
        </div>
        {error && <ErrorBox msg={error} />}
        <button onClick={handleSubmit} disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "⏳ Submitting..." : "✅ Submit for Verification"}
        </button>
      </PageWrapper>
    );
  }

  if (step === "pay") {
    const amount = getAmount();
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=UTI%20PAN%20Toolkit&am=${amount}&cu=INR`;
    return (
      <PageWrapper whatsappNum={whatsappNum}>
        <button onClick={() => setStep("select")} style={backBtnStyle}>← Back</button>
        <h2 style={sectionTitle}>📱 Pay ₹{amount} via UPI</h2>

        <div style={{ background: "#f8f9ff", border: "2px dashed #c0c8e0", borderRadius: 12, padding: "20px 16px", textAlign: "center", marginBottom: 14 }}>
          {/* QR Code */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
            <div style={{ background: "#fff", padding: 12, borderRadius: 14, border: "2px solid #dde", display: "inline-block" }}>
              <QRCodeSVG value={upiLink} size={170} bgColor="#ffffff" fgColor="#1a3a6b" level="M" />
            </div>
          </div>
          <p style={{ fontSize: 12, color: "#888", margin: "0 0 4px", fontWeight: 600 }}>📷 Scan QR with any UPI app</p>
          <p style={{ fontSize: 11, color: "#aaa", margin: "0 0 14px" }}>GPay • PhonePe • Paytm • BHIM</p>

          <p style={{ fontSize: 12, color: "#555", margin: "0 0 8px" }}>— or enter UPI ID manually —</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#fff", border: "2px solid #1a3a6b", borderRadius: 10, padding: "12px 16px", marginBottom: 12 }}>
            <span style={{ fontWeight: 900, fontSize: 15, color: "#1a3a6b", flex: 1, textAlign: "center" }}>{UPI_ID}</span>
            <CopyButton text={UPI_ID} />
          </div>
          <p style={{ fontSize: 12, color: "#888", margin: "0 0 14px" }}>Pay <b style={{ color: "#1a3a6b" }}>exactly ₹{amount}</b></p>
          <a href={upiLink} style={{ display: "block", background: "linear-gradient(135deg,#00b386,#00854f)", color: "#fff", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 800, textDecoration: "none" }}>
            🚀 Open UPI App to Pay ₹{amount}
          </a>
        </div>

        <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#7a5a00", marginBottom: 16 }}>
          📌 After paying, note your UTR number from the UPI app, then click below.
        </div>

        <button onClick={() => setStep("submit")} style={btnStyle}>✅ I've Paid — Enter Details →</button>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper whatsappNum={whatsappNum}>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#1a3a6b", margin: "0 0 6px" }}>🎟️ Buy Coupon Pack</h1>
        <p style={{ fontSize: 13, color: "#666", margin: 0 }}>Pay via UPI → Submit UTR → Uses credited within 2 hrs</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        {PACK_OPTIONS.map((opt, i) => (
          <button key={i} onClick={() => { setSelected(i); setUseCustom(false); }}
            style={{
              padding: "16px 18px", borderRadius: 12,
              border: (!useCustom && selected === i) ? `3px solid ${opt.color}` : "2px solid #dde",
              background: (!useCustom && selected === i) ? opt.color : "#fff",
              color: (!useCustom && selected === i) ? "#fff" : "#333",
              fontWeight: 700, fontSize: 15, cursor: "pointer", textAlign: "left",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              boxShadow: (!useCustom && selected === i) ? `0 4px 14px ${opt.color}40` : "0 1px 4px rgba(0,0,0,0.07)",
            }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>₹{opt.amount}</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{opt.uses} uses</div>
            </div>
            <span style={{ fontSize: 11, background: "rgba(255,255,255,0.25)", padding: "3px 10px", borderRadius: 20, fontWeight: 700, flexShrink: 0 }}>{opt.tag}</span>
          </button>
        ))}

        <div onClick={() => setUseCustom(true)}
          style={{ padding: "14px 18px", borderRadius: 12, border: useCustom ? "3px solid #888" : "2px solid #dde", background: useCustom ? "#f8f8f8" : "#fff", cursor: "pointer" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#555", marginBottom: useCustom ? 8 : 0 }}>🎯 Custom Amount</div>
          {useCustom && (
            <input autoFocus value={customAmount} onChange={e => setCustomAmount(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter amount in ₹ (min ₹10)" inputMode="numeric"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #dde", fontSize: 15, boxSizing: "border-box", outline: "none" }}
              onClick={e => e.stopPropagation()} />
          )}
        </div>
      </div>

      {error && <ErrorBox msg={error} />}

      <button onClick={() => {
        if (useCustom && (!customAmount || parseInt(customAmount) < 10)) { setError("Enter a valid amount (min ₹10)"); return; }
        setError(""); setStep("pay");
      }} style={btnStyle}>Continue →</button>

      <div style={{ marginTop: 18, borderTop: "1px solid #eee", paddingTop: 14, textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#888" }}>
          Already paid?{" "}
          <a href="/my-coupons" style={{ color: "#1a3a6b", fontWeight: 700 }}>Find your uses by UTR or mobile →</a>
        </p>
      </div>
    </PageWrapper>
  );
}

function PageWrapper({ children, whatsappNum }: { children: React.ReactNode; whatsappNum: string }) {
  return (
    <div style={{ minHeight: "100vh", background: "#eef1f7", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #1a3a6b, #2557a7)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 800, fontSize: 16 }}>UTI PAN Toolkit</a>
        <a href="/my-coupons" style={{ color: "rgba(255,255,255,0.85)", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>🎟️ My Coupons</a>
      </div>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px" }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, hint, inputMode }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; hint?: string; inputMode?: any }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode}
        style={{ width: "100%", padding: "11px 12px", borderRadius: 8, border: "1.5px solid #dde", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
      {hint && <p style={{ fontSize: 10, color: "#aaa", margin: "4px 0 0" }}>{hint}</p>}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return <div style={{ background: "#fee", border: "1px solid #fcc", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#c00", marginBottom: 12 }}>⚠️ {msg}</div>;
}

const sectionTitle: React.CSSProperties = { fontSize: 18, fontWeight: 800, color: "#1a3a6b", marginBottom: 16 };
const backBtnStyle: React.CSSProperties = { background: "none", border: "none", color: "#555", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: "4px 0", marginBottom: 12, display: "block" };
const btnStyle: React.CSSProperties = { display: "block", width: "100%", padding: "14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #1a3a6b, #2557a7)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", textDecoration: "none", textAlign: "center" };
