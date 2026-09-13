import React, { useState } from 'react';

export default function ScoresTable({ vehicles, logs = [], onAdjustScore, onViewViolations }) {
  // Score adjustment modal states
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustType, setAdjustType] = useState('add'); // 'add', 'deduct', 'set'
  const [customPointsInput, setCustomPointsInput] = useState('10');
  const [adjustReason, setAdjustReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleOpenAdjustModal = (item) => {
    setAdjustTarget(item);
    setAdjustType('add');
    setCustomPointsInput('10');
    setAdjustReason('');
  };

  const handleSaveAdjustment = async () => {
    if (!adjustTarget) return;

    let change = 0;
    const val = parseInt(customPointsInput, 10) || 0;
    const currentScore = adjustTarget.score ?? 100;

    if (adjustType === 'add') {
      change = Math.abs(val);
    } else if (adjustType === 'deduct') {
      change = -Math.abs(val);
    } else if (adjustType === 'set') {
      const targetScore = Math.max(0, Math.min(100, val));
      change = targetScore - currentScore;
    }

    if (change === 0 && adjustType !== 'set') {
      alert('Please enter a valid points value to add or deduct.');
      return;
    }

    setSubmitting(true);
    try {
      const defaultReason = change > 0 
        ? 'Admin Score Restoration / Safety Bonus' 
        : 'Admin Manual Penalty Adjustment';
      const finalReason = adjustReason.trim() || defaultReason;

      if (onAdjustScore) {
        await onAdjustScore(adjustTarget.owner, change, finalReason);
      }

      setAdjustTarget(null);
    } catch (e) {
      console.error('Failed to save score adjustment:', e);
      alert('Error updating score. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Compute live score preview for adjust modal
  const getPreviewScore = () => {
    if (!adjustTarget) return 100;
    const cur = adjustTarget.score ?? 100;
    const val = parseInt(customPointsInput, 10) || 0;
    if (adjustType === 'add') return Math.min(100, cur + Math.abs(val));
    if (adjustType === 'deduct') return Math.max(0, cur - Math.abs(val));
    if (adjustType === 'set') return Math.max(0, Math.min(100, val));
    return cur;
  };

  const uniqueDrivers = Array.from(
    new Map(
      vehicles.map(item => [item.ownerEmail || item.owner, item])
    ).values()
  );

  const getLatestViolation = (item) => {
    return logs.find(log =>
      log.isViolation &&
      (
        log.owner === item.ownerEmail ||
        log.owner === item.owner ||
        log.owner?.includes(item.ownerEmail || '')
      )
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-title">
          <i className="ri-speed-up-line"></i>
          <span>Driver Safety Score & Penalty Enforcement</span>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Safety Score</th>
              <th>Last Violation</th>
              <th style={{ textAlign: 'right', paddingRight: 24 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {uniqueDrivers.map((item, i) => {
              const latestViolation = getLatestViolation(item);

              return (
                <tr key={i}>
                <td style={{ fontWeight: 700, color: '#0f172a' }}>{item.id}</td>
                <td style={{ fontWeight: 700, color: '#0f172a' }}>{item.owner}</td>
                <td style={{ 
                  fontWeight: 900, 
                  fontSize: '15px', 
                  color: item.score >= 80 ? '#059669' : (item.score >= 60 ? '#d97706' : '#dc2626') 
                }}>
                  {item.score} / 100
                </td>
                <td>
                  {latestViolation ? (
                    <div>
                      <div style={{ fontWeight: 600, color: '#dc2626' }}>No Helmet Violation</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        {latestViolation.date} • {latestViolation.time}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: '#059669', fontWeight: 600, fontSize: 13 }}>
                      Compliant (No Violations)
                    </span>
                  )}
                </td>
                <td style={{ textAlign: 'right', paddingRight: 24 }}>
                  <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      style={{ color: '#0f172a', border: '1px solid #cbd5e1', background: '#f8fafc', display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600, fontSize: 12, padding: '5px 11px', borderRadius: 8 }} 
                      onClick={() => handleOpenAdjustModal(item)}
                      title="Adjust / Edit Safety Score"
                    >
                      <i className="ri-sliders-line" style={{ color: '#2563eb' }}></i> Adjust Score
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      style={{ color: '#0f172a', border: '1px solid #cbd5e1', background: '#f8fafc', display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600, fontSize: 12, padding: '5px 11px', borderRadius: 8 }} 
                      onClick={() => onViewViolations && onViewViolations(item.owner || item.plate)}
                      title="View Gate Access & Violation History"
                    >
                      <i className="ri-history-line" style={{ color: '#64748b' }}></i> History
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>



      {/* Interactive Score Adjustment Modal */}
      {adjustTarget && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div className="card" style={{ width: 480, padding: 24, borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 800 }}>
                <span>Adjust Driver Safety Score</span>
              </h3>
            </div>

            {/* Target Student Header Card */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{adjustTarget.owner}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Student ID: <strong>{adjustTarget.id}</strong> • Plate: <strong>{adjustTarget.plate}</strong>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Current Score</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: adjustTarget.score >= 80 ? '#059669' : (adjustTarget.score >= 60 ? '#d97706' : '#dc2626') }}>
                  {adjustTarget.score} / 100
                </div>
              </div>
            </div>

            {/* Action Type Selector Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => { setAdjustType('add'); setCustomPointsInput('10'); }}
                style={{
                  flex: 1, padding: '9px 6px', borderRadius: 10, fontWeight: 700, fontSize: 12,
                  border: adjustType === 'add' ? '2px solid #059669' : '1px solid #cbd5e1',
                  background: adjustType === 'add' ? '#ecfdf5' : '#ffffff',
                  color: adjustType === 'add' ? '#059669' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                <i className="ri-add-circle-line" style={{ marginRight: 4 }}></i> Add (+)
              </button>
              <button
                type="button"
                onClick={() => { setAdjustType('deduct'); setCustomPointsInput('10'); }}
                style={{
                  flex: 1, padding: '9px 6px', borderRadius: 10, fontWeight: 700, fontSize: 12,
                  border: adjustType === 'deduct' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                  background: adjustType === 'deduct' ? '#fef2f2' : '#ffffff',
                  color: adjustType === 'deduct' ? '#dc2626' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                <i className="ri-indeterminate-circle-line" style={{ marginRight: 4 }}></i> Deduct (-)
              </button>
              <button
                type="button"
                onClick={() => { setAdjustType('set'); setCustomPointsInput('100'); }}
                style={{
                  flex: 1, padding: '9px 6px', borderRadius: 10, fontWeight: 700, fontSize: 12,
                  border: adjustType === 'set' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: adjustType === 'set' ? '#eff6ff' : '#ffffff',
                  color: adjustType === 'set' ? '#2563eb' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                <i className="ri-equalizer-line" style={{ marginRight: 4 }}></i> Set Exact (=)
              </button>
            </div>

            {/* Value Input Field & Live Score Preview */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                  {adjustType === 'add' ? 'Points to Add:' : (adjustType === 'deduct' ? 'Points to Deduct:' : 'Target Score Value (0 - 100):')}
                </label>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#2563eb' }}>
                  Preview: {adjustTarget.score} → <span style={{ color: getPreviewScore() >= 80 ? '#059669' : (getPreviewScore() >= 60 ? '#d97706' : '#dc2626'), fontSize: 14 }}>{getPreviewScore()} / 100</span>
                </div>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={customPointsInput}
                onChange={(e) => setCustomPointsInput(e.target.value)}
                placeholder="Enter points value"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1',
                  fontSize: 15, fontWeight: 700, color: '#0f172a', outline: 'none'
                }}
              />
            </div>

            {/* Reason Field */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Adjustment Note:
              </label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Approved appeal, Safety workshop completion..."
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1',
                  fontSize: 13, color: '#0f172a', outline: 'none'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setAdjustTarget(null)}
                disabled={submitting}
                style={{ padding: '9px 18px', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveAdjustment}
                disabled={submitting}
                style={{ background: '#2563eb', padding: '9px 20px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {submitting ? (
                  <>
                    <i className="ri-loader-4-line spin"></i> Saving...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

