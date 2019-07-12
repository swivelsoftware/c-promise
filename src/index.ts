import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import EventEmitter from 'wolfy87-eventemitter'
import { CancelError } from './error'
import { sleep } from './sleep'

/**
 * Promise function for cancelable promise
 */
export type HandlePromiseFn<T> = (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void, check: () => Promise<void>, canceled: () => void) => void|Promise<void>

/**
 * Promise function in case overriding a cancelable promise
 */
export type OverridePromiseFn<T, U> = (promise: CancelablePromise<U>, resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void, check: () => Promise<void>, canceled: () => void) => void|Promise<void>

/**
 * Create function in case overriding a cancelable promise
 * so that the overriden promise will not run immediately
 */
export type CreatePromiseFn<T> = () => CancelablePromise<T>

/**
 * Promise function in case overriding a cancelable promise
 */
export type OverrideCreatePromiseFn<T, U> = (createPromise: CreatePromiseFn<U>, resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void, check: () => Promise<void>, canceled: () => void) => void|Promise<void>

/**
 * Promise than can be canceled
 */
export class CancelablePromise<T = any, U = any> extends EventEmitter implements Promise<T> {
  private resolve_: (value?: T | PromiseLike<T>) => void
  private reject_: (reason?: any) => void
  private readonly promise: Promise<T>
  private canceled: boolean = false

  /**
   * @param fn [Function]
   */
  constructor(fn: HandlePromiseFn<T>)

  /**
   * Wrap another CancelablePromise
   * @param promise [CancelablePromise]
   * @param fn [Function]
   */
  constructor(promise: CancelablePromise<U>, fn: OverridePromiseFn<T, U>)

  /**
   * Wrap another CancelablePromise
   * @param createPromise [Function]
   * @param fn [Function]
   * @param onCheck [Function] optional
   */
  constructor(createPromise: CreatePromiseFn<U>, fn: OverrideCreatePromiseFn<T, U>)

  constructor(...args: any[]) {
    super()
    if (args.length === 2 && typeof args[0] === 'function') {
      const createPromise: CreatePromiseFn<U> = args[0], fn: OverrideCreatePromiseFn<T, U> = args[1]
      this.promise = new Promise(async (resolve, reject) => {
        try {
          this.resolve_ = resolve
          this.reject_ = reject
          await fn(
            () => {
              const promise = createPromise()
              this.on('cancel', () => promise.cancel())
              return promise
            },
            resolve,
            reject,
            async () => {
              await sleep()
              if (this.canceled) throw new CancelError()
            },
            () => this.emit('canceled'),
          )
        }
        catch (e) {
          return reject(e)
        }
      })
    }
    else if (args.length === 2) {
      const promise: CancelablePromise<U> = args[0], fn: OverridePromiseFn<T, U> = args[1]
      this.on('cancel', () => promise.cancel())
      this.promise = new Promise(async (resolve, reject) => {
        try {
          this.resolve_ = resolve
          this.reject_ = reject
          await fn(
            promise,
            resolve,
            reject,
            async () => {
              await sleep()
              if (this.canceled) throw new CancelError()
            },
            () => this.emit('canceled'),
          )
        }
        catch (e) {
          return reject(e)
        }
      })
    }
    else {
      const fn: HandlePromiseFn<T> = args[0]
      this.promise = new Promise(async (resolve, reject) => {
        try {
          this.resolve_ = resolve
          this.reject_ = reject
          await fn(resolve, reject,
            async () => {
              await sleep()
              if (this.canceled) throw new CancelError()
            },
            () => this.emit('canceled'),
          )
        }
        catch (e) {
          return reject(e)
        }
      })
    }
  }

  get [Symbol.toStringTag](): string {
    return 'CancelablePromise'
  }

  // @override
  public then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1|PromiseLike<TResult1>)|null|undefined,
    onrejected?: ((reason: any) => TResult2|PromiseLike<TResult2>)|null|undefined,
  ): Promise<TResult1|TResult2> {
    return this.promise.then(onfulfilled, onrejected)
  }

  // @override
  public catch(onRejected?: (reason: any) => PromiseLike<never>): Promise<T> {
    return this.promise.catch(onRejected)
  }

  // @override
  public finally(onfinally?: (() => void)|null|undefined): Promise<T> {
    return this.promise.finally(onfinally)
  }

  public resolve(value?: T | PromiseLike<T>): void {
    return this.resolve_(value)
  }

  public reject(reason?: any): void {
    return this.reject_(reason)
  }

  /**
   * Cancel the promise
   */
  public cancel(): void {
    this.canceled = true
    this.emit('cancel')
  }
}

/**
 * Axios request in Promise that can be canceled
 */
export class CancelableAxiosPromise<T = any> extends CancelablePromise<AxiosResponse<T>> {
  /**
   * @param config [AxiosRequestConfig]
   * @param axiosInstance [AxiosInstance] optional
   * @param cancelTokenSource [CancelTokenSource] optional
   */
  constructor(config: AxiosRequestConfig, axiosInstance: AxiosInstance = axios.create(), private readonly cancelTokenSource = axios.CancelToken.source()) {
    super(async (resolve, reject) => {
      try {
        const response = await axiosInstance.request({
          ...config,
          cancelToken: cancelTokenSource.token,
        })
        return response ? resolve(response) : reject(new CancelError())
      }
      catch (e) {
        return reject(e.constructor.name === 'Cancel' ? new CancelError() : e)
      }
    })
  }

  // @override
  public cancel(): void {
    this.cancelTokenSource.cancel()
    this.emit('cancel')
  }
}

export { CancelError } from './error'
export { sleep } from './sleep'
