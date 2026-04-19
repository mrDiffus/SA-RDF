import React from 'react';
import { calculateRacialBonuses } from '../../utils/characterCreation';
import type { Race, AbilityScores } from '../../types';

interface RaceSelectionStepProps {
  race: string;
  races: Race[];
  baseScores: AbilityScores;
  onRaceChange: (race: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const RaceSelectionStep: React.FC<RaceSelectionStepProps> = ({
  race,
  races,
  baseScores,
  onRaceChange,
  onNext,
  onBack
}) => {
  const selectedRace = races.find((r) => r.id === race);
  const racialBonuses = calculateRacialBonuses(race);

  const finalScores =
    race && racialBonuses
      ? {
          strength: baseScores.strength + (racialBonuses.strength || 0),
          dexterity: baseScores.dexterity + (racialBonuses.dexterity || 0),
          constitution: baseScores.constitution + (racialBonuses.constitution || 0),
          intelligence: baseScores.intelligence + (racialBonuses.intelligence || 0),
          wisdom: baseScores.wisdom + (racialBonuses.wisdom || 0),
          charisma: baseScores.charisma + (racialBonuses.charisma || 0)
        }
      : baseScores;

  return (
    <div>
      <h2 style={{ color: 'rgb(161, 140, 0)', marginBottom: '1rem' }}>Select Race</h2>
      <p style={{ color: 'rgb(212, 212, 216)', marginBottom: '1.5rem' }}>Choose your character's race.</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        {races.map((r) => (
          <div
            key={r.id}
            onClick={() => onRaceChange(r.id)}
            style={{
              background: 'rgb(39, 39, 42)',
              border: race === r.id ? '2px solid rgb(161, 140, 0)' : '2px solid rgb(82, 82, 89)',
              borderRadius: '6px',
              padding: '1rem',
              cursor: 'pointer',
              color: 'rgb(212, 212, 216)',
              transition: 'all 0.2s ease'
            }}
          >
            <strong style={{ color: 'rgb(161, 140, 0)' }}>{r.label}</strong>
          </div>
        ))}
      </div>

      {selectedRace && (
        <div style={{ background: 'rgb(39, 39, 42)', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'rgb(161, 140, 0)', marginBottom: '1rem' }}>Ability Score Preview</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {(Object.keys(baseScores) as Array<keyof AbilityScores>).map((ability) => (
              <div key={ability} style={{ textAlign: 'center' }}>
                <div style={{ color: 'rgb(82, 82, 89)', fontSize: '0.9rem' }}>{ability.toUpperCase()}</div>
                <div style={{ color: 'rgb(212, 212, 216)' }}>
                  {baseScores[ability]}
                  {racialBonuses[ability] ? (
                    <span style={{ color: 'rgb(161, 140, 0)', marginLeft: '0.25rem' }}>
                      +{racialBonuses[ability]}
                    </span>
                  ) : null}
                </div>
                <div style={{ color: 'rgb(251, 146, 60)', fontWeight: 'bold' }}>= {finalScores[ability]}</div>
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
          disabled={!race}
          style={{
            background: 'rgb(161, 140, 0)',
            color: 'rgb(24, 24, 27)',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '6px',
            cursor: race ? 'pointer' : 'not-allowed',
            opacity: race ? 1 : 0.5,
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
