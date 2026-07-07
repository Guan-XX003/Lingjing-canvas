const ts=require('typescript'), fs=require('fs');
const [func,hook]=process.argv.slice(2);
const P='src/renderer/bundle/index.js';
const src=fs.readFileSync(P,'utf8');
const sf=ts.createSourceFile('i.js',src,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
let decl=null;
(function v(n){ if(ts.isVariableDeclaration(n)&&n.name&&ts.isIdentifier(n.name)&&n.name.text===func&&n.initializer&&ts.isCallExpression(n.initializer)&&n.initializer.expression.getText(sf)==='useCallback') decl=n; ts.forEachChild(n,v); })(sf);
if(!decl) throw new Error('not found: '+func);
const s=decl.initializer.getStart(sf), e=decl.initializer.getEnd();
const initText=src.slice(s,e);
fs.writeFileSync('src/renderer/hooks/'+hook+'.ts',
  '/**\n * '+func+'。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。\n */\n'+
  'import { useCallback } from "react";\n\nexport function '+hook+'(deps: any) {\n  const {} = deps;\n  const '+func+' = '+initText+';\n  return { '+func+' };\n}\n');
fs.writeFileSync(P, src.slice(0,s)+hook+'({}).'+func+src.slice(e));
console.log('extracted',func,'(',initText.length,'chars) -> hooks/'+hook);
