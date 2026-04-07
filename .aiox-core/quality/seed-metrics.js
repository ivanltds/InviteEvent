/**
 * Seed Metrics Mock
 */

async function seedMetrics(options) {
  return {
    history: [],
    layers: {
      layer1: { totalRuns: 0, passRate: 0 },
      layer2: { totalRuns: 0, passRate: 0 },
      layer3: { totalRuns: 0, passRate: 0 },
    },
    trends: {
      passRates: [],
      autoCatchRate: [],
    }
  };
}

function generateSeedData(options) {
  return {
    history: [],
    layers: {
      layer1: { totalRuns: 0, passRate: 0 },
      layer2: { totalRuns: 0, passRate: 0 },
      layer3: { totalRuns: 0, passRate: 0 },
    }
  };
}

module.exports = { seedMetrics, generateSeedData };
