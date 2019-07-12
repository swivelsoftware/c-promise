/**
 * Sleep for a period of time
 * @param time [number] optional
 */
export function sleep(time = 0): Promise<void> {
  return new Promise(resolve => setTimeout(() => resolve(), time))
}
