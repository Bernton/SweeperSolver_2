const fs=require("fs"), vm=require("vm");
const src=fs.readFileSync("/home/user/SweeperSolver_2/sweeper.js","utf8");
const shared={};
function load(){
  let sm=Object.create(Math); sm.seedrandom=(s)=>Math.random;
  let ctx={console:{log(){},warn(){}}, performance, setTimeout, Math:sm, document:{addEventListener(){},removeEventListener(){}}};
  ctx.window=new Proxy(shared,{}); // shared window props
  vm.createContext(ctx);
  // make globals visible via window: functions referenced as window.x are set on shared
  vm.runInContext(src,ctx);
  return ctx;
}
async function run(ctx, ms){
  vm.runInContext("autoSweepConfig.isVirtualMode=true; autoSweepConfig.virtualBatchSize=50; startAutoSweep(autoSweepConfig, autoSweepStats);",ctx);
  await new Promise(r=>setTimeout(r,ms));
  vm.runInContext("stopAutoSweep(autoSweepConfig)",ctx);
  await new Promise(r=>setTimeout(r,50));
  return vm.runInContext("[autoSweepStats.gameStats.filter(g=>g&&g.finishState).length, autoSweepConfig.state.gameIndex, autoSweepStats.gameStats.length]",ctx);
}
(async()=>{
  let c1=load();
  console.log("after paste 1:", await run(c1, 1500));
  let c2=load();
  console.log("after paste 2 (same window):", await run(c2, 300));
})();
