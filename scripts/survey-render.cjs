const ts=require('typescript'), fs=require('fs');
const src=fs.readFileSync('src/renderer/bundle/index.js','utf8');
const sf=ts.createSourceFile('i.js',src,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
const line=p=>sf.getLineAndCharacterOfPosition(p).line+1;
// 找顶层组件函数(WanJuanApp*)及其 return 语句大小
(function v(n,depth){
  if((ts.isFunctionDeclaration(n))&&n.name&&/WanJuan/.test(n.name.text)&&n.body){
    let retSize=0, retLine=0, stateCount=0, effCount=0;
    n.body.statements.forEach(st=>{
      if(ts.isReturnStatement(st)){ retSize=st.getEnd()-st.getStart(sf); retLine=line(st.getStart(sf)); }
    });
    // 统计该组件体内 useState/useEffect(粗略,直接子孙)
    (function w(m){ if(ts.isCallExpression(m)){ const f=m.expression.getText(sf); if(f==='useState'||f==='useRef')stateCount++; if(f==='useEffect')effCount++; } ts.forEachChild(m,w); })(n.body);
    console.log(n.name.text, ': body', line(n.body.getStart(sf))+'-'+line(n.body.getEnd()), '| return@L'+retLine+' 大小~'+Math.round(retSize/40)+'行 | useState/Ref '+stateCount+' | useEffect '+effCount);
  }
  ts.forEachChild(n, c=>v(c,depth+1));
})(sf,0);
