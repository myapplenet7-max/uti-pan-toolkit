import LegalLayout from "./LegalLayout";

export default function TermsConditions() {
  return (
    <LegalLayout title="Terms & Conditions">
      <h2>Acceptance of Terms</h2>
      <p>
        By accessing or using this service ("PAN Photo Toolkit"), you agree to be bound by
        these Terms and Conditions. If you do not agree, please do not use this service.
      </p>

      <h2>Description of Service</h2>
      <p>
        We provide a digital photo formatting and document preparation service to help users
        prepare images that comply with technical specifications for online government portal
        submissions. Our services include:
      </p>
      <ul>
        <li>Photo placement on PAN application form templates</li>
        <li>Photo and signature cropping and compression</li>
        <li>Background removal for passport-format photos</li>
        <li>JPEG-to-PDF document merging</li>
      </ul>

      <h2>Important Disclaimer</h2>
      <div style={{ background: "#fff3cd", border: "1px solid #ffe58f", borderRadius: 8, padding: "12px 16px", margin: "8px 0 16px" }}>
        <strong>We are not affiliated with, endorsed by, or authorized by UTIITSL, NSDL, the Income Tax
        Department, or the Government of India.</strong> This is an independent third-party image
        formatting tool. Acceptance of your application by government portals is subject to
        their own review processes, which are beyond our control.
      </div>

      <h2>Payment Terms</h2>
      <ul>
        <li>Service uses are sold in bundles (₹10/1 use, ₹50/5 uses, ₹100/10 uses).</li>
        <li>Payments are processed securely via Razorpay.</li>
        <li>Uses are non-transferable and valid only for the purchasing device (or recovered via unique code).</li>
        <li>Uses do not expire.</li>
      </ul>

      <h2>Permitted Use</h2>
      <ul>
        <li>You may use this service only for lawful purposes.</li>
        <li>You may not attempt to reverse-engineer, copy, or redistribute the toolkit.</li>
        <li>You may not use this service to process images that violate any applicable law.</li>
      </ul>

      <h2>No Guarantee of Portal Acceptance</h2>
      <p>
        We format your images to the best of our ability to meet portal specifications, but we
        cannot guarantee that government portals will accept your submission. Portal requirements
        may change without notice. We are not liable for application rejections.
      </p>

      <h2>Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, we shall not be liable for any indirect, incidental,
        special, or consequential damages arising out of or in connection with your use of this service.
        Our total liability shall not exceed the amount you paid for the service in question.
      </p>

      <h2>Intellectual Property</h2>
      <p>
        All content, design, and code of this service are our exclusive intellectual property.
        The underlying PAN form templates belong to their respective government authorities.
      </p>

      <h2>Changes to Terms</h2>
      <p>
        We reserve the right to update these terms at any time. Continued use of the service
        after changes constitutes acceptance of the revised terms.
      </p>

      <h2>Governing Law</h2>
      <p>These terms are governed by the laws of India. Any disputes shall be subject to the
      jurisdiction of courts in India.</p>
    </LegalLayout>
  );
}
