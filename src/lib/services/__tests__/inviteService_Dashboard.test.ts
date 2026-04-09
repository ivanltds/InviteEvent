import { inviteService, InviteWithRSVP } from '../inviteService';

describe('inviteService - Dashboard Stats', () => {
  const mockInvites: InviteWithRSVP[] = [
    {
      id: '1', nome_principal: 'Família A', limite_pessoas: 4, tipo: 'familia', slug: 'a', created_at: '',
      rsvp: [{ id: 'r1', convite_id: '1', confirmados: 2, status: 'confirmado' }],
      membros: [
        { id: 'm1', nome: 'Membro 1', confirmado: true, convite_id: '1' },
        { id: 'm2', nome: 'Membro 2', confirmado: true, convite_id: '1' },
        { id: 'm3', nome: 'Membro 3', confirmado: false, convite_id: '1' },
        { id: 'm4', nome: 'Membro 4', confirmado: null, convite_id: '1' }
      ]
    },
    {
      id: '2', nome_principal: 'Casal B', limite_pessoas: 2, tipo: 'casal', slug: 'b', created_at: '',
      rsvp: [],
      membros: []
    }
  ];

  test('calculateDashboardStats deve retornar números consolidados corretos', () => {
    const stats = inviteService.calculateDashboardStats(mockInvites);

    expect(stats.totalConvites).toBe(2);
    expect(stats.convitesRespondidos).toBe(1);
    expect(stats.pessoasConfirmadas).toBe(2); // Membros com confirmado: true
    expect(stats.pessoasRecusadas).toBe(1);    // Membros com confirmado: false
    expect(stats.pessoasPendentes).toBe(1 + 2); // 1 membro pendente na Família A + 2 vagas do Casal B
  });

  test('calculateDashboardStats deve calcular excedentes corretamente', () => {
    const invites: InviteWithRSVP[] = [
      {
        id: '1', nome_principal: 'Família Silva', limite_pessoas: 2, tipo: 'familia', slug: 'silva', created_at: '',
        rsvp: [{ id: 'r1', convite_id: '1', confirmados: 4, status: 'excedente_solicitado' }],
        membros: [
          { id: 'm1', nome: 'Pai', confirmado: true, convite_id: '1' },
          { id: 'm2', nome: 'Mãe', confirmado: true, convite_id: '1' },
          { id: 'm3', nome: 'Filho 1', confirmado: true, convite_id: '1' },
          { id: 'm4', nome: 'Filho 2', confirmado: true, convite_id: '1' }
        ]
      }
    ];

    const stats = inviteService.calculateDashboardStats(invites);

    // Se os membros nominais estão cadastrados, eles não contam como excedentes
    // Excedente = confirmados - max(limite_pessoas, total_membros_nominais)
    expect(stats.excedentes).toBe(0);
  });
});
