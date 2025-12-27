async function checkRedirect(url) {
  try {
    console.log(`Fetching ${url}...`);
    const response = await fetch(url, { 
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    console.log('Final URL:', response.url);
    const text = await response.text();
    // Look for something that looks like an address or coordinates
    // console.log(text.substring(0, 2000)); 
    
    // Check for meta tags
    const metaRegex = /<meta[^>]+>/g;
    const metas = text.match(metaRegex);
    if (metas) {
        console.log("Meta tags found:", metas.length);
        metas.forEach(m => {
            if (m.includes('og:title') || m.includes('og:description') || m.includes('description')) {
                console.log(m);
            }
        });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkRedirect('https://g.co/kgs/tawXxcs');
