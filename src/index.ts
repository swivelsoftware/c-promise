import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios'
import EventEmitter from 'wolfy87-eventemitter'
import { CancelError } from './error'

export class CancelablePromise<T = any> extends EventEmitter implements Promise<T> {
  private resolve_: (value?: T | PromiseLike<T>) => void
  private reject_: (reason?: any) => void
  private readonly promise: Promise<T>
  private canceled: boolean = false

  constructor(fn: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void, checkCancel: () => void) => void) {
    super()
    this.promise = new Promise((resolve, reject) => fn(resolve, reject, () => {
      if (this.canceled) throw new CancelError()
    }))
  }

  get [Symbol.toStringTag](): string {
    return 'CancelablePromise'
  }

  public then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1|PromiseLike<TResult1>)|null|undefined,
    onrejected?: ((reason: any) => TResult2|PromiseLike<TResult2>)|null|undefined,
  ): Promise<TResult1|TResult2> {
    return this.promise.then(onfulfilled, onrejected)
  }

  public catch(onRejected?: (reason: any) => PromiseLike<never>): Promise<T> {
    return this.promise.catch(onRejected)
  }

  public finally(onfinally?: (() => void)|null|undefined): Promise<T> {
    return this.promise.finally(onfinally)
  }

  public cancel(): void {
    this.canceled = true
    this.emit('cancel')
  }

  public resolve(value?: T | PromiseLike<T>): void {
    return this.resolve_(value)
  }

  public reject(reason?: any): void {
    return this.reject_(reason)
  }
}

export class CancelableAxiosPromise<T = any> extends CancelablePromise<AxiosResponse<T>> {
  private readonly cancelTokenSource: CancelTokenSource

  constructor(config: AxiosRequestConfig, axiosInstance: AxiosInstance = axios.create()) {
    super((resolve, reject) => {
      axiosInstance.request(config)
        .then(response => response ? resolve(response) : reject(new CancelError()))
        .catch(e => reject(e))
    })
    this.cancelTokenSource = axios.CancelToken.source()
    config.cancelToken = this.cancelTokenSource.token
  }

  // @override
  public cancel(): void {
    this.cancelTokenSource.cancel()
    this.emit('cancel')
  }
}

export { CancelError } from './error'
