import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import EventEmitter from 'wolfy87-eventemitter'
import { CancelError } from './error'

/**
 * Promise than can be canceled
 */
export class CancelablePromise<T = any, U = any> extends EventEmitter implements Promise<T> {
  private readonly promise: Promise<T>
  private canceled: boolean = false

  /**
   * @param fn [Function]
   */
  constructor(fn: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void, check: () => void, canceled: () => void) => void)

  /**
   * Wrap another CancelablePromise
   * @param promise [CancelPromise]
   * @param fn [Function]
   */
  constructor(promise: CancelablePromise<U>, fn: (promise: CancelablePromise<U>, resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void, check: () => void, canceled: () => void) => void)

  constructor(...args: any[]) {
    super()
    if (args.length === 2) {
      const promise: CancelablePromise<U> = args[0], fn: (promise: CancelablePromise<U>, resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void, check: () => void, canceled: () => void) => void = args[1]
      this.on('cancel', () => promise.cancel())
      this.promise = new Promise((resolve, reject) => fn(promise, resolve, reject,
        () => {
          if (this.canceled) throw new CancelError()
        },
        () => {
          this.emit('canceled')
        },
      ))
    }
    else {
      const fn: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void, check: () => void, canceled: () => void) => void = args[0]
      this.promise = new Promise((resolve, reject) => fn(resolve, reject,
        () => {
          if (this.canceled) throw new CancelError()
        },
        () => {
          this.emit('canceled')
        },
      ))
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
    super((resolve, reject) => {
      axiosInstance.request({
        ...config,
        cancelToken: cancelTokenSource.token,
      })
        .then(response => response ? resolve(response) : reject(new CancelError()))
        .catch(e => reject(e.constructor.name === 'Cancel' ? new CancelError() : e))
    })
  }

  // @override
  public cancel(): void {
    this.cancelTokenSource.cancel()
    this.emit('cancel')
  }
}

export { CancelError } from './error'
