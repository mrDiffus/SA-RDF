import React, { useEffect, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { PersonCharacter } from '../../types';
import { CharacterDetail } from '../../components/CharacterDetail';
import { loadCharacter } from '../../data';
import Breadcrumb from '../../components/Breadcrumb';

export default function CharacterDetailPage() {
  const { orgSlug, charSlug } = useParams<{ orgSlug: string; charSlug: string }>();
  const [character, setCharacter] = useState<PersonCharacter | null | undefined>(undefined);
  const [orgLabel, setOrgLabel] = useState<string>('');

  useEffect(() => {
    if (!orgSlug || !charSlug) return;
    // Derive org display label from folder name
    setOrgLabel(orgSlug.replace(/-/g, ' '));
    loadCharacter(orgSlug, charSlug)
      .then(data => setCharacter(data as PersonCharacter))
      .catch(() => setCharacter(null));
  }, [orgSlug, charSlug]);

  if (character === undefined) return <div className="text-zinc-500 animate-pulse">Loading character...</div>;
  if (character === null) return <Navigate to={`/setting/organizations/${orgSlug}`} replace />;

  const charName = character['rdfs:label'] || character['label'] || charSlug;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Breadcrumb items={[
        { label: 'Setting', href: '/setting' },
        { label: 'Organizations', href: '/setting/organizations' },
        { label: orgLabel || orgSlug!, href: `/setting/organizations/${orgSlug}` },
        { label: charName },
      ]} />

      <CharacterDetail character={character} organizationLabel={orgLabel} />
    </div>
  );
}
