export interface StateRtiInfo {
  state: string;
  portalName: string;
  portalUrl: string;
  sicName?: string;
  sicUrl?: string;
}

export const STATE_RTI_PORTALS: Record<string, StateRtiInfo> = {
  'Andhra Pradesh': {
    state: 'Andhra Pradesh',
    portalName: 'AP RTI Online Portal',
    portalUrl: 'https://rtionline.ap.gov.in',
    sicName: 'Andhra Pradesh State Information Commission (APSIC)',
    sicUrl: 'https://apsic.ap.gov.in',
  },
  'Arunachal Pradesh': {
    state: 'Arunachal Pradesh',
    portalName: 'Arunachal Pradesh Information Commission (APIC)',
    portalUrl: 'https://apic.nic.in',
    sicName: 'APIC Official Portal',
    sicUrl: 'https://apic.nic.in',
  },
  'Assam': {
    state: 'Assam',
    portalName: 'Assam State Information Commission',
    portalUrl: 'https://sic.assam.gov.in',
    sicName: 'Assam SIC Portal',
    sicUrl: 'https://sic.assam.gov.in',
  },
  'Bihar': {
    state: 'Bihar',
    portalName: 'Jaankari RTI Bihar Portal',
    portalUrl: 'https://rtionline.bihar.gov.in',
    sicName: 'Bihar State Information Commission',
    sicUrl: 'https://state.bihar.gov.in/sic',
  },
  'Chhattisgarh': {
    state: 'Chhattisgarh',
    portalName: 'Chhattisgarh State Information Commission',
    portalUrl: 'https://sic.cg.gov.in',
    sicName: 'CG SIC Portal',
    sicUrl: 'https://sic.cg.gov.in',
  },
  'Goa': {
    state: 'Goa',
    portalName: 'Goa State RTI Portal',
    portalUrl: 'https://rtionline.goa.gov.in',
    sicName: 'Goa State Information Commission (GSIC)',
    sicUrl: 'https://gsic.goa.gov.in',
  },
  'Gujarat': {
    state: 'Gujarat',
    portalName: 'Gujarat RTI Online Portal',
    portalUrl: 'https://rti.gujarat.gov.in',
    sicName: 'Gujarat State Information Commission (GSIC)',
    sicUrl: 'https://gsic.gujarat.gov.in',
  },
  'Haryana': {
    state: 'Haryana',
    portalName: 'Haryana RTI Online Portal',
    portalUrl: 'https://rtionline.haryana.gov.in',
    sicName: 'Haryana State Information Commission',
    sicUrl: 'https://hic.gov.in',
  },
  'Himachal Pradesh': {
    state: 'Himachal Pradesh',
    portalName: 'Himachal RTI Online Portal',
    portalUrl: 'https://rtionline.hp.gov.in',
    sicName: 'HP State Information Commission',
    sicUrl: 'https://hpsic.nic.in',
  },
  'Jharkhand': {
    state: 'Jharkhand',
    portalName: 'Jharkhand State Information Commission',
    portalUrl: 'https://jnsik.jharkhand.gov.in',
    sicName: 'Jharkhand SIC',
    sicUrl: 'https://jnsik.jharkhand.gov.in',
  },
  'Karnataka': {
    state: 'Karnataka',
    portalName: 'Mahiti Karnataka RTI Online',
    portalUrl: 'https://rtionline.karnataka.gov.in',
    sicName: 'Karnataka Information Commission (KIC)',
    sicUrl: 'https://kic.karnataka.gov.in',
  },
  'Kerala': {
    state: 'Kerala',
    portalName: 'Kerala State Information Commission',
    portalUrl: 'https://sic.kerala.gov.in',
    sicName: 'Kerala SIC Portal',
    sicUrl: 'https://sic.kerala.gov.in',
  },
  'Madhya Pradesh': {
    state: 'Madhya Pradesh',
    portalName: 'MP RTI Online Portal',
    portalUrl: 'https://rti.mp.gov.in',
    sicName: 'MP State Information Commission',
    sicUrl: 'https://sic.mp.gov.in',
  },
  'Maharashtra': {
    state: 'Maharashtra',
    portalName: 'Maharashtra RTI Online Portal',
    portalUrl: 'https://rtionline.maharashtra.gov.in',
    sicName: 'Maharashtra State Information Commission',
    sicUrl: 'https://sic.maharashtra.gov.in',
  },
  'Manipur': {
    state: 'Manipur',
    portalName: 'Manipur State Information Commission',
    portalUrl: 'https://manipur.gov.in/state-information-commission/',
    sicName: 'Manipur SIC',
    sicUrl: 'https://manipur.gov.in/state-information-commission/',
  },
  'Meghalaya': {
    state: 'Meghalaya',
    portalName: 'Meghalaya State Information Commission',
    portalUrl: 'https://megsic.gov.in',
    sicName: 'Meghalaya SIC Portal',
    sicUrl: 'https://megsic.gov.in',
  },
  'Mizoram': {
    state: 'Mizoram',
    portalName: 'Mizoram State Information Commission',
    portalUrl: 'https://mizoramsic.mizoram.gov.in',
    sicName: 'Mizoram SIC',
    sicUrl: 'https://mizoramsic.mizoram.gov.in',
  },
  'Nagaland': {
    state: 'Nagaland',
    portalName: 'Nagaland State Information Commission',
    portalUrl: 'https://sic.nagaland.gov.in',
    sicName: 'Nagaland SIC',
    sicUrl: 'https://sic.nagaland.gov.in',
  },
  'Odisha': {
    state: 'Odisha',
    portalName: 'Odisha RTI Online Portal',
    portalUrl: 'https://rtiodisha.gov.in',
    sicName: 'Odisha State Information Commission',
    sicUrl: 'https://odishasic.nic.in',
  },
  'Punjab': {
    state: 'Punjab',
    portalName: 'Punjab RTI Online Portal',
    portalUrl: 'https://rtionline.punjab.gov.in',
    sicName: 'State Information Commission Punjab',
    sicUrl: 'https://infocommpunjab.com',
  },
  'Rajasthan': {
    state: 'Rajasthan',
    portalName: 'Rajasthan RTI Online Portal',
    portalUrl: 'https://rti.rajasthan.gov.in',
    sicName: 'Rajasthan Information Commission (RIC)',
    sicUrl: 'https://ric.rajasthan.gov.in',
  },
  'Sikkim': {
    state: 'Sikkim',
    portalName: 'Sikkim State Information Commission',
    portalUrl: 'https://sic.sikkim.gov.in',
    sicName: 'Sikkim SIC',
    sicUrl: 'https://sic.sikkim.gov.in',
  },
  'Tamil Nadu': {
    state: 'Tamil Nadu',
    portalName: 'Tamil Nadu RTI Online Portal',
    portalUrl: 'https://rtionline.tn.gov.in',
    sicName: 'Tamil Nadu State Information Commission (TNSIC)',
    sicUrl: 'https://tnsic.tn.gov.in',
  },
  'Telangana': {
    state: 'Telangana',
    portalName: 'Telangana RTI Online Portal',
    portalUrl: 'https://rtionline.telangana.gov.in',
    sicName: 'Telangana State Information Commission (TSIC)',
    sicUrl: 'https://tsic.gov.in',
  },
  'Tripura': {
    state: 'Tripura',
    portalName: 'Tripura State Information Commission',
    portalUrl: 'https://sic.tripura.gov.in',
    sicName: 'Tripura SIC',
    sicUrl: 'https://sic.tripura.gov.in',
  },
  'Uttar Pradesh': {
    state: 'Uttar Pradesh',
    portalName: 'UP RTI Online Portal',
    portalUrl: 'https://rtionline.up.gov.in',
    sicName: 'UP State Information Commission (UPSIC)',
    sicUrl: 'https://upsic.up.gov.in',
  },
  'Uttarakhand': {
    state: 'Uttarakhand',
    portalName: 'Uttarakhand Information Commission',
    portalUrl: 'https://uic.uk.gov.in',
    sicName: 'Uttarakhand SIC',
    sicUrl: 'https://uic.uk.gov.in',
  },
  'West Bengal': {
    state: 'West Bengal',
    portalName: 'West Bengal Information Commission',
    portalUrl: 'https://wbic.wb.gov.in',
    sicName: 'WBIC Official Portal',
    sicUrl: 'https://wbic.wb.gov.in',
  },
  'Delhi': {
    state: 'Delhi',
    portalName: 'Delhi RTI Online Portal',
    portalUrl: 'https://rtionline.delhi.gov.in',
    sicName: 'Central Information Commission (Delhi jurisdiction)',
    sicUrl: 'https://cic.gov.in',
  },
  'Jammu and Kashmir': {
    state: 'Jammu and Kashmir',
    portalName: 'J&K Information Portal',
    portalUrl: 'https://jksic.nic.in',
    sicName: 'Central Information Commission (J&K)',
    sicUrl: 'https://cic.gov.in',
  },
  'Chandigarh': {
    state: 'Chandigarh',
    portalName: 'Chandigarh RTI Portal',
    portalUrl: 'https://chandigarh.gov.in',
    sicName: 'Chandigarh Administration RTI',
    sicUrl: 'https://chandigarh.gov.in',
  },
  'Puducherry': {
    state: 'Puducherry',
    portalName: 'Puducherry State Information Commission',
    portalUrl: 'https://sic.py.gov.in',
    sicName: 'Puducherry SIC',
    sicUrl: 'https://sic.py.gov.in',
  },
  'Ladakh': {
    state: 'Ladakh',
    portalName: 'UT Ladakh Administration Portal',
    portalUrl: 'https://ladakh.nic.in',
    sicName: 'Central Information Commission (Ladakh)',
    sicUrl: 'https://cic.gov.in',
  },
  'Andaman and Nicobar Islands': {
    state: 'Andaman and Nicobar Islands',
    portalName: 'A&N Administration RTI',
    portalUrl: 'https://andaman.gov.in',
    sicName: 'Central Information Commission (A&N)',
    sicUrl: 'https://cic.gov.in',
  },
  'Dadra and Nagar Haveli and Daman and Diu': {
    state: 'Dadra and Nagar Haveli and Daman and Diu',
    portalName: 'Daman & Diu Administration RTI',
    portalUrl: 'https://daman.nic.in',
    sicName: 'Central Information Commission (DNH & DD)',
    sicUrl: 'https://cic.gov.in',
  },
  'Lakshadweep': {
    state: 'Lakshadweep',
    portalName: 'Lakshadweep Administration RTI',
    portalUrl: 'https://lakshadweep.gov.in',
    sicName: 'Central Information Commission (Lakshadweep)',
    sicUrl: 'https://cic.gov.in',
  },
};

export function getStateRtiPortal(stateName?: string): StateRtiInfo | null {
  if (!stateName) return null;
  const clean = stateName.trim().toLowerCase();
  for (const [key, val] of Object.entries(STATE_RTI_PORTALS)) {
    if (key.toLowerCase() === clean) return val;
  }
  return null;
}
