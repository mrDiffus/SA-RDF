import React, { useEffect, useState } from 'react';
import { fetchRaces, fetchArchetypes } from '../data';
import { generateCharacterId, getDefaultAbilities, calculateRacialBonuses } from '../utils/characterCreation';
import { NameStep } from './CharacterCreationSteps/NameStep';
import { AbilityGenerationStep } from './CharacterCreationSteps/AbilityGenerationStep';
import { RaceSelectionStep } from './CharacterCreationSteps/RaceSelectionStep';
import { ArchetypeSelectionStep } from './CharacterCreationSteps/ArchetypeSelectionStep';
import { ReviewStep } from './CharacterCreationSteps/ReviewStep';
import './CharacterCreation.css';
import type { Character, AbilityScores, Race, Archetype } from '../types';

export default function CharacterCreation() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [abilityScores, setAbilityScores] = useState(getDefaultAbilities());
  const [method, setMethod] = useState<'pointBuy' | 'roll4d6' | 'default'>('pointBuy');
  const [race, setRace] = useState('');
  const [archetypes, setArchetypes] = useState<string[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [archetypeList, setArchetypeList] = useState<Archetype[]>([]);

  useEffect(() => {
    Promise.all([fetchRaces(), fetchArchetypes()]).then(([r, a]) => {
      setRaces(r);
      setArchetypeList(a);
    });
  }, []);

  const submit = () => {
    if (!name || !race || archetypes.length !== 2) {
      alert('Please fill all fields before creating character');
      return;
    }
    const character: Character = {
      id: generateCharacterId(),
      name,
      race,
      archetypes: archetypes as [string, string],
      totalExperience: 0,
      abilityScores,
      racialBonuses: calculateRacialBonuses(race),
      features: [],
      skills: [],
      equipment: [],
      spells: [],
      attacks: []
    };
    // Encode character into URL hash (char:<base64>) — same pattern as sharable links
    const encoded = btoa(JSON.stringify(character));
    window.history.pushState({}, '', `/character-sheet#char:${encoded}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <NameStep
            name={name}
            onNameChange={setName}
            onNext={() => setStep(2)}
            onBack={() => {}}
          />
        );
      case 2:
        return (
          <AbilityGenerationStep
            scores={abilityScores}
            method={method}
            onScoresChange={setAbilityScores}
            onMethodChange={setMethod}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        );
      case 3:
        return (
          <RaceSelectionStep
            race={race}
            races={races}
            baseScores={abilityScores}
            onRaceChange={setRace}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        );
      case 4:
        return (
          <ArchetypeSelectionStep
            archetypes={archetypes}
            archetypeList={archetypeList}
            onArchetypesChange={setArchetypes}
            onNext={() => setStep(5)}
            onBack={() => setStep(3)}
          />
        );
      case 5:
        return (
          <ReviewStep
            character={{
              id: generateCharacterId(),
              name,
              race,
              archetypes: archetypes as [string, string],
              totalExperience: 0,
              abilityScores
            }}
            races={races}
            archetypeList={archetypeList}
            onSubmit={submit}
            onBack={() => setStep(4)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 2rem', color: 'rgb(212, 212, 216)' }}>
      <h1 style={{ color: 'rgb(161, 140, 0)', fontSize: '2.5rem', marginBottom: '0.5rem' }}>Character Creation</h1>
      <p style={{ color: 'rgb(161, 140, 0)', marginBottom: '2rem' }}>Step {step} of 5</p>

      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          justifyContent: 'space-between'
        }}
      >
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: '8px',
              background: s <= step ? 'rgb(161, 140, 0)' : 'rgb(39, 39, 42)',
              borderRadius: '4px',
              transition: 'background 0.3s ease'
            }}
          />
        ))}
      </div>

      <div
        style={{
          background: 'rgb(24, 24, 27)',
          border: '1px solid rgb(82, 82, 89)',
          borderRadius: '8px',
          padding: '2rem',
          marginBottom: '2rem'
        }}
      >
        {renderStep()}
      </div>
    </div>
  );
}
