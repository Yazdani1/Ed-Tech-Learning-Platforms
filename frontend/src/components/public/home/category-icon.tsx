import BrushOutlinedIcon from '@mui/icons-material/BrushOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import InsightsIcon from '@mui/icons-material/Insights';
import PollOutlinedIcon from '@mui/icons-material/PollOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import TerminalIcon from '@mui/icons-material/Terminal';
import TranslateIcon from '@mui/icons-material/Translate';

import type { ReactNode } from 'react';

const SX = { fontSize: 20 } as const;

// Categories have a name only, so the icon comes from words in it (English and Bangla); first match wins.
const RULES: readonly (readonly [RegExp, ReactNode])[] = [
  [/data|analytic|ডাটা|ডেটা/i, <PollOutlinedIcon key="data" sx={SX} />],
  [/design|ux|ui\b|graphic|ডিজাইন/i, <BrushOutlinedIcon key="design" sx={SX} />],
  [
    /language|english|spoken|communicat|ভাষা|ইংরেজি|যোগাযোগ/i,
    <TranslateIcon key="language" sx={SX} />,
  ],
  [
    /program|develop|web|software|coding|\bai\b|প্রোগ্রাম|ডেভেলপ|সফটওয়্যার/i,
    <TerminalIcon key="program" sx={SX} />,
  ],
  [
    /business|market|finance|sales|বিজনেস|ব্যবসা|মার্কেটিং/i,
    <InsightsIcon key="business" sx={SX} />,
  ],
  [/science|math|physics|বিজ্ঞান|গণিত/i, <ScienceOutlinedIcon key="science" sx={SX} />],
];

/** The icon of a category in the home page filter. */
export const categoryIcon = (name: string): ReactNode =>
  RULES.find(([pattern]) => pattern.test(name))?.[1] ?? <CategoryOutlinedIcon sx={SX} />;
