/**
 * Maps common Nominatim country name variants → canonical GeoJSON name
 * (Natural Earth common English names used by the world GeoJSON).
 */
export const COUNTRY_ALIASES: Record<string, string> = {
  // North America
  "United States": "United States of America",
  "USA": "United States of America",
  "US": "United States of America",
  // Europe
  "UK": "United Kingdom",
  "Britain": "United Kingdom",
  "Great Britain": "United Kingdom",
  "Czech Republic": "Czech Republic",
  "Czechia": "Czech Republic",
  "Republic of Ireland": "Ireland",
  "Russian Federation": "Russia",
  "Bosnia and Herzegovina": "Bosnia and Herz.",
  "North Macedonia": "Macedonia",
  "Republic of North Macedonia": "Macedonia",
  // Asia
  "Republic of Korea": "South Korea",
  "Korea, Republic of": "South Korea",
  "Democratic People's Republic of Korea": "North Korea",
  "Korea, Democratic People's Republic of": "North Korea",
  "People's Republic of China": "China",
  "Islamic Republic of Iran": "Iran",
  "Viet Nam": "Vietnam",
  "Republic of the Union of Myanmar": "Myanmar",
  "Lao People's Democratic Republic": "Laos",
  "Syrian Arab Republic": "Syria",
  "Hashemite Kingdom of Jordan": "Jordan",
  // Africa
  "United Republic of Tanzania": "Tanzania",
  "Democratic Republic of the Congo": "Dem. Rep. Congo",
  "Republic of the Congo": "Congo",
  "Côte d'Ivoire": "Ivory Coast",
  "Cote d'Ivoire": "Ivory Coast",
  "Swaziland": "eSwatini",
  // South America
  "Plurinational State of Bolivia": "Bolivia",
  "Bolivarian Republic of Venezuela": "Venezuela",
  // Oceania
  "Papua New Guinea": "Papua New Guinea",
};

/**
 * Normalise a country name from Nominatim to the name used in the GeoJSON.
 */
export function normalizeCountry(name: string): string {
  return COUNTRY_ALIASES[name] ?? name;
}

/**
 * Primary/most distinctive flag colour for each country (GeoJSON canonical name).
 * Falls back to INDIGO for unmapped countries.
 */
export const FLAG_COLORS: Record<string, string> = {
  // A
  Afghanistan: "#000000",
  Albania: "#E41E20",
  Algeria: "#006233",
  Angola: "#CC0000",
  Argentina: "#74ACDF",
  Armenia: "#D90012",
  Australia: "#00008B",
  Austria: "#ED2939",
  Azerbaijan: "#0092BC",
  // B
  Bangladesh: "#006A4E",
  Belarus: "#CF101A",
  Belgium: "#F6D027",
  Bolivia: "#D52B1E",
  "Bosnia and Herz.": "#002395",
  Brazil: "#009C3B",
  Bulgaria: "#00966E",
  // C
  Cambodia: "#032EA1",
  Cameroon: "#007A5E",
  Canada: "#D52B1E",
  Chile: "#D52B1E",
  China: "#DE2910",
  Colombia: "#FCD116",
  "Costa Rica": "#002B7F",
  Croatia: "#FF0000",
  Cuba: "#002A8F",
  Cyprus: "#4E6B00",
  "Czech Republic": "#D7141A",
  // D
  Denmark: "#C60C30",
  "Dominican Republic": "#002D62",
  // E
  Ecuador: "#FFD100",
  Egypt: "#CE1126",
  "El Salvador": "#0F47AF",
  Ethiopia: "#078930",
  // F
  Finland: "#003580",
  France: "#0055A4",
  // G
  Georgia: "#FF0000",
  Germany: "#FFCE00",
  Ghana: "#006B3F",
  Greece: "#0D5EAF",
  Guatemala: "#4997D0",
  // H
  Honduras: "#0073CF",
  Hungary: "#CE2939",
  // I
  Iceland: "#003897",
  India: "#FF9933",
  Indonesia: "#CE1126",
  Iran: "#239F40",
  Iraq: "#CE1126",
  Ireland: "#169B62",
  Israel: "#0038B8",
  Italy: "#009246",
  "Ivory Coast": "#F77F00",
  // J
  Jamaica: "#000000",
  Japan: "#BC002D",
  Jordan: "#007A3D",
  // K
  Kazakhstan: "#00AFCA",
  Kenya: "#006600",
  Kosovo: "#244AA5",
  // L
  Laos: "#CE1126",
  Latvia: "#9E3039",
  Lebanon: "#00A651",
  Libya: "#000000",
  Lithuania: "#FDB913",
  Luxembourg: "#00A3E0",
  // M
  Macedonia: "#CE2028",
  Malaysia: "#CC0001",
  Mexico: "#006847",
  Moldova: "#003DA5",
  Mongolia: "#C4272F",
  Morocco: "#C1272D",
  Myanmar: "#FECB00",
  // N
  Nepal: "#003893",
  Netherlands: "#AE1C28",
  "New Zealand": "#00247D",
  Nicaragua: "#3A75C4",
  Nigeria: "#008751",
  "North Korea": "#024FA2",
  Norway: "#EF2B2D",
  // O
  Oman: "#DB161B",
  // P
  Pakistan: "#01411C",
  Panama: "#DB161B",
  Paraguay: "#D52B1E",
  Peru: "#D91023",
  Philippines: "#0038A8",
  Poland: "#DC143C",
  Portugal: "#006600",
  // R
  Romania: "#002B7F",
  Russia: "#D52B1E",
  // S
  "Saudi Arabia": "#006C35",
  Serbia: "#C6363C",
  Slovakia: "#0B4EA2",
  Slovenia: "#003DA5",
  "South Africa": "#007A4D",
  "South Korea": "#003478",
  Spain: "#AA151B",
  "Sri Lanka": "#8D153A",
  Sudan: "#D21034",
  Sweden: "#006AA7",
  Switzerland: "#FF0000",
  Syria: "#CE1126",
  // T
  Tanzania: "#1EB53A",
  Thailand: "#A51931",
  Tunisia: "#E70013",
  Turkey: "#E30A17",
  // U
  Uganda: "#000000",
  Ukraine: "#005BBB",
  "United Arab Emirates": "#00732F",
  "United Kingdom": "#012169",
  "United States of America": "#B22234",
  Uruguay: "#5EB6E4",
  Uzbekistan: "#1EB53A",
  // V
  Venezuela: "#CF142B",
  Vietnam: "#DA251D",
  // Y
  Yemen: "#CE1126",
  // Z
  Zambia: "#198A00",
  Zimbabwe: "#006400",
  // Dem. Rep. Congo / Congo
  "Dem. Rep. Congo": "#007FFF",
  Congo: "#009A44",
};

export const DEFAULT_COUNTRY_COLOR = "#6366f1"; // indigo fallback

export function getFlagColor(geoJsonCountryName: string): string {
  return FLAG_COLORS[geoJsonCountryName] ?? DEFAULT_COUNTRY_COLOR;
}

/**
 * GeoJSON canonical country name → ISO 3166-1 alpha-2 code.
 * Used to build flag image URLs: https://flagcdn.com/w320/{iso2}.png
 */
export const COUNTRY_ISO2: Record<string, string> = {
  Afghanistan: "af", Albania: "al", Algeria: "dz", Angola: "ao",
  Argentina: "ar", Armenia: "am", Australia: "au", Austria: "at",
  Azerbaijan: "az", Bangladesh: "bd", Belarus: "by", Belgium: "be",
  Belize: "bz", Benin: "bj", Bhutan: "bt", Bolivia: "bo",
  "Bosnia and Herz.": "ba", Botswana: "bw", Brazil: "br", Bulgaria: "bg",
  "Burkina Faso": "bf", Burundi: "bi", Cambodia: "kh", Cameroon: "cm",
  Canada: "ca", "Cape Verde": "cv", "Central African Rep.": "cf",
  Chad: "td", Chile: "cl", China: "cn", Colombia: "co",
  Comoros: "km", Congo: "cg", "Costa Rica": "cr", Croatia: "hr",
  Cuba: "cu", Cyprus: "cy", "Czech Republic": "cz", Denmark: "dk",
  Djibouti: "dj", "Dominican Republic": "do", "Dem. Rep. Congo": "cd",
  Ecuador: "ec", Egypt: "eg", "El Salvador": "sv", "Eq. Guinea": "gq",
  Eritrea: "er", Estonia: "ee", Eswatini: "sz", Ethiopia: "et",
  Fiji: "fj", Finland: "fi", France: "fr", Gabon: "ga",
  Gambia: "gm", Georgia: "ge", Germany: "de", Ghana: "gh",
  Greece: "gr", Guatemala: "gt", Guinea: "gn", "Guinea-Bissau": "gw",
  Guyana: "gy", Haiti: "ht", Honduras: "hn", Hungary: "hu",
  Iceland: "is", India: "in", Indonesia: "id", Iran: "ir",
  Iraq: "iq", Ireland: "ie", Israel: "il", Italy: "it",
  "Ivory Coast": "ci", Jamaica: "jm", Japan: "jp", Jordan: "jo",
  Kazakhstan: "kz", Kenya: "ke", Kosovo: "xk", Kuwait: "kw",
  Kyrgyzstan: "kg", Laos: "la", Latvia: "lv", Lebanon: "lb",
  Lesotho: "ls", Liberia: "lr", Libya: "ly", Lithuania: "lt",
  Luxembourg: "lu", Macedonia: "mk", Madagascar: "mg", Malawi: "mw",
  Malaysia: "my", Mali: "ml", Malta: "mt", Mauritania: "mr",
  Mexico: "mx", Moldova: "md", Mongolia: "mn", Montenegro: "me",
  Morocco: "ma", Mozambique: "mz", Myanmar: "mm", Namibia: "na",
  Nepal: "np", Netherlands: "nl", "New Zealand": "nz", Nicaragua: "ni",
  Niger: "ne", Nigeria: "ng", "North Korea": "kp", Norway: "no",
  Oman: "om", Pakistan: "pk", Panama: "pa", "Papua New Guinea": "pg",
  Paraguay: "py", Peru: "pe", Philippines: "ph", Poland: "pl",
  Portugal: "pt", Qatar: "qa", Romania: "ro", Russia: "ru",
  Rwanda: "rw", "Saudi Arabia": "sa", Senegal: "sn", Serbia: "rs",
  "Sierra Leone": "sl", Singapore: "sg", Slovakia: "sk", Slovenia: "si",
  Somalia: "so", "South Africa": "za", "South Korea": "kr",
  "S. Sudan": "ss", Spain: "es", "Sri Lanka": "lk", Sudan: "sd",
  Suriname: "sr", Sweden: "se", Switzerland: "ch", Syria: "sy",
  Tajikistan: "tj", Tanzania: "tz", Thailand: "th", "Timor-Leste": "tl",
  Togo: "tg", "Trinidad and Tobago": "tt", Tunisia: "tn", Turkey: "tr",
  Turkmenistan: "tm", Uganda: "ug", Ukraine: "ua",
  "United Arab Emirates": "ae", "United Kingdom": "gb",
  "United States of America": "us", Uruguay: "uy", Uzbekistan: "uz",
  Vanuatu: "vu", Venezuela: "ve", Vietnam: "vn", Yemen: "ye",
  Zambia: "zm", Zimbabwe: "zw",
};

