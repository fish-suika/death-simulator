// ===== 起動 =====
dexInit();
Game.reset();
resize();
bindUI();
onPhase('ready');
requestAnimationFrame(frame);
