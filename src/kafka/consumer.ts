export async function consumeFromKafka(
  topic: string,
  broker: string,
  onMessage: (message: string) => void
): Promise<() => void> {
  // Placeholder: Add kafkajs consumer logic here
  console.log(`Listening to ${topic} at ${broker}`);
  
  // Simulate receiving messages every 2 seconds for testing
  const intervalId = setInterval(() => {
    onMessage(`Sample message from ${topic} at ${new Date().toISOString()}`);
  }, 2000);

  return () => clearInterval(intervalId);
} 