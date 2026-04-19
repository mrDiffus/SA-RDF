import React, { useState } from 'react';
import type { Archetype } from '../../types';
import { findExclusiveFeatureGroups } from '../../utils/characterCreation';

interface ExclusiveFeatureSelectionStepProps {
  archetypes: string[];
  archetypeList: Archetype[];
  selections: Record<string, string>;
  onSelectionsChange: (selections: Record<string, string>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const ExclusiveFeatureSelectionStep: React.FC<ExclusiveFeatureSelectionStepProps> = ({
  archetypes,
  archetypeList,
  selections,
  onSelectionsChange,
  onNext,
  onBack
}) => {
  const exclusiveGroups = findExclusiveFeatureGroups(archetypes, archetypeList);

  const handleSelection = (groupName: string, featureLabel: string) => {
    onSelectionsChange({
      ...selections,
      [groupName]: featureLabel
    });
  };

  const allGroupsSelected = exclusiveGroups.every((group) => selections[group.groupName]);

  return (
    <div>
      <h2 style={{ color: 'rgb(161, 140, 0)', marginBottom: '1rem' }}>Select Exclusive Features</h2>
      <p style={{ color: 'rgb(212, 212, 216)', marginBottom: '1.5rem' }}>
        Some archetype features are mutually exclusive. Choose one from each group below.
      </p>

      {exclusiveGroups.map((group) => (
        <div key={group.groupName} style={{ marginBottom: '2rem', background: 'rgb(39, 39, 42)', padding: '1.5rem', borderRadius: '6px' }}>
          <h3 style={{ color: 'rgb(161, 140, 0)', marginBottom: '1rem' }}>
            {group.groupName}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {group.features.map((feature) => (
              <label
                key={feature.label}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '1rem',
                  background: selections[group.groupName] === feature.label ? 'rgb(55, 55, 60)' : 'rgb(28, 28, 30)',
                  borderRadius: '6px',
                  border: `2px solid ${selections[group.groupName] === feature.label ? 'rgb(161, 140, 0)' : 'rgb(82, 82, 89)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <input
                  type="radio"
                  name={group.groupName}
                  value={feature.label}
                  checked={selections[group.groupName] === feature.label}
                  onChange={() => handleSelection(group.groupName, feature.label)}
                  style={{ marginRight: '1rem', marginTop: '0.25rem', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'rgb(212, 212, 216)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {feature.label}
                  </div>
                  <div style={{ color: 'rgb(161, 161, 170)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                    {feature.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
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
          disabled={!allGroupsSelected}
          style={{
            background: allGroupsSelected ? 'rgb(134, 239, 172)' : 'rgb(82, 82, 89)',
            color: allGroupsSelected ? 'rgb(24, 24, 27)' : 'rgb(161, 161, 170)',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '6px',
            cursor: allGroupsSelected ? 'pointer' : 'not-allowed',
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
