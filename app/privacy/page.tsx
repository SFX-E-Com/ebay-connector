export default function PrivacyPolicyPage() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <h1 className="mb-4">Privacy Policy</h1>

          <p className="text-muted mb-4">
            Last Updated: {new Date().toLocaleDateString('de-DE')}
          </p>

          <section className="mb-5">
            <h2 className="h4 mb-3">1. Introduction</h2>
            <p>
              This Privacy Policy describes how eBay Connector ("we", "our", or "us") collects,
              uses, and protects your personal information when you use our application to manage
              your eBay seller accounts.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">2. Information We Collect</h2>
            <h3 className="h6 mb-2">2.1 Information You Provide</h3>
            <ul>
              <li>Account credentials (email, password)</li>
              <li>eBay seller account information</li>
              <li>User profile information (name, contact details)</li>
            </ul>

            <h3 className="h6 mb-2 mt-3">2.2 Information from eBay</h3>
            <p>
              When you connect your eBay account, we receive:
            </p>
            <ul>
              <li>eBay account details (username, user ID)</li>
              <li>OAuth access tokens and refresh tokens</li>
              <li>Inventory, order, and listing information</li>
              <li>Transaction and fulfillment data</li>
              <li>Messages and customer inquiries</li>
            </ul>

            <h3 className="h6 mb-2 mt-3">2.3 Automatically Collected Information</h3>
            <ul>
              <li>API usage logs and debug information</li>
              <li>Session data and authentication tokens</li>
              <li>Technical information (IP address, browser type)</li>
            </ul>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide access to eBay API functionality</li>
              <li>Manage your eBay seller accounts and listings</li>
              <li>Process orders and handle customer service</li>
              <li>Authenticate and authorize API requests</li>
              <li>Monitor and improve our service</li>
              <li>Ensure security and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">4. Data Storage and Security</h2>
            <p>
              We store your data securely using Google Cloud Firestore. We implement
              industry-standard security measures including:
            </p>
            <ul>
              <li>Encrypted data transmission (HTTPS/TLS)</li>
              <li>Secure password hashing (bcrypt)</li>
              <li>Token-based authentication (JWT)</li>
              <li>Regular security updates and monitoring</li>
            </ul>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">5. Data Sharing</h2>
            <p>
              We do not sell your personal information. We only share data:
            </p>
            <ul>
              <li>With eBay (through their official APIs) to provide our services</li>
              <li>With Google Cloud Platform (for data storage and hosting)</li>
              <li>When required by law or legal process</li>
            </ul>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and data</li>
              <li>Revoke eBay account connections</li>
              <li>Export your data</li>
              <li>Object to data processing</li>
            </ul>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">7. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to
              provide services. You can request deletion of your data at any time by
              deleting your account.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">8. Third-Party Services</h2>
            <p>Our application integrates with:</p>
            <ul>
              <li><strong>eBay APIs</strong> - Subject to eBay's Privacy Policy</li>
              <li><strong>Google Cloud Platform</strong> - Subject to Google's Privacy Policy</li>
            </ul>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">9. Children's Privacy</h2>
            <p>
              Our service is not intended for users under 18 years of age. We do not
              knowingly collect personal information from children.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of
              any changes by updating the "Last Updated" date at the top of this policy.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices,
              please contact us through the application's support channels.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">12. eBay-Specific Information</h2>
            <p>
              This application uses eBay APIs and is subject to eBay's terms and policies:
            </p>
            <ul>
              <li>eBay User Agreement</li>
              <li>eBay Privacy Policy</li>
              <li>eBay API License Agreement</li>
            </ul>
            <p className="mt-3">
              When you authorize our application to access your eBay account, you grant us
              permission to access the specific data and perform actions as described in the
              OAuth consent screen.
            </p>
          </section>

          <hr className="my-5" />

          <p className="text-muted small">
            <strong>GDPR Compliance Note:</strong> If you are a resident of the European Economic Area (EEA),
            you have certain data protection rights. We comply with applicable data protection laws including
            the General Data Protection Regulation (GDPR).
          </p>
        </div>
      </div>
    </div>
  );
}
