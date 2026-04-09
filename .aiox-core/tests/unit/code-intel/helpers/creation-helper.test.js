'use strict';

const creationHelper = require('../../../../core/code-intel/helpers/creation-helper');

describe('CreationHelper', () => {
  describe('_formatDuplicateWarning', () => {
    it('should format warning with duplicates and references', () => {
      const dupes = { matches: [{ file: 'existing.js' }] };
      const refs = [{ file: 'usage.js' }];
      const result = creationHelper._formatDuplicateWarning('testArtefact', dupes, refs);
      
      expect(result).toContain('Similar artefact exists: existing.js');
      expect(result).toContain('"testArtefact" already referenced in 1 location(s)');
      expect(result).toContain('Consider extending instead of creating new');
    });

    it('should handle missing data gracefully', () => {
      const result = creationHelper._formatDuplicateWarning('test', null, null);
      expect(result).toBe('Consider extending instead of creating new (IDS Article IV-A).');
    });
  });

  describe('Graceful Availability', () => {
    it('should return null when code-intel is unavailable', async () => {
      const ctxResult = await creationHelper.getCodebaseContext('.');
      const dupResult = await creationHelper.checkDuplicateArtefact('name', 'desc');
      const regResult = await creationHelper.enrichRegistryEntry('entity', 'path');

      expect(ctxResult).toBeNull();
      expect(dupResult).toBeNull();
      expect(regResult).toBeNull();
    });
  });
});
