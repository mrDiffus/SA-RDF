import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import RulesLayout from './layouts/RulesLayout';
import SettingLayout from './layouts/SettingLayout';

import HomePage from './pages/HomePage';
import ChangelogPage from './pages/ChangelogPage';
import NotFoundPage from './pages/NotFoundPage';

import RulesIndexPage from './pages/rules/RulesIndexPage';

import RacesIndexPage from './pages/races/RacesIndexPage';
import RaceDetailPage from './pages/races/RaceDetailPage';

import ArchetypesIndexPage from './pages/archetypes/ArchetypesIndexPage';
import ArchetypeDetailPage from './pages/archetypes/ArchetypeDetailPage';

import SpellsIndexPage from './pages/spells/SpellsIndexPage';
import SpellDetailPage from './pages/spells/SpellDetailPage';

import EquipmentIndexPage from './pages/equipment/EquipmentIndexPage';
import EquipmentDetailPage from './pages/equipment/EquipmentDetailPage';

import SkillsIndexPage from './pages/skills/SkillsIndexPage';
import FeaturesIndexPage from './pages/features/FeaturesIndexPage';

import SettingIndexPage from './pages/setting/SettingIndexPage';
import PlanetsIndexPage from './pages/setting/PlanetsIndexPage';
import PlanetDetailPage from './pages/setting/PlanetDetailPage';
import PlaceDetailPage from './pages/setting/PlaceDetailPage';
import OrgsIndexPage from './pages/setting/OrgsIndexPage';
import OrgDetailPage from './pages/setting/OrgDetailPage';
import CharacterDetailPage from './pages/setting/CharacterDetailPage';
import CharactersIndexPage from './pages/setting/CharactersIndexPage';
import StandaloneCharacterPage from './pages/setting/StandaloneCharacterPage';

import CharacterCreation from './components/CharacterCreation';
import CharacterSheet from './components/CharacterSheet';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <RootLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'changelog', element: <ChangelogPage /> },
        { path: 'character-creation', element: <CharacterCreation /> },
        { path: 'character-sheet', element: <CharacterSheet /> },

        // Rules section
        {
          element: <RulesLayout />,
          children: [
            { path: 'rules', element: <RulesIndexPage /> },
            { path: 'races', element: <RacesIndexPage /> },
            { path: 'races/:raceSlug', element: <RaceDetailPage /> },
            { path: 'archetypes', element: <ArchetypesIndexPage /> },
            { path: 'archetypes/:archetypeSlug', element: <ArchetypeDetailPage /> },
            { path: 'spells', element: <SpellsIndexPage /> },
            { path: 'spells/:spellSlug', element: <SpellDetailPage /> },
            { path: 'equipment', element: <EquipmentIndexPage /> },
            { path: 'equipment/:equipmentSlug', element: <EquipmentDetailPage /> },
            { path: 'skills', element: <SkillsIndexPage /> },
            { path: 'features', element: <FeaturesIndexPage /> },
            // Legacy redirects
            { path: 'general-features', element: <Navigate to="/features" replace /> },
          ],
        },

        // Setting section
        {
          element: <SettingLayout />,
          children: [
            { path: 'setting', element: <SettingIndexPage /> },
            { path: 'setting/planets', element: <PlanetsIndexPage /> },
            { path: 'setting/planets/:planetSlug', element: <PlanetDetailPage /> },
            { path: 'setting/planets/:planetSlug/:placeSlug', element: <PlaceDetailPage /> },
            { path: 'setting/organizations', element: <OrgsIndexPage /> },
            { path: 'setting/organizations/:orgSlug', element: <OrgDetailPage /> },
            { path: 'setting/organizations/:orgSlug/:charSlug', element: <CharacterDetailPage /> },
            { path: 'setting/characters', element: <CharactersIndexPage /> },
            { path: 'setting/characters/:charSlug', element: <StandaloneCharacterPage /> },
          ],
        },

        // Legacy lore redirects
        { path: 'lore', element: <Navigate to="/setting" replace /> },
        { path: 'lore/*', element: <Navigate to="/setting" replace /> },

        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL }
);
