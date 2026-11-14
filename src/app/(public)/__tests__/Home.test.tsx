import { render, screen, fireEvent, within } from '@testing-library/react';
import CelebraeLanding from '@/components/landing/celebrae/CelebraeLanding';

jest.mock('next/font/google', () => {
  const font = () => ({ variable: 'font-var', className: 'font-class', style: {} });
  return { Hanken_Grotesk: font, Instrument_Serif: font, Great_Vibes: font, Alex_Brush: font, Corinthia: font, Pinyon_Script: font, Playfair_Display: font };
});

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('Landing Page (Celebraê)', () => {
  test('mostra o convite de exemplo e o título com a categoria', () => {
    render(<CelebraeLanding />);
    expect(screen.getByRole('heading', { level: 1, name: /Convite de casamento digital/i })).toBeInTheDocument();
    expect(screen.getAllByText('Lia').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /Lista de presença/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Lista de presentes/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Mural de fotos e recados/i })).toBeInTheDocument();
  });

  test('o CTA principal leva para /criar', () => {
    render(<CelebraeLanding />);
    const ctas = screen.getAllByRole('link', { name: /Criar meu convite/i });
    expect(ctas.length).toBeGreaterThan(0);
    ctas.forEach(a => expect(a.getAttribute('href')).toMatch(/^\/criar\?/));
  });

  test('os nomes digitados aparecem no convite e seguem para o cadastro', () => {
    render(<CelebraeLanding />);
    fireEvent.change(screen.getByLabelText('Nome', { selector: '#n1' }), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText('Nome', { selector: '#n2' }), { target: { value: 'Bruno' } });

    const hero = document.getElementById('topo') as HTMLElement;
    expect(within(hero).getByText('Ana')).toBeInTheDocument();
    expect(within(hero).getByText('Bruno')).toBeInTheDocument();

    const cta = screen.getAllByRole('link', { name: /Criar meu convite/i })[0];
    expect(cta.getAttribute('href')).toContain('nome1=Ana');
    expect(cta.getAttribute('href')).toContain('nome2=Bruno');
  });

  test('nomes com HTML não são interpretados como marcação', () => {
    render(<CelebraeLanding />);
    fireEvent.change(screen.getByLabelText('Nome', { selector: '#n1' }), { target: { value: '<b>x</b>' } });
    const names = document.querySelector('#topo .inv__names') as HTMLElement;
    expect(names.querySelector('b')).toBeNull();
    expect(names.textContent).toContain('<b>x</b>');
  });
});
