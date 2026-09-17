import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const SAMPLE_ANNOUNCEMENTS = [
  {
    id: 'ANC-01',
    title: 'Zone B Parking Maintenance Notice',
    content: 'Zone B motorcycle parking area floor repainting scheduled for Sept 18.',
    priority: 'high',
    date: '14/09/2026',
    target_audience: 'all'
  },
  {
    id: 'ANC-02',
    title: 'Mandatory Helmet Safety Enforcement',
    content: 'Security officers will penalize non-helmet riders entering Gate 1.',
    priority: 'normal',
    date: '12/09/2026',
    target_audience: 'all_students'
  }
];

const SEMESTER_DATA = {
  '2026-1': {
    label: 'Semester 1 / 2026 (Current Term)',
    period: '01 Jun 2026 – 31 Oct 2026',
    totalScans: 14820,
    violationsCount: 146,
    avgSafetyScore: 94,
    avgOccupancyRate: '76.4%',
    occupancyPct: 76.4,
    operatingHoursText: 'จันทร์ – ศุกร์ (09:00 – 16:30 น.)',
    hourlyOccupancy: [
      { time: '09:00', avgSlots: 245, ratePct: 49.0 },
      { time: '10:00', avgSlots: 380, ratePct: 76.0 },
      { time: '11:00', avgSlots: 462, ratePct: 92.4 },
      { time: '12:00', avgSlots: 445, ratePct: 89.0 },
      { time: '13:00', avgSlots: 450, ratePct: 90.0 },
      { time: '14:00', avgSlots: 410, ratePct: 82.0 },
      { time: '15:00', avgSlots: 325, ratePct: 65.0 },
      { time: '16:00', avgSlots: 210, ratePct: 42.0 },
      { time: '16:30', avgSlots: 110, ratePct: 22.0 }
    ],
    vehicleType: {
      motorcycles: { trips: 10107, pct: 68.2 },
      cars: { trips: 4713, pct: 31.8 }
    },
    userType: {
      registered: { trips: 11633, pct: 78.5 },
      unregistered: { trips: 3187, pct: 21.5 }
    },
    violationBreakdown: [
      { title: 'No Helmet (ไม่สวมหมวกนิรภัย)', count: 99, pct: 67.8, color: '#dc2626' },
      { title: 'VMES Overtime >30 Mins (จอดเกินเวลา)', count: 32, pct: 21.9, color: '#2563eb' },
      { title: 'Speeding in Campus (ขับรถเร็วเกินกำหนด)', count: 10, pct: 6.8, color: '#d97706' },
      { title: 'Unauthorized Zone (จอดนอกพื้นที่)', count: 5, pct: 3.4, color: '#7c3aed' }
    ],
    occupancyDetails: {
      totalOccupiedHours: 252120,
      capacity: 500,
      termWeekdays: 88,
      dailyHours: 7.5,
      totalOperatingHours: 660
    },
    monthlyTrend: [
      { month: 'Jun', traffic: 2840, violations: 32 },
      { month: 'Jul', traffic: 3450, violations: 41 },
      { month: 'Aug', traffic: 3100, violations: 28 },
      { month: 'Sep', traffic: 3220, violations: 25 },
      { month: 'Oct', traffic: 2210, violations: 20 },
    ]
  },
  '2025-2': {
    label: 'Semester 2 / 2025',
    period: '01 Nov 2025 – 31 Mar 2026',
    totalScans: 16450,
    violationsCount: 182,
    avgSafetyScore: 92,
    avgOccupancyRate: '81.2%',
    occupancyPct: 81.2,
    operatingHoursText: 'จันทร์ – ศุกร์ (09:00 – 16:30 น.)',
    hourlyOccupancy: [
      { time: '09:00', avgSlots: 270, ratePct: 54.0 },
      { time: '10:00', avgSlots: 410, ratePct: 82.0 },
      { time: '11:00', avgSlots: 480, ratePct: 96.0 },
      { time: '12:00', avgSlots: 468, ratePct: 93.6 },
      { time: '13:00', avgSlots: 472, ratePct: 94.4 },
      { time: '14:00', avgSlots: 435, ratePct: 87.0 },
      { time: '15:00', avgSlots: 350, ratePct: 70.0 },
      { time: '16:00', avgSlots: 230, ratePct: 46.0 },
      { time: '16:30', avgSlots: 120, ratePct: 24.0 }
    ],
    vehicleType: {
      motorcycles: { trips: 11186, pct: 68.0 },
      cars: { trips: 5264, pct: 32.0 }
    },
    userType: {
      registered: { trips: 12535, pct: 76.2 },
      unregistered: { trips: 3915, pct: 23.8 }
    },
    violationBreakdown: [
      { title: 'No Helmet (ไม่สวมหมวกนิรภัย)', count: 124, pct: 68.1, color: '#dc2626' },
      { title: 'VMES Overtime >30 Mins (จอดเกินเวลา)', count: 42, pct: 23.1, color: '#2563eb' },
      { title: 'Speeding in Campus (ขับรถเร็วเกินกำหนด)', count: 11, pct: 6.0, color: '#d97706' },
      { title: 'Unauthorized Zone (จอดนอกพื้นที่)', count: 5, pct: 2.8, color: '#7c3aed' }
    ],
    occupancyDetails: {
      totalOccupiedHours: 267960,
      capacity: 500,
      termWeekdays: 88,
      dailyHours: 7.5,
      totalOperatingHours: 660
    },
    monthlyTrend: [
      { month: 'Nov', traffic: 3120, violations: 42 },
      { month: 'Dec', traffic: 3540, violations: 38 },
      { month: 'Jan', traffic: 3680, violations: 45 },
      { month: 'Feb', traffic: 2980, violations: 29 },
      { month: 'Mar', traffic: 3130, violations: 28 },
    ]
  },
  '2025-3': {
    label: 'Semester 3 / 2025 (Summer)',
    period: '01 Apr 2026 – 31 May 2026',
    totalScans: 6200,
    violationsCount: 45,
    avgSafetyScore: 96,
    avgOccupancyRate: '58.4%',
    occupancyPct: 58.4,
    operatingHoursText: 'จันทร์ – ศุกร์ (09:00 – 16:30 น.)',
    hourlyOccupancy: [
      { time: '09:00', avgSlots: 180, ratePct: 36.0 },
      { time: '10:00', avgSlots: 290, ratePct: 58.0 },
      { time: '11:00', avgSlots: 360, ratePct: 72.0 },
      { time: '12:00', avgSlots: 340, ratePct: 68.0 },
      { time: '13:00', avgSlots: 350, ratePct: 70.0 },
      { time: '14:00', avgSlots: 310, ratePct: 62.0 },
      { time: '15:00', avgSlots: 220, ratePct: 44.0 },
      { time: '16:00', avgSlots: 140, ratePct: 28.0 },
      { time: '16:30', avgSlots: 70, ratePct: 14.0 }
    ],
    vehicleType: {
      motorcycles: { trips: 4216, pct: 68.0 },
      cars: { trips: 1984, pct: 32.0 }
    },
    userType: {
      registered: { trips: 5084, pct: 82.0 },
      unregistered: { trips: 1116, pct: 18.0 }
    },
    violationBreakdown: [
      { title: 'No Helmet (ไม่สวมหมวกนิรภัย)', count: 31, pct: 68.9, color: '#dc2626' },
      { title: 'VMES Overtime >30 Mins (จอดเกินเวลา)', count: 10, pct: 22.2, color: '#2563eb' },
      { title: 'Speeding in Campus (ขับรถเร็วเกินกำหนด)', count: 3, pct: 6.7, color: '#d97706' },
      { title: 'Unauthorized Zone (จอดนอกพื้นที่)', count: 1, pct: 2.2, color: '#7c3aed' }
    ],
    occupancyDetails: {
      totalOccupiedHours: 105120,
      capacity: 500,
      termWeekdays: 42,
      dailyHours: 7.5,
      totalOperatingHours: 315
    },
    monthlyTrend: [
      { month: 'Apr', traffic: 3050, violations: 22 },
      { month: 'May', traffic: 3150, violations: 23 },
    ]
  },
  '2025-1': {
    label: 'Semester 1 / 2025',
    period: '01 Jun 2025 – 31 Oct 2025',
    totalScans: 15200,
    violationsCount: 204,
    avgSafetyScore: 90,
    avgOccupancyRate: '74.8%',
    occupancyPct: 74.8,
    operatingHoursText: 'จันทร์ – ศุกร์ (09:00 – 16:30 น.)',
    hourlyOccupancy: [
      { time: '09:00', avgSlots: 230, ratePct: 46.0 },
      { time: '10:00', avgSlots: 365, ratePct: 73.0 },
      { time: '11:00', avgSlots: 446, ratePct: 89.2 },
      { time: '12:00', avgSlots: 430, ratePct: 86.0 },
      { time: '13:00', avgSlots: 438, ratePct: 87.6 },
      { time: '14:00', avgSlots: 395, ratePct: 79.0 },
      { time: '15:00', avgSlots: 310, ratePct: 62.0 },
      { time: '16:00', avgSlots: 200, ratePct: 40.0 },
      { time: '16:30', avgSlots: 105, ratePct: 21.0 }
    ],
    vehicleType: {
      motorcycles: { trips: 10184, pct: 67.0 },
      cars: { trips: 5016, pct: 33.0 }
    },
    userType: {
      registered: { trips: 11248, pct: 74.0 },
      unregistered: { trips: 3952, pct: 26.0 }
    },
    violationBreakdown: [
      { title: 'No Helmet (ไม่สวมหมวกนิรภัย)', count: 142, pct: 69.6, color: '#dc2626' },
      { title: 'VMES Overtime >30 Mins (จอดเกินเวลา)', count: 46, pct: 22.5, color: '#2563eb' },
      { title: 'Speeding in Campus (ขับรถเร็วเกินกำหนด)', count: 10, pct: 4.9, color: '#d97706' },
      { title: 'Unauthorized Zone (จอดนอกพื้นที่)', count: 6, pct: 2.9, color: '#7c3aed' }
    ],
    occupancyDetails: {
      totalOccupiedHours: 246840,
      capacity: 500,
      termWeekdays: 88,
      dailyHours: 7.5,
      totalOperatingHours: 660
    },
    monthlyTrend: [
      { month: 'Jun', traffic: 2950, violations: 48 },
      { month: 'Jul', traffic: 3610, violations: 52 },
      { month: 'Aug', traffic: 3280, violations: 41 },
      { month: 'Sep', traffic: 3160, violations: 36 },
      { month: 'Oct', traffic: 2200, violations: 27 },
    ]
  },
  '2024-2': {
    label: 'Semester 2 / 2024',
    period: '01 Nov 2024 – 31 Mar 2025',
    totalScans: 14100,
    violationsCount: 220,
    avgSafetyScore: 89,
    avgOccupancyRate: '71.5%',
    occupancyPct: 71.5,
    operatingHoursText: 'จันทร์ – ศุกร์ (09:00 – 16:30 น.)',
    hourlyOccupancy: [
      { time: '09:00', avgSlots: 220, ratePct: 44.0 },
      { time: '10:00', avgSlots: 350, ratePct: 70.0 },
      { time: '11:00', avgSlots: 430, ratePct: 86.0 },
      { time: '12:00', avgSlots: 415, ratePct: 83.0 },
      { time: '13:00', avgSlots: 420, ratePct: 84.0 },
      { time: '14:00', avgSlots: 380, ratePct: 76.0 },
      { time: '15:00', avgSlots: 295, ratePct: 59.0 },
      { time: '16:00', avgSlots: 185, ratePct: 37.0 },
      { time: '16:30', avgSlots: 95, ratePct: 19.0 }
    ],
    vehicleType: {
      motorcycles: { trips: 9306, pct: 66.0 },
      cars: { trips: 4794, pct: 34.0 }
    },
    userType: {
      registered: { trips: 10124, pct: 71.8 },
      unregistered: { trips: 3976, pct: 28.2 }
    },
    violationBreakdown: [
      { title: 'No Helmet (ไม่สวมหมวกนิรภัย)', count: 155, pct: 70.5, color: '#dc2626' },
      { title: 'VMES Overtime >30 Mins (จอดเกินเวลา)', count: 48, pct: 21.8, color: '#2563eb' },
      { title: 'Speeding in Campus (ขับรถเร็วเกินกำหนด)', count: 11, pct: 5.0, color: '#d97706' },
      { title: 'Unauthorized Zone (จอดนอกพื้นที่)', count: 6, pct: 2.7, color: '#7c3aed' }
    ],
    occupancyDetails: {
      totalOccupiedHours: 235950,
      capacity: 500,
      termWeekdays: 88,
      dailyHours: 7.5,
      totalOperatingHours: 660
    },
    monthlyTrend: [
      { month: 'Nov', traffic: 2800, violations: 50 },
      { month: 'Dec', traffic: 3200, violations: 48 },
      { month: 'Jan', traffic: 3400, violations: 54 },
      { month: 'Feb', traffic: 2600, violations: 38 },
      { month: 'Mar', traffic: 2100, violations: 30 },
    ]
  }
};

export default function LiveOverviewDashboard({
  logs,
  vehicles,
  onNavigate,
}) {
  const [selectedTerm, setSelectedTerm] = useState('2026-1');
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [liveTermSummary, setLiveTermSummary] = useState(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:8000/admin/term-summary?term=${selectedTerm}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.totalScans) {
          setLiveTermSummary(data);
        }
      })
      .catch(() => { });
  }, [selectedTerm]);

  const currentTermData = useMemo(() => {
    const base = SEMESTER_DATA[selectedTerm] || SEMESTER_DATA['2026-1'];
    if (!liveTermSummary) return base;
    return {
      ...base,
      totalScans: liveTermSummary.totalScans || base.totalScans,
      violationsCount: liveTermSummary.violationsCount || base.violationsCount,
      avgSafetyScore: liveTermSummary.avgSafetyScore || base.avgSafetyScore,
      vehicleType: liveTermSummary.vehicleType || base.vehicleType,
      userType: liveTermSummary.userType || base.userType
    };
  }, [selectedTerm, liveTermSummary]);

  const termTrendData = useMemo(() => {
    const base = SEMESTER_DATA[selectedTerm] || SEMESTER_DATA['2026-1'];
    const trend = base.monthlyTrend || [];
    const totalScans = currentTermData.totalScans || trend.reduce((s, m) => s + m.traffic, 0) || 1;
    const totalViolations = currentTermData.violationsCount || trend.reduce((s, m) => s + m.violations, 0) || 1;

    const maxTraffic = Math.max(...trend.map(m => m.traffic), 1);
    const maxViolations = Math.max(...trend.map(m => m.violations), 1);

    return trend.map((m) => {
      const trafficPct = parseFloat(((m.traffic / totalScans) * 100).toFixed(1));
      const violationPct = parseFloat(((m.violations / totalViolations) * 100).toFixed(1));
      const trafficHeightPct = Math.max(16, Math.round((m.traffic / maxTraffic) * 100));
      const violationHeightPct = Math.max(16, Math.round((m.violations / maxViolations) * 100));

      return {
        month: m.month,
        traffic: m.traffic,
        trafficPct,
        trafficHeightPct,
        violations: m.violations,
        violationPct,
        violationHeightPct
      };
    });
  }, [selectedTerm, currentTermData]);

  const avgSafetyScore = useMemo(() => {
    if (liveTermSummary?.avgSafetyScore) return liveTermSummary.avgSafetyScore;
    if (!vehicles || vehicles.length === 0) return currentTermData.avgSafetyScore;
    const sum = vehicles.reduce((acc, v) => acc + (v.score ?? 100), 0);
    return Math.round(sum / vehicles.length);
  }, [vehicles, currentTermData, liveTermSummary]);

  // Chart 4 Config: Time-based Occupancy Rate (Hourly Trend Line)
  const hourlyChartData = useMemo(() => {
    const list = currentTermData.hourlyOccupancy || [];
    return {
      labels: list.map(item => item.time),
      datasets: [
        {
          label: 'Hourly Occupancy Rate (%)',
          data: list.map(item => item.ratePct),
          borderColor: '#0284c7',
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 240);
            gradient.addColorStop(0, 'rgba(2, 132, 199, 0.35)');
            gradient.addColorStop(1, 'rgba(2, 132, 199, 0.01)');
            return gradient;
          },
          fill: true,
          tension: 0.38,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: '#0284c7',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        }
      ]
    };
  }, [currentTermData]);

  const hourlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 12,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        cornerRadius: 10,
        callbacks: {
          label: (context) => {
            const idx = context.dataIndex;
            const item = currentTermData.hourlyOccupancy[idx];
            return [
              `Occupancy Rate: ${context.parsed.y}%`,
              `Avg Occupied Slots: ${item?.avgSlots || 0} / 500 slots`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 12, weight: '600' } }
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: '#f1f5f9' },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
          callback: (val) => `${val}%`
        }
      }
    }
  };

  // Chart 5 Config: Gate Traffic Motorcycles vs Cars Pie/Doughnut Chart
  const vehiclePieData = useMemo(() => {
    const vt = currentTermData.vehicleType;
    return {
      labels: ['Motorcycles (รถจักรยานยนต์)', 'Cars (รถยนต์)'],
      datasets: [
        {
          data: [vt.motorcycles.trips, vt.cars.trips],
          backgroundColor: ['#2563eb', '#059669'],
          borderWidth: 3,
          borderColor: '#ffffff',
          hoverOffset: 6
        }
      ]
    };
  }, [currentTermData]);

  const vehiclePieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const vt = currentTermData.vehicleType;
            const isMoto = context.dataIndex === 0;
            const item = isMoto ? vt.motorcycles : vt.cars;
            return ` Gate Traffic: ${item.trips.toLocaleString()} trips (${item.pct}%)`;
          }
        }
      }
    },
    cutout: '68%'
  };

  // Chart 6 Config: Gate Traffic Registered vs Unregistered Users Pie/Doughnut Chart
  const userPieData = useMemo(() => {
    const ut = currentTermData.userType;
    return {
      labels: ['Registered Users (ผู้ลงทะเบียน)', 'Unregistered / Guests (ผู้ใช้ทั่วไป)'],
      datasets: [
        {
          data: [ut.registered.trips, ut.unregistered.trips],
          backgroundColor: ['#7c3aed', '#f59e0b'],
          borderWidth: 3,
          borderColor: '#ffffff',
          hoverOffset: 6
        }
      ]
    };
  }, [currentTermData]);

  const userPieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const ut = currentTermData.userType;
            const isReg = context.dataIndex === 0;
            const item = isReg ? ut.registered : ut.unregistered;
            return ` Gate Traffic: ${item.trips.toLocaleString()} trips (${item.pct}%)`;
          }
        }
      }
    },
    cutout: '68%'
  };

  const maxTrafficInTrend = useMemo(() => {
    return Math.max(...currentTermData.monthlyTrend.map(m => m.traffic), 4000);
  }, [currentTermData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Term Selector & Control Header Bar */}
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        border: '1px solid #e2e8f0',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            fontSize: 22
          }}>
            <i className="ri-calendar-event-line"></i>
          </div>
          <div>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: 14,
                fontWeight: 800,
                color: '#0f172a',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {Object.keys(SEMESTER_DATA).map(key => (
                <option key={key} value={key}>
                  {SEMESTER_DATA[key].label}
                </option>
              ))}
            </select>
          </div>
        </div>


      </div>

      {/* Top 4 Term Summary KPI Cards */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {/* Requirement 1: Term Gate Traffic */}
        <div className="kpi-card" style={{
          background: '#ffffff',
          padding: '20px 24px',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: '#eff6ff',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            flexShrink: 0
          }}>
            <i className="ri-scan-2-line" style={{ color: '#2563eb', fontSize: 24 }}></i>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Gate Traffic (Trips)</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {currentTermData.totalScans.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 700, lineHeight: 1.3 }}>
              Total Vehicle Entry & Exit Traffic
            </div>
          </div>
        </div>

        {/* Requirement 2: Term Violations (ผู้ทำผิดรวมทุกกรณี) */}
        <div className="kpi-card" style={{
          background: '#ffffff',
          padding: '20px 24px',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            flexShrink: 0
          }}>
            <i className="ri-error-warning-line" style={{ color: '#dc2626', fontSize: 24 }}></i>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Violations</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {currentTermData.violationsCount.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>
              Total Violations Count
            </div>
          </div>
        </div>

        {/* Requirement 3: Overall Term Occupancy Rate */}
        <div className="kpi-card" style={{
          background: '#ffffff',
          padding: '20px 24px',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: '#e0f2fe',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            flexShrink: 0
          }}>
            <i className="ri-parking-box-line" style={{ color: '#0284c7', fontSize: 24 }}></i>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Overall Term Occupancy Rate</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {currentTermData.avgOccupancyRate}
            </div>
            <div style={{ fontSize: 11, color: '#0284c7', fontWeight: 700 }}>
              คำนวณตามสูตรเปิดบริการ 09:00 - 16:30 น.
            </div>
          </div>
        </div>

        {/* Card 4: Avg Driver Safety Score */}
        <div className="kpi-card" style={{
          background: '#ffffff',
          padding: '20px 24px',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: '#f3e8ff',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            flexShrink: 0
          }}>
            <i className="ri-shield-line" style={{ color: '#7c3aed', fontSize: 24 }}></i>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Avg. Term Safety Score</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {avgSafetyScore} <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>/ 100</span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
              {(vehicles || []).length > 0 ? (vehicles || []).length : 1} Registered Vehicles
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout: 2 Main Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '62% 36%', gap: 20 }}>

        {/* Left Column (62%): Charts & Trends */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Requirement 4: Time-based Occupancy Rate (Hourly Trend Line) */}
          <div className="card" style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ri-line-chart-line" style={{ color: '#0284c7' }}></i> Time-based Occupancy Rate (Hourly Trend Line)
                </h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  อัตราความหนาแน่นของการเข้าจอดแยกตามรายชั่วโมง (เฉพาะเวลาเปิดบริการ 09:00 – 16:30 น.)
                </div>
              </div>


            </div>



            {/* Interactive Line Chart */}
            <div style={{ height: 260 }}>
              <Line data={hourlyChartData} options={hourlyChartOptions} />
            </div>
          </div>

          {/* Gate Traffic & Violation Audit (Selected Year-Term) */}
          <div className="card" style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                  Gate Traffic & Violation ({selectedTerm})
                </h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  การเปรียบเทียบสถิติจราจรทางเข้า-ออก และการทำผิดกฎประจำปีการศึกษาและเทอม {selectedTerm} (เชื่อมต่อ MongoDB Atlas Database)
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, fontWeight: 700 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#2563eb' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)' }}></span> Gate Scans (Trips)
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#dc2626' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)' }}></span> Violations
                </span>
              </div>
            </div>

            {/* Side-by-Side Double Bar Chart Visual with Clean Hover Tooltips */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${termTrendData.length}, 1fr)`,
              gap: 16,
              height: 220,
              alignItems: 'flex-end',
              paddingTop: 36
            }}>
              {termTrendData.map((m, idx) => {
                const trafficKey = `traffic-${idx}`;
                const violationKey = `violation-${idx}`;
                const isTrafficHovered = hoveredBarIndex === trafficKey;
                const isViolationHovered = hoveredBarIndex === violationKey;

                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                    {/* Double Bar Cylinder Container */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: '78%', width: '100%', justifyContent: 'center' }}>
                      
                      {/* Bar 1: Gate Traffic (Blue) */}
                      <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                        {isTrafficHovered && (
                          <div style={{
                            position: 'absolute',
                            bottom: '105%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#0f172a',
                            color: '#ffffff',
                            padding: '5px 10px',
                            borderRadius: 8,
                            boxShadow: '0 4px 14px rgba(15,23,42,0.25)',
                            fontSize: 12,
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            zIndex: 25,
                            pointerEvents: 'none'
                          }}>
                            {m.traffic.toLocaleString()} ครั้ง ({m.trafficPct}%)
                          </div>
                        )}
                        <div
                          onMouseEnter={() => setHoveredBarIndex(trafficKey)}
                          onMouseLeave={() => setHoveredBarIndex(null)}
                          style={{
                            width: 24,
                            height: `${m.trafficHeightPct}%`,
                            background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                            borderRadius: '6px 6px 0 0',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            transform: isTrafficHovered ? 'scaleY(1.05)' : 'scaleY(1)',
                            boxShadow: isTrafficHovered ? '0 4px 12px rgba(37,99,235,0.4)' : 'none',
                            opacity: hoveredBarIndex && !isTrafficHovered ? 0.7 : 1
                          }}
                        />
                      </div>

                      {/* Bar 2: Violations (Red) */}
                      <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                        {isViolationHovered && (
                          <div style={{
                            position: 'absolute',
                            bottom: '105%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#0f172a',
                            color: '#ffffff',
                            padding: '5px 10px',
                            borderRadius: 8,
                            boxShadow: '0 4px 14px rgba(15,23,42,0.25)',
                            fontSize: 12,
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            zIndex: 25,
                            pointerEvents: 'none'
                          }}>
                            {m.violations.toLocaleString()} รายการ ({m.violationPct}%)
                          </div>
                        )}
                        <div
                          onMouseEnter={() => setHoveredBarIndex(violationKey)}
                          onMouseLeave={() => setHoveredBarIndex(null)}
                          style={{
                            width: 24,
                            height: `${m.violationHeightPct}%`,
                            background: 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)',
                            borderRadius: '6px 6px 0 0',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            transform: isViolationHovered ? 'scaleY(1.05)' : 'scaleY(1)',
                            boxShadow: isViolationHovered ? '0 4px 12px rgba(220,38,38,0.4)' : 'none',
                            opacity: hoveredBarIndex && !isViolationHovered ? 0.7 : 1
                          }}
                        />
                      </div>

                    </div>

                    {/* Column Label */}
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{m.month}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (36%): Pie Charts & Formula Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Requirements 5 & 6 Side-by-Side Grid or Card Stacks */}
          {/* Requirement 5: Pie Chart comparing Motorcycles vs Cars */}
          <div className="card" style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ri-pie-chart-2-line" style={{ color: '#2563eb' }}></i> Gate Traffic: Motorcycles vs Cars
            </h4>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 150 }}>
              <div style={{ width: 140, height: 140, position: 'relative', flexShrink: 0 }}>
                <Doughnut data={vehiclePieData} options={vehiclePieOptions} />
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none'
                }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                    {currentTermData.vehicleType.motorcycles.pct}%
                  </div>
                  <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>Moto Ratio</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexGrow: 1 }}>
                <div style={{ padding: '8px 12px', background: '#eff6ff', borderRadius: 10, border: '1px solid #dbeafe' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }}></span>
                    <i className="ri-motorbike-line"></i> Motorcycles (จักรยานยนต์)
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1e3a8a', marginTop: 2 }}>
                    {currentTermData.vehicleType.motorcycles.trips.toLocaleString()} trips ({currentTermData.vehicleType.motorcycles.pct}%)
                  </div>
                </div>

                <div style={{ padding: '8px 12px', background: '#ecfdf5', borderRadius: 10, border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#065f46', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }}></span>
                    <i className="ri-car-line"></i> Cars (รถยนต์)
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#064e3b', marginTop: 2 }}>
                    {currentTermData.vehicleType.cars.trips.toLocaleString()} trips ({currentTermData.vehicleType.cars.pct}%)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Requirement 6: Pie Chart comparing Registered vs Unregistered Users */}
          <div className="card" style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ri-pie-chart-box-line" style={{ color: '#7c3aed' }}></i> Gate Traffic: Registered vs Unregistered
            </h4>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 150 }}>
              <div style={{ width: 140, height: 140, position: 'relative', flexShrink: 0 }}>
                <Doughnut data={userPieData} options={userPieOptions} />
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none'
                }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                    {currentTermData.userType.registered.pct}%
                  </div>
                  <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>Reg. Ratio</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexGrow: 1 }}>
                <div style={{ padding: '8px 12px', background: '#f3e8ff', borderRadius: 10, border: '1px solid #e9d5ff' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b21a8', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed' }}></span>
                    <i className="ri-user-star-line"></i> Registered Users
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#581c87', marginTop: 2 }}>
                    {currentTermData.userType.registered.trips.toLocaleString()} trips ({currentTermData.userType.registered.pct}%)
                  </div>
                </div>

                <div style={{ padding: '8px 12px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}></span>
                    <i className="ri-user-shared-line"></i> Unregistered (Guest)
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#78350f', marginTop: 2 }}>
                    {currentTermData.userType.unregistered.trips.toLocaleString()} trips ({currentTermData.userType.unregistered.pct}%)
                  </div>
                </div>
              </div>
            </div>
          </div>





        </div>
      </div>
    </div>
  );
}
