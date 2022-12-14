const kafkaConfig = {
  enableKafka: false,
  host: 'kfk.awsuse1.tst.edh.cnb:9093',
  ssl: {
    ca: 'ca',
    cert: 'cert',
    key: 'key',
    passphrase: 'password',
  },
  topics: {
    repPackingTopic: 'rsr.field-experiments.test.incoming.json',
    repPackingResultTopic: 'rsr.field-experiments.test.outgoing.json',
    product360OutgoingTopic: 'rsr.field-experiments.product360-test.outgoing.avro',
    setsChangesTopic: 'rsr.field-sets.dev.set-changes.outgoing.json',
    setEntriesChangesTopic: 'rsr.field-sets.dev.set-entry-association.outgoing.json',
    unitDeactivation: 'rsr.field-experiments.experimental-unit-deactivations-test.outgoing.avro',
  },
  schema: {
    product360Outgoing: 1726,
    unitDeactivation: 3420,
  },
}

export default kafkaConfig
