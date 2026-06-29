import LegalLayout from "./LegalLayout";

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy">
      <h2>Overview</h2>
      <p>
        Your privacy is important to us. This policy explains what information we collect, how we
        use it, and the choices you have.
      </p>

      <h2>Information We Collect</h2>
      <table>
        <thead>
          <tr><th>Data Type</th><th>What We Collect</th><th>Why</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Device Identifier</td>
            <td>A randomly generated ID stored in your browser's localStorage</td>
            <td>To track remaining service uses without requiring account registration</td>
          </tr>
          <tr>
            <td>Payment Data</td>
            <td>Razorpay transaction ID, order ID, payment amount</td>
            <td>To verify payment and credit service uses</td>
          </tr>
          <tr>
            <td>Unique Access Code</td>
            <td>A random alphanumeric code issued after payment</td>
            <td>To allow access recovery on a new device</td>
          </tr>
        </tbody>
      </table>

      <h2>What We Do NOT Collect</h2>
      <ul>
        <li>✅ We do <strong>not</strong> collect, upload, or store your photos, signatures, or form documents.</li>
        <li>✅ All image processing runs entirely in your browser — nothing is sent to our servers.</li>
        <li>✅ We do not collect your name, email address, phone number, or Aadhaar/PAN details.</li>
        <li>✅ We do not use third-party analytics or tracking cookies.</li>
      </ul>

      <h2>How Your Data Is Used</h2>
      <ul>
        <li>Payment records are stored securely to verify and credit service uses.</li>
        <li>Device IDs are used to track remaining uses on your device only.</li>
        <li>We do not sell, rent, or share your data with third parties, except Razorpay for payment processing.</li>
      </ul>

      <h2>Razorpay</h2>
      <p>
        Payments are processed by Razorpay. By making a payment, you also agree to{" "}
        <a href="https://razorpay.com/privacy/" target="_blank" rel="noreferrer">Razorpay's Privacy Policy</a>.
        Razorpay handles all card/UPI/bank data — we never see or store your payment credentials.
      </p>

      <h2>Data Retention</h2>
      <p>
        Payment records are retained for accounting and dispute resolution purposes for up to
        3 years. Your device ID is stored only in your browser's localStorage and is deleted
        when you clear your browser data.
      </p>

      <h2>Your Rights</h2>
      <p>
        You can request deletion of your payment record by contacting us with your transaction ID.
        We will delete it within 7 business days, subject to legal retention requirements.
      </p>

      <h2>Contact</h2>
      <p>For privacy-related requests, please visit our <a href="/contact">Contact Us</a> page.</p>
    </LegalLayout>
  );
}
