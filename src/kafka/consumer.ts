import { OutputMessage } from '../models/output';

export async function consumeFromKafka(
  topic: string,
  broker: string,
  onMessage: (message: OutputMessage) => void
): Promise<() => void> {
  // Placeholder: Add kafkajs consumer logic here
  console.log(`Listening to ${topic} at ${broker}`);
  
  // Simulate receiving messages every 2 seconds for testing
  const intervalId = setInterval(() => {
    const message: OutputMessage = {
      key: 'test-key',
      value: `Sample message from ${topic}`,
      partition: 0,
      offset: Math.floor(Math.random() * 1000),
      timestamp: Date.now()
    };
    onMessage(message);
  }, 2000);

  return () => clearInterval(intervalId);
} 