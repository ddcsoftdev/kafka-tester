const vscode = acquireVsCodeApi();

document.getElementById('connect').addEventListener('click', () => {
  const brokers = document.getElementById('brokers').value;
  const topic = document.getElementById('topic').value;
  const mode = document.getElementById('mode').value;
  
  vscode.postMessage({
    command: 'connect',
    brokers,
    topic,
    mode
  });
}); 