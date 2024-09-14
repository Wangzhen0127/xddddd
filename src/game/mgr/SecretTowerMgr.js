import GameNetMgr from "#game/net/GameNetMgr.js";
import Protocol from "#game/net/Protocol.js";
import logger from "#utils/logger.js";
import LoopMgr from "#game/common/LoopMgr.js";
import PlayerAttributeMgr from "./PlayerAttributeMgr.js";
import RegistMgr from '#game/common/RegistMgr.js';

export default class SecretTowerMgr {
    constructor() {
        this.isSyncing = false;
        this.isProcessing = false;
        this.challenge = global.account.switch.challenge || 0;
        this.showResult = global.account.switch.showResult || false;
        this.challengeSuccessReset = global.account.switch.challengeSuccessReset || false;

        LoopMgr.inst.add(this);
        RegistMgr.inst.add(this);
    }

    static get inst() {
        if (!this._instance) {
            this._instance = new SecretTowerMgr();
        }
        return this._instance;
    }

    reset() {
        this._instance = null;
    }

    clear() {
        LoopMgr.inst.remove(this);
    }

    SyncData(t) {
        logger.debug("[真火秘境管理] 初始化");
    }

    challengeResult(t) {
        if (t.ret === 0) {
            if (t.allBattleRecord.isWin) {
                if (this.challengeSuccessReset) {
                    this.challenge = global.account.switch.challenge || 0;
                }
            }

            if (this.showResult) {
                const isWinText = t.allBattleRecord.isWin == true ? `${global.colors.red}成功${global.colors.reset}` : `${global.colors.yellow}失败${global.colors.reset}`;
                logger.info(`[真火秘境管理] ${isWinText} 当前层数:${t.info.floor} 剩余次数:${this.challenge}`);
            }
        }
    }

    async loopUpdate() {
        if (this.isProcessing || this.isSyncing) return;
        this.isProcessing = true;

        try {
            if (this.challenge == 0) {
                this.clear();
                logger.info("[真火秘境管理] 任务完成停止循环");
                // 任务完成后切换为默认分身
                const defaultIdx = global.account.switch.defaultIndex || 0; //默认分身
                PlayerAttributeMgr.inst.setSeparationIdx(defaultIdx)
            } else {
                //切换到分身
                const idx = global.account.switch.challengeIndex || 0;
                PlayerAttributeMgr.inst.setSeparationIdx(idx)
                //挑战
                GameNetMgr.inst.sendPbMsg(Protocol.S_SECRETTOWER_FIGHT, { type: 1 });
                this.challenge--;
                await new Promise((resolve) => setTimeout(resolve, 1000 * 10));
            }

        } catch (error) {
            logger.error(`[真火秘境管理] loopUpdate error: ${error}`);
        } finally {
            this.isProcessing = false;
        }
    }
}
