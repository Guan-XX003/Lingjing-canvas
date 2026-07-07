const ts=require('typescript');const fs=require('fs');
const FILE='src/renderer/bundle/index.js';const src=fs.readFileSync(FILE,'utf8');
const sf=ts.createSourceFile('i.js',src,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
const ln=p=>sf.getLineAndCharacterOfPosition(p).line+1;
let target=null;
(function w(n){
  if(ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.AmpersandAmpersandToken){
    const t=n.left.getText(sf);
    if(/^false && agentAttachments/.test(t)&&ts.isCallExpression(n.right)&&ts.isIdentifier(n.right.expression)&&/^jsxs?$/.test(n.right.expression.text)){target=n;return;}
  }
  if(!target)ts.forEachChild(n,w);
})(sf);
if(!target)throw new Error('dead block not found');
console.log('dead block',ln(target.getStart(sf)),'-',ln(target.getEnd()));
const out=src.slice(0,target.getStart(sf))+'false'+src.slice(target.getEnd());
fs.writeFileSync(FILE,out);
console.log('replaced with false');
