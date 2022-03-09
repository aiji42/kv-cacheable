# :key: kv-cacheable

## What is this?

This library helps implement caching using [Cloudflare Workers KV](https://developers.cloudflare.com/workers/runtime-apis/kv/).  
With a few lines of code, you can control the execution of functions that you want to cache for speed, store them in the cache, and skip execution of the function if the cache exists.

## Install

```bash
# npm
npm install kv-cacheable

# yarn
yarn add kv-cacheable
```

## How to use

0. [Set up KV](https://developers.cloudflare.com/workers/runtime-apis/kv/#kv-bindings) in advance.
1. Create a wrapper using makeKVCacheable.
2. Set the process to be cached and the key to be used for caching in the wrapper function and execute it.
```js
// Examples for use with Remix
import makeKVCacheable from 'kv-cacheable'

const cacheable = makeKVCacheable(KV)

export const loader = async () => {
  const result = await cacheable(async () => {
    // slow process
    return 'calculation result'
  }, 'cache-key')
  
  console.log(result) // => calculation result
}
```
If a value matching the key (the second argument) exists in KV, processing of the first argument is skipped.  
If a cache matching the key does not exist, processing of the first argument is performed and the result is stored in KV.

### Type Information and Supplemental

**makeKVCacheable**
- Arguments
    - The first: Your KV object (required)
    - The second: An option object (optional)
        - *debug*: boolean (optional): If set to true, logs are output when the cache is hit and set.
- Return (function): Wrapper function to control cache (see below).

**cacheable wrapper function**  
This is the return of makeKVCacheable.
- Arguments
    - The first: Functions, asynchronous functions or Promises you want to cache and accelerate (required)
      - The return value must be a value that can be stringified with `JSON.stringify`.
    - The second: A key of cache (required)
    - The third: Option value object or function that returns it (optional)  
      When a function type is selected, the result of executing the function with the first argument is passed as an argument.  
      - *cacheable*: boolean (optional): You can intentionally choose not to cache by setting false.
        - This is useful in cases where the function of the first argument can be expected to fail temporarily, such as when communicating with another server, to prevent the cache from being overwritten with its unexpected value.
      - *[expiration](https://developers.cloudflare.com/workers/runtime-apis/kv/#creating-expiring-keys)*: number (optional): The cache expiration time.
      - *[expirationTtl](https://developers.cloudflare.com/workers/runtime-apis/kv/#creating-expiring-keys)*: number (optional): The cache expiration time.
- Return (Promise): The result of the execution of the function or promise set as the first argument, or the cache retrieved from KV.

```js
// If exampleFunc does not return the correct value, do not cache it.
const result = await cacheable(
  exampleFunc,
  'cache-key',
  // res is the value returned by exampleFunc.
  (res) => isValid(res) ? { cacheable: true } : { cacheable: false }
)
```