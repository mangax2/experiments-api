import avro from 'avsc'

function encode(message, schema) {
  const type = schema ? avro.Type.forSchema(schema) : avro.Type.forValue(message)
  return type.toBuffer(message)
}

const serializeKafkaAvroMsg = (message, schemaId, schema) => {
  const header = Buffer.alloc(5, 0)
  header.writeInt32BE(schemaId, 1)

  const data = encode(message, schema)

  return Buffer.concat([header, data], header.length + data.length)
}

export default { serializeKafkaAvroMsg }
