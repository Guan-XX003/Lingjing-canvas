const ts=require('typescript'), fs=require('fs');
const src=fs.readFileSync('src/renderer/bundle/index.js','utf8');
const sf=ts.createSourceFile('i.js',src,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
const line=p=>sf.getLineAndCharacterOfPosition(p).line+1;
// AppRoot body 2187-13017; 顶层(depth对应)函数赋值 NAME = (arrow|useCallback|async)
const fns=[];
(function v(n,depth){
  if(depth===2 && ts.isVariableDeclaration(n)&&n.name&&ts.isIdentifier(n.name)&&n.initializer){
    const l=line(n.name.getStart(sf));
    if(l>2187&&l<10331){
      const init=n.initializer;
      let kind=null;
      if(ts.isCallExpression(init)&&init.expression.getText(sf)==='useCallback') kind='useCallback';
      else if(ts.isArrowFunction(init)||ts.isFunctionExpression(init)) kind='arrow';
      if(kind){ fns.push([n.name.text, init.getEnd()-init.getStart(sf), kind, l]); }
    }
  }
  const isFn=ts.isArrowFunction(n)||ts.isFunctionExpression(n)||ts.isFunctionDeclaration(n)||ts.isMethodDeclaration(n);
  ts.forEachChild(n, c=>v(c, isFn?depth+1:depth));
})(sf,0);
fns.sort((a,b)=>b[1]-a[1]);
console.log('AppRoot 顶层函数(前20):');
fns.slice(0,20).forEach(([n,c,k,l])=>console.log(String(c).padStart(6),k.padEnd(11),'@L'+l,n));
console.log('共',fns.length,'个, 总',fns.reduce((s,x)=>s+x[1],0),'字符(~'+Math.round(fns.reduce((s,x)=>s+x[1],0)/40)+'行)');
