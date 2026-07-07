const ts=require('typescript'), fs=require('fs');
const src=fs.readFileSync('src/renderer/bundle/index.js','utf8');
const sf=ts.createSourceFile('i.js',src,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
const res=[];
(function v(n){
  if(ts.isVariableDeclaration(n)&&n.name&&ts.isIdentifier(n.name)&&n.initializer&&ts.isCallExpression(n.initializer)&&n.initializer.expression.getText(sf)==='useCallback'){
    res.push([n.name.text, n.initializer.getEnd()-n.initializer.getStart(sf)]);
  }
  ts.forEachChild(n,v);
})(sf);
res.sort((a,b)=>b[1]-a[1]);
res.slice(0,25).forEach(([n,c])=>console.log(String(c).padStart(6), n));
console.log('--- 共', res.length, '个 useCallback, 总字符', res.reduce((s,x)=>s+x[1],0));
