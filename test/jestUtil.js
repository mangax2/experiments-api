import KafkaProducer from '../src/services/kafka/KafkaProducer'

export const resolve = data => Promise.resolve(data)
export const reject = data => Promise.reject(data)
export const mock = returnValue => (typeof returnValue === 'function' ? jest.fn(returnValue) : jest.fn(() => returnValue))
export const mockResolve = resolveValue => jest.fn(() => Promise.resolve(resolveValue))
export const mockReject = rejectValue => jest.fn(() => Promise.reject(rejectValue))
export const kafkaProducerMocker = () => {
  KafkaProducer.createProducer = () => ({
    init: mockResolve(),
    send: mock(),
  })
}
