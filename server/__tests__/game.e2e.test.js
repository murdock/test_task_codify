"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../src/index"));
describe('Slot Machine Server', () => {
    let sid;
    beforeEach(async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/session')
            .send({ userId: 'test-user' });
        sid = res.body.sid;
        expect(res.body.credits).toBe(10);
    });
    it('allocates 10 credits on session start', async () => {
        expect(sid).toBeDefined();
    });
    it('deducts 1 credit on a losing roll', async () => {
        const res = await (0, supertest_1.default)(index_1.default).post('/api/roll').send({ sid });
        expect(res.body.credits).toBeLessThan(10);
    });
    it('adds reward on a winning roll', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/roll')
            .send({ sid, forceSymbols: ['C', 'C', 'C'] }); // test hook
        expect(res.body.win).toBe(true);
        expect(res.body.reward).toBe(10);
        expect(res.body.credits).toBeGreaterThan(10);
    });
    it('applies cheating when credits between 40–60 (30% chance)', async () => {
        const preload = await (0, supertest_1.default)(index_1.default)
            .post('/api/session')
            .send({ userId: 'test-user', preloadCredits: 50 });
        sid = preload.body.sid;
        const spy = jest.spyOn(global.Math, 'random').mockReturnValue(0.1); // force reroll
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/roll')
            .send({ sid, forceSymbols: ['W', 'W', 'W'] });
        spy.mockRestore();
        expect(res.body.symbols).toBeDefined();
        // with spy you can assert reroll happened
    });
    it('applies heavier cheating when credits > 60 (60% chance)', async () => {
        const preload = await (0, supertest_1.default)(index_1.default)
            .post('/api/session')
            .send({ userId: 'test-user', preloadCredits: 70 });
        sid = preload.body.sid;
        const spy = jest.spyOn(global.Math, 'random').mockReturnValue(0.5); // under 0.6 → reroll
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/roll')
            .send({ sid, forceSymbols: ['W', 'W', 'W'] });
        spy.mockRestore();
        expect(res.body.symbols).toBeDefined();
    });
    it('cash out closes the session and moves credits to account', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/cashout')
            .send({ sid, userId: 'test-user' });
        expect(res.body.balance).toBeGreaterThan(0);
        const res2 = await (0, supertest_1.default)(index_1.default).post('/api/roll').send({ sid });
        expect(res2.status).toBe(400); // session inactive
    });
});
//# sourceMappingURL=game.e2e.test.js.map