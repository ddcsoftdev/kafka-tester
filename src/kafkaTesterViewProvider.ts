import * as vscode from 'vscode';
import * as fs from 'fs';


export class KafkaTesterViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private _extensionUri: vscode.Uri;

    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        // Configure webview
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'out')
            ]
        };

        // Get script URI
        const scriptUri = webviewView.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'out', 'frontend', 'index.js')
        );

        // Set initial HTML
        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview, scriptUri);
    }

    public getHtmlForWebview(webview: vscode.Webview, scriptUri: vscode.Uri): string {
        const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'frontend', 'index.html');
        let html = fs.readFileSync(htmlPath.fsPath, 'utf-8');
        
        return html
            .replace(/{{cspSource}}/g, webview.cspSource)
            .replace(/{{scriptUri}}/g, scriptUri.toString());
    }

    private _onReady() {
        if (!this._view) return;
        this._view.webview.postMessage({ 
            type: 'init',
            data: { timestamp: new Date().toISOString() }
        });
    }


    public dispose(): void {
        // Clean up any resources
    }
} 