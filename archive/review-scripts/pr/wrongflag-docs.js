const fs=require("fs"), vm=require("vm");
const {mulberry32}=require("/home/user/SweeperSolver_2/bench/sandbox");
const src=fs.readFileSync(process.argv[3]||"/home/user/SweeperSolver_2/sweeper.js","utf8");
let sm=Object.create(Math); sm.seedrandom=function(s){return mulberry32(s);};
let ctx={console:{log(){},warn(){}}, performance, setTimeout, Math:sm, document:{addEventListener(){},removeEventListener(){}}};
ctx.window=ctx; vm.createContext(ctx); vm.runInContext(src,ctx);
const board={width:30,height:16,bombAmount:99}; const config={isVirtualMode:true,virtualGameConfig:board};
let res={invalid:0,deathNonGuess:0,deathGuess:0,won:0,crash:0,noflag:0};
const N=Number(process.argv[2]||300);
for(let seed=1;seed<=N;seed++){
  ctx.setWindowSeedRng(); ctx.setSeed(seed); ctx.restartVirtualGame(board);
  let pick=mulberry32(seed*7+1); let step=0; let last=null; let flagged=false;
  try{
    while(true){
      if(step===5&&!flagged){
        let f=ctx.virtualGame.field.flat().filter(c=>c.isUnknown&&!c.isBomb&&c.neighbors.some(n=>n.isDigit));
        if(f.length===0){res.noflag++;}
        else{let c=f[Math.floor(pick()*f.length)]; c.isFlagged=true; c.isUnknown=false;}
        flagged=true;
      }
      let r=ctx.sweepPage(true,false,config);
      if(r.state==="solved"){res.won++;break;}
      if(r.state==="invalid"){res.invalid++;break;}
      if(r.state==="death"){ if(last&&ctx.isGuessingSolver(last))res.deathGuess++; else res.deathNonGuess++; break;}
      if(r.interactions.length===0) throw new Error("stall "+r.state);
      last=r.solver; ctx.executeInteractions(r.interactions,true,true); step++;
    }
  }catch(e){res.crash++; if(res.crash<3)console.error(seed,e.message);}
}
console.log(JSON.stringify(res));
