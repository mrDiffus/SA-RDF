import React, { useState } from 'react';
import { rollAllAbilities, getDefaultAbilities, POINT_BUY_COSTS } from '../../utils/characterCreation';
import type { AbilityScores } from '../../types';

interface AbilityGenerationStepProps {
  scores: AbilityScores;
  method: 'pointBuy' | 'roll4d6' | 'default' | 'prerolled';
  onScoresChange: (scores: AbilityScores) => void;
  onMethodChange: (method: 'pointBuy' | 'roll4d6' | 'default' | 'prerolled') => void;
  onNext: () => void;
  onBack: () => void;
}

export const AbilityGenerationStep: React.FC<AbilityGenerationStepProps> = ({
  scores,
  method,
  onScoresChange,
  onMethodChange,
  onNext,
  onBack
}) => {
  const [pointBuyScores, setPointBuyScores] = useState<AbilityScores>(scores);
  const [prerolledScores, setPrerolledScores] = useState<AbilityScores>(scores);

  const calculatePointBuyCost = (testScores: AbilityScores): number => {
    let total = 0;
    for (const ability of Object.values(testScores)) {
      total += POINT_BUY_COSTS[ability] || 0;
    }
    return total;
  };

  const pointBuyCost = calculatePointBuyCost(pointBuyScores);
  const remainingPoints = 27 - pointBuyCost;

  const handleRoll = () => {
    const rolled = rollAllAbilities();
    onScoresChange(rolled);
  };

  const handlePointBuyChange = (ability: keyof AbilityScores, value: number) => {
    const updated = { ...pointBuyScores, [ability]: value };
    setPointBuyScores(updated);
    onScoresChange(updated);
  };

  const handleDefault = () => {
    const defaults = getDefaultAbilities();
    onScoresChange(defaults);
  };

  return (
    <div>
      <h2 style={{ color: 'rgb(161, 140, 0)', marginBottom: '1rem' }}>Ability Scores</h2>
      <p style={{ color: 'rgb(212, 212, 216)', marginBottom: '1.5rem' }}>Choose how to generate your ability scores.</p>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {(['pointBuy', 'roll4d6', 'prerolled', 'default'] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              onMethodChange(m);
              if (m === 'roll4d6') handleRoll();
              else if (m === 'default') handleDefault();
            }}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: method === m ? 'rgb(161, 140, 0)' : 'rgb(39, 39, 42)',
              color: method === m ? 'rgb(24, 24, 27)' : 'rgb(212, 212, 216)',
              border: method === m ? '2px solid rgb(161, 140, 0)' : '2px solid rgb(82, 82, 89)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            {m === 'pointBuy' ? 'Point Buy' : m === 'roll4d6' ? 'Roll 4d6' : m === 'prerolled' ? 'Prerolled' : 'Default'}
          </button>
        ))}
      </div>

      {method === 'pointBuy' && (
        <div style={{ background: 'rgb(39, 39, 42)', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
          <p style={{ color: 'rgb(161, 140, 0)', fontWeight: 'bold', marginBottom: '1rem' }}>
            Points: {27 - pointBuyCost}/27 remaining
          </p>
          {remainingPoints < 0 && (
            <p style={{ color: 'rgb(251, 146, 60)', marginBottom: '1rem' }}>⚠️ Over budget by {Math.abs(remainingPoints)} points</p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {(Object.entries(pointBuyScores) as [keyof AbilityScores, number][]).map(([ability, score]) => (
              <div key={ability}>
                <label style={{ color: 'rgb(212, 212, 216)', display: 'block', marginBottom: '0.5rem' }}>
                  {ability.toUpperCase()}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="8"
                    max="15"
                    value={score}
                    onChange={(e) => handlePointBuyChange(ability, parseInt(e.target.value) || 10)}
                    style={{
                      width: '60px',
                      padding: '0.5rem',
                      background: 'rgb(24, 24, 27)',
                      border: '1px solid rgb(82, 82, 89)',
                      borderRadius: '4px',
                      color: 'rgb(212, 212, 216)'
                    }}
                  />
                  <span style={{ color: 'rgb(82, 82, 89)', fontSize: '0.9rem' }}>
                    {POINT_BUY_COSTS[score]} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {method === 'prerolled' && (
        <div style={{ background: 'rgb(39, 39, 42)', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
          <p style={{ color: 'rgb(212, 212, 216)', marginBottom: '1rem' }}>Enter your prerolled ability scores:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {(Object.entries(prerolledScores) as [keyof AbilityScores, number][]).map(([ability, score]) => (
              <div key={ability}>
                <label style={{ color: 'rgb(212, 212, 216)', display: 'block', marginBottom: '0.5rem' }}>
                  {ability.toUpperCase()}
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={score}
                  onChange={(e) => {
                    const updated = { ...prerolledScores, [ability]: parseInt(e.target.value) || 10 };
                    setPrerolledScores(updated);
                    onScoresChange(updated);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgb(24, 24, 27)',
                    border: '1px solid rgb(82, 82, 89)',
                    borderRadius: '4px',
                    color: 'rgb(212, 212, 216)'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {method === 'roll4d6' && (
        <div style={{ background: 'rgb(39, 39, 42)', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
          <p style={{ color: 'rgb(212, 212, 216)', marginBottom: '1rem' }}>Current rolls:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {(Object.entries(scores) as [keyof AbilityScores, number][]).map(([ability, score]) => (
              <div
                key={ability}
                style={{
                  background: 'rgb(24, 24, 27)',
                  padding: '1rem',
                  borderRadius: '4px',
                  textAlign: 'center',
                  border: '1px solid rgb(82, 82, 89)'
                }}
              >
                <div style={{ color: 'rgb(161, 140, 0)', fontSize: '0.9rem' }}>{ability.toUpperCase()}</div>
                <div style={{ color: 'rgb(251, 146, 60)', fontSize: '1.5rem', fontWeight: 'bold' }}>{score}</div>
              </div>
            ))}
          </div>
          <button
            onClick={handleRoll}
            style={{
              width: '100%',
              padding: '0.75rem',
              marginTop: '1rem',
              background: 'rgb(161, 140, 0)',
              color: 'rgb(24, 24, 27)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            Reroll
          </button>
        </div>
      )}

      {method === 'default' && (
        <div style={{ background: 'rgb(39, 39, 42)', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
          <p style={{ color: 'rgb(212, 212, 216)', marginBottom: '1rem' }}>Default ability scores:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {(Object.entries(scores) as [keyof AbilityScores, number][]).map(([ability, score]) => (
              <div
                key={ability}
                style={{
                  background: 'rgb(24, 24, 27)',
                  padding: '1rem',
                  borderRadius: '4px',
                  textAlign: 'center',
                  border: '1px solid rgb(82, 82, 89)'
                }}
              >
                <div style={{ color: 'rgb(161, 140, 0)', fontSize: '0.9rem' }}>{ability.toUpperCase()}</div>
                <div style={{ color: 'rgb(251, 146, 60)', fontSize: '1.5rem', fontWeight: 'bold' }}>{score}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgb(39, 39, 42)',
            color: 'rgb(212, 212, 216)',
            padding: '0.75rem 1.5rem',
            border: '2px solid rgb(82, 82, 89)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600'
          }}
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={remainingPoints < 0}
          style={{
            background: 'rgb(161, 140, 0)',
            color: 'rgb(24, 24, 27)',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '6px',
            cursor: remainingPoints >= 0 ? 'pointer' : 'not-allowed',
            opacity: remainingPoints >= 0 ? 1 : 0.5,
            fontSize: '1rem',
            fontWeight: '600'
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
};
