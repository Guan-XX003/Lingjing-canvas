const ts=require('typescript'), fs=require('fs');
const THRESH=parseInt(process.argv[2]||'800');
const P='src/renderer/bundle/index.js';
let src=fs.readFileSync(P,'utf8');
const sf=ts.createSourceFile('i.js',src,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
const effs=[];
(function v(n){ if(ts.isCallExpression(n)&&n.expression.getText(sf)==='useEffect') effs.push({s:n.getStart(sf),e:n.getEnd()}); ts.forEachChild(n,v); })(sf);
// 按出现顺序编号, 但从后往前替换
effs.sort((a,b)=>a.s-b.s);
const targets=effs.map((x,i)=>({...x,name:'useCanvasEffect'+(i+1)})).filter(x=>x.e-x.s>=THRESH);
// 从后往前替换 src
[...targets].sort((a,b)=>b.s-a.s).forEach(t=>{
  const callText=src.slice(t.s,t.e);
  fs.writeFileSync('src/renderer/hooks/'+t.name+'.ts',
    '/**\n * '+t.name+'（自 bundle 抽出的 useEffect，逐字搬运、行为不变）。\n */\n'+
    'import { useEffect, useRef, useState, useMemo, useCallback } from "react";\n\nexport function '+t.name+'(deps: any) {\n  const {} = deps;\n  '+callText+';\n}\n');
  src=src.slice(0,t.s)+t.name+'({})'+src.slice(t.e);
});
fs.writeFileSync(P,src);
console.log('抽了',targets.length,'个effect(>'+THRESH+'c):', targets.map(t=>t.name).join(','));
