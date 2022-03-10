type OriginalFunction<T> = (...[]: unknown[]) => T;

/**
 * Object or boolean value to control cache
 * For a boolean value, it is synonymous with `cacheable`
 * @property cacheable - You can intentionally choose not to cache by setting false
 * @property expiration - The cache expiration time {@link https://developers.cloudflare.com/workers/runtime-apis/kv/#creating-expiring-keys}
 * @property expirationTtl - The cache expiration time {@link https://developers.cloudflare.com/workers/runtime-apis/kv/#creating-expiring-keys}
 */
export type CacheableOption =
  | {
      cacheable?: boolean;
      expiration?: number;
      expirationTtl?: number;
    }
  | boolean;

/**
 * @param arg - The value of executed result OriginalFunction
 * @return CacheableOption
 */
export type CacheableController<T> = (
  arg: Awaited<T>
) => CacheableOption | Promise<CacheableOption>;

/**
 * @property debug - If set to true, logs are output when the cache is hit and set
 * @property expiration - The cache expiration time {@link https://developers.cloudflare.com/workers/runtime-apis/kv/#creating-expiring-keys}
 * @property expirationTtl - The cache expiration time {@link https://developers.cloudflare.com/workers/runtime-apis/kv/#creating-expiring-keys}
 */
export type CommonOption = {
  debug?: boolean;
  expiration?: number;
  expirationTtl?: number;
};

/**
 * @param key - A key of cache
 * @param originalFunction - A process you want to cache and accelerate
 * @param option - An option to control cache
 * @return Value obtained from the execution result of originalFunction or from the cache
 */
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

/**
 * @param KV - Your KV namespace object
 * @param option - An option object
 * @return CacheableWrapper
 */
const makeCacheable = (
  KV: KVNamespace,
  option?: CommonOption
): CacheableWrapper => {
  return async (key, org, controller) => {
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
};

export default makeCacheable;
