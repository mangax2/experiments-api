import Kafka from 'no-kafka'
import s3Object from '../utility/S3Utils'
import KafkaConfig from '../utility/KafkaConfig'

const kafkaCertPromise = s3Object({ Bucket: KafkaConfig.s3Path, Key: `${KafkaConfig.certName}.cert` })
const kafkaKeyPromise = s3Object({ Bucket: KafkaConfig.s3Path, Key: `${KafkaConfig.keyName}.pem` })

function produce({ topic, message }) {
  return Promise.all([kafkaCertPromise, kafkaKeyPromise]).then(([kafkaCert, kafkaKey]) => {
    const params = {
      client_id: 'PD-EXPERIMENTS-API-DEV-SVC',
      connectionString: KafkaConfig.host,
      reconnectionDelay: {
        min: 100000,
        max: 100000,
      },
      ssl: {
        cert: kafkaCert.Body.toString(),
        key: kafkaKey.Body.toString(),
        passphrase: KafkaConfig.kafkaKeyPhrase,
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
  })
}

module.exports = produce
