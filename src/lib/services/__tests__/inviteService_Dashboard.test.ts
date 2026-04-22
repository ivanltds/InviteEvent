import { inviteService } from '../inviteService';

describe('inviteService - Dashboard Stats', () => {
  test('calculateDashboardStats deve processar rsvp corretamente', () => {
    const mockInvites = [
      { 
        id: '1', 
        limite_pessoas: 2, 
        rsvp: [{ status: 'confirmado', confirmados: 3 }] 
      } as any,
      { 
        id: '2', 
        limite_pessoas: 1, 
        rsvp: [{ status: 'recusado' }] 
      } as any,
      {
        id: '3',
        limite_pessoas: 2,
        rsvp: [] // pendente
      } as any
    ];

    const stats = inviteService.calculateDashboardStats(mockInvites);

    expect(stats.totalConvites).toBe(3);
    expect(stats.convitesRespondidos).toBe(2);
    expect(stats.pessoasConfirmadas).toBe(3);
    expect(stats.pessoasRecusadas).toBe(1);
    expect(stats.pessoasPendentes).toBe(2);
    expect(stats.excedentes).toBe(1); // 3 confirmados no convite 1 que tinha limite 2
  });
});
