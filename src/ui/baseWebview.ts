import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export abstract class BaseWebviewProvider implements vscode.WebviewViewProvider {
  protected _view?: vscode.WebviewView;

  constructor(
    protected readonly _extensionUri: vscode.Uri,
    protected readonly _viewType: string
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'out', 'ui', 'templates'),
        vscode.Uri.joinPath(this._extensionUri, 'media')
      ]
    };

    webviewView.webview.html = this._getHtmlContent(webviewView.webview);
    this._setWebviewMessageListener(webviewView.webview);
    this._onWebviewReady(webviewView.webview);
  }

  protected abstract _getHtmlContent(webview: vscode.Webview): string;
  protected abstract _setWebviewMessageListener(webview: vscode.Webview): void;
  protected _onWebviewReady(webview: vscode.Webview): void {}

  protected _getAssetUri(webview: vscode.Webview, ...pathSegments: string[]): vscode.Uri {
    return webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'ui', 'templates', ...pathSegments)
    );
  }

  protected _getHtmlFile(fileName: string): string {
    try {
      const filePath = path.join(this._extensionUri.fsPath, 'out', 'ui', 'templates', fileName);
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error(`Failed to read HTML file: ${fileName}`, error);
      throw error;
    }
  }
} 