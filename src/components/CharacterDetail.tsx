import React from 'react';
import { PersonCharacter } from '../types';
import './CharacterDetail.css';

interface CharacterDetailProps {
  character: PersonCharacter;
  organizationLabel?: string;
}

/**
 * CharacterDetail renders a narrative character entity (NPC/setting figure)
 * Displays structured sections: identity, description, thematics, nature, mechanics, relationships, quotes
 */
export const CharacterDetail: React.FC<CharacterDetailProps> = ({ character, organizationLabel }) => {
  // Normalize description to array
  const descriptions = Array.isArray(character['schema:description'])
    ? character['schema:description']
    : [character['schema:description']];

  // Render a nested object section (nature, mechanics, relationships)
  const renderSection = (sectionData: Record<string, any>) => {
    return (
      <dl className="character-section-list">
        {Object.entries(sectionData).map(([key, value]) => (
          <div key={key} className="character-section-item">
            <dt className="character-section-term">{formatLabel(key)}</dt>
            {typeof value === 'string' ? (
              <dd className="character-section-definition">{value}</dd>
            ) : typeof value === 'object' && value !== null ? (
              <dd className="character-section-definition">
                {Object.entries(value).map(([subKey, subValue]) => (
                  <div key={subKey} className="character-subsection">
                    <strong>{formatLabel(subKey)}:</strong> {String(subValue)}
                  </div>
                ))}
              </dd>
            ) : null}
          </div>
        ))}
      </dl>
    );
  };

  return (
    <div className="character-detail">
      {/* Header */}
      <header className="character-header">
        <h1 className="character-name">{character['label'] || character['rdfs:label']}</h1>
        {organizationLabel && (
          <p className="character-organization">{organizationLabel}</p>
        )}
      </header>

      {/* Identity Block */}
      {character['sa:identity'] && (
        <section className="character-section character-identity">
          <h2 className="section-title">Identity</h2>
          <h3 className="character-role">{character['sa:identity'].label}</h3>
          <p className="character-identity-desc">{character['sa:identity'].description}</p>
        </section>
      )}

      {/* Main Description */}
      <section className="character-section character-description">
        <h2 className="section-title">Overview</h2>
        <div className="character-description-content">
          {descriptions.map((desc, idx) => (
            <p key={idx} className="description-paragraph">
              {desc}
            </p>
          ))}
        </div>
      </section>

      {/* Thematics */}
      {character['sa:thematics'] && character['sa:thematics'].length > 0 && (
        <section className="character-section character-thematics">
          <h2 className="section-title">Thematics</h2>
          <ul className="thematics-list">
            {character['sa:thematics'].map((theme, idx) => (
              <li key={idx} className="thematic-item">
                {theme}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Nature */}
      {character['sa:nature'] && Object.keys(character['sa:nature']).length > 0 && (
        <section className="character-section character-nature">
          <h2 className="section-title">Nature</h2>
          {renderSection(character['sa:nature'])}
        </section>
      )}

      {/* Mechanics */}
      {character['sa:mechanics'] && Object.keys(character['sa:mechanics']).length > 0 && (
        <section className="character-section character-mechanics">
          <h2 className="section-title">Mechanics</h2>
          {renderSection(character['sa:mechanics'])}
        </section>
      )}

      {/* Relationships */}
      {character['sa:relationships'] && Object.keys(character['sa:relationships']).length > 0 && (
        <section className="character-section character-relationships">
          <h2 className="section-title">Relationships</h2>
          {renderSection(character['sa:relationships'])}
        </section>
      )}

      {/* Quotes */}
      {character['sa:quotes'] && character['sa:quotes'].length > 0 && (
        <section className="character-section character-quotes">
          <h2 className="section-title">Notable Quotes</h2>
          <blockquote className="quotes-block">
            {character['sa:quotes'].map((quote, idx) => (
              <p key={idx} className="quote-item">
                "{quote}"
              </p>
            ))}
          </blockquote>
        </section>
      )}
    </div>
  );
};

/**
 * Helper: format camelCase/snake_case keys to Title Case
 */
function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
