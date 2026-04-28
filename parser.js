const COUNTRY_MAP = {
  // Africa
  nigeria: "NG",
  angola: "AO",
  kenya: "KE",
  tanzania: "TZ",
  uganda: "UG",
  sudan: "SD",
  ghana: "GH",
  egypt: "EG",
  ethiopia: "ET",
  south_africa: "ZA",
  morocco: "MA",
  algeria: "DZ",
  senegal: "SN",
  cameroon: "CM",
  ivory_coast: "CI",

  // Europe
  united_kingdom: "GB",
  uk: "GB",
  germany: "DE",
  france: "FR",
  italy: "IT",
  spain: "ES",
  netherlands: "NL",
  sweden: "SE",
  norway: "NO",
  poland: "PL",
  portugal: "PT",
  switzerland: "CH",
  russia: "RU",
  turkey: "TR",

  // Americas
  usa: "US",
  united_states: "US",
  canada: "CA",
  brazil: "BR",
  mexico: "MX",
  argentina: "AR",
  colombia: "CO",
  chile: "CL",
  peru: "PE",

  // Asia & Oceania
  china: "CN",
  japan: "JP",
  india: "IN",
  south_korea: "KR",
  indonesia: "ID",
  pakistan: "PK",
  vietnam: "VN",
  thailand: "TH",
  philippines: "PH",
  australia: "AU",
  new_zealand: "NZ",
};

export const parseQuery = (query) => {
  const q = query.toLowerCase();
  const filters = {};

  // Gender
  if (q.includes("male") && !q.includes("female")) filters.gender = "male";
  if (q.includes("female")) filters.gender = "female";

  // Age Groups
  if (q.includes("teenager")) filters.age_group = "teenager";
  if (q.includes("adult")) filters.age_group = "adult";
  if (q.includes("senior")) filters.age_group = "senior";
  if (q.includes("child")) filters.age_group = "child";

  // Young group logic
  if (q.includes("young")) {
    filters.min_age = 16;
    filters.max_age = 24;
  }

  // "Above X" Logic
  const aboveMatch = q.match(/above (\d+)/);
  if (aboveMatch) filters.min_age = parseInt(aboveMatch[1]);

  // Country Detection
  Object.keys(COUNTRY_MAP).forEach((country) => {
    if (q.includes(country)) filters.country_id = COUNTRY_MAP[country];
  });

  // If no filter found
  if (Object.keys(filters).length === 0) return null;

  return filters;
};
