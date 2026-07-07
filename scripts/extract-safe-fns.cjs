const ts=require('typescript'), fs=require('fs');
const THRESH=parseInt(process.argv[2]||'800');
const P='src/renderer/bundle/index.js';
let src=fs.readFileSync(P,'utf8');
const sf=ts.createSourceFile('i.js',src,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
const line=p=>sf.getLineAndCharacterOfPosition(p).line+1;
const isFnNode=n=>ts.isArrowFunction(n)||ts.isFunctionExpression(n)||ts.isFunctionDeclaration(n)||ts.isMethodDeclaration(n);
// 找组件函数(WanJuan*)范围
const comps=[];
(function v(n){ if(ts.isFunctionDeclaration(n)&&n.name&&/WanJuan/.test(n.name.text)&&n.body) comps.push({name:n.name.text, s:line(n.body.getStart(sf)), e:line(n.body.getEnd())}); ts.forEachChild(n,v); })(sf);
const compOf=l=>{ let best=null; for(const c of comps) if(l>=c.s&&l<=c.e&&(!best||(c.e-c.s)<(best.e-best.s))) best=c; return best?best.name:null; };
// 最近的组件祖先(用 parent 链)
function nearestComp(node){ let p=node.parent; while(p){ if(ts.isFunctionDeclaration(p)&&p.name&&/WanJuan/.test(p.name.text)) { // 确认 node 到 p 之间无其它函数
      let q=node.parent, inner=false; while(q&&q!==p){ if(isFnNode(q)) {inner=true;break;} q=q.parent; } return inner?null:p.name.text; } p=p.parent; } return null; }
// 每组件声明表: name->line, 仅组件体直属
const compDecl={}; comps.forEach(c=>compDecl[c.name]={});
(function v(n){
  if(ts.isVariableDeclaration(n)&&n.name){
    const c=nearestComp(n);
    if(c){ const put=(nm,ln)=>{ if(!(nm in compDecl[c])||ln<compDecl[c][nm]) compDecl[c][nm]=ln; };
      if(ts.isIdentifier(n.name)) put(n.name.text, line(n.name.getStart(sf)));
      else if(ts.isArrayBindingPattern(n.name)||ts.isObjectBindingPattern(n.name)) n.name.elements.forEach(el=>{ if(el.name&&ts.isIdentifier(el.name)) put(el.name.text, line(el.name.getStart(sf))); });
    }
  }
  ts.forEachChild(n,v);
})(sf);
// 候选函数
const cands=[];
(function v(n){
  if(ts.isVariableDeclaration(n)&&n.name&&ts.isIdentifier(n.name)&&n.initializer){
    const c=nearestComp(n);
    if(c){ const init=n.initializer;
      const ok=(ts.isCallExpression(init)&&['useCallback','useMemo'].includes(init.expression.getText(sf)))||ts.isArrowFunction(init)||ts.isFunctionExpression(init);
      if(ok&&init.getEnd()-init.getStart(sf)>=THRESH){
        const refs=new Set(); (function w(m){ if(ts.isIdentifier(m)) refs.add(m.text); ts.forEachChild(m,w); })(init);
        cands.push({name:n.name.text, s:init.getStart(sf), e:init.getEnd(), line:line(n.name.getStart(sf)), comp:c, refs:[...refs]});
      }
    }
  }
  ts.forEachChild(n,v);
})(sf);
// 安全 = 本组件内无前向引用(组件级名声明行>func行)
const targets=[], meta={};
for(const c of cands){
  const dl=compDecl[c.comp]; let fwd=null;
  for(const r of c.refs){ if(r!==c.name && dl[r]!==undefined && dl[r]>c.line){ fwd=r; break; } }
  if(fwd) continue;
  targets.push(c); meta[c.name]={comp:c.comp, line:c.line, hook:'use_'+c.name};
}
[...targets].sort((a,b)=>b.s-a.s).forEach(t=>{
  const initText=src.slice(t.s,t.e);
  fs.writeFileSync('src/renderer/hooks/use_'+t.name+'.ts',
    '/**\n * '+t.name+'。自 bundle 抽出，逐字搬运、行为不变。\n */\n'+
    'import { useCallback, useMemo } from "react";\n\nexport function use_'+t.name+'(deps: any) {\n  const {} = deps;\n  const '+t.name+' = '+initText+';\n  return { '+t.name+' };\n}\n');
  src=src.slice(0,t.s)+'use_'+t.name+'({}).'+t.name+src.slice(t.e);
});
fs.writeFileSync(P,src);
// 输出 每组件声明表 + func meta 供解析器
fs.writeFileSync('/tmp/fnmeta.json', JSON.stringify({compDecl, meta}));
console.log('候选',cands.length,'安全抽',targets.length,'个');
