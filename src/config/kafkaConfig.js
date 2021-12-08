const localKafkaConfig = {
  enableKafka: 'false',
  host: 'kfk.awsuse1.tst.edh.cnb:9093',
  topics: {
    repPackingTopic: 'rsr.field-experiments.test.incoming.json',
    repPackingResultTopic: 'rsr.field-experiments.test.outgoing.json',
    product360OutgoingTopic: 'rsr.field-experiments.product360-test.outgoing.avro',
    setsChangesTopic: 'rsr.field-sets.dev.product360.outgoing.avro',
    setEntriesChangesTopic: 'rsr.field-sets.dev.set-entry-association.outgoing.json',
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
