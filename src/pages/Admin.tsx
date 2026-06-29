import { useState, useEffect, useCallback } from "react";

interface PaymentRecord {
  id: number;
  uniqueCode: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  deviceId: string;
  serviceType: string;
  amount: number;
  usesTotal: number;
  usesRemaining: number;
  paymentMethod: string;
  upiName: string | null;
  upiMobile: string | null;
  upiUtr: string | null;
  upiStatus: string;
  createdAt: string;
}

interface Stats {
  totalPayments: number;
  totalRevenue: number;
  totalUses: number;
  usedUses: number;
  activeDevices: number;
  pendingApprovals: number;
}

export default function AdminPage() {
  const [secret, setSecret] = useState(() => sessionStorage.getItem("admin_secret") || "");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [addUsesModal, setAddUsesModal] = useState<PaymentRecord | null>(null);
  const [addUsesCount, setAddUsesCount] = useState(1);
  const [addUsesLoading, setAddUsesLoading] = useState(false);
  const [approveModal, setApproveModal] = useState<PaymentRecord | null>(null);
  const [approveUses, setApproveUses] = useState(12);
  const [approveLoading, setApproveLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [showGrantFree, setShowGrantFree] = useState(false);
  const [grantMobile, setGrantMobile] = useState("");
  const [grantName, setGrantName] = useState("");
  const [grantUses, setGrantUses] = useState(5);
  const [grantNote, setGrantNote] = useState("");
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantResult, setGrantResult] = useState<{ uniqueCode: string; utr: string; usesGranted: number; mobile: string } | null>(null);

  const LIMIT = 20;

  const fetchData = useCallback(async (pg = 1, statusFilter?: string) => {
    setLoading(true);
    try {
      const statusParam = statusFilter ? `&status=${statusFilter}` : "";
      const [recRes, statsRes] = await Promise.all([
        fetch(`/api/admin/payments?page=${pg}&limit=${LIMIT}${statusParam}`, { headers: { "x-admin-secret": secret } }),
        fetch("/api/admin/stats", { headers: { "x-admin-secret": secret } }),
      ]);
      if (!recRes.ok) { setAuthError("Unauthorized — check your admin password"); setAuthed(false); return; }
      const recData = await recRes.json();
      const statsData = await statsRes.json();
      setRecords(recData.records);
      setTotal(recData.total);
      setStats(statsData);
      setAuthed(true);
      setAuthError("");
    } catch {
      setAuthError("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  }, [secret]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem("admin_secret", secret);
    await fetchData(1, "pending");
  };

  const handleApprove = async () => {
    if (!approveModal) return;
    setApproveLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/${approveModal.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify({ uses: approveUses }),
      });
      if (!res.ok) throw new Error("Failed");
      setApproveModal(null);
      setActionMsg(`✅ Approved! ${approveUses} uses credited to ${approveModal.upiName}.`);
      setTimeout(() => setActionMsg(""), 4000);
      await fetchData(page, tab === "pending" ? "pending" : undefined);
    } catch {
      alert("Failed to approve");
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async (record: PaymentRecord) => {
    if (!confirm(`Reject payment from ${record.upiName} (UTR: ${record.upiUtr})?`)) return;
    const res = await fetch(`/api/admin/payments/${record.id}/reject`, {
      method: "POST",
      headers: { "x-admin-secret": secret },
    });
    if (res.ok) {
      setActionMsg(`❌ Rejected payment from ${record.upiName}.`);
      setTimeout(() => setActionMsg(""), 4000);
      await fetchData(page, tab === "pending" ? "pending" : undefined);
    }
  };

  const handleAddUses = async () => {
    if (!addUsesModal) return;
    setAddUsesLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/${addUsesModal.uniqueCode}/add-uses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify({ count: addUsesCount }),
      });
      if (!res.ok) throw new Error("Failed");
      setAddUsesModal(null);
      await fetchData(page, tab === "pending" ? "pending" : undefined);
    } catch {
      alert("Failed to add uses");
    } finally {
      setAddUsesLoading(false);
    }
  };

  const handleGrantFree = async () => {
    if (!/^\d{10}$/.test(grantMobile.trim())) { alert("Enter a valid 10-digit mobile number"); return; }
    if (!grantName.trim()) { alert("Enter recipient name"); return; }
    setGrantLoading(true);
    try {
      const res = await fetch("/api/admin/grant-free", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify({ mobile: grantMobile.trim(), name: grantName.trim(), uses: grantUses, note: grantNote.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setGrantResult({ uniqueCode: data.uniqueCode, utr: data.utr, usesGranted: data.usesGranted, mobile: data.mobile });
      setActionMsg(`🎁 ${grantUses} free uses granted to ${grantName} (${grantMobile}).`);
      setTimeout(() => setActionMsg(""), 5000);
      await fetchData(page, tab === "pending" ? "pending" : undefined);
    } catch (err: any) {
      alert("Failed: " + (err.message || "Unknown error"));
    } finally {
      setGrantLoading(false);
    }
  };

  const handleTabChange = (newTab: "pending" | "all") => {
    setTab(newTab);
    setPage(1);
    fetchData(1, newTab === "pending" ? "pending" : undefined);
  };

  const filteredRecords = search
    ? records.filter(r =>
        (r.uniqueCode || "").includes(search.toUpperCase()) ||
        (r.upiUtr || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.upiName || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.upiMobile || "").includes(search) ||
        (r.deviceId || "").includes(search)
      )
    : records;

  const getUsesDefault = (amount: number) => {
    if (amount >= 500) return 70;
    if (amount >= 200) return 25;
    if (amount >= 100) return 12;
    return Math.max(1, Math.floor(amount / 8));
  };

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#eef1f7", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: 32, width: "100%", maxWidth: 360, boxShadow: "0 2px 16px rgba(0,0,0,0.10)" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 40 }}>🔐</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1a3a6b", margin: "8px 0 4px" }}>Admin Panel</h1>
            <p style={{ fontSize: 12, color: "#888" }}>UTI PAN Toolkit — Payment Management</p>
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="Enter admin password"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 9, border: "2px solid #dde", fontSize: 15, marginBottom: 12, boxSizing: "border-box", outline: "none" }}
              autoFocus
            />
            {authError && (
              <div style={{ background: "#fee", border: "1px solid #fcc", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#c00", marginBottom: 12 }}>
                ⚠️ {authError}
              </div>
            )}
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #1a3a6b, #2557a7)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
              {loading ? "⏳ Signing in..." : "🔐 Sign In"}
            </button>
          </form>
          <p style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "#aaa" }}>
            <a href="/" style={{ color: "#1a3a6b" }}>← Back to Toolkit</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#eef1f7", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a3a6b, #2557a7)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: 0 }}>🔐 Admin Panel</h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: 1.5 }}>UTI PAN Toolkit — UPI Payments</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button onClick={() => { setShowGrantFree(true); setGrantResult(null); }} style={{ background: "#f59e0b", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            🎁 Grant Free
          </button>
          <button onClick={() => fetchData(page, tab === "pending" ? "pending" : undefined)} style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            🔄 Refresh
          </button>
          <a href="/" style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "none" }}>
            ← Toolkit
          </a>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "16px 12px" }}>
        {/* Action message */}
        {actionMsg && (
          <div style={{ background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 8, padding: "12px 16px", marginBottom: 12, fontSize: 13, fontWeight: 600, color: "#1a7a3a" }}>
            {actionMsg}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Pending Approvals", value: stats.pendingApprovals, icon: "⏳", highlight: stats.pendingApprovals > 0 },
              { label: "Total Approved", value: stats.totalPayments, icon: "✅", highlight: false },
              { label: "Revenue Collected", value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`, icon: "💰", highlight: false },
              { label: "Uses Sold", value: stats.totalUses, icon: "📋", highlight: false },
              { label: "Uses Consumed", value: stats.usedUses, icon: "🔥", highlight: false },
              { label: "Active Devices", value: stats.activeDevices, icon: "📱", highlight: false },
            ].map(s => (
              <div key={s.label} style={{ background: s.highlight ? "#fffbe6" : "#fff", border: s.highlight ? "1.5px solid #ffe58f" : "none", borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <div style={{ fontSize: 20 }}>{s.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.highlight ? "#d97706" : "#1a3a6b", margin: "4px 0 2px" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#888" }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {(["pending", "all"] as const).map(t => (
            <button key={t} onClick={() => handleTabChange(t)} style={{
              padding: "8px 18px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer",
              background: tab === t ? "#1a3a6b" : "#fff",
              color: tab === t ? "#fff" : "#555",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}>
              {t === "pending" ? `⏳ Pending${stats?.pendingApprovals ? ` (${stats.pendingApprovals})` : ""}` : "📋 All Payments"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ background: "#fff", borderRadius: 10, padding: "12px 16px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search by name, mobile, UTR, code or device..."
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #dde", fontSize: 13, boxSizing: "border-box", outline: "none" }}
          />
        </div>

        {/* Table */}
        <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#1a3a6b", color: "#fff" }}>
                  {["Code", "Name / Mobile", "UTR Number", "Amount", "Status", "Uses", "Date", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "#888" }}>⏳ Loading...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "#888" }}>
                    {tab === "pending" ? "✅ No pending approvals!" : "No records found"}
                  </td></tr>
                ) : filteredRecords.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8f9ff", borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 800, color: "#1a3a6b", whiteSpace: "nowrap" }}>
                      <code style={{ background: "#eef1f7", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{r.uniqueCode}</code>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 700, color: "#333" }}>{r.upiName || "—"}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>{r.upiMobile || "—"}</div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <code style={{ fontSize: 11, color: "#555", background: "#f0f0f0", padding: "2px 6px", borderRadius: 4 }}>{r.upiUtr || r.razorpayPaymentId || "—"}</code>
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, whiteSpace: "nowrap" }}>₹{r.amount.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        background: r.upiStatus === "approved" ? "#e8f5e9" : r.upiStatus === "pending" ? "#fffbe6" : "#fee",
                        color: r.upiStatus === "approved" ? "#1a7a3a" : r.upiStatus === "pending" ? "#d97706" : "#c00",
                        padding: "3px 10px", borderRadius: 12, fontWeight: 700, fontSize: 11, whiteSpace: "nowrap",
                      }}>
                        {r.upiStatus === "approved" ? "✅ Approved" : r.upiStatus === "pending" ? "⏳ Pending" : "❌ Rejected"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <span style={{ background: r.usesRemaining > 0 ? "#e8f5e9" : "#f0f0f0", color: r.usesRemaining > 0 ? "#1a7a3a" : "#888", padding: "2px 10px", borderRadius: 12, fontWeight: 800, fontSize: 11 }}>
                        {r.usesRemaining}/{r.usesTotal}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap", color: "#666", fontSize: 11 }}>
                      {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}<br />
                      {new Date(r.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {r.upiStatus === "pending" && (
                          <>
                            <button
                              onClick={() => { setApproveModal(r); setApproveUses(getUsesDefault(r.amount)); }}
                              style={{ background: "#1a7a3a", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                            >
                              ✅ Approve
                            </button>
                            <button
                              onClick={() => handleReject(r)}
                              style={{ background: "#c00", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                            >
                              ❌ Reject
                            </button>
                          </>
                        )}
                        {r.upiStatus === "approved" && (
                          <button
                            onClick={() => { setAddUsesModal(r); setAddUsesCount(1); }}
                            style={{ background: "#2557a7", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                          >
                            + Uses
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > LIMIT && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "12px 16px", borderTop: "1px solid #eee" }}>
              <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); fetchData(page - 1, tab === "pending" ? "pending" : undefined); }} style={{ padding: "6px 14px", borderRadius: 7, border: "1.5px solid #dde", background: "#fff", cursor: "pointer", fontWeight: 700, opacity: page <= 1 ? 0.4 : 1 }}>← Prev</button>
              <span style={{ fontSize: 12, color: "#666" }}>Page {page} of {Math.ceil(total / LIMIT)}</span>
              <button disabled={page >= Math.ceil(total / LIMIT)} onClick={() => { setPage(p => p + 1); fetchData(page + 1, tab === "pending" ? "pending" : undefined); }} style={{ padding: "6px 14px", borderRadius: 7, border: "1.5px solid #dde", background: "#fff", cursor: "pointer", fontWeight: 700, opacity: page >= Math.ceil(total / LIMIT) ? 0.4 : 1 }}>Next →</button>
            </div>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      {approveModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 24, maxWidth: 360, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1a7a3a", marginBottom: 12 }}>✅ Approve Payment</h3>
            <div style={{ background: "#f0f7f0", borderRadius: 8, padding: "10px 14px", fontSize: 12, marginBottom: 14 }}>
              <div><b>Name:</b> {approveModal.upiName}</div>
              <div><b>Mobile:</b> {approveModal.upiMobile}</div>
              <div><b>UTR:</b> {approveModal.upiUtr}</div>
              <div><b>Amount:</b> ₹{approveModal.amount.toLocaleString("en-IN")}</div>
            </div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>Uses to credit:</label>
            <input
              type="number"
              value={approveUses}
              onChange={e => setApproveUses(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "2px solid #dde", fontSize: 18, fontWeight: 800, textAlign: "center", marginBottom: 14, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setApproveModal(null)} style={{ flex: 1, padding: "11px", borderRadius: 9, border: "1.5px solid #dde", background: "#fff", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleApprove} disabled={approveLoading} style={{ flex: 2, padding: "11px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#1a7a3a,#2e9e55)", color: "#fff", fontWeight: 800, cursor: "pointer", opacity: approveLoading ? 0.7 : 1 }}>
                {approveLoading ? "⏳ Approving..." : `✅ Credit ${approveUses} Uses`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Uses Modal */}
      {addUsesModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 24, maxWidth: 340, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1a3a6b", marginBottom: 8 }}>+ Add Uses Manually</h3>
            <p style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
              Adding uses to <code style={{ background: "#eef1f7", padding: "2px 8px", borderRadius: 4, fontWeight: 800 }}>{addUsesModal.uniqueCode}</code>
              {addUsesModal.upiName && <> — {addUsesModal.upiName}</>}
            </p>
            <input
              type="number"
              value={addUsesCount}
              onChange={e => setAddUsesCount(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={200}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "2px solid #dde", fontSize: 18, fontWeight: 700, textAlign: "center", marginBottom: 14, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setAddUsesModal(null)} style={{ flex: 1, padding: "11px", borderRadius: 9, border: "1.5px solid #dde", background: "#fff", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleAddUses} disabled={addUsesLoading} style={{ flex: 1, padding: "11px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#1a7a3a,#2e9e55)", color: "#fff", fontWeight: 800, cursor: "pointer", opacity: addUsesLoading ? 0.7 : 1 }}>
                {addUsesLoading ? "⏳..." : `+ Add ${addUsesCount}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grant Free Uses Modal */}
      {showGrantFree && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 24, maxWidth: 380, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            {grantResult ? (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#d97706", marginBottom: 12 }}>🎁 Free Uses Granted!</h3>
                <div style={{ background: "#fffbe6", border: "1.5px solid #ffe58f", borderRadius: 10, padding: "14px", marginBottom: 14, fontSize: 13 }}>
                  <div style={{ marginBottom: 6 }}><b>Mobile:</b> {grantResult.mobile}</div>
                  <div style={{ marginBottom: 6 }}><b>Unique Code:</b> <code style={{ background: "#eef1f7", padding: "2px 8px", borderRadius: 4, fontWeight: 800, fontSize: 14 }}>{grantResult.uniqueCode}</code></div>
                  <div style={{ marginBottom: 6 }}><b>Generated UTR:</b> <code style={{ fontSize: 11, color: "#888" }}>{grantResult.utr}</code></div>
                  <div><b>Uses Credited:</b> <span style={{ color: "#1a7a3a", fontWeight: 800 }}>{grantResult.usesGranted}</span></div>
                </div>
                <div style={{ background: "#eef1f7", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#555", marginBottom: 14 }}>
                  💡 User can access their uses at <b>/my-coupons</b> by entering their mobile number <b>{grantResult.mobile}</b>.
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setGrantResult(null); setGrantMobile(""); setGrantName(""); setGrantNote(""); setGrantUses(5); }}
                    style={{ flex: 1, padding: "11px", borderRadius: 9, border: "1.5px solid #dde", background: "#fff", fontWeight: 700, cursor: "pointer" }}>
                    + Grant Another
                  </button>
                  <button onClick={() => setShowGrantFree(false)}
                    style={{ flex: 1, padding: "11px", borderRadius: 9, border: "none", background: "#1a3a6b", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#d97706", margin: 0 }}>🎁 Grant Free Uses</h3>
                  <button onClick={() => setShowGrantFree(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>×</button>
                </div>
                <p style={{ fontSize: 12, color: "#888", marginBottom: 14 }}>
                  Grant free uses to a user by their mobile number. They can retrieve them at <b>/my-coupons</b> using their mobile number.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Recipient Name *</label>
                    <input value={grantName} onChange={e => setGrantName(e.target.value)} placeholder="Customer name"
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #dde", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Mobile Number *</label>
                    <input value={grantMobile} onChange={e => setGrantMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile number" inputMode="numeric"
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #dde", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Number of Free Uses *</label>
                    <input type="number" value={grantUses} onChange={e => setGrantUses(Math.max(1, parseInt(e.target.value) || 1))} min={1} max={500}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "2px solid #dde", fontSize: 20, fontWeight: 800, textAlign: "center", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Note (optional)</label>
                    <input value={grantNote} onChange={e => setGrantNote(e.target.value)} placeholder="e.g. WhatsApp complaint, referral bonus..."
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #dde", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setShowGrantFree(false)} style={{ flex: 1, padding: "11px", borderRadius: 9, border: "1.5px solid #dde", background: "#fff", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                  <button onClick={handleGrantFree} disabled={grantLoading}
                    style={{ flex: 2, padding: "11px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#d97706,#f59e0b)", color: "#fff", fontWeight: 800, cursor: "pointer", opacity: grantLoading ? 0.7 : 1 }}>
                    {grantLoading ? "⏳ Granting..." : `🎁 Grant ${grantUses} Free Use${grantUses > 1 ? "s" : ""}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
