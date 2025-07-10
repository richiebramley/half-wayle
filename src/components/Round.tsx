import React, { useState } from 'react';
import countries, { Country } from '../utils/geo';
import { getCountryFlag } from '../utils/flags';
import Autocomplete from './Autocomplete';
import Map from './Map';

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getDirection(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const dLat = toLat - fromLat;
  const dLng = toLng - fromLng;
  const angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
  // Convert angle to compass direction
  if (angle >= -22.5 && angle < 22.5) return 'North';
  if (angle >= 22.5 && angle < 67.5) return 'North East';
  if (angle >= 67.5 && angle < 112.5) return 'East';
  if (angle >= 112.5 && angle < 157.5) return 'South East';
  if (angle >= 157.5 || angle < -157.5) return 'South';
  if (angle >= -157.5 && angle < -112.5) return 'South West';
  if (angle >= -112.5 && angle < -67.5) return 'West';
  if (angle >= -67.5 && angle < -22.5) return 'North West';
  return '';
}

type RoundProps = {
  country1: Country;
  country2: Country;
  answer: Country;
  attempts: { name: string; distance: number; direction: string; correct: boolean }[];
  onAttempt: (attempt: { name: string; distance: number; direction: string; correct: boolean }) => void;
  gameOver: boolean;
};

const Round: React.FC<RoundProps> = ({ country1, country2, answer, attempts, onAttempt, gameOver }) => {
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState('');

  // Prevent duplicate attempts
  const guessedNames = attempts.map(a => a.name.toLowerCase());

  const handleGuess = (selected: string) => {
    if (gameOver) return;
    if (guessedNames.includes(selected.toLowerCase())) {
      setFeedback('You already guessed that country.');
      setGuess('');
      return;
    }
    const guessedCountry = countries.find(c => c.name.toLowerCase() === selected.toLowerCase());
    if (!guessedCountry) {
      setFeedback('Country not found. Try again!');
      setGuess('');
      return;
    }
    const distance = Math.round(haversine(guessedCountry.lat, guessedCountry.lng, answer.lat, answer.lng));
    const direction = getDirection(guessedCountry.lat, guessedCountry.lng, answer.lat, answer.lng);
    const correct = guessedCountry.name.toLowerCase() === answer.name.toLowerCase();
    onAttempt({ name: guessedCountry.name, distance, direction, correct });
    setGuess('');
    setFeedback('');
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h3>Which country's geographical center is closest to the halfway point between:</h3>
      {/* Country cards presentation */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, margin: '24px 0' }}>
        <div style={{ border: '1px solid #ccc', borderRadius: 12, padding: '16px 24px', minWidth: 120, textAlign: 'center', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 32 }}>{getCountryFlag(country1.name)}</div>
          <div style={{ fontWeight: 'bold', fontSize: 20, marginTop: 8 }}>{country1.name}</div>
        </div>
        <span style={{ fontSize: 24, fontWeight: 'bold' }}>and</span>
        <div style={{ border: '1px solid #ccc', borderRadius: 12, padding: '16px 24px', minWidth: 120, textAlign: 'center', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 32 }}>{getCountryFlag(country2.name)}</div>
          <div style={{ fontWeight: 'bold', fontSize: 20, marginTop: 8 }}>{country2.name}</div>
        </div>
      </div>
      <div style={{ maxWidth: 600, margin: '24px auto 0 auto' }}>
        <Autocomplete
          value={guess}
          onChange={setGuess}
          onSelect={handleGuess}
          options={countries.filter(c => c.name !== country1.name && c.name !== country2.name).map(c => c.name)}
          disabled={gameOver}
        />
      </div>
      <div style={{ marginTop: 16, minHeight: 24 }}>{feedback}</div>
      <div style={{ marginTop: 8 }}>Attempts: {attempts.length} / 5</div>
      {/* Show correct message if last attempt is correct */}
      {attempts.length > 0 && attempts[attempts.length - 1].correct && (
        <div style={{ fontWeight: 'bold', fontSize: 20, color: '#388e3c', marginBottom: 12 }}>
          You are correct! {getCountryFlag(answer.name)} {answer.name}
        </div>
      )}
      <ul style={{ marginTop: 16, display: 'inline-block', textAlign: 'left' }}>
        {attempts.map((a, i) => (
          <li key={i} style={{ listStyle: 'none', fontWeight: 'bold' }}>
            <b>{i + 1}.</b> {getCountryFlag(a.name)} {a.name}
            {a.correct ? ' - you are correct!' : (isNaN(a.distance) ? '' : ` - you are ${a.distance} km away${a.direction ? `, go ${a.direction}` : ''}`)}
          </li>
        ))}
      </ul>
      {/* Show map when round is finished */}
      {gameOver && (
        <Map 
          country1={country1}
          country2={country2}
          answer={answer}
          guesses={attempts}
        />
      )}
    </div>
  );
};

export default Round; 