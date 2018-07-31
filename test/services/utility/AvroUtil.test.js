import avro from 'avsc'
import { encode, serializeKafkaAvroMsg } from '../../../src/services/utility/AvroUtil'

describe('AvroUtil', () => {
  beforeEach(() => {
    expect.hasAssertions()
  })

  describe('encode', () => {
    test('test encoding function', () => {
      const message = {
        resource_id: 1137,
        event_category: 'update',
        time: '2018-03-28T15:52:58.234Z',
      }
      const avroMsg = encode(message)
      const type = avro.Type.forValue(message)
      expect(type.fromBuffer(avroMsg)).toEqual(message)
    })
  })

  describe('serializeKafkaAvroMsg', () => {
    test('test encoding function', () => {
      const message = {
        resource_id: 1137,
        event_category: 'update',
        time: '2018-03-28T15:52:58.234Z',
      }
      const schemaId = 777
      const avroMsg = serializeKafkaAvroMsg(message, schemaId)
      expect(avroMsg[0]).toEqual(0)
      expect(avroMsg.readInt32BE(1)).toEqual(schemaId)
    })
  })
})
