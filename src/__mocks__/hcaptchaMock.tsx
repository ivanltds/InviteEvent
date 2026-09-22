import React, { forwardRef, useImperativeHandle } from 'react';

/**
 * Mock de teste para @hcaptcha/react-hcaptcha (ver moduleNameMapper em
 * jest.config.js). O componente real injeta um <script> externo e não
 * funciona em jsdom/sem rede — este mock expõe um botão de "verificar"
 * pra testes conseguirem simular a resolução do captcha sem depender do
 * hCaptcha de verdade.
 */
interface Props {
  onVerify?: (token: string) => void;
  onExpire?: () => void;
  sitekey?: string;
}

const HCaptchaMock = forwardRef<{ resetCaptcha: () => void }, Props>((props, ref) => {
  useImperativeHandle(ref, () => ({ resetCaptcha: () => {} }));
  return (
    <button type="button" data-testid="hcaptcha-mock-verify" onClick={() => props.onVerify?.('test-captcha-token')}>
      Verificar captcha (mock)
    </button>
  );
});
HCaptchaMock.displayName = 'HCaptchaMock';

export default HCaptchaMock;
