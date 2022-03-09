import makeKVCacheable from "./index";

const MockedKVGet = jest.fn()
const MockedKVPut = jest.fn()
const KV = {
  get: MockedKVGet,
  put: MockedKVPut
} as unknown as KVNamespace

const mockedConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {})

describe("makeKVCacheable", () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('returns cached value if KV has the cache', async () => {
    MockedKVGet.mockResolvedValue('my cache')
    const cacheable = makeKVCacheable(KV)
    const result = await cacheable(() => 'no cache', 'my-cache-test')

    expect(MockedKVGet).toBeCalledWith('my-cache-test', 'json')
    expect(result).toBe('my cache')
  })

  it('puts cache value if KV does not have the cache',async () => {
    MockedKVGet.mockResolvedValue(null)
    const cacheable = makeKVCacheable(KV)
    const result = await cacheable(() => 'no cache', 'my-cache-test')


    expect(MockedKVGet).toBeCalledWith('my-cache-test', 'json')
    expect(MockedKVPut).toBeCalledWith('my-cache-test', "\"no cache\"", {})
    expect(result).toBe('no cache')
  })

  test('the first argument is a async function',async () => {
    MockedKVGet.mockResolvedValue(null)
    const cacheable = makeKVCacheable(KV)
    const result = await cacheable(async () => 'no cache', 'my-cache-test')


    expect(MockedKVGet).toBeCalledWith('my-cache-test', 'json')
    expect(MockedKVPut).toBeCalledWith('my-cache-test', "\"no cache\"", {})
    expect(result).toBe('no cache')
  })

  test('the first argument is a Promise',async () => {
    MockedKVGet.mockResolvedValue(null)
    const cacheable = makeKVCacheable(KV)
    const result = await cacheable(new Promise((resolve) => resolve('no cache')), 'my-cache-test')


    expect(MockedKVGet).toBeCalledWith('my-cache-test', 'json')
    expect(MockedKVPut).toBeCalledWith('my-cache-test', "\"no cache\"", {})
    expect(result).toBe('no cache')
  })

  describe('the type of the controller (the 3rd argument) is function', () => {
    it('does not cache when "cacheable" is false',async () => {
      MockedKVGet.mockResolvedValue(null)
      const cacheable = makeKVCacheable(KV)
      const result = await cacheable(() => 'no cache', 'my-cache-test', (res) => res === 'no cache' ? { cacheable: false } : {})


      expect(MockedKVGet).toBeCalledWith('my-cache-test', 'json')
      expect(MockedKVPut).not.toBeCalled()
      expect(result).toBe('no cache')
    })

    it('passed as an option to put except "cacheable"',async () => {
      MockedKVGet.mockResolvedValue(null)
      const cacheable = makeKVCacheable(KV)
      const result = await cacheable(() => 'no cache', 'my-cache-test', () => ({ cacheable: true, expirationTtl: 100 }))


      expect(MockedKVGet).toBeCalledWith('my-cache-test', 'json')
      expect(MockedKVPut).toBeCalledWith('my-cache-test', "\"no cache\"", { expirationTtl: 100 })
      expect(result).toBe('no cache')
    })
  })

  describe('the type of the controller (the 3rd argument) is object', () => {
    test('does not cache when "cacheable" is false',async () => {
      MockedKVGet.mockResolvedValue(null)
      const cacheable = makeKVCacheable(KV)
      const result = await cacheable(() => 'no cache', 'my-cache-test', { cacheable: false })

      expect(MockedKVGet).toBeCalledWith('my-cache-test', 'json')
      expect(MockedKVPut).not.toBeCalled()
      expect(result).toBe('no cache')
    })

    test('passed as an option to put except "cacheable"',async () => {
      MockedKVGet.mockResolvedValue(null)
      const cacheable = makeKVCacheable(KV)
      const result = await cacheable(() => 'no cache', 'my-cache-test', { cacheable: true, expirationTtl: 100 })


      expect(MockedKVGet).toBeCalledWith('my-cache-test', 'json')
      expect(MockedKVPut).toBeCalledWith('my-cache-test', "\"no cache\"", { expirationTtl: 100 })
      expect(result).toBe('no cache')
    })
  })

  describe('debug mode', () => {
    beforeEach(() => {
    })
    test('indicates that the cache has been hit', async () => {
      MockedKVGet.mockResolvedValue('my cache')
      const cacheable = makeKVCacheable(KV, { debug: true })
      await cacheable(() => 'no cache', 'my-cache-test')

      expect(mockedConsoleLog).toBeCalledWith("cache hit: ", 'my-cache-test')
    })

    test('indicates that the cache has been put',async () => {
      MockedKVGet.mockResolvedValue(null)
      const cacheable = makeKVCacheable(KV, { debug: true })
      await cacheable(() => 'no cache', 'my-cache-test')

      expect(mockedConsoleLog).toBeCalledWith("cache set: ", 'my-cache-test')
    })
  })
})