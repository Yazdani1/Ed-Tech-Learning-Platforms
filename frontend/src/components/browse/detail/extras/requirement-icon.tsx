import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import WifiIcon from '@mui/icons-material/Wifi';

import type { ReactNode } from 'react';

const SX = { fontSize: 32 } as const;

// Requirements are plain text, so the icon comes from words in it (English and Bangla); first match wins.
const RULES: readonly (readonly [RegExp, ReactNode])[] = [
  [/internet|wi-?fi|network|ইন্টারনেট/i, <WifiIcon key="wifi" sx={SX} aria-hidden />],
  [
    /fluency|skill|knowledge|basic|experience|দক্ষতা|জ্ঞান|ধারণা|অভিজ্ঞতা/i,
    <PsychologyOutlinedIcon key="skill" sx={SX} aria-hidden />,
  ],
  [
    /laptop|computer|\bpc\b|desktop|ল্যাপটপ|কম্পিউটার/i,
    <LaptopMacIcon key="laptop" sx={SX} aria-hidden />,
  ],
];

/** The icon of one course requirement. */
export const requirementIcon = (text: string): ReactNode =>
  RULES.find(([pattern]) => pattern.test(text))?.[1] ?? <BuildOutlinedIcon sx={SX} aria-hidden />;
