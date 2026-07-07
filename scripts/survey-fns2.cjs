const ts=require('typescript'), fs=require('fs');
const src=fs.readFileSync('src/renderer/bundle/index.js','utf8');
const sf=ts.createSourceFile('i.js',src,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
const line=p=>sf.getLineAndCharacterOfPosition(p).line+1;
const isFn=n=>ts.isArrowFunction(n)||ts.isFunctionExpression(n)||ts.isFunctionDeclaration(n)||ts.isMethodDeclaration(n);
const fns=[];
(function v(n,depth){
  if(depth===1 && ts.isVariableDeclaration(n)&&n.name&&ts.isIdentifier(n.name)&&n.initializer){
    const init=n.initializer; let kind=null;
    if(ts.isCallExpression(init)&&['useCallback','useMemo'].includes(init.expression.getText(sf))) kind=init.expression.getText(sf);
    else if(ts.isArrowFunction(init)||ts.isFunctionExpression(init)) kind='arrow';
    if(kind&&init.getEnd()-init.getStart(sf)>500) fns.push([n.name.text, init.getEnd()-init.getStart(sf), kind, line(n.name.getStart(sf))]);
  }
  ts.forEachChild(n, c=>v(c, isFn(n)?depth+1:depth));
})(sf,0);
fns.sort((a,b)=>b[1]-a[1]);
fns.slice(0,20).forEach(([n,c,k,l])=>console.log(String(c).padStart(6),k.padEnd(11),'@L'+l,n));
console.log('共',fns.length,'个>500c, 总',fns.reduce((s,x)=>s+x[1],0));
