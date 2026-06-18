export function getCompanyKey(companyName = '') {
  const name = String(companyName).trim().toLowerCase();
  if (name.includes('demand')) return 'demand';
  if (name.includes('ptw') || name.includes('pluto')) return 'ptw';
  return null;
}

export function filterByCompany(makers, companyKey) {
  if (!companyKey) return makers;
  return makers.filter((m) => getCompanyKey(m.companyName) === companyKey);
}

export function belongsToCompany(maker, companyKey) {
  return getCompanyKey(maker?.companyName) === companyKey;
}

export function filterRecordsByCompany(records, companyMakers) {
  const ids = new Set(companyMakers.map((m) => String(m._id)));
  return records.filter((r) => ids.has(String(r.userId)));
}
