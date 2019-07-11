import { TIMEOUT } from 'dns'
import { CancelableAxiosPromise, CancelablePromise } from '.'
import { CancelError } from './error'

test('Create cancelable promise', async callback => {
  const promise = new CancelablePromise((resolve, reject, check) => {
    let tick = 0
    setInterval(() => {
      try {
        check()
        tick += 1
        if (tick === 10) return resolve()
      }
      catch (e) {
        return reject(e)
      }
    }, 100)
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
