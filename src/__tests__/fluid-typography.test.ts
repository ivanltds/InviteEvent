import fs from 'fs';
import path from 'path';

describe('Fluid Typography (STORY-026)', () => {
  const cssFiles = [
    'src/app/globals.css',
    'src/app/(public)/page.module.css',
    'src/components/sections/Historia.module.css',
    'src/components/sections/OsNoivos.module.css',
    'src/components/sections/FAQ.module.css'
  ];

  test.each(cssFiles)('o arquivo %s deve conter a função clamp() para tipografia fluida', (filePath) => {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`Arquivo não encontrado: ${filePath}`);
      return;
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Verifica se existe o uso de clamp( para font-size
    const hasClamp = /font-size:\s*clamp\(/.test(content);
    
    expect(hasClamp).toBe(true);
  });
});
