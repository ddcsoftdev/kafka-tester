import * as vscode from 'vscode';
import { KafkaTesterViewProvider } from './kafkaTesterViewProvider';

export function activate(context: vscode.ExtensionContext) {
	const provider = new KafkaTesterViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('kafka-stream-tester', provider)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('kafka-stream-tester.openInWindow', () => {
			const panel = vscode.window.createWebviewPanel(
				'kafka-stream-tester',
				'Kafka Stream Tester',
				vscode.ViewColumn.One,
				{
					enableScripts: true,
					localResourceRoots: [
						vscode.Uri.joinPath(context.extensionUri, 'out')
					]
				}
			);

			const webview = panel.webview;
			const indexPath = vscode.Uri.joinPath(context.extensionUri, 'out', 'frontend', 'index.js');
			const indexUri = webview.asWebviewUri(indexPath);

			webview.html = provider.getHtmlForWebview(webview, indexUri);
		})
	);
}

export function deactivate() {} 