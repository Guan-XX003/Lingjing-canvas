const ts=require('typescript'), fs=require('fs');
const P='src/renderer/bundle/index.js';
let src=fs.readFileSync(P,'utf8');
let sf=ts.createSourceFile('i.js',src,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
const line=p=>sf.getLineAndCharacterOfPosition(p).line+1;
const isFn=n=>ts.isArrowFunction(n)||ts.isFunctionExpression(n)||ts.isFunctionDeclaration(n)||ts.isMethodDeclaration(n);
// 组件范围 + props(prop 视为在组件体起始行声明)
const comps=[];
(function v(n){ if(ts.isFunctionDeclaration(n)&&n.name&&/WanJuan/.test(n.name.text)&&n.body){ const props=[]; n.parameters.forEach(p=>{ if(ts.isObjectBindingPattern(p.name)) p.name.elements.forEach(el=>{if(el.name&&ts.isIdentifier(el.name))props.push(el.name.text);}); }); comps.push({name:n.name.text,s:line(n.body.getStart(sf)),e:line(n.body.getEnd()),props}); } ts.forEachChild(n,v); })(sf);
const compByLine=l=>{ let b=null; for(const c of comps) if(l>=c.s&&l<=c.e&&(!b||(c.e-c.s)<(b.e-b.s)))b=c; return b; };
// 每组件声明行(VariableDeclaration depth1 + props@组件起始)
const declLine={}; comps.forEach(c=>{declLine[c.name]={}; c.props.forEach(p=>declLine[c.name][p]=c.s);});
(function v(n,depth){
  if(depth===1&&ts.isVariableDeclaration(n)&&n.name){ const c=compByLine(line(n.getStart(sf))); if(c){const put=(nm,ln)=>{if(!(nm in declLine[c.name])||ln<declLine[c.name][nm])declLine[c.name][nm]=ln;};
    if(ts.isIdentifier(n.name))put(n.name.text,line(n.name.getStart(sf)));
    else if(ts.isArrayBindingPattern(n.name)||ts.isObjectBindingPattern(n.name))n.name.elements.forEach(el=>{if(el.name&&ts.isIdentifier(el.name))put(el.name.text,line(el.name.getStart(sf)));});
  }}
  ts.forEachChild(n,c=>v(c, isFn(n)?depth+1:depth));
})(sf,0);
// 每个 use_ hook 调用点行
const callLine={};
(function v(n){ if(ts.isCallExpression(n)&&ts.isIdentifier(n.expression)&&/^use_/.test(n.expression.text)) callLine[n.expression.text]=line(n.getStart(sf)); ts.forEachChild(n,v); })(sf);
// 检查每个 hook
const glob=fs.readdirSync('src/renderer/hooks').filter(f=>/^use_.*\.ts$/.test(f));
let totalFix=0; const report=[];
for(const file of glob){
  const hk=file.slice(0,-3); const fn=hk.slice(4);
  const cl=callLine[hk]; if(!cl) continue;
  const comp=compByLine(cl); if(!comp) continue;
  const dl=declLine[comp.name];
  let h=fs.readFileSync('src/renderer/hooks/'+file,'utf8');
  const destructured=new Set([...h.matchAll(/^\s+([\w$]+),\s*$/gm)].map(m=>m[1]));
  const imported=new Set([...h.matchAll(/import \{([^}]*)\}/g)].flatMap(m=>m[1].split(',').map(x=>x.trim())));
  const refs=new Set([...h.matchAll(/\b([a-zA-Z_$][\w$]*)\b/g)].map(m=>m[1]));
  const need=[];
  for(const r of refs){ if(r===fn||destructured.has(r)||imported.has(r)) continue;
    if(dl[r]!==undefined && dl[r]<cl) need.push(r); // 组件级、声明在调用点前 => 该传却没传
  }
  if(need.length){ report.push(hk+': '+need.join(',')); totalFix+=need.length;
    // 修 hook
    if(h.includes('  const {} = deps;')) h=h.replace('  const {} = deps;','  const {\n    '+need.sort().join(',\n    ')+',\n  } = deps;');
    else if(h.includes('  } = deps;')) h=h.replace('  } = deps;','    '+need.sort().join(',\n    ')+',\n  } = deps;');
    fs.writeFileSync('src/renderer/hooks/'+file,h);
    // 修调用点
    const re=new RegExp(hk.replace('$','\\$')+'\\(\\{([^}]*)\\}\\)');
    const m=src.match(re); if(m){ const inside=m[1].trim(); const ni=inside+(inside?', ':' ')+need.join(', '); src=src.replace(m[0], hk+'({ '+ni+' })'); }
  }
}
fs.writeFileSync(P,src);
console.log('修复', report.length, '个hook,', totalFix, '个漏传依赖');
report.slice(0,20).forEach(r=>console.log(' ',r.slice(0,100)));
