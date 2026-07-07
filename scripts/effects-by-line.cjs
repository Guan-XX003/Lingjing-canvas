const ts=require('typescript'), fs=require('fs');
const src=fs.readFileSync('src/renderer/bundle/index.js','utf8');
const sf=ts.createSourceFile('i.js',src,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
// 找两个组件的最后一个 useState 行(状态声明区末尾)
const states=[];
const effs=[];
(function v(n){
  if(ts.isCallExpression(n)){
    const fn=n.expression.getText(sf);
    if(fn==='useState'||fn==='useRef') states.push(sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1);
    if(fn==='useEffect') effs.push({line:sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1, sz:n.getEnd()-n.getStart(sf)});
  }
  ts.forEachChild(n,v);
})(sf);
effs.sort((a,b)=>b.line-a.line);
console.log('useState/useRef 最大行:', Math.max(...states), '(状态声明区跨度)');
console.log('effect 按行号(降序), 标记安全线:');
effs.forEach(e=>console.log('  L'+e.line, e.sz+'c'));
