const ts=require('typescript'), fs=require('fs');
const src=fs.readFileSync('src/renderer/bundle/index.js','utf8');
const sf=ts.createSourceFile('i.js',src,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
const out={};
(function v(n){ if(ts.isFunctionDeclaration(n)&&n.name&&/WanJuan/.test(n.name.text)){
  const props=[];
  n.parameters.forEach(p=>{ if(ts.isObjectBindingPattern(p.name)) p.name.elements.forEach(el=>{ if(el.name&&ts.isIdentifier(el.name)) props.push(el.name.text); });
    else if(ts.isIdentifier(p.name)) props.push(p.name.text); });
  out[n.name.text]=props;
} ts.forEachChild(n,v); })(sf);
fs.writeFileSync('/tmp/props.json', JSON.stringify(out));
for(const k in out) console.log(k, ':', out[k].length, 'props:', out[k].join(', ').slice(0,120));
