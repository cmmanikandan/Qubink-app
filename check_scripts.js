const http = require('http');

http.get('http://localhost:3000/login', (res) => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    console.log('HTML status:', res.statusCode);
    const regex = /src="(\/_next\/static\/chunks\/[^"]+)"/g;
    let match;
    const scripts = [];
    while ((match = regex.exec(html)) !== null) {
      scripts.push(match[1]);
    }
    console.log('Total scripts found:', scripts.length);
    
    Promise.all(scripts.map(s => {
      return new Promise((resolve) => {
        http.get('http://localhost:3000' + s, (scriptRes) => {
          console.log(scriptRes.statusCode, s);
          resolve();
        });
      });
    })).then(() => {
      console.log('All scripts checked!');
      process.exit(0);
    });
  });
});
