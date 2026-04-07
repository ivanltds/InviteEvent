/**
 * Metrics Collector
 *
 * Collects and stores metrics from quality gate runs.
 *
 * @module quality/metrics-collector
 * @version 1.0.0
 * @story 3.11a - Quality Gates Metrics Collector
 */

const fs = require('fs').promises;
const path = require('path');

class MetricsCollector {
  constructor(config = {}) {
    this.storagePath = config.storagePath || '.aiox/metrics.json';
  }

  /**
   * Record a quality gate run
   * @param {number} layer - Layer number
   * @param {Object} result - Run result
   * @returns {Promise<Object>} Recorded run
   */
  async recordRun(layer, result) {
    const run = {
      timestamp: new Date().toISOString(),
      layer,
      passed: result.passed,
      durationMs: result.durationMs || 0,
      findingsCount: result.findingsCount || 0,
      metadata: result.metadata || {},
    };

    await this.saveMetric(run);
    return run;
  }

  /**
   * Record a PR review (Layer 2)
   * @param {Object} result - PR review result
   * @returns {Promise<Object>} Recorded run
   */
  async recordPRReview(result) {
    const run = {
      timestamp: new Date().toISOString(),
      layer: 2,
      passed: result.passed,
      durationMs: result.durationMs || 0,
      findingsCount: result.findingsCount || 0,
      coderabbit: result.coderabbit,
      quinn: result.quinn,
      metadata: result.metadata || {},
    };

    await this.saveMetric(run);
    return run;
  }

  /**
   * Save metric to storage
   * @param {Object} metric - Metric to save
   * @private
   */
  async saveMetric(metric) {
    try {
      let metrics = [];
      try {
        const content = await fs.readFile(this.storagePath, 'utf8');
        metrics = JSON.parse(content);
      } catch (error) {
        // File doesn't exist or is invalid, start with empty array
      }

      metrics.push(metric);

      await fs.mkdir(path.dirname(this.storagePath), { recursive: true });
      await fs.writeFile(this.storagePath, JSON.stringify(metrics, null, 2));
    } catch (error) {
      console.error(`Failed to save metric: ${error.message}`);
    }
  }
}

module.exports = { MetricsCollector };
