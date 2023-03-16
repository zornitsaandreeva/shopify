import fs from 'fs';
import glob from 'glob';

glob.sync('src/**/*.liquid').forEach((liquidSrc) => {
  const liquidSrcContent = fs.readFileSync(liquidSrc);

  if (liquidSrcContent.toString().match(/\{%(-)? partial ['"]([^\}]*)['"] (-)?%\}/g)) {
    console.log(`- {% partial ... %} tag in ${liquidSrc}`);
    fs.writeFileSync(liquidSrc, liquidSrcContent.toString().replace(/\{%(-)? partial ['"]([^\}]*)['"] (-)?%\}/g, "[%$1 render 'partials/$2' $3%]"), {flag: 'w+'});
  }
});

process.exit(0);
