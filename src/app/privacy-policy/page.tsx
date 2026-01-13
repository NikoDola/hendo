'use client';

import '@/components/pages/PrivacyPolicy.css';

export default function PrivacyPolicyPage() {
  return (
    <section className="section-regular privacyPolicyPage">
      <h1 className="privacyPolicyTitle">Privacy Policy</h1>
      <p className="privacyPolicyUpdated">Last Updated: JAN 1 2026</p>

      <p className="privacyPolicyIntro">
        This Privacy Policy explains how DREAMSTATION (“we,” “us,” or “our”) collects, uses, and protects your
        information when you visit or make a purchase from THELEGENDOFHENDO.com (the “Site”).
      </p>

      <h3 className="privacyPolicySectionTitle">1. Information We Collect</h3>
      <p className="privacyPolicyText">
        When you visit or use our store, we may collect the following types of information:
      </p>

      <p className="privacyPolicyBold">Personal Information</p>
      <ul className="privacyPolicyList">
        <li>Name</li>
        <li>Email address</li>
        <li>Billing and shipping address</li>
        <li>Phone number</li>
        <li>Payment details (processed securely by third-party payment providers)</li>
      </ul>

      <p className="privacyPolicyBold">Account Information</p>
      <ul className="privacyPolicyList">
        <li>Username and password</li>
        <li>Order history</li>
        <li>Saved beats, favorites, and licenses</li>
      </ul>

      <p className="privacyPolicyBold">Device &amp; Usage Information</p>
      <ul className="privacyPolicyList">
        <li>IP address</li>
        <li>Browser type</li>
        <li>Device type</li>
        <li>Pages viewed</li>
        <li>Time spent on the site</li>
        <li>Referral source</li>
      </ul>

      <h3 className="privacyPolicySectionTitle">2. How We Use Your Information</h3>
      <p className="privacyPolicyText">We use your information to:</p>
      <ul className="privacyPolicyList">
        <li>Process beat purchases and license deliveries</li>
        <li>Manage user accounts</li>
        <li>Provide downloads and access to purchased content</li>
        <li>Send order confirmations and updates</li>
        <li>Provide customer support</li>
        <li>Improve website performance and user experience</li>
        <li>Prevent fraud and unauthorized use</li>
        <li>Send promotional emails (if you opt in)</li>
      </ul>

      <h3 className="privacyPolicySectionTitle">3. How Payments Are Handled</h3>
      <p className="privacyPolicyText">
        All payments are processed through secure third-party payment processors (such as Stripe, PayPal, or Shopify
        Payments). We do not store or have access to your full credit card details. These providers handle your
        information according to their own privacy policies and security standards.
      </p>

      <h3 className="privacyPolicySectionTitle">4. How We Share Information</h3>
      <p className="privacyPolicyText">
        We do not sell your personal data. We may share limited data with trusted third parties only when necessary,
        including:
      </p>
      <ul className="privacyPolicyList">
        <li>Payment processors</li>
        <li>Email services</li>
        <li>Cloud storage &amp; hosting providers</li>
        <li>Website analytics (remembering user behavior for improvement)</li>
      </ul>
      <p className="privacyPolicyText">
        These partners are required to keep your data secure and confidential.
      </p>

      <h3 className="privacyPolicySectionTitle">5. Cookies &amp; Tracking</h3>
      <p className="privacyPolicyText">We use cookies and similar technologies to:</p>
      <ul className="privacyPolicyList">
        <li>Remember your login</li>
        <li>Save cart and favorite beats</li>
        <li>Track site performance</li>
        <li>Understand how users interact with our store</li>
      </ul>
      <p className="privacyPolicyText">
        You may disable cookies in your browser, but some site features may not work properly.
      </p>

      <h3 className="privacyPolicySectionTitle">6. Digital Products &amp; Licensing</h3>
      <p className="privacyPolicyText">
        When you purchase beats or licenses:
      </p>
      <ul className="privacyPolicyList">
        <li>Your purchase is recorded</li>
        <li>Your license is tied to your account and email</li>
        <li>We may use this data to prevent piracy, abuse, or unauthorized distribution</li>
      </ul>

      <h3 className="privacyPolicySectionTitle">7. Data Security</h3>
      <p className="privacyPolicyText">
        We take security seriously and use:
      </p>
      <ul className="privacyPolicyList">
        <li>Encrypted connections (SSL)</li>
        <li>Secure hosting</li>
        <li>Firewall protection</li>
        <li>Limited employee access</li>
      </ul>
      <p className="privacyPolicyText">
        No system is 100% secure, but we use industry-standard protections to safeguard your data.
      </p>

      <h3 className="privacyPolicySectionTitle">8. Your Rights</h3>
      <p className="privacyPolicyText">
        You have the right to:
      </p>
      <ul className="privacyPolicyList">
        <li>Access your personal data</li>
        <li>Request corrections</li>
        <li>Request deletion of your account</li>
        <li>Opt out of marketing emails</li>
      </ul>
      <p className="privacyPolicyText">
        To exercise these rights, contact us at: <span className="privacyPolicyBold">levelup@thelegendofhendo.com</span>
      </p>

      <h3 className="privacyPolicySectionTitle">9. Children’s Privacy</h3>
      <p className="privacyPolicyText">
        Our services are not intended for children under 13. We do not knowingly collect personal data from minors.
      </p>

      <h3 className="privacyPolicySectionTitle">10. Changes to This Policy</h3>
      <p className="privacyPolicyText">
        We may update this Privacy Policy from time to time. Changes will be posted on this page with a new “Last
        Updated” date.
      </p>

      <h3 className="privacyPolicySectionTitle">11. Contact Us</h3>
      <p className="privacyPolicyText">
        If you have questions about this Privacy Policy, contact us at:
      </p>
      <p className="privacyPolicyText">
        DREAMSTATION<br />
        <span className="privacyPolicyBold">levelup@thelegendofhendo.com</span><br />
        <span className="privacyPolicyBold">THELEGENDOFHENDO.COM</span>
      </p>
    </section>
  );
}


