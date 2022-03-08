import makeKVWrapper from "./index";

const MockedKVGet = jest.fn()
const MockedKVPut = jest.fn()
const KV = {
  get: MockedKVGet,
  put: MockedKVPut
} as unknown as KVNamespace

describe("makeKVWrapper", () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })
  test('test',async () => {
    const cacheable = makeKVWrapper(KV)
    await cacheable(() => true, 'test')

    expect(MockedKVGet).toBeCalledWith('test', 'json')
    expect(MockedKVPut).toBeCalledWith('test', "true", {})
  })
})