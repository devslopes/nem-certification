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
const Observable_1 = require("rxjs/Observable");
const nemConfig = require('./nem-config.json');
nem_library_1.NEMLibrary.bootstrap(nem_library_1.NetworkTypes.TEST_NET);
const transactionHttp = new nem_library_1.TransactionHttp();
const mosaicHttp = new nem_library_1.MosaicHttp();
exports.processCertification = (address, certName) => __awaiter(this, void 0, void 0, function* () {
    try {
        const cert = nemConfig.certifications[certName];
        if (!cert)
            throw Error('Invalid certification name');
        const mosaicId = new nem_library_1.MosaicId(cert.namespace, cert.mosaicName);
        const isOwned = yield exports.certificationOwned(address, cert.mosaicName);
        if (isOwned)
            throw Error('This certification is already owned by address');
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
            mosaicHttp.getMosaicTransferableWithAmount(certTransfer.rewardMosaicId, certTransfer.rewardAmount / 1e6)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsNkNBaUJxQjtBQUNyQixNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekIsZ0RBQTZDO0FBQzdDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBRS9DLHdCQUFVLENBQUMsU0FBUyxDQUFDLDBCQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDNUMsTUFBTSxlQUFlLEdBQUcsSUFBSSw2QkFBZSxFQUFFLENBQUM7QUFDOUMsTUFBTSxVQUFVLEdBQUcsSUFBSSx3QkFBVSxFQUFFLENBQUM7QUF1QnZCLFFBQUEsb0JBQW9CLEdBQUcsQ0FBTyxPQUFlLEVBQUUsUUFBZ0IsRUFBRSxFQUFFO0lBQy9FLElBQUksQ0FBQztRQUVKLE1BQU0sSUFBSSxHQUF1QixTQUFTLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQUMsTUFBTSxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQztRQUNyRCxNQUFNLFFBQVEsR0FBRyxJQUFJLHNCQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFHL0QsTUFBTSxPQUFPLEdBQUcsTUFBTSwwQkFBa0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ25FLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQztZQUFDLE1BQU0sS0FBSyxDQUFDLGdEQUFnRCxDQUFDLENBQUM7UUFHM0UsTUFBTSxXQUFXLEdBQUcsTUFBTSxnQ0FBd0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM3RCxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztZQUFDLE1BQU0sQ0FBQztRQUd6QixNQUFNLFFB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QyxFQUFFLEtBQUssQ0FBQyxFQUFFO1lBQ1YsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2YsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG5cdEFjY291bnRIdHRwLFxuXHRBZGRyZXNzLFxuXHRNb3NhaWNTdXBwbHlDaGFuZ2VUcmFuc2FjdGlvbixcblx0VGltZVdpbmRvdyxcblx0TW9zYWljSWQsXG5cdEFjY291bnQsXG5cdE5ldHdvcmtUeXBlcyxcblx0TW9zYWljU3VwcGx5VHlwZSxcblx0U2ltcGxlV2FsbGV0LFxuXHRQYXNzd29yZCxcblx0VHJhbnNhY3Rpb25IdHRwLFxuXHRORU1MaWJyYXJ5LFxuXHRUcmFuc2ZlclRyYW5zYWN0aW9uLFxuXHRNb3NhaWNIdHRwLFxuXHRFbXB0eU1lc3NhZ2UsXG5cdE5lbUFubm91bmNlUmVzdWx0XG59IGZyb20gJ25lbS1saWJyYXJ5JztcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzL09ic2VydmFibGUnO1xuY29uc3QgbmVtQ29uZmlnID0gcmVxdWlyZSgnLi9uZW0tY29uZmlnLmpzb24nKTtcblxuTkVNTGlicmFyeS5ib290c3RyYXAoTmV0d29ya1R5cGVzLlRFU1RfTkVUKTtcbmNvbnN0IHRyYW5zYWN0aW9uSHR0cCA9IG5ldyBUcmFuc2FjdGlvbkh0dHAoKTtcbmNvbnN0IG1vc2FpY0h0dHAgPSBuZXcgTW9zYWljSHR0cCgpO1xuXG5leHBvcnQgaW50ZXJmYWNlIENlcnRpZmljYXRpb25Hcm91cCB7XG5cdG5hbWVzcGFjZTogc3RyaW5nO1xuXHRtb3NhaWNOYW1lOiBzdHJpbmc7XG5cdHJld2FyZDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENlcnRpZmljYXRpb25UcmFuc2ZlciB7XG5cdHRvQWRkcmVzczogQWRkcmVzcztcblx0c2lnbmVyOiBBY2NvdW50O1xuXHRyZXdhcmRBbW91bnQ6IG51bWJlcjtcblx0Y2VydE1vc2FpY0lkOiBNb3NhaWNJZDtcblx0cmV3YXJkTW9zYWljSWQ6IE1vc2FpY0lkO1xufVxuXG4vKipcbiAqIDEuIENoZWNrIGlmIHRoZSBhZGRyZXNzIGFscmVhZHkgb3ducyB0aGlzIGNlcnRpZmljYXRpb25cbiAqIDIuIElmIG5vdCwgZ2VuZXJhdGUgMSBuZXcgY2VydGlmaWNhdGlvbiBtb3NhaWNcbiAqIDMuIFRoZW4gdHJhbnNmZXIgY2VydGlmaWNhdGlvbiBtb3NhaWMgYW5kIHJld2FyZCB0byBhZGRyZXNzXG4gKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyBBZGRyZXNzIG9mIHRoZSBpbmNvbWluZyByZXF1ZXN0XG4gKiBAcGFyYW0ge3N0cmluZ30gY2VydE5hbWUgTmFtZSBvZiB0aGUgY2VydGlmaWNhdGlvbiBlYXJuZWRcbiAqL1xuZXhwb3J0IGNvbnN0IHByb2Nlc3NDZXJ0aWZpY2F0aW9uID0gYXN5bmMgKGFkZHJlc3M6IHN0cmluZywgY2VydE5hbWU6IHN0cmluZykgPT4ge1xuXHR0cnkge1xuXHRcdC8vIEdyYWIgZGF0YSBmcm9tIGNvbmZpZyBqc29uIGZpbGVcblx0XHRjb25zdCBjZXJ0OiBDZXJ0aWZpY2F0aW9uR3JvdXAgPSBuZW1Db25maWcuY2VydGlmaWNhdGlvbnNbY2VydE5hbWVdO1xuXHRcdGlmICghY2VydCkgdGhyb3cgRXJyb3IoJ0ludmFsaWQgY2VydGlmaWNhdGlvbiBuYW1lJyk7XG5cdFx0Y29uc3QgbW9zYWljSWQgPSBuZXcgTW9zYWljSWQoY2VydC5uYW1lc3BhY2UsIGNlcnQubW9zYWljTmFtZSk7XG5cblx0XHQvLyBPbmx5IHByb2NlZWQgaWYgY2VydCBub3QgYWxyZWFkeSBvd25lZFxuXHRcdGNvbnN0IGlzT3duZWQgPSBhd2FpdCBjZXJ0aWZpY2F0aW9uT3duZWQoYWRkcmVzcywgY2VydC5tb3NhaWNOYW1lKTtcblx0XHRpZiAoaXNPd25lZCkgdGhyb3cgRXJyb3IoJ1RoaXMgY2VydGlmaWNhdGlvbiBpcyBhbHJlYWR5IG93bmVkIGJ5IGFkZHJlc3MnKTtcblxuXHRcdC8vIENyZWF0ZSAxIG5ldyBjZXJ0aWZpY2F0aW9uIGFzc2V0XG5cdFx0Y29uc3QgY2VydENyZWF0ZWQgPSBhd2FpdCBjcmVhdGVDZXJ0aWZjYXRpb25Nb3NhaWMobW9zYWljSWQpO1xuXHRcdGlmICghY2VydENyZWF0ZWQpIHJldHVybjtcblxuXHRcdC8vIFRyYW5zZmVyIGNlcnRpZmljYXRpb24gYW5kIHJld2FyZCB0byBhZGRyZXNzXG5cdFx0Y29uc3QgdHJhbnNmZXI6IENlcnRpZmljYXRpb25UcmFuc2ZlciA9IHtcblx0XHRcdHRvQWRkcmVzczogbmV3IEFkZHJlc3MoYWRkcmVzcyksXG5cdFx0XHRzaWduZXI6IGxvYWRBY2NvdW50KCksXG5cdFx0XHRyZXdhcmRBbW91bnQ6IGNlcnQucmV3YXJkLFxuXHRcdFx0Y2VydE1vc2FpY0lkOiBtb3NhaWNJZCxcblx0XHRcdHJld2FyZE1vc2FpY0lkOiBuZXcgTW9zYWljSWQobmVtQ29uZmlnLm1vc2FpY05hbWVzcGFjZSwgbmVtQ29uZmlnLm1vc2FpY0ZvclJld2FyZClcblx0XHR9O1xuXHRcdGF3YWl0IHRyYW5zZmVyTW9zYWljcyh0cmFuc2Zlcik7XG5cblx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0Y29uc29sZS5sb2coZXJyKTtcblx0fVxufTtcblxuLyoqXG4gKiBGZXRjaCBtb3NhaWMgYmFsYW5jZXMgZm9yIGdpdmVuIGFkZHJlc3NcbiAqIEl0ZXJhdGUgdGhyb3VnaCBtb3NhaWNzIHRvIHNlZSBpZiBjZXJ0aWZpY2F0aW9uIGlzIG93bmVkXG4gKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyBBZGRyZXNzIHRvIHNlYXJjaCBiYWxhbmNlcyBvblxuICogQHBhcmFtIHtzdHJpbmd9IGNlcnROYW1lIENlcnRpZmljYXRpb24gdG8gY2hlY2sgZXhpc3RlbmNlIG9mXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxib29sZWFuPn1cbiAqL1xuZXhwb3J0IGNvbnN0IGNlcnRpZmljYXRpb25Pd25lZCA9IChhZGRyZXNzOiBzdHJpbmcsIGNlcnROYW1lOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+ID0+IHtcblx0cmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRjb25zdCBhY2NvdW50SHR0cCA9IG5ldyBBY2NvdW50SHR0cCgpO1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBhZGQgPSBuZXcgQWRkcmVzcyhhZGRyZXNzKTtcblx0XHRcdGFjY291bnRIdHRwLmdldE1vc2FpY093bmVkQnlBZGRyZXNzKGFkZClcblx0XHRcdFx0LnN1YnNjcmliZShtb3NhaWNzID0+IHtcblx0XHRcdFx0XHRjb25zdCBjZXJ0ID0gbW9zYWljcy5maW5kKChtb3NhaWMpID0+IHtcblx0XHRcdFx0XHRcdHJldHVybiBtb3NhaWMubW9zYWljSWQubmFtZSA9PT0gY2VydE5hbWVcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRpZiAoIWNlcnQpIHJlc29sdmUoZmFsc2UpO1xuXHRcdFx0XHRcdGVsc2UgeyByZXNvbHZlICh0cnVlKTsgfVxuXHRcdFx0XHR9LCBlcnIgPT4ge1xuXHRcdFx0XHRcdHJlamVjdChlcnIpO1xuXHRcdFx0XHR9KTtcblx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdHJlamVjdChlcnIpO1xuXHRcdH1cblx0fSk7XG59O1xuXG4vKipcbiAqIExvYWQgdGhlIEFjY291bnQgdGhyb3VnaCB0aGUgd2FsbGV0IGZpbGUgYW5kIHBhc3N3b3JkXG4gKiBAcmV0dXJucyB7QWNjb3VudH1cbiAqL1xuY29uc3QgbG9hZEFjY291bnQgPSAoKTogQWNjb3VudCA9PiB7XG5cdGNvbnN0IGNvbnRlbnRzID0gZnMucmVhZEZpbGVTeW5jKG5lbUNvbmZpZy53YWxsZXRQYXRoKTtcblx0Y29uc3Qgd2FsbGV0ID0gU2ltcGxlV2FsbGV0LnJlYWRGcm9tTmFub1dhbGxldFdMRihjb250ZW50cyk7XG5cdGNvbnN0IHBhc3MgPSBuZXcgUGFzc3dvcmQobmVtQ29uZmlnLndhbGxldFBhc3N3b3JkKTtcblx0cmV0dXJuIHdhbGxldC5vcGVuKHBhc3MpO1xufTtcblxuLyoqXG4gKiBDcmVhdGUgMSBuZXcgY2VydGlmaWNhdGlvbiB0byBiZSBpbW1lZGlhdGVseSB0cmFuc2ZlcnJlZFxuICogQHBhcmFtIHtNb3NhaWNJZH0gbW9zYWljXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxib29sZWFuPn1cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZUNlcnRpZmNhdGlvbk1vc2FpYyA9IChtb3NhaWM6IE1vc2FpY0lkKSA9PiB7XG5cdHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0Y29uc3Qgc3VwcGx5Q2hhbmdlVHJhbnNhY3Rpb24gPSBNb3NhaWNTdXBwbHlDaGFuZ2VUcmFuc2FjdGlvblxuXHRcdFx0LmNyZWF0ZShUaW1lV2luZG93LmNyZWF0ZVdpdGhEZWFkbGluZSgpLCBtb3NhaWMsIE1vc2FpY1N1cHBseVR5cGUuSW5jcmVhc2UsIDEpO1xuXHRcdGNvbnN0IGFjY291bnQgPSBsb2FkQWNjb3VudCgpO1xuXHRcdGNvbnN0IHNpZ25lZCA9IGFjY291bnQuc2lnblRyYW5zYWN0aW9uKHN1cHBseUNoYW5nZVRyYW5zYWN0aW9uKTtcblx0XHR0cmFuc2FjdGlvbkh0dHAuYW5ub3VuY2VUcmFuc2FjdGlvbihzaWduZWQpXG5cdFx0XHQuc3Vic2NyaWJlKF8gPT4ge1xuXHRcdFx0XHRyZXNvbHZlKHRydWUpO1xuXHRcdFx0fSwgZXJyID0+IHtcblx0XHRcdFx0cmVqZWN0KGVycik7XG5cdFx0XHR9KTtcblx0fSk7XG59O1xuXG5leHBvcnQgY29uc3QgdHJhbnNmZXJNb3NhaWNzID0gKGNlcnRUcmFuc2ZlcjogQ2VydGlmaWNhdGlvblRyYW5zZmVyKTogUHJvbWlzZTxOZW1Bbm5vdW5jZVJlc3VsdD4gPT4ge1xuXHRyZXR1cm4gbmV3IFByb21pc2U8TmVtQW5ub3VuY2VSZXN1bHQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRjb25zdCB0cmFuc2FjdGlvbkh0dHAgPSBuZXcgVHJhbnNhY3Rpb25IdHRwKCk7XG5cdFx0T2JzZXJ2YWJsZS5mcm9tKFtcblx0XHRcdG1vc2FpY0h0dHAuZ2V0TW9zYWljVHJhbnNmZXJhYmxlV2l0aEFtb3VudChjZXJ0VHJhbnNmZXIuY2VydE1vc2FpY0lkLCAxKSxcblx0XHRcdG1vc2FpY0h0dHAuZ2V0TW9zYWljVHJhbnNmZXJhYmxlV2l0aEFtb3VudChjZXJ0VHJhbnNmZXIucmV3YXJkTW9zYWljSWQsIGNlcnRUcmFuc2Zlci5yZXdhcmRBbW91bnQgLyAxZTYpXSlcblx0XHRcdC5mbGF0TWFwKHRyYW5zZmVyID0+IHRyYW5zZmVyKVxuXHRcdFx0LnRvQXJyYXkoKVxuXHRcdFx0Lm1hcChtb3NhaWNzID0+IFRyYW5zZmVyVHJhbnNhY3Rpb24uY3JlYXRlV2l0aE1vc2FpY3MoXG5cdFx0XHRcdFRpbWVXaW5kb3cuY3JlYXRlV2l0aERlYWRsaW5lKCksXG5cdFx0XHRcdGNlcnRUcmFuc2Zlci50b0FkZHJlc3MsXG5cdFx0XHRcdG1vc2FpY3MsXG5cdFx0XHRcdEVtcHR5TWVzc2FnZSkpXG5cdFx0XHQubWFwKHRyYW5zYWN0aW9uID0+IGNlcnRUcmFuc2Zlci5zaWduZXIuc2lnblRyYW5zYWN0aW9uKHRyYW5zYWN0aW9uKSlcblx0XHRcdC5mbGF0TWFwKHNpZ25lZCA9PiB0cmFuc2FjdGlvbkh0dHAuYW5ub3VuY2VUcmFuc2FjdGlvbihzaWduZWQpKVxuXHRcdFx0LnN1YnNjcmliZShyZXN1bHQgPT4ge1xuXHRcdFx0XHRyZXNvbHZlKHJlc3VsdCk7XG5cdFx0XHR9LCBlcnJvciA9PiB7XG5cdFx0XHRcdHJlamVjdChlcnJvcik7XG5cdFx0XHR9KTtcblx0fSk7XG59O1xuIl19