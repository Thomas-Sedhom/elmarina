import { describe, expect, it, vi } from "vitest";
import { COOKIE_NAME } from "../shared/const";
import { authService } from "./src/modules/auth/auth.service";

describe("Express auth service", () => {
  it("clears the local session cookie on logout", () => {
    const clearCookie = vi.fn();
    const result = authService.logout({ protocol: "https", headers: {} } as any, { clearCookie } as any);
    expect(result).toEqual({ success: true });
    expect(clearCookie).toHaveBeenCalledWith(COOKIE_NAME, expect.objectContaining({ maxAge: -1, httpOnly: true, secure: true }));
  });
});
