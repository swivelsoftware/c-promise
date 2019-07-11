import { CancelableAxiosPromise, CancelablePromise } from '.'
import { CancelError } from './error'

function asyncTask(check: () => void): Promise<void> {
  return new Promise((resolve, reject) => {
    let tick = 0
    setInterval(async () => {
      try {
        await check()
        tick += 1
        if (tick === 20) return resolve()
      }
      catch (e) {
        return reject(e)
      }
    }, 10)
  })
}

test('Create cancelable promise', async callback => {
  const promise = new CancelablePromise(async (resolve, reject, check) => {
    try {
      await asyncTask(check)
      return resolve()
    }
    catch (e) {
      return reject(e)
    }
  })
  try {
    setTimeout(() => promise.cancel(), 50)
    await promise
    throw new Error('Cancel not called')
  }
  catch (e) {
    expect(e).toBeInstanceOf(CancelError)
    callback()
  }
})

test('Create cancelable axios promise', async callback => {
  const promise = new CancelableAxiosPromise({ method: 'GET', url: 'https://www.google.com.hk' })
  try {
    setTimeout(() => promise.cancel(), 50)
    await promise
    throw new Error('Cancel not called')
  }
  catch (e) {
    expect(e).toBeInstanceOf(CancelError)
    callback()
  }
})
