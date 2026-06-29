import LegalLayout from "./LegalLayout";

export default function AboutUs() {
  return (
    <LegalLayout title="About Us">
      <h2>Who We Are</h2>
      <p>
        We are a digital image formatting and document processing service that helps individuals
        prepare photos and signatures for government portal submissions, including PAN card applications.
        Our tools are designed to make the technical requirements of official photo submissions
        simple, fast, and accessible for everyone.
      </p>

      <h2>What We Do</h2>
      <p>We provide the following digital services:</p>
      <ul>
        <li><strong>PAN Form Photo Placement</strong> — Accurately places your passport photo and signature onto the UTI PAN application form at the exact pixel coordinates required by the portal.</li>
        <li><strong>UTI Portal Photo &amp; Signature Crop</strong> — Resizes and compresses your photo/signature to meet UTI portal upload requirements (213×213px, max 100KB).</li>
        <li><strong>General Photo &amp; Signature Formatting</strong> — Crops, background-removes, and formats photos for standard ID/passport sizes.</li>
        <li><strong>Passport Photo Maker</strong> — Generates standard passport/visa format photos with white background.</li>
        <li><strong>JPEG to PDF Conversion</strong> — Merges multiple document images into a single PDF for portal submission.</li>
      </ul>

      <h2>Disclaimer</h2>
      <div style={{ background: "#fff3cd", border: "1px solid #ffe58f", borderRadius: 8, padding: "12px 16px", margin: "16px 0" }}>
        <strong>⚠️ Important:</strong> We provide photo formatting and image editing services only. We are <strong>not affiliated with, endorsed by, or authorized by UTIITSL, NSDL, the Income Tax Department, or the Government of India</strong>. This is an independent third-party tool. All official PAN-related government services are available at <a href="https://www.utiitsl.com" target="_blank" rel="noreferrer">utiitsl.com</a> and <a href="https://www.onlineservices.nsdl.com" target="_blank" rel="noreferrer">nsdl.com</a>.
      </div>

      <h2>Our Technology</h2>
      <p>
        All image processing runs entirely in your browser — no photos, signatures, or personal data
        are ever uploaded to our servers. Your files remain completely private on your device.
      </p>

      <h2>Contact</h2>
      <p>For support, please visit our <a href="/contact">Contact Us</a> page.</p>
    </LegalLayout>
  );
}
