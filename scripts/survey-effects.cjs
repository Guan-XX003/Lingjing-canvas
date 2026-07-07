const ts=require('typescript'), fs=require('fs');
const src=fs.readFileSync('src/renderer/bundle/index.js','utf8');
const sf=ts.createSourceFile('i.js',src,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
const effs=[];
(function v(n){ if(ts.isCallExpression(n)&&n.expression.getText(sf)==='useEffect'){ const s=n.getStart(sf); effs.push({s,e:n.getEnd(),line:sf.getLineAndCharacterOfPosition(s).line+1}); } ts.forEachChild(n,v); })(sf);
effs.sort((a,b)=>(b.e-b.s)-(a.e-a.s));
console.log('剩',effs.length,'个effect, 总',effs.reduce((s,x)=>s+(x.e-x.s),0),'字符');
effs.slice(0,14).forEach((x,i)=>{ const body=src.slice(x.s+12, x.s+120).replace(/\s+/g,' ').trim(); console.log((x.e-x.s)+'c @L'+x.line+' :: '+body.slice(0,80)); });
