import React from 'react';
import type { Character, AbilityScores, Race, Archetype } from '../../types';

interface ReviewStepProps {
  character: Partial<Character>;
  races: Race[];
  archetypeList: Archetype[];
  onSubmit: () => void;
  onBack: () => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  character,
  races,
  archetypeList,
  onSubmit,
  onBack
}) => {
  const selectedRace = races.find((r) => r.id === character.race);
  const selectedArchetypes = character.archetypes
    ? [
        archetypeList.find((a) => a.id === character.archetypes![0]),
        archetypeList.find((a) => a.id === character.archetypes![1])
      ]
    : [];

  return (
    <div>
      <h2 style={{ color: 'rgb(161, 140, 0)', marginBottom: '1rem' }}>Review Character</h2>

      <div style={{ background: 'rgb(39, 39, 42)', padding: '1.5rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ color: 'rgb(82, 82, 89)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>NAME</p>
          <p style={{ color: 'rgb(212, 212, 216)', fontSize: '1.25rem', fontWeight: 'bold' }}>
            {character.name}
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <p style={{ color: 'rgb(82, 82, 89)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>RACE</p>
          <p style={{ color: 'rgb(212, 212, 216)', fontSize: '1.25rem', fontWeight: 'bold' }}>
            {selectedRace?.label || 'Unknown'}
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <p style={{ color: 'rgb(82, 82, 89)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>ARCHETYPES</p>
          <p style={{ color: 'rgb(212, 212, 216)', fontSize: '1.25rem', fontWeight: 'bold' }}>
            {selectedArchetypes
              .filter((a) => a)
              .map((a) => a?.label)
              .join(', ') || 'None selected'}
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <p style={{ color: 'rgb(82, 82, 89)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>ABILITY SCORES</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {(Object.keys(character.abilityScores || {}) as Array<keyof AbilityScores>).map((ability) => (
              <div key={ability} style={{ textAlign: 'center' }}>
                <div style={{ color: 'rgb(161, 140, 0)', fontSize: '0.9rem' }}>{ability.toUpperCase()}</div>
                <div style={{ color: 'rgb(251, 146, 60)', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {character.abilityScores?.[ability]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
          onClick={onSubmit}
          style={{
            background: 'rgb(134, 239, 172)',
            color: 'rgb(24, 24, 27)',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600'
          }}
        >
          Create Character
        </button>
      </div>
    </div>
  );
};
