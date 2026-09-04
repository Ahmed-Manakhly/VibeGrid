import fs from "fs";
import path from "path";
import { LogArchiveWorker } from "../LogArchiveWorker";

describe("LogArchiveWorker Unit & Isolation Tests", () => {
  const testLogDir = path.join(__dirname, "test-logs-tmp");

  beforeAll(() => {
    if (!fs.existsSync(testLogDir)) {
      fs.mkdirSync(testLogDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testLogDir)) {
      fs.rmSync(testLogDir, { recursive: true, force: true });
    }
  });

  it("should handle missing MinIO connection gracefully without throwing or deleting local files", async () => {
    const activeFile = path.join(testLogDir, "bff-active.log");
    const rotatedFile = path.join(testLogDir, "bff-2026-09-05.log.1");

    fs.writeFileSync(activeFile, '{"level":30,"message":"active log"}\n');
    fs.writeFileSync(rotatedFile, '{"level":30,"message":"rotated log"}\n');

    const worker = new LogArchiveWorker({
      logDir: testLogDir,
      minioEndpoint: "http://127.0.0.1:59999", // Intentional invalid port
    });

    const result = await worker.archiveLogs();

    expect(result.uploaded).toBe(0);
    // Verified local rotated file remains intact when storage is offline
    expect(fs.existsSync(rotatedFile)).toBe(true);
    expect(fs.existsSync(activeFile)).toBe(true);
  });
});
