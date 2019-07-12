# c-promise

[![npm version](https://badge.fury.io/js/%40kennysng%2Fc-promise.svg)](https://badge.fury.io/js/%40kennysng%2Fc-promise)

This is a cancelable Promise library.

# Usage

``` js
new CancelablePromise(async (resolve, reject, check, canceled) => {
  try {
    // async tasks
    await asyncTask()
    await asyncTask()

    // check if cancel() is called
    await check()
    
    await asyncTask()
    await asyncTask()

    // return result
    return resolve()
  }
  catch (e) {
    // emit canceled event
    if (e instanceof CancelError) return canceled()

    // throw error
    return reject(e)
  }
})

new CancelablePromise(anotherCancelablePromise, async (promise, resolve, reject, check, canceled) => {
  try {
    // async tasks
    await asyncTask()
    await asyncTask()

    // check if cancel() is called
    await check()

    // wait for the promise
    await promise

    // return result
    return resolve()
  }
  catch (e) {
    // emit canceled event
    if (e instanceof CancelError) return canceled()

    // throw error
    return reject(e)
  }
})

new CancelablePromise(createAnotherCancelablePromiseFn, async (createFn, resolve, reject, check, canceled) => {
  try {
    // async tasks
    await asyncTask()
    await asyncTask()

    // check if cancel() is called
    await check()

    // create and wait for the promise
    await createFn()

    // return result
    return resolve()
  }
  catch (e) {
    // emit canceled event
    if (e instanceof CancelError) return canceled()

    // throw error
    return reject(e)
  }
})
```

# Pay attention

`check()` function consists of 2 steps:

1. `setTimeout()` sleep to wait for cancel request

2. check if canceled. It true, throw `CancelError`

Note that the `setTimeout()` step will put great overhead on computation time. Avoid abuse use of `check()`. Only check at critical point. 