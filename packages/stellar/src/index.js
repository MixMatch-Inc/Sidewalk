"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StellarService = void 0;
const stellar_sdk_1 = require("@stellar/stellar-sdk");
class StellarService {
    constructor(networkUrl = 'https://horizon-testnet.stellar.org') {
        this.server = new stellar_sdk_1.Horizon.Server(networkUrl);
        console.log(`✨ Stellar Service initialized on ${networkUrl}`);
    }
    async getHealth() {
        try {
            await this.server.fetchTimebounds(100);
            return true;
        }
        catch (error) {
            console.error('Stellar connection failed', error);
            return false;
        }
    }
}
exports.StellarService = StellarService;
