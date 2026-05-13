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
        insert: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: {}, error: null }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        then: jest.fn().mockImplementation(fn => Promise.resolve(fn({ data: [], error: null })))
      };
      const chain = mockChain;`;

files.forEach(relPath => {
  const fullPath = path.join(process.cwd(), relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Substitui o mock local se ele existir por esta versão completa
    content = content.replace(
      /const\s+mockChain\s*=\s*\{[\s\S]*?\};[\s\S]*?const\s+chain\s*=\s*mockChain;/g,
      mockSnippet
    );
    
    // Se for um arquivo RSVP, garante que passa a prop inviteSlug="joao-silva"
    if (relPath.includes('RSVP_')) {
       content = content.replace(/render\(<RSVP\s*\/>\)/g, 'render(<RSVP inviteSlug="joao-silva" />)');
    }
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Applied robust mock and renders to: ${relPath}`);
  }
});
