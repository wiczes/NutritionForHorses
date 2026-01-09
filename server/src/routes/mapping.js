function normalize(str) {
  if (!str) return "";
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const aliasRaw = {
  'wyslodki buraczane': 'wyslodki',
};

const aliasMap = {};
Object.entries(aliasRaw).forEach(([k, v]) => {
  aliasMap[normalize(k)] = v;
});

const goalsMapping = {
  'uspokojenie konia': ['nadpobudliwosc'],
  'dodanie energii': ['ospalosc'],
  'budowa masy mięśniowej': ['budowamiesni'],
  'utrata tkanki tłuszczowej': ['redukcja'],
  'nabranie tkanki tłuszczowej': ['nabraniewagi'],
  'utrzymanie zbilansowanej diety': ['utrzymanie'],
};

const supplementsMapping = {
  'wzmocnienie wątroby': ['slabawatroba'],
  'słabe lub kontuzjowane ścięgna i stawy': ['slabesciegnaistawy'],
  'wzmocnienie zdrowych ścięgien': ['sport', 'wyczynowy'],
  'regeneracja mięśni': ['regeneracjamiesni'],
  'wzmocnienie odporności': ['odpornosc'],
  'problemy oddechowe': ['oddechowe'],
  'wzmocnienie jelit': ['slabejelita'],
  'wrzody żołądka': ['wrzody'],
  'wzmocnienie żołądka': ['slabybrzuch'],
  'kwasowość żołądka': ['kwasowosc'],
  'odpiaszczanie': ['odpiaszczanie'],
  'wzmocnienie kopyt': ['slabekopyta'],
  'brak połysku sierści': ['slabasiersc'],
  'wzmocnienie zębów': ['slabezeby'],
  'odstraszenie owadów': ['owady'],
  'koń nerwowy': ['nadpobudliwosc'],
  'klacz nerwowa podczas rui': ['ruja'],
  'wzmożony strach lub stres': ['nerwowe', 'plochliwe'],
};

const basicInfoMapping = {
  'Niski wysiłek (koń na pastwisku)': ['utrzymanie', 'zrownowazonaenergia'],
  'Średni wysiłek (rekreacja, ok. 1 godz. dziennie)': ['utrzymanie'],
  'Średni wysiłek (mały sport)': ['sport', 'elektrolit'],
  'Wysoki wysiłek (sport wyczynowy)': ['wyczynowy', 'elektrolit'],
  'Klacz źrebna': ['ciaza'],
  'Klacz w laktacji': ['laktacja'],
  'Źrebię': ['zrebie'],
  'Emeryt': ['senior'],
  'Ogier kryjący': ['ogierkryjacy'],
  'Koń kontuzjowany': ['kontuzjowany'],
};

module.exports = {
  normalize,
  aliasMap,
  goalsMapping,
  supplementsMapping,
  basicInfoMapping
};