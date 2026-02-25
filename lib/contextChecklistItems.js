/**
 * Context-aware checklist item generator.
 *
 * Generates additional checklist items based on the user's session context
 * (medicine type, setting, facilitator). These items supplement the 18
 * default template items already in the database.
 *
 * Each returned item includes { title, description, category, isEssential }
 * matching the schema expected by sessionChecklistService.addCustomItem().
 *
 * Categories: 'physical', 'safety', 'mental', 'practical'
 */

/**
 * Generate context-specific checklist items based on session details.
 *
 * @param {Object} context
 * @param {string} [context.medicine] - Medicine/substance name
 * @param {string} [context.setting]  - Location (home, clinic, retreat, etc.)
 * @param {string} [context.facilitator] - Facilitator type (solo, guide, etc.)
 * @returns {Array<{title: string, description: string, category: string, isEssential: boolean}>}
 */
export function generateContextItems({ medicine, setting, facilitator } = {}) {
  const items = [];
  const med = (medicine || '').toLowerCase();
  const loc = (setting || '').toLowerCase();
  const fac = (facilitator || '').toLowerCase();

  // --- Medicine-specific items ---
  if (med.includes('ayahuasca') || med.includes('aya')) {
    items.push(
      { title: 'Dieta followed', description: 'Follow dietary restrictions from your guide', category: 'physical', isEssential: true },
      { title: 'Purge bucket nearby', description: 'With liner, tissues, water for rinsing', category: 'practical', isEssential: true },
      { title: 'Change of clothes', description: 'In case of purging accidents', category: 'practical', isEssential: true },
    );
  }

  if (med.includes('psilocybin') || med.includes('mushroom') || med.includes('lsd') || med.includes('acid')) {
    items.push(
      { title: 'Trip reducers available', description: 'Benzos if prescribed, for emergencies only', category: 'safety', isEssential: false },
    );
  }

  if (med.includes('mdma') || med.includes('molly')) {
    items.push(
      { title: 'Electrolytes prepared', description: 'Sports drink or electrolyte water', category: 'physical', isEssential: false },
      { title: 'Supplements ready', description: 'Any recommended pre/post supplements', category: 'physical', isEssential: false },
    );
  }

  if (medicine) {
    items.push(
      { title: 'Dosage confirmed', description: 'Know exact amount and timing', category: 'safety', isEssential: true },
      { title: 'Medicine properly prepared', description: 'Measured, ready to consume', category: 'practical', isEssential: true },
    );
  }

  // --- Setting-specific items ---
  if (loc.includes('home') || loc.includes('personal')) {
    items.push(
      { title: 'Space cleaned and organized', description: 'Clutter-free, peaceful environment', category: 'practical', isEssential: true },
      { title: 'Lighting prepared', description: 'Dimmer, candles, or soft lamps ready', category: 'practical', isEssential: false },
      { title: 'Privacy ensured', description: 'No interruptions, door locked if needed', category: 'safety', isEssential: true },
    );
  }

  if (loc.includes('clinic') || loc.includes('center') || loc.includes('retreat')) {
    items.push(
      { title: 'Personal blanket or shawl', description: 'Something comforting from home', category: 'practical', isEssential: false },
      { title: 'Warm socks', description: 'Feet can get cold during sessions', category: 'practical', isEssential: true },
    );
  }

  // --- Facilitator-specific items ---
  if (fac.includes('solo') || fac.includes('self') || !facilitator) {
    items.push(
      { title: 'Emergency contact on standby', description: 'Someone who knows you are journeying', category: 'safety', isEssential: true },
      { title: 'Music playlist ready', description: 'Preselected playlist on your device', category: 'practical', isEssential: true },
    );
  }

  if (facilitator && !fac.includes('solo') && !fac.includes('self')) {
    items.push(
      { title: 'Sitter/facilitator confirmed', description: 'Verified attendance and timing', category: 'safety', isEssential: true },
      { title: 'Sitter briefed on intention', description: 'They know what you are working on', category: 'mental', isEssential: false },
    );
  }

  return items;
}
