const ts=require('typescript'), fs=require('fs');
const src=fs.readFileSync('src/renderer/bundle/index.js','utf8');
const sf=ts.createSourceFile('i.js',src,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
const memo=[], eff=[], cb=[];
(function v(n){
  if(ts.isVariableDeclaration(n)&&n.name&&ts.isIdentifier(n.name)&&n.initializer&&ts.isCallExpression(n.initializer)){
    const fn=n.initializer.expression.getText(sf); const sz=n.initializer.getEnd()-n.initializer.getStart(sf);
    if(fn==='useMemo') memo.push([n.name.text,sz]);
    else if(fn==='useCallback') cb.push([n.name.text,sz]);
  }
  if(ts.isCallExpression(n)&&n.expression.getText(sf)==='useEffect'){ eff.push(n.getEnd()-n.getStart(sf)); }
  ts.forEachChild(n,v);
})(sf);
memo.sort((a,b)=>b[1]-a[1]); eff.sort((a,b)=>b-a);
console.log('useMemo top:'); memo.slice(0,12).forEach(([n,c])=>console.log(String(c).padStart(6),n));
console.log('useMemo共',memo.length,'总',memo.reduce((s,x)=>s+x[1],0));
console.log('useEffect: 共',eff.length,'总',eff.reduce((s,x)=>s+x,0),'最大',eff.slice(0,8));
console.log('useCallback剩:',cb.length,'总',cb.reduce((s,x)=>s+x[1],0));
