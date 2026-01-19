'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import '@/components/pages/FaqPage.css';

type FAQItem = {
  q: string;
  a: string;
};

const FAQS: FAQItem[] = [
  {
    q: '1. What am I actually buying when I purchase a beat?',
    a: `You are purchasing a license to use the beat, not ownership of the music.\nThe producer (and DREAMSTATION) keeps full copyright unless an exclusive license states otherwise.`,
  },
  {
    q: '2. What files do I receive?',
    a: `This depends on the license you purchase. Typical formats include:\n- MP3\n- WAV\n- Track Stems (if included)\n- License PDF\nAll files are delivered digitally to your account and email.`,
  },
  {
    q: '3. Can I use the beat for Spotify, Apple Music, YouTube, and TikTok?',
    a: `Yes — if your license allows distribution and monetization.\nAlways check your specific license terms to confirm platform rights and usage limits.`,
  },
  {
    q: '4. Do you offer exclusive beats?',
    a: `Yes.\nWhen an exclusive license is purchased, the beat is removed from public sale and no longer leased to others.\nPlease contact levelup@thelegendofhendo.com for inquiries.`,
  },
  {
    q: '5. Can I copyright a song I make with one of your beats?',
    a: `Yes — you can copyright your song (lyrics + vocals), but you do not own the beat itself unless you purchased full rights in writing.`,
  },
  {
    q: '6. Can I upload the beat to YouTube Content ID or similar systems?',
    a: `No, unless your license specifically allows it.\nUploading beats to Content ID systems without permission can block or claim other licensed users and will result in license termination.`,
  },
  {
    q: '7. Can I resell or give away a beat I bought?',
    a: `No.\nReselling, sharing, redistributing, or giving away beats is strictly prohibited and considered copyright infringement.`,
  },
  {
    q: '8. What if I lose my files?',
    a: `Your purchased beats remain in your account. You can re-download them anytime while your account is active.`,
  },
  {
    q: '9. Are there refunds?',
    a: `No. All digital sales are final.\nBecause beats are digital products delivered instantly and cannot be returned or revoked:\n- No refunds\n- No exchanges\n- No chargebacks\nUnauthorized chargebacks will result in account termination and license cancellation.`,
  },
  {
    q: '10. What if I accidentally buy the wrong license?',
    a: `Contact us immediately at levelup@thelegendofhendo.com\nWe may upgrade your license, but refunds are not provided.`,
  },
  {
    q: '11. Can I use the beat for commercial projects?',
    a: `Yes — as long as your license allows commercial use.\nCommercial use includes streaming, selling music, music videos, performances, and monetization.`,
  },
  {
    q: '12. Do you offer bulk deals or subscriptions?',
    a: `Yes. We may periodically offer bundles, packs, and special pricing.\nFollow us or join our mailing list to stay updated.`,
  },
  {
    q: '13. What happens if I violate my license?',
    a: `Your license will be terminated and we may:\n- Issue takedown notices\n- Ban your account\n- Pursue legal action if necessary`,
  },
  {
    q: '14. Who owns the beats?',
    a: `All beats are owned by DREAMSTATION and its producers unless otherwise stated in writing.`,
  },
  {
    q: '15. How do I contact support?',
    a: `📧 levelup@thelegendofhendo.com\nWe usually respond within 24–48 hours.`,
  },
];

function chunkIntoColumns<T>(items: T[], columns: number): T[][] {
  const cols = Array.from({ length: columns }, () => [] as T[]);
  items.forEach((item, idx) => {
    cols[idx % columns].push(item);
  });
  return cols;
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const groups = chunkIntoColumns(FAQS, 3);

  return (
    <section className="section-regular faqPageContainer">
      <h1 className="faqPageTitle" data-text="Frequently Asked Questions (FAQ)">Frequently Asked Questions (FAQ)</h1>

      <div className="faqColumns">
        {groups.map((group, colIdx) => (
          <div key={colIdx} className="faqColumn">
            {group.map((item, rowIdx) => {
              const globalIndex = colIdx + rowIdx * groups.length;
              const isOpen = openIndex === globalIndex;
              return (
                <div key={globalIndex} className={`faqCard glass-effect ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="faqQuestionRow"
                    onClick={() => setOpenIndex((prev) => (prev === globalIndex ? null : globalIndex))}
                    aria-expanded={isOpen}
                  >
                    <ChevronDown className={`faqChevron ${isOpen ? 'open' : ''}`} size={20} />
                    <p className="faqQuestionText">{item.q}</p>
                  </button>

                  {isOpen && (
                    <div className="faqAnswer">
                      {item.a.split('\n').map((line, i) => (
                        <p key={i} className="faqAnswerLine">
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}


