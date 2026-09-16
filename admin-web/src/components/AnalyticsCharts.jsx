import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AnalyticsCharts() {
  const barData = {
    labels: ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
    datasets: [{
      label: 'Vehicle Entries',
      data: [45, 210, 340, 180, 95, 130, 110, 160, 290, 310, 140],
      backgroundColor: '#3b82f6',
      borderRadius: 6
    }]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const raw = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const pct = total > 0 ? ((raw / total) * 100).toFixed(1) : '0';
            return `${context.dataset.label || 'Entries'}: ${raw.toLocaleString()} vehicles (${pct}%)`;
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: '#202d4a' }, ticks: { color: '#94a3b8' } }
    }
  };

  const doughnutData = {
    labels: ['Helmet Compliant', 'Helmet Violation'],
    datasets: [{
      data: [1138, 146],
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
    <div class="grid-2-col">
      <div class="card">
        <div class="card-header">
          <div class="card-header-title"><i class="ri-bar-chart-line"></i> Access Peak Hours</div>
        </div>
        <div class="chart-box">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-header-title"><i class="ri-pie-chart-line"></i> Helmet Compliance Ratio</div>
        </div>
        <div class="chart-box">
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>
    </div>
  );
}
