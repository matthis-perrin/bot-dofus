export function restart(): never {
  // eslint-disable-next-line node/no-process-exit
  process.exit();
}

export function stopBotEntirely(): never {
  // eslint-disable-next-line node/no-process-exit
  process.exit(111);
}
