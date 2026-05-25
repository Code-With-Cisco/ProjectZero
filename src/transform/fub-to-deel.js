const COUNTRY_MAP = {
  'Afghanistan': 'AF', 'Albania': 'AL', 'Algeria': 'DZ', 'Argentina': 'AR',
  'Australia': 'AU', 'Austria': 'AT', 'Belgium': 'BE', 'Brazil': 'BR',
  'Canada': 'CA', 'Chile': 'CL', 'China': 'CN', 'Colombia': 'CO',
  'Czech Republic': 'CZ', 'Denmark': 'DK', 'Egypt': 'EG', 'Finland': 'FI',
  'France': 'FR', 'Germany': 'DE', 'Greece': 'GR', 'Hong Kong': 'HK',
  'Hungary': 'HU', 'India': 'IN', 'Indonesia': 'ID', 'Ireland': 'IE',
  'Israel': 'IL', 'Italy': 'IT', 'Japan': 'JP', 'Kenya': 'KE',
  'Malaysia': 'MY', 'Mexico': 'MX', 'Netherlands': 'NL', 'New Zealand': 'NZ',
  'Nigeria': 'NG', 'Norway': 'NO', 'Pakistan': 'PK', 'Peru': 'PE',
  'Philippines': 'PH', 'Poland': 'PL', 'Portugal': 'PT', 'Romania': 'RO',
  'Singapore': 'SG', 'South Africa': 'ZA', 'South Korea': 'KR', 'Spain': 'ES',
  'Sweden': 'SE', 'Switzerland': 'CH', 'Taiwan': 'TW', 'Thailand': 'TH',
  'Turkey': 'TR', 'Ukraine': 'UA', 'United Arab Emirates': 'AE',
  'United Kingdom': 'GB', 'United States': 'US', 'Vietnam': 'VN',
};

function extractCountryCode(address) {
  if (!address) return null;
  if (address.country && address.country.length === 2) return address.country.toUpperCase();
  const name = address.country || '';
  if (COUNTRY_MAP[name]) return COUNTRY_MAP[name];
  // Fall back to parsing city field: "Paris, France" → "France"
  const cityStr = address.city || '';
  const parts = cityStr.split(',').map(p => p.trim());
  const last = parts[parts.length - 1];
  return COUNTRY_MAP[last] || null;
}

function transform(fubPerson) {
  const tags = fubPerson.tags || [];
  const address = fubPerson.addresses?.[0] || {};
  const email = fubPerson.emails?.[0]?.value;
  const custom = fubPerson.customFields || {};
  const dept = tags.find(t => t.startsWith('Dept-'))?.slice(5) || null;

  return {
    firstName: fubPerson.firstName,
    lastName: fubPerson.lastName,
    email,
    jobTitle: custom.position || null,
    department: dept,
    startDate: custom.startDate || null,
    countryCode: extractCountryCode(address),
    address: {
      street: address.street || null,
      city: address.city || null,
      postalCode: address.zip || null,
      country: extractCountryCode(address),
    },
    seniorityLevel: 'mid',     // Deel required field — update per hire if needed
    contractType: 'fixed',     // Deel contract type — update per hire if needed
    fubPersonId: fubPerson.id,
  };
}

module.exports = { transform, extractCountryCode };
