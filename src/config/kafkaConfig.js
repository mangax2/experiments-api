const localKafkaConfig = {
  enableKafka: 'false',
  host: 'kafka.tst.datahub.internal:9093',
  topics: {
    repPackingTopic: 'rsr.field-experiments.test.incoming.json',
    repPackingResultTopic: 'rsr.field-experiments.test.outgoing.json',
    product360OutgoingTopic: 'rsr.field-experiments.product360-test.outgoing.avro',
    setsChangesTopic: 'rsr.field-sets.product360-np.outgoing.avro',
    unitDeactivation: 'rsr.field-experiments.experimental-unit-deactivations-test.outgoing.avro',
  },
  schema: {
    product360Outgoing: 1726,
    unitDeactivation: 3420,
  },
}
const kafkaConfig = process.env.KAFKA_CONFIG
  ? JSON.parse(process.env.KAFKA_CONFIG)
  : localKafkaConfig

export default kafkaConfig
