import _ from 'lodash'
import { KafkaClient, Producer } from 'kafka-node'
import { serializeKafkaAvroMsg } from '../utility/AvroUtil'
import VaultUtil from '../utility/VaultUtil'
import cfServices from '../utility/ServiceConfig'

class KafkaProducer {
  static init = () => {
    const params = {
      client_id: VaultUtil.clientId,
      kafkaHost: cfServices.experimentsKafka.value.host,
      sslOptions: {
        cert: VaultUtil.kafkaClientCert,
        key: VaultUtil.kafkaPrivateKey,
        passphrase: VaultUtil.kafkaPassword,
      },
    }

    const client = new KafkaClient(params)
    KafkaProducer.createProducer(client)
  }

  // istanbul ignore next
  static createProducer(params) {
    const producer = new Producer(params)
    KafkaProducer.producerPromise = new Promise((resolve, reject) => {
      producer.on('ready', () => resolve(producer))

      producer.on('error', err => reject(err))
    })
  }

  static publish = ({ topic, message, schemaId }) => {
    if (!KafkaProducer.producerPromise) {
      KafkaProducer.init()
    }

    return KafkaProducer.producerPromise.then((producer) => {
      const messageToBePublished = {
        topic,
        messages: _.isNil(schemaId)
          ? JSON.stringify(message)
          : serializeKafkaAvroMsg(message, schemaId),
      }

      return producer.send([messageToBePublished], (err, data) => {
        if (err) {
          return Promise.reject(err)
        }

        return data
      })
    })
  }
}

export default KafkaProducer
