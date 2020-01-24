import avro from 'avsc'
import AvroUtil from '../../../src/services/utility/AvroUtil'

describe('AvroUtil', () => {
  describe('serializeKafkaAvroMsg', () => {
    test('encodes data with the first byte as 0, then schemaId, and finally the message', () => {
      const message = {
        resource_id: 1137,
        event_category: 'update',
        time: '2018-03-28T15:52:58.234Z',
      }
      const schemaId = 777

      const avroMsg = AvroUtil.serializeKafkaAvroMsg(message, schemaId)

      expect(avroMsg[0]).toEqual(0)
      expect(avroMsg.readInt32BE(1)).toEqual(schemaId)
      const type = avro.Type.forValue(message)
      expect(type.fromBuffer(avroMsg.slice(5))).toEqual(message)
    })

    test('passes the schema into the encoder and encodes with it', () => {
      const message = {
        id: 5,
        someNullableString: null,
      }
      const schema = {
        type: 'record',
        fields: [
          {
            name: 'id',
            type: 'int',
          },
          {
            name: 'someNullableString',
            type: [
              'null',
              'string',
            ],
            default: null,
          },
        ],
      }
      const type = avro.Type.forSchema(schema)
      const schemaId = 777

      const avroMsg = AvroUtil.serializeKafkaAvroMsg(message, schemaId, schema)

      expect(avroMsg[0]).toEqual(0)
      expect(avroMsg.readInt32BE(1)).toEqual(schemaId)
      expect(type.fromBuffer(avroMsg.slice(5))).toEqual(message)
    })
  })
})
