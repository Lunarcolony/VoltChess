import Link from "next/link";

export default function TermsAndConditions() {
  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 24 }}>
      <h1>Terms and Conditions</h1>

      <div style={{ marginBottom: 24 }}>
        <Link href="/register" style={{ color: "#007bff" }}>← Back to Registration</Link>
      </div>

      <div style={{ lineHeight: 1.6, marginBottom: 32 }}>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using VoltChess, you accept and agree to be bound by the terms
          and provision of this agreement.
        </p>

        <h2>2. Use License</h2>
        <p>
          Permission is granted to temporarily download one copy of VoltChess for personal,
          non-commercial transitory viewing only. This is the grant of a license, not a
          transfer of title, and under this license you may not:
        </p>
        <ul>
          <li>modify or copy the materials;</li>
          <li>use the materials for any commercial purpose or for any public display;</li>
          <li>attempt to reverse engineer any software contained in VoltChess;</li>
          <li>remove any copyright or other proprietary notations from the materials.</li>
        </ul>

        <h2>3. User Accounts</h2>
        <p>
          When you create an account with us, you must provide information that is accurate,
          complete, and current at all times. You are responsible for safeguarding the password
          and for any activities that occur under your account.
        </p>

        <h2>4. Privacy Policy</h2>
        <p>
          Your privacy is important to us. We collect minimal information necessary to provide
          our chess analysis services. We do not sell or share your personal information with
          third parties.
        </p>

        <h2>5. Prohibited Uses</h2>
        <p>You may not use our service:</p>
        <ul>
          <li>For any unlawful purpose or to solicit others to unlawful acts;</li>
          <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances;</li>
          <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others;</li>
          <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate;</li>
          <li>To submit false or misleading information.</li>
        </ul>

        <h2>6. Disclaimer</h2>
        <p>
          The information on this website is provided on an 'as is' basis. To the fullest extent
          permitted by law, this Company excludes all representations, warranties, conditions and
          terms relating to our website and the use of this website.
        </p>

        <h2>7. Limitations</h2>
        <p>
          In no event shall VoltChess or its suppliers be liable for any damages (including,
          without limitation, damages for loss of data or profit, or due to business interruption)
          arising out of the use or inability to use VoltChess.
        </p>

        <h2>8. Changes to Terms</h2>
        <p>
          We reserve the right to revise these terms of service at any time without notice.
          By using this website, you are agreeing to be bound by the then current version
          of these terms of service.
        </p>

        <h2>9. Contact Information</h2>
        <p>
          If you have any questions about these Terms and Conditions, please contact us through
          our support channels.
        </p>
      </div>

      <div style={{ textAlign: "center", borderTop: "1px solid #eee", paddingTop: 24 }}>
        <p style={{ color: "#666" }}>
          Last updated: {new Date().toLocaleDateString()}
        </p>
        <div style={{ marginTop: 16 }}>
          <Link href="/register" style={{ color: "#007bff", marginRight: 16 }}>
            Back to Registration
          </Link>
          <Link href="/" style={{ color: "#007bff" }}>
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
