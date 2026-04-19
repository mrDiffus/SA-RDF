import React from 'react';
import type { Archetype } from '../../types';

interface ArchetypeSelectionStepProps {
  archetypes: string[];
  archetypeList: Archetype[];
  onArchetypesChange: (archetypes: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const ArchetypeSelectionStep: React.FC<ArchetypeSelectionStepProps> = ({
  archetypes,
  archetypeList,
  onArchetypesChange,
  onNext,
  onBack
}) => {
  const toggleArchetype = (id: string) => {
    if (archetypes.includes(id)) {
      onArchetypesChange(archetypes.filter((a) => a !== id));
    } else if (archetypes.length < 2) {
      onArchetypesChange([...archetypes, id]);
    }
  };

  return (
    <div>
      <h2 style={{ color: 'rgb(161, 140, 0)', marginBottom: '1rem' }}>Select Archetypes</h2>
      <p style={{ color: 'rgb(212, 212, 216)', marginBottom: '0.5rem' }}>Choose exactly 2 archetypes.</p>
      <p style={{ color: 'rgb(161, 140, 0)', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        Selected: {archetypes.length}/2
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        {archetypeList.map((a) => {
          const isSelected = archetypes.includes(a.id);
          const isDisabled = !isSelected && archetypes.length >= 2;
          return (
            <div
              key={a.id}
              onClick={() => {
                if (!isDisabled) toggleArchetype(a.id);
              }}
              style={{
                background: 'rgb(39, 39, 42)',
                border: isSelected ? '2px solid rgb(161, 140, 0)' : '2px solid rgb(82, 82, 89)',
                borderRadius: '6px',
                padding: '1rem',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                color: 'rgb(212, 212, 216)',
                opacity: isDisabled ? 0.5 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <strong style={{ color: 'rgb(161, 140, 0)' }}>{a.label}</strong>
              {isSelected && (
                <div style={{ color: 'rgb(134, 239, 172)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  ✓ Selected
                </div>
              )}
            </div>
          );
        })}
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
          onClick={onNext}
          disabled={archetypes.length !== 2}
          style={{
            background: 'rgb(161, 140, 0)',
            color: 'rgb(24, 24, 27)',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '6px',
            cursor: archetypes.length === 2 ? 'pointer' : 'not-allowed',
            opacity: archetypes.length === 2 ? 1 : 0.5,
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
