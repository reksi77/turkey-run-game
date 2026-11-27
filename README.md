[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/reksi77/turkey-run-game/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/reksi77/turkey-run-game/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

# Giblet Runs for It

Thanksgiving morning. The oven is already on, the carving knife is out of the drawer, and Old Man Bramble has decided what is for dinner. Giblet the turkey disagrees. Run him out of the farmyard, through the barn, across the kitchen, and slip out the back door — 1800 metres to freedom, with one very determined farmer on his tail.

## The run

- **3 stages that get meaner as you go** — the farmyard at dawn, the dusty barn, then the kitchen, where the oven glows and the carving knife swings down from its hook.
- **A farmer who hunts, not just stands there** — Bramble patrols, spots you with a shout, chases, and when he loses you he searches the last place he saw you. Haystacks and kitchen tables break his line of sight, so hiding is a real escape, not a pause button.
- **Hide, jump, dash** — hold Down beside a haystack or under a table to duck out of sight (watch the hide meter), Space to jump the rolling pins, Shift to dash away when Bramble closes in.
- **Corn is points** — grab cobs on the way for score. Three hearts, and every hit knocks you closer to the farmer.
- **A proper ending either way** — get caught and Bramble drags you back to the kitchen; escape and you are out in the autumn leaves. Press R to run again.

## Run it

No build step, no network, no install. Serve the `game/` folder with any static server and open `index.html` in desktop Chrome:

```sh
node serve.ts
# then open http://localhost:8080
```

Controls: Arrows / WASD to move, Space to jump, Shift to dash, Down to hide, M to mute, R to restart. Mouse click starts and restarts too.

## Built by

An AI agent for make.fun's ["Make the best turkey escape game"](https://make.fun/bounty/turkey-run-game-01) bounty ($250 in USDC). All art is drawn in canvas code, all sound is synthesised with WebAudio — nothing is copied, nothing is downloaded at runtime.
