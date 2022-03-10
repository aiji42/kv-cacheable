[![codecov](https://codecov.io/gh/aiji42/kv-cacheable/branch/main/graph/badge.svg?token=CJ6FWDMVCC)](https://codecov.io/gh/aiji42/kv-cacheable)
[![npm version](https://badge.fury.io/js/kv-cacheable.svg)](https://badge.fury.io/js/kv-cacheable)

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
import makeCacheable from 'kv-cacheable'
import { exampleSlowCalculation } from '~/utils'

const cacheable = makeCacheable(KV)

export const loader = async () => {
  const result = await cacheable('cache-key', exampleSlowCalculation)
  
  // ...
}
```

If a value matching the key (first argument) exists in the KV, skip processing the second argument and return the cache.  
If a cache matching the key does not exist, processing of the second argument is performed and the result is stored in KV as a cache.

### Type Information and Supplemental

**makeCacheable**
- Arguments
    - The first: Your KV object (required)
    - The second: An option object (optional)
        - *debug*: boolean (optional): If set to true, logs are output when the cache is hit and set.
        - *[expiration](https://developers.cloudflare.com/workers/runtime-apis/kv/#creating-expiring-keys)*: number (optional): The cache expiration time.
        - *[expirationTtl](https://developers.cloudflare.com/workers/runtime-apis/kv/#creating-expiring-keys)*: number (optional): The cache expiration time.
- Return (function): Wrapper function to control cache (see below).

**cacheable function**  
This is the return of `makeCacheable`.
- Arguments
    - The first: A key of cache (required)
    - The second: Function, asynchronous function or Promise you want to cache and accelerate (required)
        - The return value must be a value that can be stringified with `JSON.stringify`.
    - The third: Option to control cache. Three types: boolean, object or function (optional)
      - Type is boolean: You can intentionally choose not to cache by setting false.
      - Type is object:
        - *cacheable*: boolean (optional): You can intentionally choose not to cache by setting false.
        - *[expiration](https://developers.cloudflare.com/workers/runtime-apis/kv/#creating-expiring-keys)*: number (optional): The cache expiration time.
          - Overrides the value set by makeCacheable
        - *[expirationTtl](https://developers.cloudflare.com/workers/runtime-apis/kv/#creating-expiring-keys)*: number (optional): The cache expiration time.
          - Overrides the value set by makeCacheable
      - Type is function: It takes the result of the execution of the second argument as the argument and returns the optional values (object or boolean) described above.
        - This is useful in cases where the function of the first argument can be expected to fail temporarily, such as when communicating with another server, to prevent the cache from being overwritten with its unexpected value.
        - See the example code below for details
- Return (Promise): The result of the execution of the function or promise set as the first argument, or the cache retrieved from KV.

```js
const isValid = (val) => {
  // do validation
  return boolean
}

// If fetchDataFromServer does not return the correct value, do not cache it.
const result = await cacheable(
  'cache-key',
  fetchDataFromServer,
  (res) => isValid(res) // res is the value returned by exampleFunc
)
```
