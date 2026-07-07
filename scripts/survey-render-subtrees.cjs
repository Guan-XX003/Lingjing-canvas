const ts=require('typescript'), fs=require('fs');
const src=fs.readFileSync('src/renderer/bundle/index.js','utf8');
const sf=ts.createSourceFile('i.js',src,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
const line=p=>sf.getLineAndCharacterOfPosition(p).line+1;
// 找 AppRoot 的 return 语句
let ret=null;
(function v(n){ if(ts.isFunctionDeclaration(n)&&n.name&&n.name.text==='WanJuanAppRoot'&&n.body){ n.body.statements.forEach(st=>{if(ts.isReturnStatement(st))ret=st.expression;}); } ts.forEachChild(n,v); })(sf);
if(!ret){console.log('no return');process.exit(0);}
// 递归找 jsx/jsxs 调用, 收集"较大且是 children 数组元素"的子树
const subs=[];
(function collect(n){
  if(ts.isCallExpression(n)&&/^jsxs?$/.test(n.expression.getText(sf))){
    const sz=n.getEnd()-n.getStart(sf);
    // 第一个参数(tag)
    const tag=n.arguments[0]?n.arguments[0].getText(sf).slice(0,30):'?';
    subs.push({sz, line:line(n.getStart(sf)), tag});
  }
  ts.forEachChild(n,collect);
})(ret);
subs.sort((a,b)=>b.sz-a.sz);
console.log('AppRoot return 内 jsx/jsxs 调用(前25大):');
subs.slice(0,25).forEach(s=>console.log(String(s.sz).padStart(7), '@L'+s.line, s.tag));
console.log('return 总大小:', ret.getEnd()-ret.getStart(sf), '字符, @L'+line(ret.getStart(sf)));
