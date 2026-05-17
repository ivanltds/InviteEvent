import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './GuestStoryMaker.module.css';
import { storyTemplates, TemplateId } from './templates';

export interface GuestStoryMakerProps {
  coupleNames: string;
  eventDate: string;
  accentColor?: string;
  bgPrimary?: string;
  onClose?: () => void;
}

const uploadToCloudinary = async (file: string | Blob, resourceType: 'image' | 'video' = 'image') => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) throw new Error('Cloudinary config missing');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'invite_preset');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('Cloudinary upload failed');
  return res.json();
};

export function GuestStoryMaker({ coupleNames, eventDate, accentColor = '#C5A059', bgPrimary = '#FFFFFF', onClose }: GuestStoryMakerProps) {
  const resolvedEventDate = eventDate || '12/10/2026';
  const [activeTemplate, setActiveTemplate] = useState<TemplateId>('classic');
  const [mediaSrc, setMediaSrc] = useState<string>('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1000');
  const [isVideo, setIsVideo] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [format, setFormat] = useState<'story' | 'post'>('story');
  
  const getNamesScale = (names: string) => {
    const len = names.length;
    if (len <= 10) return 1.1;
    if (len <= 15) return 0.95;
    if (len <= 20) return 0.8;
    if (len <= 25) return 0.7;
    return 0.55;
  };
  
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      if (file.type.startsWith('video/')) {
        setIsVideo(true);
        setMediaSrc(url);
      } else {
        setIsVideo(false);
        setMediaSrc(url);
      }
    }
  };

  const shareOnInstagram = () => {
    try {
      navigator.clipboard.writeText('@invite_event.ai');
    } catch (e) {
      console.warn('Erro ao copiar tag para a área de transferência', e);
    }
    // Tenta abrir o instagram
    window.location.href = "instagram://camera";
  };

  const handleSave = async () => {
    if (!previewRef.current) return;
    setSavingStatus('saving');
    
    try {
      // Garantir que todas as fontes estejam 100% carregadas e prontas no navegador antes de capturar
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready;
      }

      const node = previewRef.current;
      const scaleFactor = node.offsetWidth ? Math.max(6, 2160 / node.offsetWidth) : 6;

      if (isVideo && selectedFile) {
        // --- FLUXO DE VÍDEO (CLOUDINARY) ---
        // Capturar design transparente usando onclone para evitar alterar o DOM real do usuário
        const overlayCanvas = await html2canvas(node, {
          scale: scaleFactor,
          useCORS: true,
          allowTaint: false,
          backgroundColor: null, // Importante: Transparente!
          logging: false,
          onclone: (clonedDoc) => {
            // 1. Injetar tag de estilo local para carregar fontes sem bloqueio CORS no html2canvas
            const style = clonedDoc.createElement('style');
            style.type = 'text/css';
            style.innerHTML = `
              @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Montserrat:wght@300;400;700;900&family=Great+Vibes&family=Cinzel:wght@400;700&family=Outfit:wght@200;300;400;600;800&display=swap');
            `;
            clonedDoc.head.appendChild(style);

            // 2. Forçar transparência absoluta no container clonado e esconder imagem/vídeo original
            const clonedNode = clonedDoc.querySelector('[data-testid="story-preview-container"]') as HTMLElement;
            if (clonedNode) {
              clonedNode.style.borderRadius = '0px';
              clonedNode.style.setProperty('background', 'transparent', 'important');
              clonedNode.style.setProperty('background-color', 'transparent', 'important');
              clonedNode.style.setProperty('background-image', 'none', 'important');
              clonedNode.style.setProperty('box-shadow', 'none', 'important');
              clonedNode.style.setProperty('border', 'none', 'important');

              const photoContainer = clonedNode.querySelector('.guestPhotoContainer') as HTMLElement;
              if (photoContainer) {
                photoContainer.style.setProperty('display', 'none', 'important');
              }
            }
          }
        });

        const overlayDataUrl = overlayCanvas.toDataURL('image/png');

        // Fazer Uploads simultâneos
        const [overlayRes, videoRes] = await Promise.all([
          uploadToCloudinary(overlayDataUrl, 'image'),
          uploadToCloudinary(selectedFile, 'video')
        ]);

        const overlayId = overlayRes.public_id.replace(/\//g, ':');
        const videoId = videoRes.public_id;

        // Montar a URL do Cloudinary que mescla o vídeo com o overlay transparente
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const w = 1080;
        const h = format === 'story' ? 1920 : 1350;
        // fl_attachment força o download automático do vídeo com o nome correto, e c_scale garante encaixe milimétrico
        const finalVideoUrl = `https://res.cloudinary.com/${cloudName}/video/upload/fl_attachment/c_fill,w_${w},h_${h}/l_${overlayId}/c_scale,w_${w},h_${h}/fl_layer_apply/${videoId}.mp4`;

        // Iniciar download
        const a = document.createElement('a');
        a.href = finalVideoUrl;
        a.download = 'moment_invite_event.mp4';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

      } else {
        // --- FLUXO DE FOTO (LOCAL) ---
        const canvas = await html2canvas(node, {
          scale: scaleFactor,
          useCORS: true,
          allowTaint: false,
          backgroundColor: null, // Deixamos nulo para html2canvas usar a cor real do template em vez de forçar branco
          logging: false,
          onclone: (clonedDoc) => {
            // 1. Injetar tag de estilo local para carregar fontes sem bloqueio CORS no html2canvas
            const style = clonedDoc.createElement('style');
            style.type = 'text/css';
            style.innerHTML = `
              @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Montserrat:wght@300;400;700;900&family=Great+Vibes&family=Cinzel:wght@400;700&family=Outfit:wght@200;300;400;600;800&display=swap');
            `;
            clonedDoc.head.appendChild(style);

            // 2. Prevenir bordas arredondadas na imagem gerada
            const clonedNode = clonedDoc.querySelector('[data-testid="story-preview-container"]') as HTMLElement;
            if (clonedNode) {
              clonedNode.style.borderRadius = '0px';
            }
          }
        });
        
        // Exportar em qualidade máxima sem perdas de compressão (JPEG 1.0)
        const dataUrl = canvas.toDataURL('image/jpeg', 1.0);

        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'moment_invite_event.jpg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      setSavingStatus('success');
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: [accentColor, '#FFFFFF', '#000000']
      });

    } catch (err) {
      console.error('Erro ao gerar Mídia:', err);
      setSavingStatus('error');
      setTimeout(() => setSavingStatus('idle'), 3000);
    }
  };

  useEffect(() => {
    // Adiciona preconnect para melhorar o carregamento e cache das fontes do Google
    if (!document.getElementById('story-maker-preconnect-1')) {
      const pre1 = document.createElement('link');
      pre1.id = 'story-maker-preconnect-1';
      pre1.rel = 'preconnect';
      pre1.href = 'https://fonts.googleapis.com';
      document.head.appendChild(pre1);
    }
    if (!document.getElementById('story-maker-preconnect-2')) {
      const pre2 = document.createElement('link');
      pre2.id = 'story-maker-preconnect-2';
      pre2.rel = 'preconnect';
      pre2.href = 'https://fonts.gstatic.com';
      pre2.setAttribute('crossorigin', 'anonymous');
      document.head.appendChild(pre2);
    }

    if (!document.getElementById('story-maker-fonts')) {
      const link = document.createElement('link');
      link.id = 'story-maker-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Montserrat:wght@300;400;700;900&family=Great+Vibes&family=Cinzel:wght@400;700&family=Outfit:wght@200;300;400;600;800&display=swap';
      document.head.appendChild(link);
    }

    return () => {
      if (mediaSrc.startsWith('blob:')) {
        URL.revokeObjectURL(mediaSrc);
      }
    };
  }, [mediaSrc]);

  const activeTpl = storyTemplates.find(t => t.id === activeTemplate);

  // Define proporção visual
  const aspectRatio = format === 'story' ? '9/16' : '4/5';

  return (
    <div className={styles.mobileShell}>
      <div className={styles.iphoneNotch} />
      
      <div className={styles.innerScreen} style={{ backgroundColor: bgPrimary }}>
        <AnimatePresence mode="wait">
          {savingStatus === 'success' ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className={styles.successScreen} 
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '2rem', textAlign: 'center' }}
            >
              <h2 className="cursive" style={{ color: accentColor, fontSize: '2.5rem', marginBottom: '1rem' }}>Ficou Incrível!</h2>
              <p style={{ color: '#555', marginBottom: '2rem' }}>Sua lembrança foi {isVideo ? 'gerada' : 'salva'} com sucesso.</p>
              
              <button onClick={shareOnInstagram} style={{ backgroundColor: accentColor, color: '#fff', padding: '1rem 2rem', borderRadius: '30px', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', marginBottom: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                Postar no Instagram
              </button>
              
              <span style={{ marginTop: '10px', fontSize: '0.85rem', color: '#666', maxWidth: '320px', lineHeight: '1.5' }}>
                Ficaríamos honrados se você compartilhasse esse momento especial conosco! <br/>
                Ao postar, marque nossa página <strong>@invite_event.ai</strong> (o tag já foi copiado para sua área de transferência). <br/>
                <span style={{ fontSize: '0.75rem', color: '#999', marginTop: '6px', display: 'block', fontStyle: 'italic' }}>
                  (Dica elegante: se preferir manter o design limpo, você pode encolher a menção ou arrastá-la para fora da tela nos seus Stories!)
                </span>
              </span>
              
              <button onClick={() => setSavingStatus('idle')} style={{ marginTop: '35px', color: accentColor, background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontWeight: '600' }}>
                Fazer outro
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}
            >
              <div className={styles.topBar}>
                <button className={styles.closeBtn} onClick={onClose} aria-label="fechar" style={{ color: accentColor }}>×</button>
                <div className={styles.stepIndicator} style={{ color: accentColor }}>Criar Lembrança</div>
                <div style={{ width: '35px' }}></div>
              </div>

              <div className={styles.formatSelector}>
                 <button 
                   className={format === 'story' ? styles.formatActive : ''} 
                   onClick={() => setFormat('story')}
                   style={format === 'story' ? { background: accentColor, color: '#fff', borderColor: accentColor } : { color: accentColor, borderColor: accentColor, background: 'transparent' }}
                 >
                   Story 9:16
                 </button>
                 <button 
                   className={format === 'post' ? styles.formatActive : ''} 
                   onClick={() => setFormat('post')}
                   style={format === 'post' ? { background: accentColor, color: '#fff', borderColor: accentColor } : { color: accentColor, borderColor: accentColor, background: 'transparent' }}
                 >
                   Post 4:5
                 </button>
              </div>

              <div 
                className={`${styles.storyPreview} ${styles[`preview_${activeTemplate}`]} ${styles[format]}`} 
                id="storyPreview"
                data-testid="story-preview-container"
                ref={previewRef}
                style={{ 
                  aspectRatio, 
                  maxHeight: format === 'post' ? '55vh' : '65vh', 
                  backgroundColor: bgPrimary, 
                  margin: '0 auto', 
                  overflow: 'hidden',
                  ['--names-scale' as unknown as string]: getNamesScale(coupleNames)
                } as React.CSSProperties}
              >
                <div className="guestPhotoContainer">
                  {/* Imagem */}
                  {!isVideo && (
                    <img 
                      src={mediaSrc}
                      className="guestPhoto" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover'
                      }} 
                      alt="Guest Moment"
                      crossOrigin="anonymous"
                    />
                  )}
                  {/* Video Real */}
                  {isVideo && (
                    <video 
                      ref={videoRef}
                      src={mediaSrc}
                      className="guestPhoto"
                      crossOrigin="anonymous"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      autoPlay loop muted playsInline
                    />
                  )}
                </div>
                
                <div className={styles.brandSubtle} style={{ color: activeTpl?.id === 'minimal' || activeTpl?.id === 'polaroid' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.45)' }}>InviteEvent.ai</div>
                
                <div className="overlayContainer">
                  {activeTpl?.renderOverlay(coupleNames, resolvedEventDate)}
                </div>
              </div>

              <div className={styles.bottomPanel} style={{ backgroundColor: bgPrimary }}>
                <div className={styles.templateSelector}>
                  {storyTemplates.map(tpl => (
                    <div 
                      key={tpl.id}
                      className={`${styles.templateItem} ${activeTemplate === tpl.id ? styles.templateItemActive : ''}`}
                      onClick={() => setActiveTemplate(tpl.id)}
                      style={activeTemplate === tpl.id ? { color: accentColor, borderColor: accentColor } : { color: '#888', borderColor: 'transparent', background: 'rgba(0,0,0,0.05)' }}
                    >
                      {tpl.icon}
                      <span>{tpl.name}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.actionBtns}>
                  <div className={styles.btnCapture} onClick={() => fileInputRef.current?.click()} style={{ color: accentColor, borderColor: accentColor }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      style={{ display: 'none' }} 
                      accept="image/*,video/*"
                      onChange={handleFileChange} 
                    />
                  </div>
                  <button 
                    className={styles.btnMain} 
                    onClick={handleSave}
                    disabled={savingStatus === 'saving'}
                    style={{ backgroundColor: accentColor, color: '#FFF' }}
                  >
                    {savingStatus === 'idle' && (isVideo ? 'GERAR VÍDEO MP4 ✨' : 'SALVAR IMAGEM ✨')}
                    {savingStatus === 'saving' && 'PROCESSANDO... ⏳'}
                    {savingStatus === 'error' && 'ERRO AO SALVAR ❌'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
