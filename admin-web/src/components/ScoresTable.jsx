import React, { useState } from 'react';

export default function ScoresTable({ vehicles, logs = [], onAdjustScore, onViewViolations }) {
  // Score adjustment modal states
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustType, setAdjustType] = useState('add'); // 'add', 'deduct', 'set'
  const [customPointsInput, setCustomPointsInput] = useState('10');
  const [adjustReason, setAdjustReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Semester Reset Modal States
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [resettingSemester, setResettingSemester] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  const handleResetSemesterScores = async (selectedTermName) => {
    setResettingSemester(true);
    setResetSuccessMessage('');
    try {
      let res = await fetch('http://localhost:8000/admin/reset-semester-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semester_name: selectedTermName || 'New Academic Semester' })
      });
      if (!res.ok) {
        res = await fetch('https://smart-campus-parking-deploy.onrender.com/admin/reset-semester-scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ semester_name: selectedTermName || 'New Academic Semester' })
        });
      }
      if (res.ok) {
        const data = await res.json();
        setResetSuccessMessage(data.message || 'All driver safety scores reset to 100 successfully!');
        if (onAdjustScore) onAdjustScore();
      } else {
        alert('Failed to reset semester scores. Please try again.');
      }
    } catch (e) {
      alert('Error connecting to server for semester score reset.');
    } finally {
      setResettingSemester(false);
    }
  };

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

  const [searchQuery, setSearchQuery] = useState('');

  // Filter vehicles by Student ID or Name
  const filteredVehicles = (vehicles || []).filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const idMatch = (item.id || '').toLowerCase().includes(q);
    const nameMatch = (item.owner || '').toLowerCase().includes(q);
    const plateMatch = (item.plate || '').toLowerCase().includes(q);
    return idMatch || nameMatch || plateMatch;
  });

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div className="card-header-title">
          <i className="ri-speed-up-line"></i>
          <span>Driving Score</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>


          <div className="search-box">
            <i className="ri-search-line"></i>
            <input 
              type="text" 
              placeholder="Search Student ID or Name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ minWidth: 220 }}
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 16
                }}
                title="Clear search"
              >
                <i className="ri-close-circle-fill"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="table-container">
        {(!filteredVehicles || filteredVehicles.length === 0) ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
            <i className="ri-user-search-line" style={{ fontSize: 36, color: '#94a3b8', display: 'block', marginBottom: 12 }}></i>
            <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>No Drivers Found</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>No student driver matches your Student ID or Name search query.</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '18%' }}>Student ID</th>
                <th style={{ width: '22%' }}>Name</th>
                <th style={{ width: '18%' }}>Safety Score</th>
                <th style={{ width: '24%' }}>Last Violation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((item, i) => (
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
                    {item.isViolation ? (
                      <div>
                        <div style={{ fontWeight: 600, color: '#dc2626' }}>No Helmet (-10 pts)</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          {item.lastViolationDate || item.time || 'Today'}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#0f172a', fontWeight: 600, fontSize: 13 }}>
                        Compliant (No Violations)
                      </span>
                    )}
                  </td>
                  <td>
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
              ))}
            </tbody>
          </table>
        )}
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

      {/* 3-Term Semester Reset Modal */}
      {showSemesterModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div className="card" style={{ width: 540, padding: 24, borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="ri-refresh-line" style={{ fontSize: 22, color: '#2563eb' }}></i>
                <h4 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                  Academic Semester Score Reset Schedule
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowSemesterModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#64748b', cursor: 'pointer' }}
              >
                <i className="ri-close-line"></i>
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#475569', marginTop: 0, marginBottom: 16, lineHeight: 1.5 }}>
              Driver Safety Scores automatically restore to <strong>100 points</strong> at the start of each of the 3 academic terms per year:
            </p>

            {/* 3 Terms Schedule Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>1. Semester 1 (June – November)</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Auto-resets all scores to 100 at start of June (1 June)</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetSemesterScores('Semester 1 (June - Nov)')}
                  disabled={resettingSemester}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  Reset Term 1
                </button>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>2. Semester 2 (November – March)</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Auto-resets all scores to 100 at start of November (1 Nov)</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetSemesterScores('Semester 2 (Nov - Mar)')}
                  disabled={resettingSemester}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  Reset Term 2
                </button>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>3. Summer Term (April – May)</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Auto-resets all scores to 100 at start of April (1 April)</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetSemesterScores('Summer Term (Apr - May)')}
                  disabled={resettingSemester}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  Reset Summer
                </button>
              </div>
            </div>

            {resetSuccessMessage && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, marginBottom: 16 }}>
                <i className="ri-checkbox-circle-fill" style={{ marginRight: 6 }}></i>
                {resetSuccessMessage}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleResetSemesterScores('Current Academic Semester')}
                disabled={resettingSemester}
                style={{ background: '#2563eb', padding: '9px 18px', fontWeight: 700, fontSize: 12 }}
              >
                {resettingSemester ? 'Resetting All Scores...' : 'Reset All Driver Scores to 100 Now'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowSemesterModal(false)}
                style={{ padding: '9px 16px', fontWeight: 600, fontSize: 12 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

