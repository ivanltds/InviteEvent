const fs = require('fs');
const path = require('path');

const files = [
  'src/components/sections/__tests__/RSVP_SuccessAction.test.tsx',
  'src/components/sections/__tests__/RSVP_Messages.test.tsx',
  'src/components/sections/__tests__/RSVP_FormRevision.test.tsx',
  'src/components/sections/__tests__/RSVP_Decline.test.tsx',
  'src/app/(public)/presentes/__tests__/PresentesPage.test.tsx',
  'src/app/(public)/inv/[slug]/__tests__/InvitationPage.test.tsx'
];

const mockSnippet = `const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        then: jest.fn().mockImplementation(fn => Promise.resolve(fn({ data: null, error: null })))
      };
      const chain = mockChain;`;

files.forEach(relPath => {
  const fullPath = path.join(process.cwd(), relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Substituir o const chain = (supabase as any).from().select(); recursivo
    content = content.replace(
      /const\s+(chain|mockChain)\s*=\s*\(supabase\s+as\s+any\)\.from\(\)\.select\(\);?\s*/g,
      mockSnippet
    );
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed recursive mock in: ${relPath}`);
  } else {
    console.log(`❌ File not found: ${relPath}`);
  }
});
