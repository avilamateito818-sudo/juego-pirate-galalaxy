export interface ActivePilotSession {
  readonly sessionId: string;
  readonly roomId: string;
  readonly evict: () => Promise<void>;
}

/**
 * Lock estricto de sesión única por pilotId (ARCHITECTURE.md Regla 10).
 * Impide duplicación de crionita/ítems abriendo dos pestañas simultáneas.
 */
class SingleSessionRegistry {
  private readonly activeByPilot = new Map<string, ActivePilotSession>();

  public async claimSession(
    pilotId: string,
    session: ActivePilotSession
  ): Promise<boolean> {
    const existing = this.activeByPilot.get(pilotId);
    let evicted = false;

    if (existing && existing.sessionId !== session.sessionId) {
      evicted = true;
      this.activeByPilot.delete(pilotId);
      await existing.evict();
    }

    this.activeByPilot.set(pilotId, session);
    return evicted;
  }

  public releaseSession(pilotId: string, sessionId: string): void {
    const current = this.activeByPilot.get(pilotId);
    if (current && current.sessionId === sessionId) {
      this.activeByPilot.delete(pilotId);
    }
  }

  public getActiveCount(): number {
    return this.activeByPilot.size;
  }
}

export const sessionRegistry = new SingleSessionRegistry();
