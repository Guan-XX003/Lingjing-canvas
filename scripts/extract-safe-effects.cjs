const ts=require('typescript'), fs=require('fs');
const THRESH=parseInt(process.argv[2]||'500');
const P='src/renderer/bundle/index.js';
let src=fs.readFileSync(P,'utf8');
const sf=ts.createSourceFile('i.js',src,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
const line=p=>sf.getLineAndCharacterOfPosition(p).line+1;
const isFn=n=>ts.isArrowFunction(n)||ts.isFunctionExpression(n)||ts.isFunctionDeclaration(n)||ts.isMethodDeclaration(n);
// 只记录组件顶层(函数深度==1)的声明
const declLine={};
function rec(name,l){ if(!(name in declLine)||l<declLine[name]) declLine[name]=l; }
(function v(n,depth){
  if(depth===1){
    if(ts.isVariableDeclaration(n)&&n.name){
      if(ts.isIdentifier(n.name)) rec(n.name.text, line(n.name.getStart(sf)));
      else if(ts.isArrayBindingPattern(n.name)||ts.isObjectBindingPattern(n.name)) n.name.elements.forEach(el=>{ if(el.name&&ts.isIdentifier(el.name)) rec(el.name.text, line(el.name.getStart(sf))); });
    }
  }
  const nd=isFn(n)?depth+1:depth;
  ts.forEachChild(n, c=>v(c,nd));
})(sf,0);
// effects + 引用标识符
const effs=[];
(function v(n){ if(ts.isCallExpression(n)&&n.expression.getText(sf)==='useEffect'){ const st=n.getStart(sf); const refs=new Set(); (function w(m){ if(ts.isIdentifier(m)) refs.add(m.text); ts.forEachChild(m,w); })(n); effs.push({s:st,e:n.getEnd(),line:line(st),refs}); } ts.forEachChild(n,v); })(sf);
effs.sort((a,b)=>a.s-b.s);
const targets=[]; let idx=0;
for(const ef of effs){ idx++;
  if(ef.e-ef.s<THRESH) continue;
  let fwd=null;
  for(const r of ef.refs){ if(declLine[r]!==undefined && declLine[r]>ef.line){ fwd=r; break; } }
  if(fwd){ console.log('  跳过 L'+ef.line+'('+(ef.e-ef.s)+'c): 前向引用组件级 '+fwd+'@L'+declLine[fwd]); continue; }
  targets.push({...ef,name:'useLateEffect'+ef.line});
}
[...targets].sort((a,b)=>b.s-a.s).forEach(t=>{
  const callText=src.slice(t.s,t.e);
  fs.writeFileSync('src/renderer/hooks/'+t.name+'.ts',
    '/**\n * '+t.name+'（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。\n */\n'+
    'import { useEffect, useRef, useState, useMemo, useCallback } from "react";\n\nexport function '+t.name+'(deps: any) {\n  const {} = deps;\n  '+callText+';\n}\n');
  src=src.slice(0,t.s)+t.name+'({})'+src.slice(t.e);
});
fs.writeFileSync(P,src);
console.log('安全抽取',targets.length,'个:', targets.map(t=>t.name).join(','));
