const ts=require('typescript'), fs=require('fs');
const [marker,hook]=process.argv.slice(2);
const P='src/renderer/bundle/index.js';
const src=fs.readFileSync(P,'utf8');
const sf=ts.createSourceFile('i.js',src,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
let node=null;
(function v(n){ if(!node && ts.isCallExpression(n) && n.expression.getText(sf)==='useEffect'){ const t=src.slice(n.getStart(sf),n.getEnd()); if(t.includes(marker)) node=n; } ts.forEachChild(n,v); })(sf);
if(!node) throw new Error('effect not found for marker: '+marker);
const s=node.getStart(sf), e=node.getEnd();
const callText=src.slice(s,e); // useEffect(() => {...}, [deps])
fs.writeFileSync('src/renderer/hooks/'+hook+'.ts',
  '/**\n * '+hook+'（自 bundle 抽出的 useEffect，行为不变）。\n */\n'+
  'import { useEffect, useRef, useState, useMemo, useCallback } from "react";\n\nexport function '+hook+'(deps: any) {\n  const {} = deps;\n  '+callText+';\n}\n');
fs.writeFileSync(P, src.slice(0,s)+hook+'({})'+src.slice(e));
console.log('extracted effect', hook, '(',callText.length,'chars)');
