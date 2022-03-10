import makeKVCacheable from "./index";

const MockedKVGet = jest.fn();
const MockedKVPut = jest.fn();
const KV = {
  get: MockedKVGet,
  put: MockedKVPut,
} as unknown as KVNamespace;

const mockedConsoleLog = jest
  .spyOn(console, "log")
  .mockImplementation(() => {});

describe("makeKVCacheable", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns cached value if KV has the cache", async () => {
    MockedKVGet.mockResolvedValue("my cache");
    const cacheable = makeKVCacheable(KV);
    const result = await cacheable("my-cache-test", () => "no cache");

    expect(MockedKVGet).toBeCalledWith("my-cache-test", "json");
    expect(result).toBe("my cache");
  });

  it("puts cache value if KV does not have the cache", async () => {
    MockedKVGet.mockResolvedValue(null);
    const cacheable = makeKVCacheable(KV);
    const result = await cacheable("my-cache-test", () => "no cache");

    expect(MockedKVGet).toBeCalledWith("my-cache-test", "json");
    expect(MockedKVPut).toBeCalledWith("my-cache-test", '"no cache"', {});
    expect(result).toBe("no cache");
  });

  test("the first argument is a async function", async () => {
    MockedKVGet.mockResolvedValue(null);
    const cacheable = makeKVCacheable(KV);
    const result = await cacheable("my-cache-test", async () => "no cache");

    expect(MockedKVGet).toBeCalledWith("my-cache-test", "json");
    expect(MockedKVPut).toBeCalledWith("my-cache-test", '"no cache"', {});
    expect(result).toBe("no cache");
  });

  test("the first argument is a Promise", async () => {
    MockedKVGet.mockResolvedValue(null);
    const cacheable = makeKVCacheable(KV);
    const result = await cacheable(
      "my-cache-test",
      new Promise((resolve) => resolve("no cache"))
    );

    expect(MockedKVGet).toBeCalledWith("my-cache-test", "json");
    expect(MockedKVPut).toBeCalledWith("my-cache-test", '"no cache"', {});
    expect(result).toBe("no cache");
  });

  describe("the type of the option (the 3rd argument) is function", () => {
    it('does not cache when "cacheable" is false', async () => {
      MockedKVGet.mockResolvedValue(null);
      const cacheable = makeKVCacheable(KV);
      const result = await cacheable(
        "my-cache-test",
        () => "no cache",
        (res) => (res === "no cache" ? { cacheable: false } : {})
      );

      expect(MockedKVGet).toBeCalledWith("my-cache-test", "json");
      expect(MockedKVPut).not.toBeCalled();
      expect(result).toBe("no cache");
    });

    it("does not cache when return false", async () => {
      MockedKVGet.mockResolvedValue(null);
      const cacheable = makeKVCacheable(KV);
      const result = await cacheable(
        "my-cache-test",
        () => "no cache",
        (res) => res !== "no cache"
      );

      expect(MockedKVGet).toBeCalledWith("my-cache-test", "json");
      expect(MockedKVPut).not.toBeCalled();
      expect(result).toBe("no cache");
    });
  });

  describe("the type of the option (the 3rd argument) is object", () => {
    test('does not cache when "cacheable" is false', async () => {
      MockedKVGet.mockResolvedValue(null);
      const cacheable = makeKVCacheable(KV);
      const result = await cacheable("my-cache-test", () => "no cache", {
        cacheable: false,
      });

      expect(MockedKVGet).toBeCalledWith("my-cache-test", "json");
      expect(MockedKVPut).not.toBeCalled();
      expect(result).toBe("no cache");
    });
  });

  describe("the type of the option (the 3rd argument) is boolean", () => {
    test("does not cache when false", async () => {
      MockedKVGet.mockResolvedValue(null);
      const cacheable = makeKVCacheable(KV);
      const result = await cacheable("my-cache-test", () => "no cache", false);

      expect(MockedKVGet).toBeCalledWith("my-cache-test", "json");
      expect(MockedKVPut).not.toBeCalled();
      expect(result).toBe("no cache");
    });
  });

  describe("common option", () => {
    describe("debug mode", () => {
      test("indicates that the cache has been hit", async () => {
        MockedKVGet.mockResolvedValue("my cache");
        const cacheable = makeKVCacheable(KV, { debug: true });
        await cacheable("my-cache-test", () => "no cache");

        expect(mockedConsoleLog).toBeCalledWith("cache hit: ", "my-cache-test");
      });

      test("indicates that the cache has been put", async () => {
        MockedKVGet.mockResolvedValue(null);
        const cacheable = makeKVCacheable(KV, { debug: true });
        await cacheable("my-cache-test", () => "no cache");

        expect(mockedConsoleLog).toBeCalledWith("cache set: ", "my-cache-test");
      });
    });

    it("is able to set expiration", async () => {
      MockedKVGet.mockResolvedValue(null);
      const cacheable = makeKVCacheable(KV, { expiration: 100 });
      await cacheable("my-cache-test", () => "no cache");

      expect(MockedKVPut).toBeCalledWith("my-cache-test", '"no cache"', {
        expiration: 100,
      });
    });

    it("is able to set expiration (when wrapper option (the 3rd argument) is boolean)", async () => {
      MockedKVGet.mockResolvedValue(null);
      const cacheable = makeKVCacheable(KV, { expirationTtl: 100 });
      await cacheable(
        "my-cache-test",
        () => "no cache",
        () => true
      );

      expect(MockedKVPut).toBeCalledWith("my-cache-test", '"no cache"', {
        expirationTtl: 100,
      });
    });

    it("the wrapper option (the 3rd argument) is preferred", async () => {
      MockedKVGet.mockResolvedValue(null);
      const cacheable = makeKVCacheable(KV, { expiration: 100 });
      await cacheable("my-cache-test", () => "no cache", { expiration: 200 });

      expect(MockedKVPut).toBeCalledWith("my-cache-test", '"no cache"', {
        expiration: 200,
      });
    });
  });
});
