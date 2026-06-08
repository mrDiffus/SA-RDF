import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { PersonCharacter } from '../../types';
import { CharacterDetail } from '../../components/CharacterDetail';
import Breadcrumb from '../../components/Breadcrumb';

function resolveDataPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${normalizedPath}`;
}

async function fetchStandaloneCharacter(slug: string): Promise<PersonCharacter | null> {
  try {
    const res = await fetch(resolveDataPath(`/data/Setting/Characters/${slug}.json`));
    if (!res.ok) return null;
    const data = await res.json();
    return (data['@graph']?.[0] ?? data) as PersonCharacter;
  } catch {
    return null;
  }
}

export default function StandaloneCharacterPage() {
  const { charSlug } = useParams<{ charSlug: string }>();
  const [character, setCharacter] = useState<PersonCharacter | null | undefined>(undefined);

  useEffect(() => {
    if (charSlug) fetchStandaloneCharacter(charSlug).then(setCharacter);
  }, [charSlug]);

  if (character === undefined) return <div className="text-zinc-500 animate-pulse">Loading character...</div>;
  if (character === null) return <Navigate to="/setting/characters" replace />;

  const charName = character['rdfs:label'] || character['label'] || charSlug;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Breadcrumb items={[
        { label: 'Setting', href: '/setting' },
        { label: 'Characters', href: '/setting/characters' },
        { label: charName },
      ]} />

      <CharacterDetail character={character} />
    </div>
  );
}
