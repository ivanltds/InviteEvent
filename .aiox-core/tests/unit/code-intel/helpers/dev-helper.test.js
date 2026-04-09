'use strict';

const devHelper = require('../../../../core/code-intel/helpers/dev-helper');

describe('DevHelper (Code Intelligence Helpers)', () => {
  describe('_calculateRiskLevel', () => {
    it('should return LOW for blast radius <= LOW_MAX', () => {
      expect(devHelper._calculateRiskLevel(0)).toBe('LOW');
      expect(devHelper._calculateRiskLevel(devHelper.RISK_THRESHOLDS.LOW_MAX)).toBe('LOW');
    });

    it('should return MEDIUM for blast radius between LOW_MAX and MEDIUM_MAX', () => {
      expect(devHelper._calculateRiskLevel(devHelper.RISK_THRESHOLDS.LOW_MAX + 1)).toBe('MEDIUM');
      expect(devHelper._calculateRiskLevel(devHelper.RISK_THRESHOLDS.MEDIUM_MAX)).toBe('MEDIUM');
    });

    it('should return HIGH for blast radius > MEDIUM_MAX', () => {
      expect(devHelper._calculateRiskLevel(devHelper.RISK_THRESHOLDS.MEDIUM_MAX + 1)).toBe('HIGH');
      expect(devHelper._calculateRiskLevel(100)).toBe('HIGH');
    });
  });

  describe('_formatSuggestion', () => {
    it('should format message with duplicates and references', () => {
      const dupes = { matches: [{ file: 'existing.js', line: 10 }] };
      const refs = [{ file: 'usage.js', line: 5 }];
      const result = devHelper._formatSuggestion(dupes, refs);
      
      expect(result).toContain('Found 1 similar match(es)');
      expect(result).toContain('Closest: existing.js:10');
      expect(result).toContain('Symbol already referenced in 1 location(s)');
      expect(result).toContain('Consider REUSE or ADAPT');
    });

    it('should handle missing data gracefully', () => {
      const result = devHelper._formatSuggestion(null, null);
      expect(result).toBe('Consider REUSE or ADAPT before creating new code (IDS Article IV-A).');
    });
  });

  describe('Graceful Availability', () => {
    // These functions should return null if code-intel is not initialized/available
    it('should return null when code-intel is unavailable', async () => {
      // Since we haven't initialized providers in this test env, it should be null
      const checkResult = await devHelper.checkBeforeWriting('test.js', 'desc');
      const reuseResult = await devHelper.suggestReuse('Symbol');
      const conventionResult = await devHelper.getConventionsForPath('.');
      const impactResult = await devHelper.assessRefactoringImpact(['file.js']);

      expect(checkResult).toBeNull();
      expect(reuseResult).toBeNull();
      expect(conventionResult).toBeNull();
      expect(impactResult).toBeNull();
    });
  });
});
