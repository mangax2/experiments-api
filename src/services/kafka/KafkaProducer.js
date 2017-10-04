import Kafka from 'no-kafka'
import VaultUtil from '../utility/VaultUtil'
import cfServices from '../utility/ServiceConfig'

function produce({ topic, message }) {
  const params = {
    client_id: 'PD-EXPERIMENTS-API-DEV-SVC',
    connectionString: cfServices.experimentsKafka.value.host,
    reconnectionDelay: {
      min: 100000,
      max: 100000,
    },
    ssl: {
      cert: VaultUtil.kafkaClientCert,
      key: VaultUtil.kafkaPrivateKey,
      passphrase: VaultUtil.kafkaPassword,
    },
  }
  const producer = new Kafka.Producer(params)

  const messageToBePublished = {
    topic,
    message: {
      value: JSON.stringify(message),
    },
  }

  return producer.init().then(() => producer.send(messageToBePublished, {}))
}

module.exports = produce
