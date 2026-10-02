import React, { useState } from 'react';
import { getImageUrl } from '../api';

const THAILAND_TIME_ZONE = 'Asia/Bangkok';

const getThailandDateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: THAILAND_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map(({ type, value: partValue }) => [type, partValue]));
  return `${values.year}-${values.month}-${values.day}`;
};

const formatThailandDate = (value = new Date()) => {
  const key = getThailandDateKey(value);
  if (!key) return '';
  const [year, month, day] = key.split('-');
  return `${day}/${month}/${year}`;
};

export default function InspectionTable({
  logs,
  isOverview = false,
  onViewAllHistory,
  initialSearchQuery = '',
  initialViolationFilter = 'all'
}) {
  const [dateFilter, setDateFilter] = useState('today');
  const [selectedDate, setSelectedDate] = useState(getThailandDateKey());
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [violationFilter, setViolationFilter] = useState(initialViolationFilter); // 'all' | 'violations_only' | 'pass_only'
  const [gateFilter, setGateFilter] = useState('all'); // 'all' | 'entry' | 'exit'
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [modalImageError, setModalImageError] = useState(false);

  React.useEffect(() => {
    setSearchQuery(initialSearchQuery || '');
    if (initialSearchQuery) {
      setDateFilter('all');
    } else {
      setDateFilter('today');
    }
    setViolationFilter(initialViolationFilter || 'all');
  }, [initialSearchQuery, initialViolationFilter]);

  const filteredLogs = (logs || []).filter(item => {
    if (isOverview) return true;

    // 1. Violation Filter
    if (violationFilter === 'violations_only' && !item.isViolation) return false;
    if (violationFilter === 'helmet_only' && (!item.isViolation || (item.violationType && !item.violationType.toLowerCase().includes('helmet')))) return false;
    if (violationFilter === 'pass_only' && item.isViolation) return false;

    // 1.5 Gate Direction Filter (Entry / Exit)
    if (gateFilter === 'entry' && !(item.gate || '').toLowerCase().includes('entry') && !(item.action || '').toLowerCase().includes('entry')) return false;
    if (gateFilter === 'exit' && !(item.gate || '').toLowerCase().includes('exit') && !(item.action || '').toLowerCase().includes('exit')) return false;

    // 2. Date Filter
    let dateMatch = true;
    if (item.rawDate || item.timestamp) {
      const itemDate = item.rawDate ? new Date(item.rawDate) : (item.timestamp ? new Date(item.timestamp) : new Date());
      const todayKey = getThailandDateKey();
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayKey = getThailandDateKey(yesterday);
      const itemDateKey = getThailandDateKey(itemDate);

      if (dateFilter === 'today') {
        dateMatch = itemDateKey === todayKey;
      } else if (dateFilter === 'yesterday') {
        dateMatch = itemDateKey === yesterdayKey;
      } else if (dateFilter === 'custom' && selectedDate) {
        dateMatch = itemDateKey === selectedDate;
      }
    } else {
      dateMatch = dateFilter === 'today' || dateFilter === 'all';
    }

    if (!dateMatch) return false;

    // 3. User & Plate Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const ownerMatch = (item.owner || '').toLowerCase().includes(q);
      const plateMatch = (item.plate || '').toLowerCase().includes(q);
      const vehicleMatch = (item.vehicle || '').toLowerCase().includes(q);
      const gateMatch = (item.gate || '').toLowerCase().includes(q);
      const idMatch = (item.id || '').toLowerCase().includes(q);
      return ownerMatch || plateMatch || vehicleMatch || gateMatch || idMatch;
    }

    return true;
  });

  const displayLogs = isOverview ? filteredLogs.slice(0, 5) : filteredLogs;

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div className="card-header-title">
          <i className="ri-history-line"></i>
          <span>{isOverview ? 'Recent Gate Scans (Live Feed)' : 'Gate Access & Violation History'}</span>
        </div>

        {isOverview ? (
          <button
            className="btn btn-secondary btn-sm"
            style={{ color: '#0f172a', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={onViewAllHistory}
          >
            <i className="ri-arrow-right-line" style={{ color: '#2563eb' }}></i> View All History
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Search Input Box */}
            <div className="search-box">
              <i className="ri-search-line"></i>
              <input
                type="text"
                placeholder="Search User, Plate, or Gate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ minWidth: 180 }}
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

            {/* Violation Filter Dropdown */}
            <select
              value={violationFilter}
              onChange={(e) => setViolationFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#0f172a',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Logs & Scans</option>
              <option value="violations_only">All Violations (-10 pts)</option>
              <option value="helmet_only">No Helmet Violations (-10 pts)</option>
              <option value="pass_only">Pass Granted</option>
            </select>

            {/* Gate Filter Dropdown */}
            <select
              value={gateFilter}
              onChange={(e) => setGateFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#0f172a',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Gates (Entry & Exit)</option>
              <option value="entry">Entry Gate Only</option>
              <option value="exit">Exit Gate Only</option>
            </select>

            {/* Date Filter Dropdown */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#0f172a',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="custom">Select Date Calendar...</option>
              <option value="all">All History</option>
            </select>

            {dateFilter === 'custom' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: '5px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#0f172a',
                  background: '#ffffff',
                  border: '1px solid #2563eb',
                  borderRadius: 8,
                  outline: 'none'
                }}
              />
            )}

            <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, padding: '5px 12px' }}>
              {filteredLogs.length} Scans Logged
            </span>
          </div>
        )}
      </div>

      <div className="table-container">
        {(!displayLogs || displayLogs.length === 0) ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
            <i className="ri-radar-line" style={{ fontSize: 36, color: '#94a3b8', display: 'block', marginBottom: 12 }}></i>
            <div style={{ fontWeight: 600, color: '#0f172a' }}>No Vehicle Detections Found</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Plate Number</th>
                <th>Vehicle & Owner</th>
                <th>Violation</th>
                <th>Gate</th>
                <th>CCTV Snapshot</th>
                <th>Access Action</th>
              </tr>
            </thead>
            <tbody>
              {displayLogs.map((item, index) => {
                const isCar = (item.vehicle || '').toLowerCase().includes('car');
                const rawUrl = item.imageUrl || item.image_url || item.snapshot_base64 || item.snapshotUrl || item.image || item.photo || item.cctv_image_url || item.snapshot_url;
                const cleanUrl = typeof rawUrl === 'string' ? rawUrl.trim() : '';
                const hasPhoto = Boolean(
                  cleanUrl &&
                  cleanUrl.length > 15 &&
                  cleanUrl !== '-' &&
                  cleanUrl !== 'null' &&
                  cleanUrl !== 'undefined' &&
                  !cleanUrl.endsWith('base64,') &&
                  !cleanUrl.endsWith('base64')
                );
                const snapshotUrl = hasPhoto
                  ? ((cleanUrl.startsWith('http') || cleanUrl.startsWith('data:')) ? cleanUrl : getImageUrl(cleanUrl))
                  : null;

                const formattedDate = (() => {
                  let d = new Date();
                  if (item.rawDate) d = new Date(item.rawDate);
                  else if (item.timestamp) d = new Date(item.timestamp);
                  return !isNaN(d.getTime()) ? formatThailandDate(d) : formatThailandDate();
                })();

                return (
                  <tr key={index}>
                    <td style={{ fontWeight: 600, color: '#64748b', fontSize: 12 }}>{formattedDate}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{item.time}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{item.plate} {item.province && !item.plate.includes(item.province) ? item.province : ''}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.owner}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{item.vehicle}</div>
                    </td>
                    <td>
                      {(() => {
                        const vType = item.violationType || (item.helmet || '');
                        const isHelmetViol = String(vType).toUpperCase().includes('NO HELMET');
                        
                        if (isHelmetViol) {
                          return <span style={{ color: '#0f172a', fontWeight: 600 }}>No Helmet</span>;
                        }
                        if (item.isViolation && vType && vType !== '-') {
                          return <span style={{ color: '#0f172a', fontWeight: 600 }}>{vType}</span>;
                        }
                        return <span style={{ color: '#0f172a', fontWeight: 600 }}>-</span>;
                      })()}
                    </td>
                    <td style={{ color: '#0f172a', fontWeight: 500 }}>{item.gate}</td>
                    <td>
                      {hasPhoto ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#0f172a', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: 11, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          onClick={() => {
                            setModalImageError(false);
                            setSelectedSnapshot({ ...item, snapshotUrl });
                          }}
                        >
                          <i className="ri-image-line" style={{ color: '#0f172a' }}></i> View Photo
                        </button>
                      ) : (
                        <span style={{ color: '#0f172a', fontWeight: 600 }}>-</span>
                      )}
                    </td>
                    <td>
                      <span style={{ color: (item.isViolation && item.penaltyApplied !== false) ? '#dc2626' : '#059669', fontWeight: 700 }}>
                        {(!item.isViolation || item.penaltyApplied === false)
                          ? 'Pass Granted'
                          : 'Penalized (-10 pts)'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Snapshot Preview Modal */}
      {selectedSnapshot && (
        <div
          onClick={() => setSelectedSnapshot(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}
        >
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: 540, padding: 24, borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: 17, fontWeight: 800 }}>
                  <span>CCTV Gate Access Snapshot</span>
                </h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {(() => {
                    let d = new Date();
                    if (selectedSnapshot.rawDate) d = new Date(selectedSnapshot.rawDate);
                    else if (selectedSnapshot.timestamp) d = new Date(selectedSnapshot.timestamp);
                    const dateStr = !isNaN(d.getTime()) ? formatThailandDate(d) : formatThailandDate();
                    return `${dateStr} • ${selectedSnapshot.time || ''}`;
                  })()}
                </div>
              </div>
              <button
                onClick={() => setSelectedSnapshot(null)}
                style={{ background: 'none', border: 'none', fontSize: 22, color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              >
                <i className="ri-close-line"></i>
              </button>
            </div>

            {/* Image Frame */}
            {selectedSnapshot.snapshotUrl && !modalImageError ? (
              <div style={{ borderRadius: 14, overflow: 'hidden', border: '2px solid #e2e8f0', background: '#f8fafc', marginBottom: 16 }}>
                <img
                  src={selectedSnapshot.snapshotUrl}
                  alt="CCTV Gate Entry Snapshot"
                  onError={() => setModalImageError(true)}
                  style={{ width: '100%', height: 260, objectFit: 'cover', display: 'block' }}
                />
              </div>
            ) : (
              <div style={{ borderRadius: 14, overflow: 'hidden', border: '2px solid #e2e8f0', background: '#f8fafc', height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: 8, marginBottom: 16 }}>
                <i className="ri-image-off-line" style={{ fontSize: 36 }}></i>
                <span style={{ fontSize: 13, fontWeight: 600 }}>No CCTV Snapshot Available</span>
              </div>
            )}

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                Plate: {selectedSnapshot.plate} {selectedSnapshot.province && !selectedSnapshot.plate?.includes(selectedSnapshot.province) ? selectedSnapshot.province : ''}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginTop: 4 }}>
                Gate: {selectedSnapshot.gate}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginTop: 2 }}>
                Owner: {selectedSnapshot.owner}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
