import React, { useState } from 'react';
import countries, { findClosestCountry, Country } from '../utils/geo';
import Round from './Round';
import Map from './Map'; // Added Map import

const NUM_ATTEMPTS = 5;

function getRandomCountry(exclude: string[] = []): Country {
  const filtered = countries.filter(c => !exclude.includes(c.name));
  return filtered[Math.floor(Math.random() * filtered.length)];
}

const Game: React.FC = () => {
  // Pick the two countries ONCE for the whole game
  const [countryPair] = useState(() => {
    const c1 = getRandomCountry();
    const c2 = getRandomCountry([c1.name]);
    return [c1, c2];
  });
  const [attempts, setAttempts] = useState<any[]>([]);
  const [gameOver, setGameOver] = useState(false);

  // Progress indicator and round number are based on attempts
  const round = attempts.length + 1;

  // Find the answer for the pair
  const answer = findClosestCountry(countryPair[0], countryPair[1]);

  const handleAttempt = (attempt: { name: string; distance: number; direction: string; correct: boolean }) => {
    setAttempts([...attempts, attempt]);
    if (attempts.length + 1 >= NUM_ATTEMPTS || attempt.correct) {
      setGameOver(true);
    }
  };

  const handleRestart = () => {
    window.location.reload(); // simplest way to reset everything
  };

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
      <h2 style={{ textAlign: 'center' }}>Round {round} / {NUM_ATTEMPTS}</h2>
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