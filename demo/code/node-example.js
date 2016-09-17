console.log('console.log');
console.error('console.error');
setTimeout(() => process.stdout.write('stdout (250ms)'), 250);
setTimeout(() => process.stderr.write('stdout (750ms)'), 750);
