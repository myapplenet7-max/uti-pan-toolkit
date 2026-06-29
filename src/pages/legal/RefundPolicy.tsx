import LegalLayout from "./LegalLayout";

export default function RefundPolicy() {
  return (
    <LegalLayout title="Refund & Cancellation Policy">
      <h2>Our Commitment</h2>
      <p>
        We want you to be satisfied with your purchase. This policy explains when refunds
        are available and how to request them.
      </p>

      <h2>Service Nature</h2>
      <p>
        Our service sells digital "uses" — each use allows you to generate a formatted photo
        output. Because the service is delivered digitally and uses are consumed at the point
        of generation, standard cancellation policies for physical goods do not apply.
      </p>

      <h2>Refund Eligibility</h2>
      <table>
        <thead>
          <tr><th>Situation</th><th>Refund</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Payment deducted but uses not credited</td>
            <td>✅ Full refund or uses credited — contact us within 7 days</td>
          </tr>
          <tr>
            <td>Double payment for the same order</td>
            <td>✅ Full refund for the duplicate amount</td>
          </tr>
          <tr>
            <td>Technical error preventing service use</td>
            <td>✅ Full refund or replacement uses at our discretion</td>
          </tr>
          <tr>
            <td>Changed mind after purchasing (uses not yet consumed)</td>
            <td>⚠️ Considered on a case-by-case basis — contact us within 24 hours</td>
          </tr>
          <tr>
            <td>Uses already consumed</td>
            <td>❌ Not eligible for refund</td>
          </tr>
          <tr>
            <td>Application rejected by government portal</td>
            <td>❌ Not eligible — portal acceptance is beyond our control</td>
          </tr>
        </tbody>
      </table>

      <h2>How to Request a Refund</h2>
      <ol>
        <li>Contact us via WhatsApp or the <a href="/contact">Contact Us</a> page.</li>
        <li>Provide your <strong>Razorpay transaction ID</strong> (from your payment receipt).</li>
        <li>Describe the issue clearly.</li>
        <li>We will respond within 2 business days.</li>
      </ol>

      <h2>Refund Processing</h2>
      <p>
        Approved refunds are processed back to the original payment method (UPI/card/bank)
        within <strong>5–7 business days</strong>, depending on your bank or payment provider.
        Razorpay's refund processing timeline applies.
      </p>

      <h2>Alternative Resolution</h2>
      <p>
        In cases where a refund is not possible, we may offer equivalent service uses as
        compensation at our discretion.
      </p>

      <h2>Contact for Refunds</h2>
      <p>Visit our <a href="/contact">Contact Us</a> page to raise a refund request.</p>
    </LegalLayout>
  );
}
