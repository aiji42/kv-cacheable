type OriginalFunction<T> = (...[]: unknown[]) => T;

export type CacheableOption =
  | {
      cacheable?: boolean;
      expiration?: number;
      expirationTtl?: number;
    }
  | boolean;

export type CacheableController<T> = (
  arg: Awaited<T>
) => CacheableOption | Promise<CacheableOption>;

export type CommonOption = {
  debug?: boolean;
  expiration?: number;
  expirationTtl?: number;
};

export type CacheableWrapper = <T>(
  key: string,
  originalFunction: OriginalFunction<T> | Promise<T>,
  option?: CacheableOption | CacheableController<T>
) => Promise<T>;

type InferResult<T> = T extends OriginalFunction<infer U>
  ? U
  : T extends Promise<infer U>
  ? U
  : never;

const makeCacheable =
  (KV: KVNamespace, option?: CommonOption): CacheableWrapper =>
  async (key, org, controller) => {
    const cache = await KV.get<InferResult<typeof org>>(key, "json");
    if (cache) {
      option?.debug && console.log("cache hit: ", key);
      return cache;
    }

    const result = await (typeof org === "function" ? org() : org);
    const cacheableOption =
      typeof controller === "function"
        ? await controller(result)
        : controller ?? {};
    const cacheable =
      typeof cacheableOption === "object"
        ? cacheableOption.cacheable ?? true
        : cacheableOption;
    if (cacheable) {
      await KV.put(key, JSON.stringify(result), {
        ...option,
        ...(typeof cacheableOption === "object" ? cacheableOption : {}),
      });
      option?.debug && console.log("cache set: ", key);
    }
    return result;
  };

export default makeCacheable;
