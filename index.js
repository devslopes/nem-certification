"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const nem_library_1 = require("nem-library");
const fs = require('fs');
const NodeCache = require("node-cache");
const Observable_1 = require("rxjs/Observable");
const nemConfig = require('./nem-config');
nem_library_1.NEMLibrary.bootstrap(nem_library_1.NetworkTypes.TEST_NET);
const transactionHttp = new nem_library_1.TransactionHttp();
const mosaicHttp = new nem_library_1.MosaicHttp();
const cacheDB = new NodeCache();
exports.processCertification = (address, certName) => __awaiter(this, void 0, void 0, function* () {
    try {
        const isOwned = yield exports.certificationOwned(address, certName);
        if (isOwned)
            return;
        const cert = nemConfig.certifications[certName];
        const mosaicId = new nem_library_1.MosaicId(cert.namespace, cert.mosaicName);
        const certCreated = yield exports.createCertifcationMosaic(mosaicId);
        if (!certCreated)
            return;
        const transfer = {
            toAddress: new nem_library_1.Address(address),
            signer: loadAccount(),
            rewardAmount: cert.reward,
            certMosaicId: mosaicId,
            rewardMosaicId: new nem_library_1.MosaicId(nemConfig.mosaicNamespace, nemConfig.mosaicForReward)
        };
        yield exports.transferMosaics(transfer);
    }
    catch (err) {
        console.log(err);
    }
});
exports.certificationOwned = (address, certName) => {
    return new Promise((resolve, reject) => {
        const accountHttp = new nem_library_1.AccountHttp();
        try {
            const add = new nem_library_1.Address(address);
            accountHttp.getMosaicOwnedByAddress(add)
                .subscribe(mosaics => {
                const cert = mosaics.find((mosaic) => {
                    return mosaic.mosaicId.name === certName;
                });
                if (!cert)
                    resolve(false);
                else {
                    resolve(true);
                }
            }, err => {
                reject(err);
            });
        }
        catch (err) {
            reject(err);
        }
    });
};
const loadAccount = () => {
    const contents = fs.readFileSync(nemConfig.walletPath);
    const wallet = nem_library_1.SimpleWallet.readFromNanoWalletWLF(contents);
    const pass = new nem_library_1.Password(nemConfig.walletPassword);
    return wallet.open(pass);
};
exports.createCertifcationMosaic = (mosaic) => {
    return new Promise((resolve, reject) => {
        const supplyChangeTransaction = nem_library_1.MosaicSupplyChangeTransaction
            .create(nem_library_1.TimeWindow.createWithDeadline(), mosaic, nem_library_1.MosaicSupplyType.Increase, 1);
        const account = loadAccount();
        const signed = account.signTransaction(supplyChangeTransaction);
        transactionHttp.announceTransaction(signed)
            .subscribe(_ => {
            resolve(true);
        }, err => {
            reject(err);
        });
    });
};
exports.transferMosaics = (certTransfer) => {
    return new Promise((resolve, reject) => {
        const transactionHttp = new nem_library_1.TransactionHttp();
        Observable_1.Observable.from([
            mosaicHttp.getMosaicTransferableWithAmount(certTransfer.certMosaicId, 1),
            mosaicHttp.getMosaicTransferableWithAmount(certTransfer.rewardMosaicId, certTransfer.rewardAmount)
        ])
            .flatMap(transfer => transfer)
            .toArray()
            .map(mosaics => nem_library_1.TransferTransaction.createWithMosaics(nem_library_1.TimeWindow.createWithDeadline(), certTransfer.toAddress, mosaics, nem_library_1.EmptyMessage))
            .map(transaction => certTransfer.signer.signTransaction(transaction))
            .flatMap(signed => transactionHttp.announceTransaction(signed))
            .subscribe(result => {
            resolve(result);
        }, error => {
            reject(error);
        });
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsNkNBaUJxQjtBQUNyQixNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekIsd0NBQXdDO0FBQ3hDLGdEQUE2QztBQUM3QyxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFMUMsd0JBQVUsQ0FBQyxTQUFTLENBQUMsMEJBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUM1QyxNQUFNLGVBQWUsR0FBRyxJQUFJLDZCQUFlLEVBQUUsQ0FBQztBQUM5QyxNQUFNLFVBQVUsR0FBRyxJQUFJLHdCQUFVLEVBQUUsQ0FBQztBQUtwQyxNQUFNLE9BQU8sR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO0FBdUJuQixRQUFBLG9CQUFvQixHQUFHLENBQU8sT0FBZSxFQUFFLFFBQWdCLEVBQUUsRUFBRTtJQUMvRSxJQUFJLENBQUM7UUFFSixNQUFNLE9BQU8sR0FBRyxNQUFNLDBCQUFrQixDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM1RCxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUM7WUFBQyxNQUFNLENBQUM7UUFHcEIsTUFBTSxJQUFJLEdBQXVCLFNBQVMsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDcEUsTUFBTSxRQUFRLEdBQUcsSUFBSSxzQkFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRy9ELE1BQU0sV0FBVyxHQUFHLE1BQU0sZ0NBQXdCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDN0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7WUFBQyxNQUFNLENBQUM7UUFHekIsTUFBTSxRQUFRLEdBQTBCO1lBQ3ZDLFNBQVMsRUFBRSxJQUFJLHFCQUFPLENBQUMsT0FBTyxDQUFDO1lB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QUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG5cdEFjY291bnRIdHRwLFxuXHRBZGRyZXNzLFxuXHRNb3NhaWNTdXBwbHlDaGFuZ2VUcmFuc2FjdGlvbixcblx0VGltZVdpbmRvdyxcblx0TW9zYWljSWQsXG5cdEFjY291bnQsXG5cdE5ldHdvcmtUeXBlcyxcblx0TW9zYWljU3VwcGx5VHlwZSxcblx0U2ltcGxlV2FsbGV0LFxuXHRQYXNzd29yZCxcblx0VHJhbnNhY3Rpb25IdHRwLFxuXHRORU1MaWJyYXJ5LFxuXHRUcmFuc2ZlclRyYW5zYWN0aW9uLFxuXHRNb3NhaWNIdHRwLFxuXHRFbXB0eU1lc3NhZ2UsXG5cdE5lbUFubm91bmNlUmVzdWx0XG59IGZyb20gJ25lbS1saWJyYXJ5JztcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcbmltcG9ydCAqIGFzIE5vZGVDYWNoZSBmcm9tICdub2RlLWNhY2hlJztcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzL09ic2VydmFibGUnO1xuY29uc3QgbmVtQ29uZmlnID0gcmVxdWlyZSgnLi9uZW0tY29uZmlnJyk7XG5cbk5FTUxpYnJhcnkuYm9vdHN0cmFwKE5ldHdvcmtUeXBlcy5URVNUX05FVCk7XG5jb25zdCB0cmFuc2FjdGlvbkh0dHAgPSBuZXcgVHJhbnNhY3Rpb25IdHRwKCk7XG5jb25zdCBtb3NhaWNIdHRwID0gbmV3IE1vc2FpY0h0dHAoKTtcbi8qKlxuICogU3RvcmUgcGVuZGluZyB0cmFuc2FjdGlvbnMgdGVtcG9yYXJpbHkgaW4gbWVtb3J5XG4gKiBAdHlwZSB7Tm9kZUNhY2hlfVxuICovXG5jb25zdCBjYWNoZURCID0gbmV3IE5vZGVDYWNoZSgpO1xuXG5leHBvcnQgaW50ZXJmYWNlIENlcnRpZmljYXRpb25Hcm91cCB7XG5cdG5hbWVzcGFjZTogc3RyaW5nO1xuXHRtb3NhaWNOYW1lOiBzdHJpbmc7XG5cdHJld2FyZDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENlcnRpZmljYXRpb25UcmFuc2ZlciB7XG5cdHRvQWRkcmVzczogQWRkcmVzcztcblx0c2lnbmVyOiBBY2NvdW50O1xuXHRyZXdhcmRBbW91bnQ6IG51bWJlcjtcblx0Y2VydE1vc2FpY0lkOiBNb3NhaWNJZDtcblx0cmV3YXJkTW9zYWljSWQ6IE1vc2FpY0lkO1xufVxuXG4vKipcbiAqIDEuIENoZWNrIGlmIHRoZSBhZGRyZXNzIGFscmVhZHkgb3ducyB0aGlzIGNlcnRpZmljYXRpb25cbiAqIDIuIElmIG5vdCwgZ2VuZXJhdGUgMSBuZXcgY2VydGlmaWNhdGlvbiBtb3NhaWNcbiAqIDMuIFRoZW4gdHJhbnNmZXIgY2VydGlmaWNhdGlvbiBtb3NhaWMgYW5kIHJld2FyZCB0byBhZGRyZXNzXG4gKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyBBZGRyZXNzIG9mIHRoZSBpbmNvbWluZyByZXF1ZXN0XG4gKiBAcGFyYW0ge3N0cmluZ30gY2VydE5hbWUgTmFtZSBvZiB0aGUgY2VydGlmaWNhdGlvbiBlYXJuZWRcbiAqL1xuZXhwb3J0IGNvbnN0IHByb2Nlc3NDZXJ0aWZpY2F0aW9uID0gYXN5bmMgKGFkZHJlc3M6IHN0cmluZywgY2VydE5hbWU6IHN0cmluZykgPT4ge1xuXHR0cnkge1xuXHRcdC8vIE9ubHkgcHJvY2VlZCBpZiBjZXJ0IG5vdCBhbHJlYWR5IG93bmVkXG5cdFx0Y29uc3QgaXNPd25lZCA9IGF3YWl0IGNlcnRpZmljYXRpb25Pd25lZChhZGRyZXNzLCBjZXJ0TmFtZSk7XG5cdFx0aWYgKGlzT3duZWQpIHJldHVybjtcblxuXHRcdC8vIEdyYWIgZGF0YSBmcm9tIGNvbmZpZyBqc29uIGZpbGVcblx0XHRjb25zdCBjZXJ0OiBDZXJ0aWZpY2F0aW9uR3JvdXAgPSBuZW1Db25maWcuY2VydGlmaWNhdGlvbnNbY2VydE5hbWVdO1xuXHRcdGNvbnN0IG1vc2FpY0lkID0gbmV3IE1vc2FpY0lkKGNlcnQubmFtZXNwYWNlLCBjZXJ0Lm1vc2FpY05hbWUpO1xuXG5cdFx0Ly8gQ3JlYXRlIDEgbmV3IGNlcnRpZmljYXRpb24gYXNzZXRcblx0XHRjb25zdCBjZXJ0Q3JlYXRlZCA9IGF3YWl0IGNyZWF0ZUNlcnRpZmNhdGlvbk1vc2FpYyhtb3NhaWNJZCk7XG5cdFx0aWYgKCFjZXJ0Q3JlYXRlZCkgcmV0dXJuO1xuXG5cdFx0Ly8gVHJhbnNmZXIgY2VydGlmaWNhdGlvbiBhbmQgcmV3YXJkIHRvIGFkZHJlc3Ncblx0XHRjb25zdCB0cmFuc2ZlcjogQ2VydGlmaWNhdGlvblRyYW5zZmVyID0ge1xuXHRcdFx0dG9BZGRyZXNzOiBuZXcgQWRkcmVzcyhhZGRyZXNzKSxcblx0XHRcdHNpZ25lcjogbG9hZEFjY291bnQoKSxcblx0XHRcdHJld2FyZEFtb3VudDogY2VydC5yZXdhcmQsXG5cdFx0XHRjZXJ0TW9zYWljSWQ6IG1vc2FpY0lkLFxuXHRcdFx0cmV3YXJkTW9zYWljSWQ6IG5ldyBNb3NhaWNJZChuZW1Db25maWcubW9zYWljTmFtZXNwYWNlLCBuZW1Db25maWcubW9zYWljRm9yUmV3YXJkKVxuXHRcdH07XG5cdFx0YXdhaXQgdHJhbnNmZXJNb3NhaWNzKHRyYW5zZmVyKTtcblxuXHR9IGNhdGNoIChlcnIpIHtcblx0XHRjb25zb2xlLmxvZyhlcnIpO1xuXHR9XG59O1xuXG4vKipcbiAqIEZldGNoIG1vc2FpYyBiYWxhbmNlcyBmb3IgZ2l2ZW4gYWRkcmVzc1xuICogSXRlcmF0ZSB0aHJvdWdoIG1vc2FpY3MgdG8gc2VlIGlmIGNlcnRpZmljYXRpb24gaXMgb3duZWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIEFkZHJlc3MgdG8gc2VhcmNoIGJhbGFuY2VzIG9uXG4gKiBAcGFyYW0ge3N0cmluZ30gY2VydE5hbWUgQ2VydGlmaWNhdGlvbiB0byBjaGVjayBleGlzdGVuY2Ugb2ZcbiAqIEByZXR1cm5zIHtQcm9taXNlPGJvb2xlYW4+fVxuICovXG5leHBvcnQgY29uc3QgY2VydGlmaWNhdGlvbk93bmVkID0gKGFkZHJlc3M6IHN0cmluZywgY2VydE5hbWU6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4gPT4ge1xuXHRyZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdGNvbnN0IGFjY291bnRIdHRwID0gbmV3IEFjY291bnRIdHRwKCk7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IGFkZCA9IG5ldyBBZGRyZXNzKGFkZHJlc3MpO1xuXHRcdFx0YWNjb3VudEh0dHAuZ2V0TW9zYWljT3duZWRCeUFkZHJlc3MoYWRkKVxuXHRcdFx0XHQuc3Vic2NyaWJlKG1vc2FpY3MgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IGNlcnQgPSBtb3NhaWNzLmZpbmQoKG1vc2FpYykgPT4ge1xuXHRcdFx0XHRcdFx0cmV0dXJuIG1vc2FpYy5tb3NhaWNJZC5uYW1lID09PSBjZXJ0TmFtZVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdGlmICghY2VydCkgcmVzb2x2ZShmYWxzZSk7XG5cdFx0XHRcdFx0ZWxzZSB7IHJlc29sdmUgKHRydWUpOyB9XG5cdFx0XHRcdH0sIGVyciA9PiB7XG5cdFx0XHRcdFx0cmVqZWN0KGVycik7XG5cdFx0XHRcdH0pO1xuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0cmVqZWN0KGVycik7XG5cdFx0fVxuXHR9KTtcbn07XG5cbi8qKlxuICogTG9hZCB0aGUgQWNjb3VudCB0aHJvdWdoIHRoZSB3YWxsZXQgZmlsZSBhbmQgcGFzc3dvcmRcbiAqIEByZXR1cm5zIHtBY2NvdW50fVxuICovXG5jb25zdCBsb2FkQWNjb3VudCA9ICgpOiBBY2NvdW50ID0+IHtcblx0Y29uc3QgY29udGVudHMgPSBmcy5yZWFkRmlsZVN5bmMobmVtQ29uZmlnLndhbGxldFBhdGgpO1xuXHRjb25zdCB3YWxsZXQgPSBTaW1wbGVXYWxsZXQucmVhZEZyb21OYW5vV2FsbGV0V0xGKGNvbnRlbnRzKTtcblx0Y29uc3QgcGFzcyA9IG5ldyBQYXNzd29yZChuZW1Db25maWcud2FsbGV0UGFzc3dvcmQpO1xuXHRyZXR1cm4gd2FsbGV0Lm9wZW4ocGFzcyk7XG59O1xuXG4vKipcbiAqIENyZWF0ZSAxIG5ldyBjZXJ0aWZpY2F0aW9uIHRvIGJlIGltbWVkaWF0ZWx5IHRyYW5zZmVycmVkXG4gKiBAcGFyYW0ge01vc2FpY0lkfSBtb3NhaWNcbiAqIEByZXR1cm5zIHtQcm9taXNlPGJvb2xlYW4+fVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlQ2VydGlmY2F0aW9uTW9zYWljID0gKG1vc2FpYzogTW9zYWljSWQpID0+IHtcblx0cmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRjb25zdCBzdXBwbHlDaGFuZ2VUcmFuc2FjdGlvbiA9IE1vc2FpY1N1cHBseUNoYW5nZVRyYW5zYWN0aW9uXG5cdFx0XHQuY3JlYXRlKFRpbWVXaW5kb3cuY3JlYXRlV2l0aERlYWRsaW5lKCksIG1vc2FpYywgTW9zYWljU3VwcGx5VHlwZS5JbmNyZWFzZSwgMSk7XG5cdFx0Y29uc3QgYWNjb3VudCA9IGxvYWRBY2NvdW50KCk7XG5cdFx0Y29uc3Qgc2lnbmVkID0gYWNjb3VudC5zaWduVHJhbnNhY3Rpb24oc3VwcGx5Q2hhbmdlVHJhbnNhY3Rpb24pO1xuXHRcdHRyYW5zYWN0aW9uSHR0cC5hbm5vdW5jZVRyYW5zYWN0aW9uKHNpZ25lZClcblx0XHRcdC5zdWJzY3JpYmUoXyA9PiB7XG5cdFx0XHRcdHJlc29sdmUodHJ1ZSk7XG5cdFx0XHR9LCBlcnIgPT4ge1xuXHRcdFx0XHRyZWplY3QoZXJyKTtcblx0XHRcdH0pO1xuXHR9KTtcbn07XG5cbmV4cG9ydCBjb25zdCB0cmFuc2Zlck1vc2FpY3MgPSAoY2VydFRyYW5zZmVyOiBDZXJ0aWZpY2F0aW9uVHJhbnNmZXIpOiBQcm9taXNlPE5lbUFubm91bmNlUmVzdWx0PiA9PiB7XG5cdHJldHVybiBuZXcgUHJvbWlzZTxOZW1Bbm5vdW5jZVJlc3VsdD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdGNvbnN0IHRyYW5zYWN0aW9uSHR0cCA9IG5ldyBUcmFuc2FjdGlvbkh0dHAoKTtcblx0XHRPYnNlcnZhYmxlLmZyb20oW1xuXHRcdFx0bW9zYWljSHR0cC5nZXRNb3NhaWNUcmFuc2ZlcmFibGVXaXRoQW1vdW50KGNlcnRUcmFuc2Zlci5jZXJ0TW9zYWljSWQsIDEpLFxuXHRcdFx0bW9zYWljSHR0cC5nZXRNb3NhaWNUcmFuc2ZlcmFibGVXaXRoQW1vdW50KGNlcnRUcmFuc2Zlci5yZXdhcmRNb3NhaWNJZCwgY2VydFRyYW5zZmVyLnJld2FyZEFtb3VudCldKVxuXHRcdFx0LmZsYXRNYXAodHJhbnNmZXIgPT4gdHJhbnNmZXIpXG5cdFx0XHQudG9BcnJheSgpXG5cdFx0XHQubWFwKG1vc2FpY3MgPT4gVHJhbnNmZXJUcmFuc2FjdGlvbi5jcmVhdGVXaXRoTW9zYWljcyhcblx0XHRcdFx0VGltZVdpbmRvdy5jcmVhdGVXaXRoRGVhZGxpbmUoKSxcblx0XHRcdFx0Y2VydFRyYW5zZmVyLnRvQWRkcmVzcyxcblx0XHRcdFx0bW9zYWljcyxcblx0XHRcdFx0RW1wdHlNZXNzYWdlKSlcblx0XHRcdC5tYXAodHJhbnNhY3Rpb24gPT4gY2VydFRyYW5zZmVyLnNpZ25lci5zaWduVHJhbnNhY3Rpb24odHJhbnNhY3Rpb24pKVxuXHRcdFx0LmZsYXRNYXAoc2lnbmVkID0+IHRyYW5zYWN0aW9uSHR0cC5hbm5vdW5jZVRyYW5zYWN0aW9uKHNpZ25lZCkpXG5cdFx0XHQuc3Vic2NyaWJlKHJlc3VsdCA9PiB7XG5cdFx0XHRcdHJlc29sdmUocmVzdWx0KTtcblx0XHRcdH0sIGVycm9yID0+IHtcblx0XHRcdFx0cmVqZWN0KGVycm9yKTtcblx0XHRcdH0pO1xuXHR9KTtcbn07Il19