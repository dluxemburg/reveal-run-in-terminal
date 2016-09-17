console.log('console.log');
console.error('console.error');
setTimeout(() => process.stdout.write('stdout (250ms)'), 250);
setTimeout(() => process.stderr.write('stderr (750ms)'), 750);
