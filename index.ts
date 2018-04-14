import {
	AccountHttp,
	Address,
	MosaicSupplyChangeTransaction,
	TimeWindow,
	MosaicId,
	Account,
	NetworkTypes,
	MosaicSupplyType,
	SimpleWallet,
	Password,
	TransactionHttp,
	NEMLibrary,
	TransferTransaction,
	MosaicHttp,
	EmptyMessage,
	NemAnnounceResult
} from 'nem-library';
const fs = require('fs');
import * as NodeCache from 'node-cache';
import { Observable } from 'rxjs/Observable';
const nemConfig = require('./nem-config');

NEMLibrary.bootstrap(NetworkTypes.TEST_NET);
const transactionHttp = new TransactionHttp();
const mosaicHttp = new MosaicHttp();
/**
 * Store pending transactions temporarily in memory
 * @type {NodeCache}
 */
const cacheDB = new NodeCache();

export interface CertificationGroup {
	namespace: string;
	mosaicName: string;
	reward: number;
}

export interface CertificationTransfer {
	toAddress: Address;
	signer: Account;
	rewardAmount: number;
	certMosaicId: MosaicId;
	rewardMosaicId: MosaicId;
}

/**
 * 1. Check if the address already owns this certification
 * 2. If not, generate 1 new certification mosaic
 * 3. Then transfer certification mosaic and reward to address
 * @param {string} address Address of the incoming request
 * @param {string} certName Name of the certification earned
 */
export const processCertification = async (address: string, certName: string) => {
	try {
		// Only proceed if cert not already owned
		const isOwned = await certificationOwned(address, certName);
		if (isOwned) return;

		// Grab data from config json file
		const cert: CertificationGroup = nemConfig.certifications[certName];
		const mosaicId = new MosaicId(cert.namespace, cert.mosaicName);

		// Create 1 new certification asset
		const certCreated = await createCertifcationMosaic(mosaicId);
		if (!certCreated) return;

		// Transfer certification and reward to address
		const transfer: CertificationTransfer = {
			toAddress: new Address(address),
			signer: loadAccount(),
			rewardAmount: cert.reward,
			certMosaicId: mosaicId,
			rewardMosaicId: new MosaicId(nemConfig.mosaicNamespace, nemConfig.mosaicForReward)
		};
		await transferMosaics(transfer);

	} catch (err) {
		console.log(err);
	}
};

/**
 * Fetch mosaic balances for given address
 * Iterate through mosaics to see if certification is owned
 * @param {string} address Address to search balances on
 * @param {string} certName Certification to check existence of
 * @returns {Promise<boolean>}
 */
export const certificationOwned = (address: string, certName: string): Promise<boolean> => {
	return new Promise<boolean>((resolve, reject) => {
		const accountHttp = new AccountHttp();
		try {
			const add = new Address(address);
			accountHttp.getMosaicOwnedByAddress(add)
				.subscribe(mosaics => {
					const cert = mosaics.find((mosaic) => {
						return mosaic.mosaicId.name === certName
					});
					if (!cert) resolve(false);
					else { resolve (true); }
				}, err => {
					reject(err);
				});
		} catch (err) {
			reject(err);
		}
	});
};

/**
 * Load the Account through the wallet file and password
 * @returns {Account}
 */
const loadAccount = (): Account => {
	const contents = fs.readFileSync(nemConfig.walletPath);
	const wallet = SimpleWallet.readFromNanoWalletWLF(contents);
	const pass = new Password(nemConfig.walletPassword);
	return wallet.open(pass);
};

/**
 * Create 1 new certification to be immediately transferred
 * @param {MosaicId} mosaic
 * @returns {Promise<boolean>}
 */
export const createCertifcationMosaic = (mosaic: MosaicId) => {
	return new Promise<boolean>((resolve, reject) => {
		const supplyChangeTransaction = MosaicSupplyChangeTransaction
			.create(TimeWindow.createWithDeadline(), mosaic, MosaicSupplyType.Increase, 1);
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

export const transferMosaics = (certTransfer: CertificationTransfer): Promise<NemAnnounceResult> => {
	return new Promise<NemAnnounceResult>((resolve, reject) => {
		const transactionHttp = new TransactionHttp();
		Observable.from([
			mosaicHttp.getMosaicTransferableWithAmount(certTransfer.certMosaicId, 1),
			mosaicHttp.getMosaicTransferableWithAmount(certTransfer.rewardMosaicId, certTransfer.rewardAmount)])
			.flatMap(transfer => transfer)
			.toArray()
			.map(mosaics => TransferTransaction.createWithMosaics(
				TimeWindow.createWithDeadline(),
				certTransfer.toAddress,
				mosaics,
				EmptyMessage))
			.map(transaction => certTransfer.signer.signTransaction(transaction))
			.flatMap(signed => transactionHttp.announceTransaction(signed))
			.subscribe(result => {
				resolve(result);
			}, error => {
				reject(error);
			});
	});
};