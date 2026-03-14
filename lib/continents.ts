// Maps city/country keywords (lowercase) to continents
const CONTINENT_MAP: Record<string, string> = {
  // Europe
  paris: "Europe", london: "Europe", rome: "Europe", berlin: "Europe",
  amsterdam: "Europe", madrid: "Europe", barcelona: "Europe", prague: "Europe",
  vienna: "Europe", lisbon: "Europe", athens: "Europe", budapest: "Europe",
  brussels: "Europe", zurich: "Europe", stockholm: "Europe", oslo: "Europe",
  copenhagen: "Europe", helsinki: "Europe", warsaw: "Europe", dublin: "Europe",
  edinburgh: "Europe", florence: "Europe", venice: "Europe", milan: "Europe",
  naples: "Europe", porto: "Europe", seville: "Europe", geneva: "Europe",
  istanbul: "Europe", santorini: "Europe", mykonos: "Europe", dubrovnik: "Europe",
  split: "Europe", kotor: "Europe", reykjavik: "Europe", valletta: "Europe",
  france: "Europe", england: "Europe", italy: "Europe", spain: "Europe",
  germany: "Europe", netherlands: "Europe", portugal: "Europe", greece: "Europe",
  switzerland: "Europe", austria: "Europe", sweden: "Europe", norway: "Europe",
  denmark: "Europe", finland: "Europe", poland: "Europe", ireland: "Europe",
  scotland: "Europe", croatia: "Europe", romania: "Europe", bulgaria: "Europe",
  "czech republic": "Europe", slovakia: "Europe", hungary: "Europe",
  iceland: "Europe", turkey: "Europe", luxembourg: "Europe", malta: "Europe",
  belgium: "Europe", ukraine: "Europe", serbia: "Europe", slovenia: "Europe",

  // Asia
  tokyo: "Asia", kyoto: "Asia", osaka: "Asia", hiroshima: "Asia", nara: "Asia",
  beijing: "Asia", shanghai: "Asia", "hong kong": "Asia", seoul: "Asia", busan: "Asia",
  bangkok: "Asia", singapore: "Asia", bali: "Asia", jakarta: "Asia", "kuala lumpur": "Asia",
  mumbai: "Asia", delhi: "Asia", "new delhi": "Asia", jaipur: "Asia", goa: "Asia",
  taipei: "Asia", hanoi: "Asia", "ho chi minh": "Asia", phuket: "Asia", "chiang mai": "Asia",
  "siem reap": "Asia", "phnom penh": "Asia", yangon: "Asia", kathmandu: "Asia",
  colombo: "Asia", maldives: "Asia", dubai: "Asia", "abu dhabi": "Asia",
  doha: "Asia", riyadh: "Asia", beirut: "Asia", amman: "Asia", jerusalem: "Asia",
  "tel aviv": "Asia", muscat: "Asia", manama: "Asia",
  japan: "Asia", china: "Asia", "south korea": "Asia", korea: "Asia",
  thailand: "Asia", indonesia: "Asia", india: "Asia", vietnam: "Asia",
  cambodia: "Asia", malaysia: "Asia", philippines: "Asia", myanmar: "Asia",
  nepal: "Asia", "sri lanka": "Asia", uae: "Asia", qatar: "Asia",
  "saudi arabia": "Asia", jordan: "Asia", israel: "Asia", oman: "Asia",
  taiwan: "Asia", laos: "Asia", bangladesh: "Asia", pakistan: "Asia",
  mongolia: "Asia", uzbekistan: "Asia", georgia: "Asia", armenia: "Asia",
  cebu: "Asia", boracay: "Asia", jeju: "Asia",

  // North America
  "new york": "North America", nyc: "North America", "los angeles": "North America",
  chicago: "North America", miami: "North America", "san francisco": "North America",
  "las vegas": "North America", seattle: "North America", boston: "North America",
  washington: "North America", toronto: "North America", vancouver: "North America",
  montreal: "North America", "mexico city": "North America", cancun: "North America",
  havana: "North America", "san jose": "North America", panama: "North America",
  "new orleans": "North America", nashville: "North America", austin: "North America",
  denver: "North America", portland: "North America", phoenix: "North America",
  "san diego": "North America", calgary: "North America", ottawa: "North America",
  guadalajara: "North America", monterrey: "North America", hawaii: "North America",
  usa: "North America", "united states": "North America", canada: "North America",
  mexico: "North America", cuba: "North America", "costa rica": "North America",
  jamaica: "North America", bahamas: "North America", "puerto rico": "North America",
  guatemala: "North America", honduras: "North America", nicaragua: "North America",
  belize: "North America", "el salvador": "North America", "dominican republic": "North America",
  barbados: "North America", trinidad: "North America",

  // South America
  "rio de janeiro": "South America", "sao paulo": "South America",
  "buenos aires": "South America", lima: "South America", bogota: "South America",
  santiago: "South America", cartagena: "South America", cusco: "South America",
  "machu picchu": "South America", medellin: "South America", quito: "South America",
  "la paz": "South America", montevideo: "South America", caracas: "South America",
  patagonia: "South America", galapagos: "South America",
  brazil: "South America", argentina: "South America", peru: "South America",
  colombia: "South America", chile: "South America", ecuador: "South America",
  bolivia: "South America", uruguay: "South America", paraguay: "South America",
  venezuela: "South America", suriname: "South America", guyana: "South America",

  // Africa
  cairo: "Africa", nairobi: "Africa", "cape town": "Africa", johannesburg: "Africa",
  marrakech: "Africa", casablanca: "Africa", "addis ababa": "Africa", lagos: "Africa",
  accra: "Africa", "dar es salaam": "Africa", zanzibar: "Africa", serengeti: "Africa",
  kilimanjaro: "Africa", luxor: "Africa", aswan: "Africa", "victoria falls": "Africa",
  dakar: "Africa", kigali: "Africa", kampala: "Africa", harare: "Africa",
  egypt: "Africa", kenya: "Africa", "south africa": "Africa", morocco: "Africa",
  ethiopia: "Africa", nigeria: "Africa", ghana: "Africa", tanzania: "Africa",
  uganda: "Africa", rwanda: "Africa", madagascar: "Africa", mauritius: "Africa",
  seychelles: "Africa", botswana: "Africa", zimbabwe: "Africa", mozambique: "Africa",
  namibia: "Africa", zambia: "Africa", senegal: "Africa", tunisia: "Africa",
  algeria: "Africa", libya: "Africa", sudan: "Africa", cameroon: "Africa",

  // Oceania
  sydney: "Oceania", melbourne: "Oceania", brisbane: "Oceania", perth: "Oceania",
  auckland: "Oceania", queenstown: "Oceania", cairns: "Oceania",
  "gold coast": "Oceania", christchurch: "Oceania", wellington: "Oceania",
  fiji: "Oceania", tahiti: "Oceania", "bora bora": "Oceania",
  australia: "Oceania", "new zealand": "Oceania", "papua new guinea": "Oceania",
  samoa: "Oceania", tonga: "Oceania", vanuatu: "Oceania",

  // Antarctica
  antarctica: "Antarctica",
};

const CONTINENT_ORDER = [
  "Europe", "Asia", "North America", "South America", "Africa", "Oceania", "Antarctica",
];

/** Returns all continents a travel plan belongs to based on its cities string. */
export function getContinents(cities: string | null): string[] {
  if (!cities || !cities.trim()) return ["Unknown"];

  const entries = cities.toLowerCase().split(",").map((c) => c.trim());
  const found = new Set<string>();

  for (const entry of entries) {
    let matched = false;
    for (const [keyword, continent] of Object.entries(CONTINENT_MAP)) {
      if (entry.includes(keyword) || keyword.includes(entry)) {
        found.add(continent);
        matched = true;
        break;
      }
    }
    if (!matched) found.add("Unknown");
  }

  return Array.from(found);
}

/** Sorts continent names in a logical display order. */
export function sortContinents(continents: string[]): string[] {
  return [...continents].sort((a, b) => {
    const ai = CONTINENT_ORDER.indexOf(a);
    const bi = CONTINENT_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}
