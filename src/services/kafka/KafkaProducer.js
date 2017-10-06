import Kafka from 'no-kafka'
import VaultUtil from '../utility/VaultUtil'
import cfServices from '../utility/ServiceConfig'

class KafkaProducer {
  static init = () => {
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

    const producer = KafkaProducer.createProducer(params)
    KafkaProducer.producerPromise = producer.init().then(() => producer)
  }

  static createProducer(params) {
    return new Kafka.Producer(params)
  }

  static publish = ({ topic, message }) => {
    if (!KafkaProducer.producerPromise) {
      KafkaProducer.init()
    }
    return KafkaProducer.producerPromise.then((producer) => {
      const messageToBePublished = {
        topic,
        message: {
          value: JSON.stringify(message),
        },
      }

      return producer.send(messageToBePublished, {})
    })
  }
}

export default KafkaProducer
