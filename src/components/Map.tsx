import React, { useEffect, useState } from 'react';
import { Country } from '../utils/geo';
import { getCountryFlag } from '../utils/flags';
import countries from '../utils/geo';
import { FeatureCollection, Geometry } from 'geojson';
import { geoPath } from 'd3-geo';
// @ts-expect-error: No types for d3-geo-projection
import { geoRobinson } from 'd3-geo-projection';

const MAP_WIDTH = 1920;
const MAP_HEIGHT = 974.83;

// The downloaded SVG is 1920x975, so we need to scale our overlay accordingly
const SVG_WORLD_MAP_WIDTH = 1920;
const SVG_WORLD_MAP_HEIGHT = 975;

// Set up Robinson projection to fit the SVG map
const projection = geoRobinson()
  .fitExtent(
    [ [0, 0], [MAP_WIDTH, MAP_HEIGHT] ],
    { type: 'Sphere' }
  );

function latLngToSVG(lat: number, lng: number) {
  // D3 expects [lng, lat]
  const [x, y] = projection([lng, lat]);
  return { x, y };
}

type MapProps = {
  country1: Country;
  country2: Country;
  answer: Country;
  guesses: { name: string; distance: number; direction: string }[];
};

const Map: React.FC<MapProps> = ({ country1, country2, answer, guesses }) => {
  const [geoData, setGeoData] = useState<FeatureCollection<Geometry> | null>(null);

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + '/data/world-countries.geojson')
      .then(res => res.json())
      .then(data => setGeoData(data));
  }, []);

  if (!geoData) {
    return <div>Loading map...</div>;
  }

  const pathGenerator = geoPath(projection);

  const pos1 = latLngToSVG(country1.lat, country1.lng);
  const pos2 = latLngToSVG(country2.lat, country2.lng);
  const posAnswer = latLngToSVG(answer.lat, answer.lng);

  // Scale overlay to fit our display size
  const scaleX = MAP_WIDTH / SVG_WORLD_MAP_WIDTH;
  const scaleY = MAP_HEIGHT / SVG_WORLD_MAP_HEIGHT;

  function scale(pos: { x: number; y: number }) {
    return { x: pos.x * scaleX, y: pos.y * scaleY };
  }

  // Project all relevant points
  const points = [
    latLngToSVG(country1.lat, country1.lng),
    latLngToSVG(country2.lat, country2.lng),
    latLngToSVG(answer.lat, answer.lng),
    ...guesses.map((g: any) => {
      const c = countries.find((c) => c.name.toLowerCase() === g.name.toLowerCase());
      return c ? latLngToSVG(c.lat, c.lng) : null;
    }).filter(Boolean)
  ];

  // Filter out nulls from points
  const validPoints = points.filter((p): p is { x: number; y: number } => p !== null);
  const xs = validPoints.map((p) => p.x);
  const ys = validPoints.map((p) => p.y);
  let minX = Math.min(...xs);
  let maxX = Math.max(...xs);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);

  // Add padding (50% of width/height for maximum zoom out)
  const padX = (maxX - minX) * 0.5;
  const padY = (maxY - minY) * 0.5;
  minX = Math.max(0, minX - padX);
  maxX = Math.min(MAP_WIDTH, maxX + padX);
  minY = Math.max(0, minY - padY);
  maxY = Math.min(MAP_HEIGHT, maxY + padY);
  const viewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;

  return (
    <div style={{ marginTop: 20, textAlign: 'center' }}>
      <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32 }}>
        <div style={{ border: '1px solid #ccc', borderRadius: 12, padding: '12px 20px', minWidth: 120, textAlign: 'center', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 28 }}>{getCountryFlag(country1.name)}</div>
          <div style={{ fontWeight: 'bold', fontSize: 16, marginTop: 6 }}>{country1.name}</div>
        </div>
        <div style={{ border: '2px solid #51cf66', borderRadius: 12, padding: '12px 20px', minWidth: 120, textAlign: 'center', background: '#f6fff8', boxShadow: '0 2px 8px rgba(81,207,102,0.08)' }}>
          <div style={{ fontSize: 28 }}>{getCountryFlag(answer.name)}</div>
          <div style={{ fontWeight: 'bold', fontSize: 16, marginTop: 6 }}>{answer.name} <span style={{ color: '#51cf66', fontWeight: 500 }}>(Middle)</span></div>
        </div>
        <div style={{ border: '1px solid #ccc', borderRadius: 12, padding: '12px 20px', minWidth: 120, textAlign: 'center', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 28 }}>{getCountryFlag(country2.name)}</div>
          <div style={{ fontWeight: 'bold', fontSize: 16, marginTop: 6 }}>{country2.name}</div>
        </div>
      </div>
      {guesses.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          {guesses.map((g: any, i: number) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8f9fa', borderRadius: 12, padding: '14px 24px', fontSize: 18, border: '1.5px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', minWidth: 160, fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
                <span style={{ fontWeight: 700, fontSize: 24 }}>{i + 1}.</span>
                <span style={{ fontSize: 22 }}>{getCountryFlag(g.name)}</span>
                <span>{g.name}</span>
              </span>
              <span style={{ marginTop: 6, fontWeight: 400, fontSize: 15, color: '#444' }}>{!isNaN(g.distance) ? `${g.distance} km` : ''}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ width: '100%', maxWidth: MAP_WIDTH, margin: '0 auto' }}>
        <svg width="100%" height="auto" viewBox={viewBox} style={{ border: '1px solid #ccc', background: '#f0f8ff', display: 'block', width: '100%', height: 'auto' }}>
          {/* Render the world map from GeoJSON */}
          {geoData.features.map((feature: any, i: number) => {
            // Highlight the answer country border in green
            const isAnswer = feature.properties && feature.properties.name && feature.properties.name.toLowerCase() === answer.name.toLowerCase();
            return (
              <path
                key={i}
                d={pathGenerator(feature) || ''}
                fill="#e0e0e0"
                stroke={isAnswer ? "#51cf66" : "#888"}
                strokeWidth={isAnswer ? 3 : 0.5}
                style={isAnswer ? { filter: 'drop-shadow(0 0 6px #51cf6688)' } : {}}
              />
            );
          })}

          {/* Country 1 */}
          <circle {...scale(pos1)} r="8" fill="#ff6b6b" stroke="#fff" strokeWidth="2" />
          <text x={scale(pos1).x} y={scale(pos1).y - 8} textAnchor="middle" fontSize="12" fill="#333">
            {getCountryFlag(country1.name)} {country1.name}
          </text>

          {/* Country 2 */}
          <circle {...scale(pos2)} r="8" fill="#4ecdc4" stroke="#fff" strokeWidth="2" />
          <text x={scale(pos2).x} y={scale(pos2).y - 8} textAnchor="middle" fontSize="12" fill="#333">
            {getCountryFlag(country2.name)} {country2.name}
          </text>

          {/* Correct Answer */}
          <circle {...scale(posAnswer)} r="10" fill="#45b7d1" stroke="#fff" strokeWidth="3" />
          <text x={scale(posAnswer).x} y={scale(posAnswer).y - 8} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333">
            {getCountryFlag(answer.name)} {answer.name}
          </text>

          {/* Line connecting the two countries */}
          <line 
            x1={scale(pos1).x} y1={scale(pos1).y} x2={scale(pos2).x} y2={scale(pos2).y} 
            stroke="#666" strokeWidth="2"
          />
          {/* Dots at each end of the line */}
          <circle cx={scale(pos1).x} cy={scale(pos1).y} r="4" fill="#fff" stroke="#666" strokeWidth="2" />
          <circle cx={scale(pos2).x} cy={scale(pos2).y} r="4" fill="#fff" stroke="#666" strokeWidth="2" />

          {/* Show user guesses */}
          {guesses.map((guess: any, index: number) => {
            const guessedCountry = countries.find(c => c.name.toLowerCase() === guess.name.toLowerCase());
            if (guessedCountry) {
              const posGuess = latLngToSVG(guessedCountry.lat, guessedCountry.lng);
              const scaled = scale(posGuess);
              const isCorrect = guess.name.toLowerCase() === answer.name.toLowerCase();
              return (
                <g key={index}>
                  <circle 
                    cx={scaled.x} 
                    cy={scaled.y} 
                    r="4" 
                    fill={isCorrect ? "#51cf66" : "#ff6b6b"} 
                    stroke="#fff" 
                    strokeWidth="1" 
                  />
                  {/* Number with green if correct */}
                  <text 
                    x={scaled.x} 
                    y={scaled.y + 20} 
                    textAnchor="middle" 
                    fontSize="18"
                    fontWeight="bold"
                    fill={isCorrect ? "#51cf66" : "#d7263d"}
                    stroke="#fff"
                    strokeWidth="3"
                    paintOrder="stroke"
                  >
                    {index + 1}
                  </text>
                  <text 
                    x={scaled.x} 
                    y={scaled.y + 20} 
                    textAnchor="middle" 
                    fontSize="18"
                    fontWeight="bold"
                    fill={isCorrect ? "#51cf66" : "#d7263d"}
                    stroke="none"
                  >
                    {index + 1}
                  </text>
                </g>
              );
            }
            return null;
          })}
        </svg>
      </div>
    </div>
  );
};

export default Map; 