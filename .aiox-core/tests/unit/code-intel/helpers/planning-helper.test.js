'use strict';

const planningHelper = require('../../../../core/code-intel/helpers/planning-helper');

describe('PlanningHelper', () => {
  describe('_calculateRiskLevel', () => {
    it('should return LOW for blast radius <= LOW_MAX', () => {
      expect(planningHelper._calculateRiskLevel(0)).toBe('LOW');
      expect(planningHelper._calculateRiskLevel(planningHelper.RISK_THRESHOLDS.LOW_MAX)).toBe('LOW');
    });

    it('should return MEDIUM for blast radius between LOW_MAX and MEDIUM_MAX', () => {
      expect(planningHelper._calculateRiskLevel(planningHelper.RISK_THRESHOLDS.LOW_MAX + 1)).toBe('MEDIUM');
      expect(planningHelper._calculateRiskLevel(planningHelper.RISK_THRESHOLDS.MEDIUM_MAX)).toBe('MEDIUM');
    });

    it('should return HIGH for blast radius > MEDIUM_MAX', () => {
      expect(planningHelper._calculateRiskLevel(planningHelper.RISK_THRESHOLDS.MEDIUM_MAX + 1)).toBe('HIGH');
      expect(planningHelper._calculateRiskLevel(100)).toBe('HIGH');
    });
  });

  describe('_buildDependencySummary', () => {
    it('should calculate totalDeps and depth correctly', () => {
      expect(planningHelper._buildDependencySummary(['a', 'b'])).toEqual({ totalDeps: 2, depth: 'shallow' });
      expect(planningHelper._buildDependencySummary(new Array(6))).toEqual({ totalDeps: 6, depth: 'moderate' });
      expect(planningHelper._buildDependencySummary(new Array(20))).toEqual({ totalDeps: 20, depth: 'deep' });
      expect(planningHelper._buildDependencySummary(null)).toEqual({ totalDeps: 0, depth: 'none' });
    });
  });

  describe('Graceful Availability', () => {
    it('should return null when code-intel is unavailable', async () => {
      const codeResult = await planningHelper.getCodebaseOverview('.');
      const depResult = await planningHelper.getDependencyGraph('.');
      const compResult = await planningHelper.getComplexityAnalysis(['file.js']);
      const ctxResult = await planningHelper.getImplementationContext(['Symbol']);
      const impactResult = await planningHelper.getImplementationImpact(['file.js']);

      expect(codeResult).toBeNull();
      expect(depResult).toBeNull();
      expect(compResult).toBeNull();
      expect(ctxResult).toBeNull();
      expect(impactResult).toBeNull();
    });
  });
});
