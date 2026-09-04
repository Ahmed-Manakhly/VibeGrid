import { PinoLogger, REDACT_PATHS } from "../PinoLogger";
import pino from "pino";

describe("PinoLogger Unit Tests", () => {
  let logger: PinoLogger;

  beforeEach(() => {
    logger = new PinoLogger("test-service");
  });

  it("should initialize cleanly without throwing", () => {
    expect(logger).toBeDefined();
  });

  it("should contain standard sensitive field redaction paths", () => {
    expect(REDACT_PATHS).toContain("authorization");
    expect(REDACT_PATHS).toContain("password");
    expect(REDACT_PATHS).toContain("accessToken");
    expect(REDACT_PATHS).toContain("refreshToken");
    expect(REDACT_PATHS).toContain("emailToken");
  });

  it("should support child logger creation with merged context", () => {
    const childLogger = logger.child({ correlationId: "test-req-123", userId: "user-456" });
    expect(childLogger).toBeDefined();
    expect(() => childLogger.info("Test message from child")).not.toThrow();
  });

  it("should log info, warn, error, debug cleanly", () => {
    expect(() => logger.info("Info log")).not.toThrow();
    expect(() => logger.warn("Warn log")).not.toThrow();
    expect(() => logger.error("Error log", new Error("Sample error"))).not.toThrow();
    expect(() => logger.debug("Debug log")).not.toThrow();
  });
});
