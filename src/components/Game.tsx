import React, { useState } from 'react';
import countries, { Country, findClosestCountry } from '../utils/geo';
import Round from './Round';
import Map from './Map'; // Added Map import

const NUM_ATTEMPTS = 5;

// Haversine formula for distance between two countries
function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lat2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const DIFFICULTY_OPTIONS = [
  { label: 'Easy', min: 0, max: 5000 },
  { label: 'Medium', min: 5001, max: 15000 },
  { label: 'Hard', min: 15001, max: Infinity },
];

function getRandomCountry(exclude: string[] = []): Country {
  const filtered = countries.filter(c => !exclude.includes(c.name));
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function getRandomCountryPair(difficulty: { min: number; max: number }): [Country, Country] {
  let c1: Country, c2: Country, dist: number;
  let tries = 0;
  do {
    c1 = getRandomCountry();
    c2 = getRandomCountry([c1.name]);
    dist = haversine(c1.lat, c1.lng, c2.lat, c2.lng);
    tries++;
    if (tries > 2000) break; // fallback to avoid infinite loop
  } while (dist < difficulty.min || dist > difficulty.max);
  return [c1, c2];
}

const Game: React.FC = () => {
  const [difficulty, setDifficulty] = useState<typeof DIFFICULTY_OPTIONS[number] | null>(null);
  const [difficultyLocked, setDifficultyLocked] = useState(false);
  const [countryPair, setCountryPair] = useState<[Country, Country] | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [gameOver, setGameOver] = useState(false);

  // Progress indicator and round number are based on attempts
  const round = attempts.length + 1;

  // Find the answer for the pair
  const answer = countryPair ? findClosestCountry(countryPair[0], countryPair[1]) : null;

  const handleAttempt = (attempt: { name: string; distance: number; direction: string; correct: boolean }) => {
    setAttempts([...attempts, attempt]);
    if (attempts.length + 1 >= NUM_ATTEMPTS || attempt.correct) {
      setGameOver(true);
    }
  };

  const handleRestart = () => {
    window.location.reload(); // simplest way to reset everything
  };

  const handleStartGame = () => {
    if (difficulty) {
      setCountryPair(getRandomCountryPair(difficulty));
      setDifficultyLocked(true);
    }
  };

  if (!difficultyLocked) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', padding: 20, border: '1px solid #ccc', borderRadius: 8, textAlign: 'center' }}>
        <h2>Select Difficulty</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 32 }}>
          {DIFFICULTY_OPTIONS.map(opt => (
            <label key={opt.label} style={{ fontSize: 20, cursor: 'pointer' }}>
              <input
                type="radio"
                name="difficulty"
                value={opt.label}
                checked={difficulty?.label === opt.label}
                onChange={() => setDifficulty(opt)}
                style={{ marginRight: 8 }}
              />
              {opt.label}
            </label>
          ))}
        </div>
        <button
          onClick={handleStartGame}
          disabled={difficulty === null}
          style={{ fontSize: 18, padding: '8px 32px', borderRadius: 6, background: '#1976d2', color: '#fff', border: 'none', cursor: difficulty === null ? 'not-allowed' : 'pointer' }}
        >
          Start Game
        </button>
      </div>
    );
  }

  if (!countryPair || !answer) return null;

  if (gameOver) {
    const isWin = attempts.length > 0 && attempts[attempts.length - 1].correct;
    return (
      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <h2>{isWin ? 'That is correct!' : 'Game Over!'}</h2>
        <button onClick={handleRestart} style={{ marginBottom: 24 }}>Play Again</button>
        <div style={{ margin: '0 auto', maxWidth: 900 }}>
          <Map
            country1={countryPair[0]}
            country2={countryPair[1]}
            answer={answer}
            guesses={attempts}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 20, border: '1px solid #ccc', borderRadius: 8, textAlign: 'center' }}>
      {/* Progress indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, gap: 8, fontSize: 28 }}>
        {[...Array(NUM_ATTEMPTS)].map((_, i) => {
          if (i < attempts.length) {
            return attempts[i].correct ? <span key={i} title={`Attempt ${i+1}: Correct`}>✅</span> : <span key={i} title={`Attempt ${i+1}: Incorrect`}>❌</span>;
          } else if (i === attempts.length && !gameOver) {
            return <span key={i} title={`Attempt ${i+1}: In progress`}>⏳</span>;
          } else {
            return <span key={i} title={`Attempt ${i+1}: Upcoming`}>◻️</span>;
          }
        })}
      </div>
      <h2 style={{ textAlign: 'center' }}>Guess {round} / {NUM_ATTEMPTS}</h2>
      <Round
        country1={countryPair[0]}
        country2={countryPair[1]}
        answer={answer}
        attempts={attempts}
        onAttempt={handleAttempt}
        gameOver={gameOver}
      />
      {/* Show map with all attempts plotted only if correct or last attempt */}
      {(attempts.length > 0 && (attempts[attempts.length - 1].correct || attempts.length === NUM_ATTEMPTS)) && (
        <div style={{ marginTop: 32 }}>
          <Map
            country1={countryPair[0]}
            country2={countryPair[1]}
            answer={answer}
            guesses={attempts}
          />
        </div>
      )}
      {gameOver && (
        <button style={{ marginTop: 24 }} onClick={handleRestart}>Play Again</button>
      )}
    </div>
  );
};

export default Game; 