// Cross-check the benchmark's getForcedWinChance against brute force enumeration (<= MAXU unknowns)
const fs=require("fs"),vm=require("vm");
const {mulberry32,getForcedWinChance}=require("./sandbox");
const MAXU=Number(process.argv[3]||18), games=Number(process.argv[2]||1500);
const board={width:30,height:16,bombs:99};
const gc={width:30,height:16,bombAmount:99}, cfg={isVirtualMode:true,virtualGameConfig:gc};
let m=Object.create(Math); m.seedrandom=function(s){return mulberry32(s)};
let ctx={console,performance,setTimeout,Math:m,document:{addEventListener(){}}}; ctx.window=ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync("/home/user/SweeperSolver_2/sweeper.js","utf8"),ctx);
const bc=(v)=>{let c=0;while(v){v&=v-1;c++}return c};
let checked=0,mism=0,forcedN=0,big=0;
for(let seed=1;seed<=games;seed++){
 ctx.setWindowSeedRng();ctx.setSeed(seed);ctx.restartVirtualGame(gc);
 while(true){
  let r=ctx.sweepPage(true,false,cfg);
  if(r.state==="solved"||r.state==="death")break;
  let field=ctx.virtualGame.field;
  if(ctx.isGuessingSolver(r.solver)){
   let unknowns=field.flat().filter(c=>c.isUnknown);
   let f=getForcedWinChance(ctx,board.bombs);
   if(unknowns.length<=MAXU){
    let bit=new Map(unknowns.map((c,i)=>[c,1<<i]));
    let um=(c)=>c.neighbors.reduce((a,n)=>a|(bit.get(n)||0),0);
    let fa=(c)=>c.neighbors.filter(n=>n.isFlagged).length;
    let left=board.bombs-field.flat().filter(c=>c.isFlagged).length;
    let digits=field.flat().filter(c=>c.isDigit&&!c.isHidden).map(c=>({mask:um(c),b:c.value-fa(c)}));
    let confs=[];for(let k=0;k<(1<<unknowns.length);k++){if(bc(k)===left&&digits.every(d=>bc(k&d.mask)===d.b))confs.push(k)}
    let masks=unknowns.map(um),fl=unknowns.map(fa);
    let isForced=unknowns.every((c,i)=>new Set(confs.filter(k=>!(k&(1<<i))).map(k=>fl[i]+bc(k&masks[i]))).size<=1);
    let expect=isForced?1/confs.length:null;
    checked++; if(isForced)forcedN++;
    let ok=(expect===null&&f===null)||(expect!==null&&f!==null&&Math.abs(f-expect)<1e-9);
    if(!ok){mism++; if(mism<=5)console.log("mismatch seed",seed,"unknowns",unknowns.length,"bench",f,"brute",expect);}
   } else if(f!==null) big++;
  }
  ctx.executeInteractions(r.interactions,true,true);
 }
}
console.log({checked,forcedN,mism,forcedAboveMaxU:big});
