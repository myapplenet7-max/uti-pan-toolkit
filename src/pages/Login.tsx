import { useState, useEffect } from "react";

interface CouponRecord {
  uniqueCode: string;
  serviceType: string;
  usesRemaining: number;
}

interface UserData {
  mobile: string;
  name: string;
  totalPurchased: number;
  totalUsed: number;
  totalRemaining: number;
  lastRechargeDate: string;
  records: CouponRecord[];
}

function storeSession(mobile: string, token: string) {
  localStorage.setItem("uti_auth_mobile", mobile);
  localStorage.setItem("uti_auth_token", token);
}

function clearSession() {
  localStorage.removeItem("uti_auth_mobile");
  localStorage.removeItem("uti_auth_token");
}

function getSession() {
  return {
    mobile: localStorage.getItem("uti_auth_mobile") || "",
    token: localStorage.getItem("uti_auth_token") || "",
  };
}

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "register" | "forgot">("login");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [whatsappNum, setWhatsappNum] = useState("");

  // Forgot password state
  const [forgotMobile, setForgotMobile] = useState("");
  const [forgotVerifier, setForgotVerifier] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotShowPass, setForgotShowPass] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  useEffect(() => {
    const { mobile: m, token: t } = getSession();
    if (m && t) tryAutoLogin(m, t);
    fetch("/api/config").then(r => r.json()).then(d => setWhatsappNum((d.whatsappNumber || "").replace(/\D/g, ""))).catch(() => {});
  }, []);

  const tryAutoLogin = async (mobile: string, token: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { "x-auth-token": token, "x-auth-mobile": mobile },
      });
      if (res.ok) setUserData(await res.json());
      else clearSession();
    } catch { clearSession(); }
  };

  const handleLogin = async () => {
    setError("");
    if (!/^\d{10}$/.test(mobile)) { setError("Enter a valid 10-digit mobile number."); return; }
    if (password.length < 4) { setError("Password must be at least 4 characters."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      storeSession(mobile, data.token);
      setUserData(data.user);
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    setError("");
    if (!name.trim()) { setError("Enter your name."); return; }
    if (!/^\d{10}$/.test(mobile)) { setError("Enter a valid 10-digit mobile number."); return; }
    if (password.length < 4) { setError("Password must be at least 4 characters."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      storeSession(mobile, data.token);
      setUserData(data.user);
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    setForgotError("");
    setForgotSuccess("");
    if (!/^\d{10}$/.test(forgotMobile)) { setForgotError("Enter a valid 10-digit mobile number."); return; }
    if (forgotVerifier.trim().length < 6) { setForgotError("Enter your UTR number or unique code (min 6 characters)."); return; }
    if (forgotNewPass.length < 4) { setForgotError("New password must be at least 4 characters."); return; }
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: forgotMobile, verifier: forgotVerifier, newPassword: forgotNewPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setForgotSuccess("Password reset! You can now sign in.");
      setTimeout(() => { setTab("login"); setMobile(forgotMobile); setForgotMobile(""); setForgotVerifier(""); setForgotNewPass(""); setForgotSuccess(""); }, 2200);
    } catch (e: any) {
      setForgotError(e.message);
    } finally { setForgotLoading(false); }
  };

  const handleLogout = () => { clearSession(); setUserData(null); setMobile(""); setPassword(""); setName(""); };

  if (userData) {
    return (
      <div style={{ minHeight: "100vh", background: "#eef1f7", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ background: "linear-gradient(135deg,#15233D,#3D5A73)", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ color: "#fff", fontSize: 17, fontWeight: 800, margin: 0 }}>👤 My Account</h1>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, margin: "2px 0 0", letterSpacing: 1 }}>COUPON WALLET</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href="/" style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 700, textDecoration: "none", background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "7px 12px" }}>← Toolkit</a>
            <button onClick={handleLogout} style={{ color: "#fff", fontSize: 12, fontWeight: 700, background: "rgba(255,0,0,0.25)", border: "none", borderRadius: 8, padding: "7px 12px", cursor: "pointer" }}>Logout</button>
          </div>
        </div>

        <div style={{ maxWidth: 520, margin: "0 auto", padding: "16px 12px" }}>
          <div style={{ background: "linear-gradient(135deg,#15233D,#3D5A73)", borderRadius: 16, padding: "20px 22px", marginBottom: 14, color: "#fff" }}>
            <div style={{ fontSize: 32, marginBottom: 4 }}>👤</div>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 2 }}>{userData.name || "Customer"}</div>
            <div style={{ fontSize: 13, opacity: 0.75 }}>📱 +91 {userData.mobile}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[
              { label: "Purchased", value: userData.totalPurchased, color: "#15233D" },
              { label: "Used", value: userData.totalUsed, color: "#d97706" },
              { label: "Remaining", value: userData.totalRemaining, color: userData.totalRemaining > 0 ? "#1E7145" : "#c00" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "#fff", borderRadius: 12, padding: "14px 10px", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
                <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          {userData.totalRemaining > 0 && (
            <a href="/" style={{ display: "block", padding: "14px", borderRadius: 12, background: "linear-gradient(135deg,#1E7145,#2e9e55)", color: "#fff", fontWeight: 800, fontSize: 15, textAlign: "center", textDecoration: "none", marginBottom: 14 }}>
              ⚡ Use Toolkit Now
            </a>
          )}

          {userData.records && userData.records.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 14 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: "#15233D", margin: "0 0 12px" }}>ACTIVE COUPON CODES</h3>
              {userData.records.map(r => (
                <div key={r.uniqueCode} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f8f9ff", borderRadius: 9, marginBottom: 8, border: "1.5px solid #eef" }}>
                  <div>
                    <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 15, letterSpacing: 1 }}>{r.uniqueCode}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>{r.serviceType}</div>
                  </div>
                  <div style={{ background: "#e8f5e9", color: "#1E7145", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 800 }}>
                    {r.usesRemaining} uses
                  </div>
                </div>
              ))}
            </div>
          )}

          <a href="/coupons" style={{ display: "block", padding: "13px", borderRadius: 10, background: "linear-gradient(135deg,#d97706,#f59e0b)", color: "#fff", fontWeight: 800, fontSize: 14, textAlign: "center", textDecoration: "none" }}>
            🎟️ Buy More Coupons
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#eef1f7", fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(135deg,#15233D,#3D5A73)", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: 17, fontWeight: 800, margin: 0 }}>🔐 Account Login</h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, margin: "2px 0 0", letterSpacing: 1 }}>UTI PAN TOOLKIT</p>
        </div>
        <a href="/" style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 700, textDecoration: "none", background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "7px 14px" }}>← Toolkit</a>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ background: "#fff", borderRadius: 18, padding: "28px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.10)" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🪪</div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#15233D", margin: 0 }}>UTI PAN Toolkit</h2>
              <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0" }}>
                {tab === "forgot" ? "Reset your password" : "Sign in to view your coupon wallet"}
              </p>
            </div>

            {tab !== "forgot" && (
              <div style={{ display: "flex", background: "#eef1f7", borderRadius: 10, padding: 4, marginBottom: 20 }}>
                {(["login", "register"] as const).map(t => (
                  <button key={t} onClick={() => { setTab(t); setError(""); }}
                    style={{ flex: 1, padding: "8px", border: "none", borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: "pointer", background: tab === t ? "#fff" : "transparent", color: tab === t ? "#15233D" : "#888", boxShadow: tab === t ? "0 1px 6px rgba(0,0,0,0.10)" : "none", transition: "all 0.2s" }}>
                    {t === "login" ? "Sign In" : "Register"}
                  </button>
                ))}
              </div>
            )}

            {tab === "forgot" ? (
              <>
                {forgotSuccess ? (
                  <div style={{ background: "#e8f5e9", border: "1.5px solid #a5d6a7", borderRadius: 10, padding: "16px", textAlign: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 32, marginBottom: 6 }}>✅</div>
                    <p style={{ fontWeight: 800, color: "#1E7145", margin: 0, fontSize: 14 }}>{forgotSuccess}</p>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 5 }}>Mobile Number</label>
                      <input value={forgotMobile} onChange={e => setForgotMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="10-digit mobile number" inputMode="numeric" maxLength={10}
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid #dde", fontSize: 16, fontWeight: 700, outline: "none", boxSizing: "border-box", letterSpacing: 1 }} />
                    </div>

                    <div style={{ marginBottom: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 5 }}>UTR Number or Unique Code</label>
                      <input value={forgotVerifier} onChange={e => setForgotVerifier(e.target.value)}
                        placeholder="Enter your UTR or coupon code"
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid #dde", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                      <p style={{ fontSize: 10, color: "#aaa", margin: "4px 0 10px" }}>
                        UTR = 12-digit UPI transaction reference · OR enter any 8-char unique code from your coupon
                      </p>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 5 }}>New Password</label>
                      <div style={{ position: "relative" }}>
                        <input value={forgotNewPass} onChange={e => setForgotNewPass(e.target.value)}
                          type={forgotShowPass ? "text" : "password"} placeholder="Min. 4 characters"
                          style={{ width: "100%", padding: "12px 44px 12px 14px", borderRadius: 10, border: "2px solid #dde", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                        <button onClick={() => setForgotShowPass(p => !p)}
                          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#888" }}>
                          {forgotShowPass ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </div>

                    {forgotError && (
                      <div style={{ background: "#fff0f0", border: "1px solid #fcc", borderRadius: 9, padding: "10px 14px", fontSize: 13, color: "#c00", fontWeight: 600, marginBottom: 14 }}>
                        ⚠️ {forgotError}
                      </div>
                    )}

                    <button onClick={handleForgotPassword} disabled={forgotLoading}
                      style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#15233D,#3D5A73)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: forgotLoading ? 0.7 : 1, marginBottom: 12 }}>
                      {forgotLoading ? "⏳ Verifying..." : "🔑 Reset Password"}
                    </button>
                  </>
                )}

                <button onClick={() => { setTab("login"); setForgotError(""); setForgotSuccess(""); }}
                  style={{ width: "100%", padding: "11px", borderRadius: 10, border: "2px solid #dde", background: "#fff", color: "#555", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  ← Back to Sign In
                </button>
              </>
            ) : (
              <>
                {tab === "register" && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 5 }}>Your Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid #dde", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 5 }}>Mobile Number</label>
                  <input value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit mobile number" inputMode="numeric" maxLength={10}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid #dde", fontSize: 16, fontWeight: 700, outline: "none", boxSizing: "border-box", letterSpacing: 1 }} />
                </div>

                <div style={{ marginBottom: tab === "login" ? 6 : 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 5 }}>Password</label>
                  <div style={{ position: "relative" }}>
                    <input value={password} onChange={e => setPassword(e.target.value)}
                      type={showPass ? "text" : "password"} placeholder="Min. 4 characters"
                      onKeyDown={e => e.key === "Enter" && (tab === "login" ? handleLogin() : handleRegister())}
                      style={{ width: "100%", padding: "12px 44px 12px 14px", borderRadius: 10, border: "2px solid #dde", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                    <button onClick={() => setShowPass(p => !p)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#888" }}>
                      {showPass ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {tab === "login" && (
                  <div style={{ textAlign: "right", marginBottom: 16 }}>
                    <button onClick={() => { setTab("forgot"); setError(""); setForgotMobile(mobile); }}
                      style={{ background: "none", border: "none", color: "#3D5A73", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}>
                      Forgot Password?
                    </button>
                  </div>
                )}

                {error && (
                  <div style={{ background: "#fff0f0", border: "1px solid #fcc", borderRadius: 9, padding: "10px 14px", fontSize: 13, color: "#c00", fontWeight: 600, marginBottom: 14 }}>
                    ⚠️ {error}
                  </div>
                )}

                <button onClick={tab === "login" ? handleLogin : handleRegister} disabled={loading}
                  style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#15233D,#3D5A73)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "⏳ Please wait..." : tab === "login" ? "🔐 Sign In" : "✅ Create Account"}
                </button>
              </>
            )}
          </div>

          {whatsappNum && (
            <a
              href={`https://wa.me/${whatsappNum}?text=${encodeURIComponent(
                tab === "forgot"
                  ? "Hi, I need help resetting my UTI PAN Toolkit password."
                  : tab === "register"
                  ? "Hi, I need help creating my UTI PAN Toolkit account."
                  : "Hi, I'm having trouble signing in to UTI PAN Toolkit."
              )}`}
              target="_blank" rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                marginTop: 14, width: "100%", padding: "12px", borderRadius: 12,
                border: "1.5px solid #25D366", background: "#fff", color: "#1E7145",
                fontWeight: 700, fontSize: 13, textDecoration: "none", boxSizing: "border-box",
              }}>
              💬 Need help? Chat with us on WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
