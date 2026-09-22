'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

/**
 * O Supabase Auth deste projeto está com "Enable Captcha protection" (hCaptcha)
 * ligado no dashboard — qualquer signInWithPassword/signUp/resetPasswordForEmail
 * sem `options.captchaToken` é rejeitado com "captcha protection: request
 * disallowed (no captcha_token found)". Este componente protege os 3
 * formulários que chamam esses métodos: /admin/login (login e cadastro) e
 * /admin/recuperar-senha.
 *
 * Se NEXT_PUBLIC_HCAPTCHA_SITE_KEY não estiver configurada (ex: dev local),
 * o gate não renderiza nada e os forms seguem sem token — funciona desde
 * que o Supabase do ambiente também esteja sem captcha (é o caso local).
 */
// Funções (não constantes de módulo) de propósito: lidas a cada chamada,
// não uma vez no import — isso permite que os testes mutem
// process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY por caso de teste sem precisar
// de jest.resetModules()/require() dinâmico (que quebra a identidade do
// React entre o componente e o test renderer).
export function getHCaptchaSiteKey(): string | undefined {
  return process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
}

export function isHCaptchaEnabled(): boolean {
  return !!getHCaptchaSiteKey();
}

export interface HCaptchaGateHandle {
  resetCaptcha: () => void;
}

interface HCaptchaGateProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

const HCaptchaGate = forwardRef<HCaptchaGateHandle, HCaptchaGateProps>(({ onVerify, onExpire }, ref) => {
  const innerRef = useRef<HCaptcha>(null);
  const siteKey = getHCaptchaSiteKey();

  useImperativeHandle(ref, () => ({
    resetCaptcha: () => innerRef.current?.resetCaptcha(),
  }));

  if (!siteKey) return null;

  return (
    <div style={{ margin: '12px 0', display: 'flex', justifyContent: 'center' }}>
      <HCaptcha ref={innerRef} sitekey={siteKey} onVerify={onVerify} onExpire={() => onExpire?.()} />
    </div>
  );
});

HCaptchaGate.displayName = 'HCaptchaGate';

export default HCaptchaGate;
