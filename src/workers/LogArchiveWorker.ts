import fs from "fs";
import path from "path";
import zlib from "zlib";
import { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import { ILogger } from "@/shared/application/ports/ILogger";
import { PinoLogger } from "@/shared/infrastructure/PinoLogger";

export interface LogArchiveConfig {
  minioEndpoint?: string;
  minioRegion?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucketName?: string;
  logDir?: string;
  logger?: ILogger;
}

export class LogArchiveWorker {
  private s3Client: S3Client;
  private bucketName: string;
  private logDir: string;
  private logger: ILogger;

  constructor(config?: LogArchiveConfig) {
    const endpoint = config?.minioEndpoint || process.env.MINIO_ENDPOINT || "http://localhost:9000";
    const region = config?.minioRegion || process.env.MINIO_REGION || "us-east-1";
    const accessKeyId = config?.accessKeyId || process.env.MINIO_ACCESS_KEY || "minioadmin";
    const secretAccessKey = config?.secretAccessKey || process.env.MINIO_SECRET_KEY || "minioadmin";

    this.bucketName = config?.bucketName || process.env.MINIO_LOG_BUCKET || "vibegrid-logs";
    this.logDir = config?.logDir || process.env.LOG_DIR || path.join(process.cwd(), "logs");
    this.logger = config?.logger || new PinoLogger("vibegrid-log-archiver");

    this.s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  public async ensureBucketExists(): Promise<boolean> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
      return true;
    } catch (err: any) {
      if (err?.$metadata?.httpStatusCode === 404 || err?.name === "NotFound") {
        try {
          await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
          this.logger.info(`Created MinIO log archival bucket [${this.bucketName}]`);
          return true;
        } catch (createErr) {
          this.logger.error(`Failed to create MinIO log bucket [${this.bucketName}]`, { error: createErr });
          return false;
        }
      }
      this.logger.warn(`MinIO connection check failed for bucket [${this.bucketName}]`, { error: err });
      return false;
    }
  }

  public async archiveLogs(): Promise<{ scanned: number; uploaded: number; failed: number }> {
    if (!fs.existsSync(this.logDir)) {
      return { scanned: 0, uploaded: 0, failed: 0 };
    }

    const bucketReady = await this.ensureBucketExists();
    if (!bucketReady) {
      this.logger.warn(`MinIO storage unavailable. Local log files retained on disk for next cycle.`);
      return { scanned: 0, uploaded: 0, failed: 0 };
    }

    const files = fs.readdirSync(this.logDir);
    let scanned = 0;
    let uploaded = 0;
    let failed = 0;

    for (const filename of files) {
      const filePath = path.join(this.logDir, filename);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) continue;

      // Only archive rotated files (e.g. filename contains date or .1, .2, .rotated, or ended with .log.1)
      const isRotated = filename.includes(".1") || filename.includes(".2") || filename.includes("-202") || filename.endsWith(".rotated") || filename.endsWith(".gz");
      if (!isRotated) continue;

      scanned++;

      try {
        const fileContent = fs.readFileSync(filePath);
        const gzippedContent = filename.endsWith(".gz") ? fileContent : zlib.gzipSync(fileContent);

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const serviceName = filename.split("-")[0] || "vibegrid";

        const archiveFilename = filename.endsWith(".gz") ? filename : `${filename}.gz`;
        const objectKey = `logs/${serviceName}/${year}/${month}/${day}/${archiveFilename}`;

        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: objectKey,
            Body: gzippedContent,
            ContentType: "application/gzip",
          })
        );

        uploaded++;
        this.logger.info(`Uploaded rotated log [${filename}] to MinIO [${objectKey}]`, {
          filename,
          objectKey,
          bucket: this.bucketName,
        });

        // Prune local file post-ACK confirmation
        fs.unlinkSync(filePath);
      } catch (err) {
        failed++;
        this.logger.error(`Failed to archive log file [${filename}] to MinIO, leaving local file intact`, {
          filename,
          error: err,
        });
      }
    }

    return { scanned, uploaded, failed };
  }
}
