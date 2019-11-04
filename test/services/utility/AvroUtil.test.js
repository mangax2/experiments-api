import avro from 'avsc'
import AvroUtil from '../../../src/services/utility/AvroUtil'

describe('AvroUtil', () => {
  beforeEach(() => {
    expect.hasAssertions()
  })

  describe('serializeKafkaAvroMsg', () => {
    test('encodes data correctly in the format of 0, schemaId, and message', () => {
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
        experimentalUnitId: 5,
        deactivationReason: null,
        setEntryId: 7,
      }
      const schema = {
        type: 'record',
        fields: [
          {
            name: 'experimentalUnitId',
            type: 'int',
          },
          {
            name: 'deactivationReason',
            type: [
              'null',
              'string',
            ],
            default: null,
          },
          {
            name: 'setEntryId',
            type: 'int',
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
