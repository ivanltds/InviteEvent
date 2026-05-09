const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/(public)/presentes/page.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

const lines = content.split('\n');
const startTo177 = lines.slice(0, 177).join('\n');

// Find the second "return ("
let returnCount = 0;
let returnIndex = -1;
for (let i = 177; i < lines.length; i++) {
  if (lines[i].includes('return (')) {
    returnCount++;
    if (returnCount === 1) { // Actually, the first one is the right one inside the duplicated component
      returnIndex = i;
      break;
    }
  }
}

const theRest = `      'SAO PAULO',
      totalCartValue
    );
  }, [config, totalCartValue]);

  return (
    <div className={styles.main}>
      {showIntro && (
        <EmotionalIntro 
          onComplete={() => setShowIntro(false)} 
          accentColor={config?.accent_color}
        />
      )}

      <nav className={styles.glassNav}>
        <Link href={\`/inv/\${invite?.slug || ''}\`} className={styles.backLink} style={{ textDecoration: 'none', color: '#71717A', fontWeight: 'bold', fontSize: '14px' }}>
          ← Voltar ao Convite
        </Link>
        <div className={styles.cartIndicator} onClick={handleOpenCheckout} style={{ cursor: 'pointer' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cesta: </span>
          <span className={styles.cartCount} style={{ background: config?.accent_color || '#C5A059', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px' }}>
            {cart.length}
          </span>
        </div>
      </nav>

      <header className={styles.header}>
        <h1 className="cursive" style={{ color: config?.accent_color, fontFamily: config?.font_serif }}>Lista de Presentes</h1>
        <p className={styles.subtitle}>Seu maior presente é a sua presença. Mas, se desejar nos homenagear, escolha um item de nossa lista para nossa nova jornada.</p>
      </header>

      {loading ? (
        <p className={styles.loading}>Preparando lista...</p>
      ) : isInvited === false ? (
        <div className={styles.restricted}>
           <h2 className="cursive">Acesso Reservado</h2>
           <p>Por favor, use o link enviado no seu convite para acessar nossa lista personalizada.</p>
        </div>
      ) : (
        <>
          <section className={styles.grid}>
            {presentes.map(item => {
              const inCart = cart.some(p => p.id === item.id);
              const isSoldOut = item.quantidade_reservada >= item.quantidade_total;
              const isReserved = isSoldOut || item.status === 'pausado';
              
              return (
                <motion.div 
                  key={item.id} 
                  layout
                  className={\`\${styles.card} \${isReserved ? styles.reserved : ''} \${inCart ? styles.cardSelected : ''}\`}
                  style={inCart ? { borderColor: config?.accent_color } : { cursor: isReserved ? 'not-allowed' : 'pointer' }}
                  onClick={() => !isReserved && setSelectedGift(item)}
                >
                  <div className={styles.imagePlaceholder}>
                    {inCart && (
                      <span className={styles.selectedBadge} style={{ background: config?.accent_color }}>
                        Selecionado
                      </span>
                    )}
                    {item.imagem_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imagem_url} alt={item.nome} className={styles.itemImage} />
                    ) : (
                       <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1" fill="none"><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path><rect x="2" y="7" width="20" height="5"></rect><polyline points="20 12 20 22 4 22 4 12"></polyline></svg>
                    )}
                  </div>
                  <div className={styles.info}>
                    <div className={styles.description}>{item.descricao || 'EXPERIÊNCIA'}</div>
                    <h3 style={{ fontFamily: config?.font_serif }}>{item.nome}</h3>
                    <div className={styles.price} style={{ color: config?.accent_color }}>
                      R$ {Number(item.preco).toFixed(2).replace('.', ',')}
                    </div>
                    
                    <div className={styles.itemActions}>
                      <button 
                        className={styles.giftBtn}
                        style={{ backgroundColor: isReserved ? '#ccc' : (inCart ? '#333' : config?.accent_color) }}
                        disabled={isReserved}
                        onClick={(e) => { e.stopPropagation(); toggleToCart(item); }}
                      >
                        {isReserved ? 'Indisponível' : (inCart ? 'Remover ✓' : 'Adicionar ao Carrinho')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </section>

`;

// Find FloatingBasket
let floatingIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<FloatingBasket')) {
    floatingIndex = i;
  }
}

const final = startTo177 + '\n' + theRest + lines.slice(floatingIndex).join('\n');
fs.writeFileSync(filePath, final, 'utf-8');
console.log('Fixed page again');
