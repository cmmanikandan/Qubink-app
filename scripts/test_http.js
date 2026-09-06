const http = require('http');

http.get('http://localhost:3000/', (res) => {
  let body = '';
  res.on('data', (d) => (body += d));
  res.on('end', () => {
    console.log('ROOT STATUS:', res.statusCode);
    const cssMatch = body.match(/href="(\/_next\/static\/css\/[^"]+)"/);
    if (cssMatch) {
      console.log('Found CSS tag:', cssMatch[1]);
      http.get('http://localhost:3000' + cssMatch[1], (cres) => {
        console.log('CSS HTTP STATUS:', cres.statusCode);
        let cssData = '';
        cres.on('data', (chunk) => (cssData += chunk));
        cres.on('end', () => {
          console.log('CSS BYTES:', cssData.length);
          console.log('Contains qubink-teal:', cssData.includes('00a99d') || cssData.includes('qubink'));
        });
      });
    } else {
      console.log('No CSS link tag found in HTML');
    }
  });
});
