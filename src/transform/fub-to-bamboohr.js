function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  const local = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (local.length !== 10) return raw;
  return `(${local.slice(0, 3)})${local.slice(3, 6)}-${local.slice(6)}`;
}

function extractTag(tags, prefix) {
  const match = tags.find(t => t.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

function extractEquipment(tags) {
  const map = {
    'Equipment-Laptop': 'Laptop',
    'Equipment-Monitor': 'Monitor',
    'Equipment-Badge': 'Badge',
  };
  return Object.entries(map)
    .filter(([tag]) => tags.includes(tag))
    .map(([, label]) => label);
}

function transform(fubPerson) {
  const tags = fubPerson.tags || [];
  const address = fubPerson.addresses?.[0] || {};
  const phone = fubPerson.phones?.[0]?.value;
  const email = fubPerson.emails?.[0]?.value;
  const custom = fubPerson.customFields || {};

  return {
    firstName: fubPerson.firstName,
    lastName: fubPerson.lastName,
    workEmail: email,
    mobilePhone: normalizePhone(phone),
    hireDate: custom.startDate || null,
    jobTitle: custom.position || null,
    department: extractTag(tags, 'Dept-'),
    supervisorId: custom.manager || null,
    address1: address.street || null,
    city: address.city || null,
    state: address.state || null,
    zipCode: address.zip || null,
    country: address.country || 'US',
    // Populated after field discovery — placeholders until npm run discover
    customField_equipmentNeeded: extractEquipment(tags),
    customField_fubPersonId: fubPerson.id,
  };
}

module.exports = { transform, normalizePhone, extractTag, extractEquipment };
