import { Kafka, Producer } from 'kafkajs';
import { RandomDataGenerator, RandomParam } from '../utils/randomDataGenerator';

let producer: Producer | null = null;

export async function startProducer(
    topic: string,
    brokerAddress: string,
    interval: number,
    getTemplate: () => string,
    getParams: () => RandomParam[],
    onMessageSent: (msg: string) => void
): Promise<() => void> {
    const kafka = new Kafka({
        clientId: 'kafka-stream-tester',
        brokers: [brokerAddress]
    });

    producer = kafka.producer();
    await producer.connect();

    const intervalId = setInterval(async () => {
        try {
            const template = getTemplate();
            const params = getParams();
            const message = RandomDataGenerator.generateData(template, params);
            
            if (producer) {
                await producer.send({
                    topic,
                    messages: [{ value: message }]
                });
                
                onMessageSent(message);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }, interval);

    return () => {
        clearInterval(intervalId);
        if (producer) {
            producer.disconnect();
            producer = null;
        }
    };
}

export async function sendToKafka(topic: string, brokerAddress: string, template: string): Promise<void> {
    if (!producer) {
        const kafka = new Kafka({
            clientId: 'kafka-stream-tester',
            brokers: [brokerAddress]
        });
        producer = kafka.producer();
        await producer.connect();
    }

    await producer.send({
        topic,
        messages: [{ value: template }]
    });
} 