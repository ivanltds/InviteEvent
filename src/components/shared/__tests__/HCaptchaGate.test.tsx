import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import HCaptchaGate, { HCaptchaGateHandle, isHCaptchaEnabled } from '../HCaptchaGate';

describe('HCaptchaGate', () => {
  const originalSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

  afterEach(() => {
    process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY = originalSiteKey;
  });

  it('não renderiza nada quando NEXT_PUBLIC_HCAPTCHA_SITE_KEY não está definida', () => {
    delete process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
    const { container } = render(<HCaptchaGate onVerify={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
    expect(isHCaptchaEnabled()).toBe(false);
  });

  it('renderiza o widget e propaga o token quando o site key está definido', () => {
    process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY = 'test-site-key';
    expect(isHCaptchaEnabled()).toBe(true);

    const onVerify = jest.fn();
    render(<HCaptchaGate onVerify={onVerify} />);

    fireEvent.click(screen.getByTestId('hcaptcha-mock-verify'));
    expect(onVerify).toHaveBeenCalledWith('test-captcha-token');
  });

  it('expõe resetCaptcha via ref sem quebrar quando o captcha não está configurado', () => {
    delete process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
    const ref = createRef<HCaptchaGateHandle>();
    render(<HCaptchaGate ref={ref} onVerify={jest.fn()} />);

    expect(() => ref.current?.resetCaptcha()).not.toThrow();
  });
});
