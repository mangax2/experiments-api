import avro from 'avsc'

function encode(message) {
  const type = avro.Type.forValue(message)
  return type.toBuffer(message)
}

function serializeKafkaAvroMsg(message, schemaId) {
  const header = Buffer.alloc(5, 0)
  header.writeInt32BE(schemaId, 1)

  const data = encode(message)

  return Buffer.concat([header, data], header.length + data.length)
}

export { encode, serializeKafkaAvroMsg }
