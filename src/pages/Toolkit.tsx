import { useEffect, useRef, useState, useCallback } from "react";
import PaymentModal from "@/components/PaymentModal";
import RecoveryModal from "@/components/RecoveryModal";

interface PaymentRequest {
  deviceId: string;
  serviceType: string;
}

interface AccessInfo {
  hasAccess: boolean;
  usesRemaining: number;
}

export default function ToolkitPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const [usesRemaining, setUsesRemaining] = useState<number>(0);

  const checkAccess = useCallback(async (dId: string) => {
    try {
      const res = await fetch("/api/access/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: dId }),
      });
      if (!res.ok) return;
      const data: AccessInfo = await res.json();
      setUsesRemaining(data.usesRemaining);
      iframeRef.current?.contentWindow?.postMessage(
        { type: "UPDATE_USES", usesRemaining: data.usesRemaining },
        "*"
      );
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "UTI_DEVICE_INIT") {
        const dId = event.data.deviceId as string;
        setDeviceId(dId);
        checkAccess(dId);
      }
      if (event.data?.type === "REQUEST_PAYMENT") {
        setPaymentRequest({
          deviceId: event.data.deviceId,
          serviceType: event.data.serviceType,
        });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [checkAccess]);

  const handlePaymentSuccess = async () => {
    setPaymentRequest(null);
    if (deviceId) await checkAccess(deviceId);
    // Tell iframe to proceed with generate
    iframeRef.current?.contentWindow?.postMessage({ type: "PAYMENT_SUCCESS" }, "*");
  };

  const handleRecoverySuccess = async () => {
    setShowRecovery(false);
    if (deviceId) await checkAccess(deviceId);
  };

  const footerLinks = [
    { href: "/coupons", label: "🎟️ Buy Coupons" },
    { href: "/my-coupons", label: "💰 My Coupons" },
    { href: "/check", label: "📊 Usage Check" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact Us" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms & Conditions" },
    { href: "/refund", label: "Refund Policy" },
    { href: "/admin", label: "🔐 Admin" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100vh" }}>

      {/* Top quick-action bar */}
      <div style={{ background: "#1a3a6b", flexShrink: 0, padding: "6px 12px", display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>UTI PAN TOOLKIT</span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <a href="/a4-crop" style={{ background: "#7c3aed", color: "#fff", borderRadius: 7, padding: "5px 11px", fontSize: 11, fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" }}>✂️ A4 Crop</a>
          <a href="/coupons" style={{ background: "#d97706", color: "#fff", borderRadius: 7, padding: "5px 11px", fontSize: 11, fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" }}>🎟️ Buy Coupons</a>
          <a href="/my-coupons" style={{ background: "#1a7a3a", color: "#fff", borderRadius: 7, padding: "5px 11px", fontSize: 11, fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" }}>💰 My Coupons</a>
          <a href="/login" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 7, padding: "5px 11px", fontSize: 11, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>👤 My Account</a>
        </div>
      </div>

      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      <iframe
        ref={iframeRef}
        src="/toolkit.html"
        style={{ width: "100%", height: "100%", border: "none", display: "block", pointerEvents: (paymentRequest || showRecovery) ? "none" : "auto" }}
        title="UTI PAN Toolkit"
        sandbox="allow-scripts allow-same-origin allow-downloads allow-modals allow-popups"
      />

      {/* Floating recovery button */}
      <button
        onClick={() => setShowRecovery(true)}
        style={{
          position: "fixed",
          bottom: "16px",
          right: "16px",
          zIndex: 1000,
          background: "#1a3a6b",
          color: "#fff",
          border: "none",
          borderRadius: "24px",
          padding: "10px 18px",
          fontSize: "12px",
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        🔑 Recover Access
      </button>

      </div>

      {/* Legal footer */}
      <div style={{
        background: "#1a3a6b", flexShrink: 0, padding: "8px 12px",
        display: "flex", flexDirection: "column", gap: 4,
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center" }}>
          {footerLinks.map(l => (
            <a key={l.href} href={l.href} style={{ color: "#7eb8f7", textDecoration: "none", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>{l.label}</a>
          ))}
        </div>
        <p style={{ margin: 0, textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
          Not affiliated with UTIITSL, NSDL, or the Government of India
        </p>
      </div>

      {paymentRequest && (
        <PaymentModal
          deviceId={paymentRequest.deviceId}
          serviceType={paymentRequest.serviceType}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPaymentRequest(null)}
        />
      )}

      {showRecovery && (
        <RecoveryModal
          deviceId={deviceId || ""}
          onSuccess={handleRecoverySuccess}
          onClose={() => setShowRecovery(false)}
        />
      )}
    </div>
  );

}
