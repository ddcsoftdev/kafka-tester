import * as vscode from 'vscode';
import { KafkaStreamProvider } from './ui/streamControlProvider';
import { getFakerTypes } from './faker/types';

export class KafkaStreamPanel {
  private static currentPanel: KafkaStreamPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;

    this._panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(extensionUri, 'out', 'ui', 'templates'),
        vscode.Uri.joinPath(extensionUri, 'media')
      ]
    };

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Set initial content
    const provider = new KafkaStreamProvider(extensionUri);
    this._panel.webview.html = provider.getHtmlForWebview(this._panel.webview);

    // Handle messages
    this._panel.webview.onDidReceiveMessage(message => {
      if (message.type === 'getFakerTypes') {
        const types = getFakerTypes();
        this._panel.webview.postMessage({
          type: 'updateFakerTypes',
          types
        });
      }
    });
  }

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (KafkaStreamPanel.currentPanel) {
      KafkaStreamPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'kafka-stream-tester',
      'Kafka Stream Tester',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'out', 'ui', 'templates'),
          vscode.Uri.joinPath(extensionUri, 'media')
        ]
      }
    );

    KafkaStreamPanel.currentPanel = new KafkaStreamPanel(panel, extensionUri);
  }

  public dispose() {
    KafkaStreamPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}

export function activate(context: vscode.ExtensionContext) {
  const provider = new KafkaStreamProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'kafka-stream-tester',
      provider
    )
  );

  // Handle webview messages
  provider.onMessage('getFakerTypes', () => {
    const types = getFakerTypes();
    provider.postMessage({
      type: 'updateFakerTypes',
      types
    });
  });

  // Register command to open in window
  context.subscriptions.push(
    vscode.commands.registerCommand('kafka-stream-tester.openInWindow', () => {
      KafkaStreamPanel.createOrShow(context.extensionUri);
    })
  );
}

export function deactivate() {} 