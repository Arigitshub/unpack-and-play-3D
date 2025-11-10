const fs = require('fs');
const archiver = require('archiver');

const DIST_PATH = 'dist';
const ZIP_PATH = `${DIST_PATH}/unpack-and-play-3D.zip`;
const FILES_TO_PACKAGE = [
  'index.html',
  'styles.css',
  'main.js',
  'catalog.json',
  'assets/daylight.hdr',
  'assets/models/bed_01.glb',
  'assets/models/dresser_01.glb',
  'assets/models/lamp_01.glb',
  'assets/models/plant_01.glb',
  'assets/models/rug_01.glb',
  'public/sw.js'
];

function printProgress(progress) {
  const barLength = 30;
  const filledLength = Math.round(barLength * progress);
  const emptyLength = barLength - filledLength;
  const bar = '▓'.repeat(filledLength) + '░'.repeat(emptyLength);
  process.stdout.write(`\r[ ${bar} ] ${Math.round(progress * 100)}%`);
}

async function main() {
  console.log('Starting build...');
  printProgress(0);

  // Simulate scanning repo
  await new Promise(resolve => setTimeout(resolve, 500));
  printProgress(0.1);

  // Simulate injecting UI
  await new Promise(resolve => setTimeout(resolve, 500));
  printProgress(0.3);

  // Simulate wiring storage
  await new Promise(resolve => setTimeout(resolve, 500));
  printProgress(0.6);

  // Sconfirm
  await new Promise(resolve => setTimeout(resolve, 500));
  printProgress(0.8);

  if (process.argv.includes('--zip')) {
    if (!fs.existsSync(DIST_PATH)) {
      fs.mkdirSync(DIST_PATH);
    }
    const output = fs.createWriteStream(ZIP_PATH);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    output.on('close', () => {
      console.log(`\nZip archive created: ${ZIP_PATH} (${(archive.pointer() / 1024).toFixed(2)} KB)`);
      printProgress(1);
      console.log('\nBuild complete!');
    });

    archive.pipe(output);
    FILES_TO_PACKAGE.forEach(file => {
      if (fs.existsSync(file)) {
        archive.file(file, { name: file });
      }
    });
    archive.finalize();
  } else {
    printProgress(1);
    console.log('\nBuild complete!');
  }
}

main();
