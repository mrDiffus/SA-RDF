import React from 'react';

interface NameStepProps {
  name: string;
  onNameChange: (name: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const NameStep: React.FC<NameStepProps> = ({ name, onNameChange, onNext, onBack }) => {
  return (
    <div>
      <h2 style={{ color: 'rgb(161, 140, 0)', marginBottom: '1rem' }}>Character Name</h2>
      <p style={{ color: 'rgb(212, 212, 216)', marginBottom: '1rem' }}>Give your character a name to begin their story.</p>
      
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value.slice(0, 50))}
        placeholder="Enter character name"
        maxLength={50}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: 'rgb(39, 39, 42)',
          border: '1px solid rgb(82, 82, 89)',
          borderRadius: '4px',
          color: 'rgb(212, 212, 216)',
          fontSize: '1rem',
          marginBottom: '1rem',
          boxSizing: 'border-box'
        }}
      />
      
      <p style={{ color: 'rgb(82, 82, 89)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        {name.length}/50
      </p>
      
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
          disabled={!name.trim()}
          style={{
            background: 'rgb(161, 140, 0)',
            color: 'rgb(24, 24, 27)',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '6px',
            cursor: name.trim() ? 'pointer' : 'not-allowed',
            opacity: name.trim() ? 1 : 0.5,
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
