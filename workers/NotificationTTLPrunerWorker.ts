import { INotificationRepository } from "@/modules/notification/domain/INotificationRepository";
import { ILogger } from "@/shared/application/ports/ILogger";
import { PinoLogger } from "@/shared/infrastructure/PinoLogger";

export interface NotificationTTLPrunerConfig {
  intervalMs?: number;
  daysThreshold?: number;
  logger?: ILogger;
}

export class NotificationTTLPrunerWorker {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private readonly intervalMs: number;
  private readonly daysThreshold: number;
  private readonly logger: ILogger;

  constructor(
    private readonly notificationRepo: INotificationRepository,
    config: NotificationTTLPrunerConfig = {}
  ) {
    this.intervalMs = config.intervalMs || 24 * 60 * 60 * 1000; // default 24 hours
    this.daysThreshold = config.daysThreshold || 30; // default 30 days
    this.logger = config.logger || new PinoLogger("vibegrid-notification-ttl-pruner");
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.logger.info("NotificationTTLPrunerWorker started", {
      intervalMs: this.intervalMs,
      daysThreshold: this.daysThreshold,
    });

    // Run first prune immediately
    await this.prune();

    // Schedule periodic execution
    this.timer = setInterval(async () => {
      await this.prune();
    }, this.intervalMs);
  }

  public async prune(): Promise<number> {
    try {
      this.logger.info("Starting 30-day notification pruning cycle...", { daysThreshold: this.daysThreshold });
      const prunedCount = await this.notificationRepo.deleteOldNotifications(this.daysThreshold);
      this.logger.info("Notification pruning cycle complete", { prunedCount });
      return prunedCount;
    } catch (error: any) {
      this.logger.error("Error running notification pruning cycle", error);
      return 0;
    }
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    this.logger.info("NotificationTTLPrunerWorker stopped");
  }
}

