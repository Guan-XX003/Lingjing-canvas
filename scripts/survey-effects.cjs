const ts=require('typescript'), fs=require('fs');
const src=fs.readFileSync('src/renderer/bundle/index.js','utf8');
const sf=ts.createSourceFile('i.js',src,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
const effs=[];
(function v(n){ if(ts.isCallExpression(n)&&n.expression.getText(sf)==='useEffect'){ const s=n.getStart(sf); effs.push({s,e:n.getEnd(),line:sf.getLineAndCharacterOfPosition(s).line+1}); } ts.forEachChild(n,v); })(sf);
effs.sort((a,b)=>(b.e-b.s)-(a.e-a.s));
effs.slice(0,6).forEach((x,i)=>{
  const body=src.slice(x.s, x.s+260).replace(/\s+/g,' ');
  console.log('#'+i, (x.e-x.s)+'chars @line'+x.line, ':', body.slice(0,180));
});
