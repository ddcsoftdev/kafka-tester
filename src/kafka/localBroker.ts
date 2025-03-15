export async function startLocalBroker(): Promise<string> {
  // Placeholder: Use Testcontainers to start Kafka
  console.log('Starting local Kafka broker...');
  return 'localhost:9092';
}

export async function stopLocalBroker(): Promise<void> {
  // Placeholder: Tear down container
  console.log('Stopping local Kafka broker...');
} 