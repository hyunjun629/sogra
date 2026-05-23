import React from 'react';

const REGIONS = [
  { id: 'daejeon', name: '대전', color: '#6366f1', x: 160, y: 200, width: 90, height: 80 },
  { id: 'sejong', name: '세종', color: '#8b5cf6', x: 130, y: 160, width: 60, height: 50 },
  { id: 'chungnam', name: '충남', color: '#06b6d4', x: 60, y: 160, width: 110, height: 110 },
  { id: 'chungbuk', name: '충북', color: '#10b981', x: 200, y: 140, width: 110, height: 120 },
];

export default function MapKorea({ storeCounts = {} }) {
  return (
    <div className="relative">
      <svg viewBox="0 0 360 340" className="w-full max-w-md mx-auto">
        {/* Background */}
        <rect width="360" height="340" fill="transparent" />

        {/* Region blocks */}
        {REGIONS.map(r => (
          <g key={r.id}>
            <rect
              x={r.x} y={r.y} width={r.width} height={r.height}
              rx="8" fill={r.color} fillOpacity="0.2"
              stroke={r.color} strokeWidth="1.5"
            />
            <text x={r.x + r.width / 2} y={r.y + r.height / 2 - 8} textAnchor="middle" fill={r.color} fontSize="14" fontWeight="bold">
              {r.name}
            </text>
            <text x={r.x + r.width / 2} y={r.y + r.height / 2 + 12} textAnchor="middle" fill={r.color} fontSize="12" opacity="0.8">
              {storeCounts[r.name] || 0}개 상점
            </text>
          </g>
        ))}

        {/* Label */}
        <text x="180" y="310" textAnchor="middle" fill="#71717a" fontSize="12">
          대전 · 세종 · 충남 · 충북 서비스 지역
        </text>
      </svg>
    </div>
  );
}
