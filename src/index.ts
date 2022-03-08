type OriginalFunction<T> = (...[]: unknown[]) => T

export type KVOptions = {
  cacheable?: boolean
} & KVNamespacePutOptions

const makeKVWrapper =
  (KV: KVNamespace, debug = false) =>
    async <T>(
      org: OriginalFunction<T> | Promise<T>,
      key: string,
      controller?:
        | KVOptions
        | ((arg: Awaited<T>) => KVOptions | Promise<KVOptions>)
    ): Promise<T> => {
      const cache = await KV.get<T>(key, 'json')
      if (cache) {
        debug && console.log('cache hit: ', key)
        return cache
      }

      const result = await (typeof org === 'function' ? org() : org)
      const {cacheable = true, ...option} =
        typeof controller === 'function'
          ? await controller(result)
          : controller ?? {}
      if (cacheable) {
        await KV.put(key, JSON.stringify(result), option)
        debug && console.log('cache set: ', key)
      }
      return result
    }

export default makeKVWrapper