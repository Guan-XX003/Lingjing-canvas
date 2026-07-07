const ts=require('typescript'), fs=require('fs');
const [targetLine, compName]=process.argv.slice(2);
const P='src/renderer/bundle/index.js';
let src=fs.readFileSync(P,'utf8');
const sf=ts.createSourceFile('i.js',src,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
const line=p=>sf.getLineAndCharacterOfPosition(p).line+1;
// 找该行的 jsx/jsxs 调用(最外层匹配)
let node=null;
(function v(n){ if(!node&&ts.isCallExpression(n)&&/^jsxs?$/.test(n.expression.getText(sf))&&line(n.getStart(sf))==parseInt(targetLine)) node=n; ts.forEachChild(n,v); })(sf);
if(!node) throw new Error('no jsx at line '+targetLine);
const s=node.getStart(sf), e=node.getEnd();
const jsxText=src.slice(s,e);
// 组件文件: 收集自由标识符做 props(先空, tsc补)
fs.writeFileSync('src/renderer/components/'+compName+'.tsx',
  '// @ts-nocheck\n/** '+compName+'：自 WanJuanAppRoot render 抽出的 JSX 段，props 传入，行为不变。 */\n'+
  'import { jsx, jsxs, Fragment } from "react/jsx-runtime";\n\nexport function '+compName+'(props: any) {\n  const {} = props;\n  return '+jsxText+';\n}\n');
// 替换为组件引用(props 先空, 后补)
src=src.slice(0,s)+'jsx('+compName+', {})'+src.slice(e);
// 加 import 到 bundle
src=src.replace('import { useUngroupNode } from "../hooks/useUngroupNode";','import { useUngroupNode } from "../hooks/useUngroupNode";\nimport { '+compName+' } from "../components/'+compName+'";');
fs.writeFileSync(P,src);
console.log('extracted render section @L'+targetLine,'('+jsxText.length+'c) -> components/'+compName);
