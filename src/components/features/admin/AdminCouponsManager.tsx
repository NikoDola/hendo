'use client';

import { useEffect, useState, useCallback } from 'react';
import { Ticket, Plus, Loader2, Copy, Check } from 'lucide-react';
import './AdminCouponsManager.css';

interface CouponCode {
  id: string;
  code: string;
  active: boolean;
  percentOff: number | null;
  timesRedeemed: number;
  maxRedemptions: number | null;
  expiresAt: number | null;
  created: number;
}

export default function AdminCouponsManager() {
  const [codes, setCodes] = useState<CouponCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state.
  const [code, setCode] = useState('');
  const [percentOff, setPercentOff] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadCodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load coupons.');
      setCodes(data.codes || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load coupons.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setCreating(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          percentOff: Number(percentOff),
          maxRedemptions: maxRedemptions || undefined,
          expiresAt: expiresAt || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create coupon.');
      setCodes((prev) => [data.code, ...prev]);
      setCode('');
      setPercentOff('');
      setMaxRedemptions('');
      setExpiresAt('');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to create coupon.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Deactivate this code? It will stop working immediately and cannot be reactivated.')) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to deactivate.');
      setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, active: false } : c)));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Failed to deactivate.');
    }
  };

  const copyCode = (c: CouponCode) => {
    navigator.clipboard?.writeText(c.code);
    setCopiedId(c.id);
    setTimeout(() => setCopiedId((id) => (id === c.id ? null : id)), 1500);
  };

  return (
    <div className="adminCoupons">
      <div className="adminCouponsHeader">
        <Ticket size={22} />
        <h2>Coupons</h2>
      </div>
      <p className="adminCouponsHint">
        Create discount codes customers enter at checkout. A 100%-off code makes the order free — handy for testing.
        Use &ldquo;Max uses&rdquo; (e.g. 1) so a code can&rsquo;t be reused, and deactivate test codes when done.
      </p>

      <form className="adminCouponForm" onSubmit={handleCreate}>
        <div className="adminCouponFormRow">
          <div className="adminFormGroup">
            <label className="adminFormLabel">Code *</label>
            <input
              className="adminFormInput"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. TESTFREE"
              required
            />
          </div>
          <div className="adminFormGroup">
            <label className="adminFormLabel">Percent off *</label>
            <input
              className="adminFormInput"
              type="number"
              min="1"
              max="100"
              value={percentOff}
              onChange={(e) => setPercentOff(e.target.value)}
              placeholder="100"
              required
            />
          </div>
          <div className="adminFormGroup">
            <label className="adminFormLabel">Max uses (optional)</label>
            <input
              className="adminFormInput"
              type="number"
              min="1"
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              placeholder="e.g. 1"
            />
          </div>
          <div className="adminFormGroup">
            <label className="adminFormLabel">Expires (optional)</label>
            <input
              className="adminFormInput"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </div>
        {formError && (
          <div className="adminFormError" role="alert">
            <strong>Error:</strong> {formError}
          </div>
        )}
        <button type="submit" className="adminFormSubmitButton" disabled={creating}>
          {creating ? (
            <>
              <Loader2 size={16} className="adminCouponSpin" /> Creating...
            </>
          ) : (
            <>
              <Plus size={16} /> Create code
            </>
          )}
        </button>
      </form>

      <div className="adminCouponsList">
        {loading ? (
          <p className="adminCouponsMuted">Loading codes...</p>
        ) : error ? (
          <p className="adminCouponsError">{error}</p>
        ) : codes.length === 0 ? (
          <p className="adminCouponsMuted">No coupon codes yet.</p>
        ) : (
          codes.map((c) => (
            <div key={c.id} className={`adminCouponCard ${c.active ? '' : 'inactive'}`}>
              <div className="adminCouponMain">
                <button type="button" className="adminCouponCode" onClick={() => copyCode(c)} title="Copy code">
                  <span>{c.code}</span>
                  {copiedId === c.id ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <span className="adminCouponBadge">{c.percentOff ?? '—'}% off</span>
                {!c.active && <span className="adminCouponBadge inactiveBadge">Inactive</span>}
              </div>
              <div className="adminCouponMeta">
                <span>
                  Used {c.timesRedeemed}
                  {c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ''}
                </span>
                {c.expiresAt && <span>Expires {new Date(c.expiresAt).toLocaleDateString()}</span>}
              </div>
              {c.active && (
                <button type="button" className="adminCouponDeactivate" onClick={() => handleDeactivate(c.id)}>
                  Deactivate
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
