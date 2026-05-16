/**
 * @jest-environment jsdom
 */
import { Telemetry } from '../telemetryService';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockImplementation(() => ({
      insert: jest.fn().mockImplementation(() => Promise.resolve({ error: null }))
    }))
  }
}));

describe('TelemetryService Coverage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    sessionStorage.clear();
    window.history.pushState({}, '', '/home');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should track basic events', () => {
    Telemetry.track({ eventoId: 'e1', categoria: 'invite', eventType: 'view' });
    jest.runAllTimers();
    expect(supabase.from).toHaveBeenCalledWith('analytics_events');
  });

  it('should getInviteSlug from URL params', () => {
    window.history.pushState({}, '', '/presentes?invite=slug-param');
    Telemetry.track({ eventoId: 'e1', categoria: 'invite', eventType: 'view' });
    jest.runAllTimers();
    expect(supabase.from).toHaveBeenCalled();
  });

  it('should getInviteSlug from path segments', () => {
    window.history.pushState({}, '', '/my-slug');
    Telemetry.track({ eventoId: 'e1', categoria: 'invite', eventType: 'view' });
    jest.runAllTimers();
    expect(supabase.from).toHaveBeenCalled();
  });

  it('should ignore admin paths', () => {
    window.history.pushState({}, '', '/admin/dashboard');
    Telemetry.track({ eventoId: 'e1', categoria: 'invite', eventType: 'view' });
    jest.runAllTimers();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('should track section timer', async () => {
    const stopper = Telemetry.startSectionTimer('e1', 's1');
    jest.advanceTimersByTime(1100);
    stopper();
    jest.runAllTimers();
    expect(supabase.from).toHaveBeenCalled();
  });

  it('should watch rage clicks', () => {
    const div = document.createElement('div');
    const cleanup = Telemetry.watchRageClicks(div, 'e1', 't1');
    div.click(); div.click(); div.click();
    jest.runAllTimers();
    expect(supabase.from).toHaveBeenCalled();
    cleanup();
    div.click(); div.click(); div.click();
    jest.runAllTimers();
  });

  it('should track exit depth', () => {
    Telemetry.trackExitDepth('e1', 's1');
    jest.runAllTimers();
    expect(supabase.from).toHaveBeenCalled();
  });

  it('should handle missing requestIdleCallback', () => {
    const originalRIC = (window as any).requestIdleCallback;
    delete (window as any).requestIdleCallback;
    Telemetry.track({ eventoId: 'e1', categoria: 'invite', eventType: 'view' });
    (window as any).requestIdleCallback = originalRIC;
  });
});
