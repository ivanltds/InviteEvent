import { giftService } from '../giftService';
import { inviteService } from '../inviteService';
import { rsvpService } from '../rsvpService';
import { supabase } from '@/lib/supabase';

describe('Services Error Branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  test('giftService.getAllGifts error branch', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Err' } })
      })
    });
    await giftService.getAllGifts();
    expect(console.error).toHaveBeenCalled();
  });

  test('giftService.reserveGift error branch', async () => {
    (supabase.rpc as unknown as jest.Mock).mockResolvedValue({ data: null, error: { message: 'Err' } });
    const res = await giftService.reserveGift('1', 'url', 'N');
    expect(res.success).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  test('inviteService.deleteInvite error branch', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: { message: 'Err' } })
      })
    });
    const res = await inviteService.deleteInvite('1');
    expect(res.success).toBe(false);
  });

  test('rsvpService.getInviteBySlug error branch', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'Err' } })
        })
      })
    });
    await rsvpService.getInviteBySlug('s');
    expect(console.error).toHaveBeenCalled();
  });
});
