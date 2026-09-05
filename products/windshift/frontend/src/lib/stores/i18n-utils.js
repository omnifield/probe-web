/**
 * Select the CLDR plural category for a locale and count.
 * @param {string} localeCode
 * @param {number} count
 * @returns {Intl.LDMLPluralRule}
 */
export function getPluralCategory(localeCode, count) {
  return new Intl.PluralRules(localeCode).select(Number(count));
}
