const { spawn } = require('child_process');
const { chromium } = require('playwright');

function startServer() {
  return new Promise((resolve, reject) => {
    const isWin = process.platform === 'win32';
    const cmd = isWin ? (process.env.ComSpec || 'cmd.exe') : 'npx';
    const args = isWin ? ['/c', 'npx', 'serve', '-l', '5173', '.'] : ['serve', '-l', '5173', '.'];
    const server = spawn(cmd, args, {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        reject(new Error('Server start timeout'));
        server.kill();
      }
    }, 20000);
    server.stdout.on('data', (data) => {
      const text = data.toString();
      process.stdout.write(`[server] ${text}`);
      if (!resolved && /Accepting connections/.test(text)) {
        resolved = true;
        clearTimeout(timer);
        resolve(server);
      }
    });
    server.stderr.on('data', (data) => {
      process.stderr.write(`[server-err] ${data}`);
    });
    server.on('error', (err) => {
      if (!resolved) {
        clearTimeout(timer);
        reject(err);
      }
    });
    server.on('exit', (code) => {
      if (!resolved) {
        clearTimeout(timer);
        reject(new Error(`Server exited with code ${code}`));
      }
    });
  });
}

(async() => {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true, args: ['--disable-gpu', '--use-gl=swiftshader'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  // const diagnostics = await page.evaluate(() => ({
  //   assetsReady: window.__gameDebug?.state.assetsReady,
  //   totalItems: window.__gameDebug?.state.totalItems,
  //   startDisabled: document.getElementById('startButton')?.disabled,
  //   startText: document.getElementById('startButton')?.textContent,
  //   toastText: document.getElementById('toast')?.textContent
  // }));
  // console.log(diagnostics);
  await browser.close();
  server.kill('SIGTERM');
})();
