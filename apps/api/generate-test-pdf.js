const fs = require('fs');
// Very naive minimal valid PDF containing the magic bytes '%PDF-1.4'
const minimalPdfBuffer = Buffer.from('%PDF-1.4\n%EOF\n', 'utf-8');
fs.writeFileSync('test-upload-magic.pdf', minimalPdfBuffer);
console.log('Test PDF created: test-upload-magic.pdf');
