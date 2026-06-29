import LegalLayout from "./LegalLayout";

export default function ContactUs() {
  const whatsapp = ""; // fetched from config if available

  return (
    <LegalLayout title="Contact Us">
      <h2>Get Support</h2>
      <p>
        We're here to help with payment issues, access recovery, or any questions about our
        photo formatting service.
      </p>

      <h2>Payment / Access Issues</h2>
      <p>
        If your payment was deducted but uses were not credited, please contact us via WhatsApp
        with:
      </p>
      <ul>
        <li>Your payment screenshot or transaction ID</li>
        <li>Your device's unique access code (shown in the payment confirmation screen)</li>
      </ul>
      <p>We will manually verify and credit your uses within a few hours.</p>

      <h2>Contact Channels</h2>
      <table>
        <thead>
          <tr><th>Channel</th><th>Details</th><th>Response Time</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>📱 WhatsApp</td>
            <td>Send your payment screenshot + transaction ID</td>
            <td>Within 4 hours</td>
          </tr>
          <tr>
            <td>🔑 Self-service</td>
            <td>Use "Recover Access" button on the toolkit page with your unique code</td>
            <td>Instant</td>
          </tr>
        </tbody>
      </table>

      <h2>Business Hours</h2>
      <p>Monday – Saturday: 9:00 AM – 7:00 PM IST<br />Sunday: Closed</p>

      <div style={{ background: "#e8f5e9", border: "1px solid #c8e6c9", borderRadius: 8, padding: "12px 16px", margin: "16px 0" }}>
        <strong>📋 Service Description:</strong> This is a digital photo editing and formatting service.
        We process images entirely in your browser. We do not store, upload, or share your photos.
      </div>

      <h2>Disclaimer</h2>
      <p>
        We are an independent digital service provider. We are <strong>not affiliated with UTIITSL,
        NSDL, the Income Tax Department, or any Government of India entity</strong>. For official
        PAN services, visit <a href="https://www.utiitsl.com" target="_blank" rel="noreferrer">utiitsl.com</a>.
      </p>
    </LegalLayout>
  );
}
