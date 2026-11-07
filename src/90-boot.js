// ===== 起動 =====
dexInit();
shareInit();
Game.reset();
resize();
bindUI();
onPhase('ready');
requestAnimationFrame(frame);
