import { render, screen, fireEvent } from '@testing-library/react';
import PixPanel from '../PixPanel';

describe('PixPanel', () => {
  it('mostra o QR code e o valor quando total é informado (fluxo de presente)', () => {
    render(
      <PixPanel
        pixPayload="00020126payload"
        onCopy={jest.fn()}
        copyStatus="idle"
        total={199.9}
      />
    );

    expect(screen.getByRole('img', { name: /QR Code para pagamento via PIX/i })).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*199,90/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copiar Código PIX/i })).toBeInTheDocument();
  });

  it('mostra instrução genérica de valor quando total não é informado (fluxo da Gravata)', () => {
    render(<PixPanel pixPayload="00020126payload" onCopy={jest.fn()} copyStatus="idle" />);

    expect(screen.getByText(/Escolha o valor que quiser contribuir/i)).toBeInTheDocument();
    expect(screen.queryByText(/Confirme o valor de/i)).not.toBeInTheDocument();
  });

  it('mostra placeholder quando ainda não há payload PIX', () => {
    render(<PixPanel pixPayload="" onCopy={jest.fn()} copyStatus="idle" />);

    expect(screen.getByText(/Gerando QR Code/i)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('chama onCopy e reflete o estado "copiado" no botão', () => {
    const onCopy = jest.fn();
    const { rerender } = render(
      <PixPanel pixPayload="00020126payload" onCopy={onCopy} copyStatus="idle" />
    );

    fireEvent.click(screen.getByRole('button', { name: /Copiar Código PIX/i }));
    expect(onCopy).toHaveBeenCalledTimes(1);

    rerender(<PixPanel pixPayload="00020126payload" onCopy={onCopy} copyStatus="copied" />);
    expect(screen.getByText(/Código Copiado/i)).toBeInTheDocument();
  });

  it('inclui o contexto do evento no alt do QR code, quando informado', () => {
    render(
      <PixPanel
        pixPayload="00020126payload"
        onCopy={jest.fn()}
        copyStatus="idle"
        qrAltLabel="Casamento de Ana e Carlos"
      />
    );

    expect(screen.getByAltText(/QR Code para pagamento via PIX de Casamento de Ana e Carlos/i)).toBeInTheDocument();
  });
});
