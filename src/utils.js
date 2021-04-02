/* eslint-disable no-console */

const logPerformanceStats = (name, func) => {
  const startCpu = process.cpuUsage()
  const startUsedHeap = process.memoryUsage().heapUsed
  console.time(`${name} Time`)
  const result = func()
  console.timeEnd(`${name} Time`)
  console.info(`${name} Memory:`, process.memoryUsage().heapUsed - startUsedHeap)
  console.info(`${name} CPU:`, process.cpuUsage(startCpu))
  return result
}

export default {
  logPerformanceStats,
}
