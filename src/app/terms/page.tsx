'use client';

import '@/components/pages/TermsPage.css';

export default function TermsPage() {
  return (
    <section className="section-regular termsPage">
      <h1 className="termsTitle" data-text="Terms & Conditions">Terms &amp; Conditions</h1>
      <p className="termsUpdated">Last Updated: JAN 1 2026</p>

      <p className="termsIntro">
        Welcome to DREAMSTATION (“Company,” “we,” “us,” or “our”). These Terms &amp; Conditions (“Terms”) govern your use
        of thelegendofhendo.com (the “Site”) and the purchase, licensing, and use of any beats, music, or digital
        products sold through the Site. By accessing or using this Site, you agree to be bound by these Terms.
      </p>

      <h3 className="termsSectionTitle">1. Digital Products</h3>
      <p className="termsText">
        All products sold on this website are digital music files and licenses. No physical goods are shipped. When you
        purchase a beat, you are purchasing a license to use the beat — not ownership of the music or copyrights. All
        beats remain the intellectual property of DREAMSTATION and/or its producers.
      </p>

      <h3 className="termsSectionTitle">2. Beat Licensing</h3>
      <p className="termsText">
        Each beat purchase comes with a specific license type (e.g., MP3 Lease, WAV Lease, Exclusive, etc.). Your
        rights are defined by the license purchased. Unless explicitly stated in writing:
      </p>
      <ul className="termsList">
        <li>You do not own the beat</li>
        <li>You do not own the copyright</li>
        <li>You may not resell, redistribute, or give away the beat</li>
        <li>You may only use the beat as allowed in your license agreement</li>
      </ul>
      <p className="termsText">Any use outside of your license is copyright infringement.</p>

      <h3 className="termsSectionTitle">3. Exclusive Licenses</h3>
      <p className="termsText">If you purchase an exclusive license:</p>
      <ul className="termsList">
        <li>You receive exclusive usage rights</li>
        <li>The beat will be removed from public sale</li>
        <li>We still retain authorship and credit rights unless otherwise stated in writing</li>
      </ul>

      <h3 className="termsSectionTitle">4. Refund Policy</h3>
      <p className="termsText">
        All sales are final. Because digital files are instantly delivered and cannot be returned:
      </p>
      <ul className="termsList">
        <li>No refunds</li>
        <li>No chargebacks</li>
        <li>No exchanges</li>
      </ul>
      <p className="termsText">Unauthorized chargebacks will result in account termination and license revocation.</p>

      <h3 className="termsSectionTitle">5. User Accounts</h3>
      <p className="termsText">You agree to:</p>
      <ul className="termsList">
        <li>Provide accurate information</li>
        <li>Keep your login secure</li>
        <li>Not share your account</li>
      </ul>
      <p className="termsText">
        You are responsible for all activity under your account. We reserve the right to suspend or terminate accounts
        that violate these Terms.
      </p>

      <h3 className="termsSectionTitle">6. Prohibited Uses</h3>
      <p className="termsText">You may not:</p>
      <ul className="termsList">
        <li>Claim ownership of any beat</li>
        <li>Remove the producer’s beat tag</li>
        <li>Upload beats to content ID systems (YouTube, TikTok, etc.) unless your license allows</li>
        <li>Use beats for hate speech, illegal activity, or harmful content</li>
        <li>Attempt to resell or redistribute the beats</li>
        <li>Reverse engineer, watermark-remove, or pirate files</li>
      </ul>
      <p className="termsText">Violations will result in immediate license termination.</p>

      <h3 className="termsSectionTitle">7. Copyright &amp; DMCA</h3>
      <p className="termsText">
        All music is protected under U.S. and international copyright laws. We actively monitor piracy and copyright
        violations and will pursue:
      </p>
      <ul className="termsList">
        <li>Takedowns</li>
        <li>Account bans</li>
        <li>Legal action</li>
      </ul>

      <h3 className="termsSectionTitle">8. Platform Availability</h3>
      <p className="termsText">
        We do not guarantee that the Site will be uninterrupted, error-free, or always available. We are not
        responsible for:
      </p>
      <ul className="termsList">
        <li>Download issues</li>
        <li>File loss</li>
        <li>Third-party payment failures</li>
      </ul>
      <p className="termsText">Users are responsible for backing up their purchased files.</p>

      <h3 className="termsSectionTitle">9. Limitation of Liability</h3>
      <p className="termsText">
        To the fullest extent permitted by law: DREAMSTATION shall not be liable for:
      </p>
      <ul className="termsList">
        <li>Lost profits</li>
        <li>Lost data</li>
        <li>Business interruption</li>
        <li>Misuse of purchased beats</li>
      </ul>
      <p className="termsText">All products are provided “as is.”</p>

      <h3 className="termsSectionTitle">10. Changes to Terms</h3>
      <p className="termsText">
        We may update these Terms at any time. Continued use of the Site means you accept the new Terms.
      </p>

      <h3 className="termsSectionTitle">11. Governing Law</h3>
      <p className="termsText">These Terms are governed by the laws of WY, USA.</p>

      <h3 className="termsSectionTitle">12. Contact</h3>
      <p className="termsText">
        For questions or licensing inquiries, contact:
      </p>
      <p className="termsText">
        DREAMSTATION<br />
        <span className="termsBold">levelup@thelegendofhendo.com</span><br />
        <span className="termsBold">thelegendofhendo.com</span>
      </p>
    </section>
  );
}


