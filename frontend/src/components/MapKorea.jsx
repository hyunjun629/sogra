import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const GEO_URL =
  'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-topo.json';

// 서비스 지역 — 지도 중심 좌표 (경도, 위도)
const SERVICE_REGIONS = [
  {
    key: '대전',
    label: { ko: '대전', en: 'Daejeon', zh: '大田' },
    coords: [127.385, 36.35],
    color: '#6366f1',
    geoNames: ['대전광역시'],
  },
  {
    key: '세종',
    label: { ko: '세종', en: 'Sejong', zh: '世宗' },
    coords: [127.289, 36.48],
    color: '#a78bfa',
    geoNames: ['세종특별자치시'],
  },
  {
    key: '충남',
    label: { ko: '충남', en: 'S.Chungcheong', zh: '忠南' },
    coords: [126.8, 36.62],
    color: '#06b6d4',
    geoNames: ['충청남도'],
  },
  {
    key: '충북',
    label: { ko: '충북', en: 'N.Chungcheong', zh: '忠北' },
    coords: [127.73, 36.77],
    color: '#10b981',
    geoNames: ['충청북도'],
  },
];

// 시도명 → 서비스 지역 색상 매핑
const GEO_COLOR_MAP = Object.fromEntries(
  SERVICE_REGIONS.flatMap(r => r.geoNames.map(n => [n, r.color]))
);

export default function MapKorea({ storeCounts = {} }) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.slice(0, 2) || 'ko';
  const [hovered, setHovered] = useState(null);
  const [geoLoaded, setGeoLoaded] = useState(false);

  return (
    <div className="relative w-full max-w-lg mx-auto select-none">
      {/* 지도 */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [127.8, 36.5], scale: 3800 }}
        width={500}
        height={520}
        onLoad={() => setGeoLoaded(true)}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) => {
            if (!geoLoaded && geographies.length > 0) setGeoLoaded(true);
            return geographies.map(geo => {
              const name = geo.properties.name_kor || geo.properties.name || '';
              const serviceColor = GEO_COLOR_MAP[name];
              const isService = !!serviceColor;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: {
                      fill: isService ? serviceColor + '33' : '#27272a',
                      stroke: isService ? serviceColor : '#3f3f46',
                      strokeWidth: isService ? 1.5 : 0.8,
                      outline: 'none',
                    },
                    hover: {
                      fill: isService ? serviceColor + '66' : '#3f3f46',
                      stroke: isService ? serviceColor : '#52525b',
                      strokeWidth: isService ? 2 : 0.8,
                      outline: 'none',
                    },
                    pressed: { outline: 'none' },
                  }}
                />
              );
            });
          }}
        </Geographies>

        {/* 서비스 지역 마커 */}
        {SERVICE_REGIONS.map(region => {
          const count = storeCounts[region.key] || 0;
          const isHovered = hovered === region.key;
          return (
            <Marker
              key={region.key}
              coordinates={region.coords}
              onMouseEnter={() => setHovered(region.key)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* 펄스 링 */}
              <circle r={isHovered ? 22 : 16} fill={region.color} fillOpacity={0.12}>
                <animate
                  attributeName="r"
                  from={isHovered ? 22 : 16}
                  to={isHovered ? 34 : 26}
                  dur="1.6s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="fill-opacity"
                  from="0.15"
                  to="0"
                  dur="1.6s"
                  repeatCount="indefinite"
                />
              </circle>
              {/* 중심 dot */}
              <circle
                r={isHovered ? 10 : 7}
                fill={region.color}
                fillOpacity={0.9}
                stroke="#18181b"
                strokeWidth={1.5}
                style={{ cursor: 'pointer', transition: 'r 0.2s' }}
              />
              {/* 라벨 */}
              <text
                textAnchor="middle"
                y={-16}
                style={{
                  fontSize: isHovered ? '13px' : '11px',
                  fontWeight: 700,
                  fill: region.color,
                  paintOrder: 'stroke',
                  stroke: '#18181b',
                  strokeWidth: 3,
                  transition: 'font-size 0.2s',
                  pointerEvents: 'none',
                }}
              >
                {region.label[lang] || region.label.ko}
              </text>
              {/* 상점 수 뱃지 (호버 시) */}
              {isHovered && (
                <g transform="translate(0, 18)">
                  <rect x={-28} y={-10} width={56} height={20} rx={10} fill={region.color} fillOpacity={0.9} />
                  <text
                    textAnchor="middle"
                    y={5}
                    style={{ fontSize: '11px', fontWeight: 700, fill: '#fff', pointerEvents: 'none' }}
                  >
                    {count}개 상점
                  </text>
                </g>
              )}
            </Marker>
          );
        })}
      </ComposableMap>

      {/* 범례 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap justify-center gap-3 mt-2"
      >
        {SERVICE_REGIONS.map(r => (
          <div
            key={r.key}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: r.color + '22', border: `1px solid ${r.color}55`, color: r.color }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />
            {r.label[lang] || r.label.ko}
            <span className="opacity-70">· {storeCounts[r.key] || 0}개 상점</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
