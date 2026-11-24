'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en';

export interface LanguageInfo {
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '' },
];

export const translations = {
  // Navigation & General
  nav_brand_title: {
    en: 'CityNova',
    hi: 'CityNova',
    kok: 'CityNova',
  },
  nav_tagline: {
    en: 'Civic reporting for your city',
    hi: 'Civic reporting for your city',
    kok: 'Civic reporting for your city',
  },
  nav_helpline_bar: {
    en: 'CityNova Citizen Portal',
    hi: 'CityNova Citizen Portal',
    kok: 'CityNova Citizen Portal',
  },
  nav_helpline: {
    en: 'City services and complaint tracking',
    hi: 'City services and complaint tracking',
    kok: 'City services and complaint tracking',
  },
  nav_report: {
    en: 'Report Problem',
    hi: 'Report Problem',
    kok: 'Report Problem',
  },
  nav_ai_assistant: {
    en: 'CityNova Enquiry',
    hi: 'CityNova Enquiry',
    kok: 'CityNova Enquiry',
  },

  // Hero Section
  hero_tag: {
    en: 'GOVERNMENT OF GOA • PONDA MUNICIPAL COUNCIL • CITYNOVA',
    hi: 'GOVERNMENT OF GOA • PONDA MUNICIPAL COUNCIL • CITYNOVA',
    kok: 'GOVERNMENT OF GOA • PONDA MUNICIPAL COUNCIL • CITYNOVA',
  },
  hero_title_part1: {
    en: 'Civic Issue ',
    hi: 'Civic Issue ',
    kok: 'Civic Issue ',
  },
  hero_title_accent: {
    en: 'Reporting',
    hi: 'Reporting',
    kok: 'Reporting',
  },
  hero_title_part2: {
    en: '',
    hi: '',
    kok: '',
  },
  hero_subtitle: {
    en: 'Report local civic problems, browse reported issues on the map, and follow their status.',
    hi: 'Report local civic problems, browse reported issues on the map, and follow their status.',
    kok: 'Report local civic problems, browse reported issues on the map, and follow their status.',
  },
  quick_topics: {
    en: 'Quick Topics:',
    hi: 'Quick Topics:',
    kok: 'Quick Topics:',
  },
  reset_filter: {
    en: 'Reset Filter',
    hi: 'Reset Filter',
    kok: 'Reset Filter',
  },
  btn_report_problem: {
    en: 'Report Civic Problem',
    hi: 'Report Civic Problem',
    kok: 'Report Civic Problem',
  },
  btn_ask_copilot: {
    en: 'Ask CityNova Enquiry',
    hi: 'Ask CityNova Enquiry',
    kok: 'Ask CityNova Enquiry',
  },

  // Stats Cards
  stats_total: {
    en: 'Total Registered',
    hi: 'Total Registered',
    kok: 'Total Registered',
  },
  stats_total_sub: {
    en: 'Reported Issues',
    hi: 'Reported Issues',
    kok: 'Reported Issues',
  },
  stats_active: {
    en: 'Active Under Work',
    hi: 'Active Under Work',
    kok: 'Active Under Work',
  },
  stats_active_sub: {
    en: 'Currently in progress',
    hi: 'Currently in progress',
    kok: 'Currently in progress',
  },
  stats_resolved: {
    en: 'Verified Resolved',
    hi: 'Verified Resolved',
    kok: 'Verified Resolved',
  },
  stats_resolved_sub: {
    en: 'Completed complaints',
    hi: 'Completed complaints',
    kok: 'Completed complaints',
  },
  stats_sla: {
    en: 'On-time Resolution',
    hi: 'On-time Resolution',
    kok: 'On-time Resolution',
  },
  stats_sla_sub: {
    en: 'For completed complaints',
    hi: 'For completed complaints',
    kok: 'For completed complaints',
  },

  // Tabs
  tab_map: {
    en: 'Map View (GIS & Google Maps)',
    hi: 'Map View (GIS & Google Maps)',
    kok: 'Map View (GIS & Google Maps)',
  },

  // Filters
  filter_search_placeholder: {
    en: 'Search case, landmark, title...',
    hi: 'Search case, landmark, title...',
    kok: 'Search case, landmark, title...',
  },
  filter_all_categories: {
    en: 'All Categories',
    hi: 'All Categories',
    kok: 'All Categories',
  },
  filter_all_status: {
    en: 'All Statuses',
    hi: 'All Statuses',
    kok: 'All Statuses',
  },

  // Categories
  cat_pothole: {
    en: 'Pothole & Road Damage',
    hi: 'Pothole & Road Damage',
    kok: 'Pothole & Road Damage',
  },
  cat_water: {
    en: 'Water Leakage / Pipe Burst',
    hi: 'Water Leakage / Pipe Burst',
    kok: 'Water Leakage / Pipe Burst',
  },
  cat_streetlight: {
    en: 'Streetlight Outage',
    hi: 'Streetlight Outage',
    kok: 'Streetlight Outage',
  },
  cat_garbage: {
    en: 'Garbage & Waste Accumulation',
    hi: 'Garbage & Waste Accumulation',
    kok: 'Garbage & Waste Accumulation',
  },
  cat_drainage: {
    en: 'Drainage & Sewer Overflow',
    hi: 'Drainage & Sewer Overflow',
    kok: 'Drainage & Sewer Overflow',
  },

  // Map Controls & Google Maps
  map_google_roadmap: {
    en: 'Google Maps (Roadmap)',
    hi: 'Google Maps (Roadmap)',
    kok: 'Google Maps (Roadmap)',
  },
  map_google_satellite: {
    en: 'Google Satellite',
    hi: 'Google Satellite',
    kok: 'Google Satellite',
  },
  map_google_hybrid: {
    en: 'Google Hybrid',
    hi: 'Google Hybrid',
    kok: 'Google Hybrid',
  },
  map_municipal_gis: {
    en: 'Municipal GIS Light',
    hi: 'Municipal GIS Light',
    kok: 'Municipal GIS Light',
  },
  open_in_google_maps: {
    en: 'Open in Google Maps ↗',
    hi: 'Open in Google Maps ↗',
    kok: 'Open in Google Maps ↗',
  },
  get_directions_google: {
    en: 'Directions (Google Maps) ↗',
    hi: 'Directions (Google Maps) ↗',
    kok: 'Directions (Google Maps) ↗',
  },

  // Docket Cards
  reported_by: {
    en: 'Reported by:',
    hi: 'Reported by:',
    kok: 'Reported by:',
  },
  sla_guarantee: {
    en: 'Statutory SLA:',
    hi: 'Statutory SLA:',
    kok: 'Statutory SLA:',
  },
  confirmed_genuine: {
    en: 'Confirmed Genuine',
    hi: 'Confirmed Genuine',
    kok: 'Confirmed Genuine',
  },
  inspect_full_docket: {
    en: 'Inspect Full Docket',
    hi: 'Inspect Full Docket',
    kok: 'Inspect Full Docket',
  },
  share_docket: {
    en: 'Share Link',
    hi: 'Share Link',
    kok: 'Share Link',
  },
  copied_toast: {
    en: 'Copied!',
    hi: 'Copied!',
    kok: 'Copied!',
  },

  // Reporting Wizard
  step_1_title: {
    en: '1. Tell Us Problem',
    hi: '1. Tell Us Problem',
    kok: '1. Tell Us Problem',
  },
  step_2_title: {
    en: '2. Review Details',
    hi: '2. Review Details',
    kok: '2. Review Details',
  },
  step_3_title: {
    en: '3. Pick Location',
    hi: '3. Pick Location',
    kok: '3. Pick Location',
  },
  step_4_title: {
    en: '4. Confirm & Seal',
    hi: '4. Confirm & Seal',
    kok: '4. Confirm & Seal',
  },
  report_speech_prompt: {
    en: 'Speak in English using microphone:',
    hi: 'Speak in English using microphone:',
    kok: 'Speak in English using microphone:',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations) => string;
  currentLanguageInfo: LanguageInfo;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  const setLanguage = (lang: Language) => {
    setLanguageState('en');
  };

  const t = (key: keyof typeof translations): string => {
    const item = translations[key];
    if (!item) return key;
    return item['en'] || key;
  };

  const currentLanguageInfo = LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentLanguageInfo,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      t: (key: keyof typeof translations) => {
        const item = translations[key];
        return item ? item['en'] : key;
      },
      currentLanguageInfo: LANGUAGES[0],
    };
  }
  return context;
}
