'use strict';

const qaHelper = require('../../../../core/code-intel/helpers/qa-helper');

describe('QaHelper', () => {
  describe('_calculateRiskLevel', () => {
    it('should return LOW for blast radius <= LOW_MAX', () => {
      expect(qaHelper._calculateRiskLevel(0)).toBe('LOW');
      expect(qaHelper._calculateRiskLevel(qaHelper.RISK_THRESHOLDS.LOW_MAX)).toBe('LOW');
    });

    it('should return MEDIUM for blast radius between LOW_MAX and MEDIUM_MAX', () => {
      expect(qaHelper._calculateRiskLevel(qaHelper.RISK_THRESHOLDS.LOW_MAX + 1)).toBe('MEDIUM');
      expect(qaHelper._calculateRiskLevel(qaHelper.RISK_THRESHOLDS.MEDIUM_MAX)).toBe('MEDIUM');
    });

    it('should return HIGH for blast radius > MEDIUM_MAX', () => {
      expect(qaHelper._calculateRiskLevel(qaHelper.RISK_THRESHOLDS.MEDIUM_MAX + 1)).toBe('HIGH');
    });
  });

  describe('_calculateCoverageStatus', () => {
    it('should return NO_TESTS for 0 tests', () => {
      expect(qaHelper._calculateCoverageStatus(0)).toBe('NO_TESTS');
    });

    it('should return INDIRECT for test count <= INDIRECT_MAX', () => {
      expect(qaHelper._calculateCoverageStatus(qaHelper.COVERAGE_THRESHOLDS.INDIRECT_MAX)).toBe('INDIRECT');
    });

    it('should return MINIMAL for test count between INDIRECT_MAX and MINIMAL_MAX', () => {
      expect(qaHelper._calculateCoverageStatus(qaHelper.COVERAGE_THRESHOLDS.INDIRECT_MAX + 1)).toBe('MINIMAL');
      expect(qaHelper._calculateCoverageStatus(qaHelper.COVERAGE_THRESHOLDS.MINIMAL_MAX)).toBe('MINIMAL');
    });

    it('should return GOOD for test count > MINIMAL_MAX', () => {
      expect(qaHelper._calculateCoverageStatus(qaHelper.COVERAGE_THRESHOLDS.MINIMAL_MAX + 1)).toBe('GOOD');
    });
  });

  describe('suggestGateInfluence', () => {
    it('should suggest CONCERNS for HIGH risk level', () => {
      const result = qaHelper.suggestGateInfluence('HIGH');
      expect(result.suggestedGate).toBe('CONCERNS');
      expect(result.advisory).toContain('HIGH blast radius');
    });

    it('should return null for non-HIGH risk levels', () => {
      expect(qaHelper.suggestGateInfluence('LOW')).toBeNull();
      expect(qaHelper.suggestGateInfluence('MEDIUM')).toBeNull();
    });
  });

  describe('Graceful Availability', () => {
    it('should return null when code-intel is unavailable', async () => {
      const blastResult = await qaHelper.getBlastRadius(['file.js']);
      const covResult = await qaHelper.getTestCoverage(['Symbol']);
      const refResult = await qaHelper.getReferenceImpact(['file.js']);

      expect(blastResult).toBeNull();
      expect(covResult).toBeNull();
      expect(refResult).toBeNull();
    });
  });
});
