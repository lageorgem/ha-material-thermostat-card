import { buildCases } from './cases.mjs';
import { SCENARIOS } from './matrix.mjs';

export const URL_PATH = 'mt-parity-qa';

export function buildDashboard({ theme } = {}) {
  const titles = new Map([
    ...SCENARIOS.map((s) => [`s-${s.id}`, s.title]),
    ['features-climate', 'Climate features'], ['features-wh', 'Water heater features'],
    ['aux', 'Auxiliary features'], ['layout', 'Section layouts'],
    ['layout-masonry', 'Masonry layouts'], ['names-themes', 'Names and themes'],
  ]);
  const views = new Map();
  for (const entry of buildCases({ theme })) {
    if (!views.has(entry.view)) views.set(entry.view, new Map());
    const sections = views.get(entry.view);
    if (!sections.has(entry.section)) sections.set(entry.section, [{ type: 'heading', heading: entry.section }]);
    sections.get(entry.section).push(entry.config);
  }
  return { title: 'MT Parity QA', views: [...views].map(([path, sections]) => {
    const base = { title: titles.get(path) ?? path, path };
    if (path === 'layout-masonry') return { ...base, type: 'masonry', cards: [...sections.values()].flat() };
    return { ...base, type: 'sections', max_columns: 4,
      sections: [...sections.values()].map((cards) => ({ type: 'grid', cards })),
    };
  }) };
}
