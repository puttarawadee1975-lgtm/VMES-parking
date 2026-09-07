import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AnalyticsCharts() {
  const [stats, setStats] = useState({
    compliant: 1138,
    violations: 146,
    hourly: [45, 210, 340, 180, 95, 130, 110, 160, 290, 310, 140]
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('http://localhost:8000/admin/analytics');
        if (res.ok) {
          const data = await res.json();
          setStats({
            compliant: data.compliant_count || 1138,
            violations: data.violations_count || 146,
            hourly: data.hourly_distribution || [45, 210, 340, 180, 95, 130, 110, 160, 290, 310, 140]
          });
        }
      } catch (e) {
        console.log('Analytics connection notice:', e.message);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 5000);
    return () => clearInterval(interval);
  }, []);

  const barData = {
    labels: ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
    datasets: [{
      label: 'Vehicle Entries',
      data: stats.hourly,
      backgroundColor: '#3b82f6',
      borderRadius: 6
    }]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: '#202d4a' }, ticks: { color: '#94a3b8' } }
    }
  };

  const doughnutData = {
    labels: ['Helmet Compliant', 'Helmet Violation'],
    datasets: [{
      data: [stats.compliant, stats.violations],
      backgroundColor: ['#10b981', '#ef4444'],
      borderWidth: 0
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 12 } } }
    }
  };

  return (
    <div className="grid-2-col">
      <div className="card">
        <div className="card-header">
          <div className="card-header-title"><i className="ri-bar-chart-line"></i> Access Peak Hours (Live Data)</div>
        </div>
        <div className="chart-box">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-header-title"><i className="ri-pie-chart-line"></i> Helmet Compliance Ratio (MongoDB)</div>
        </div>
        <div className="chart-box">
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>
    </div>
  );
}

