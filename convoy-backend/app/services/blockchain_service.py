import asyncio
import hashlib
import json
from web3 import Web3
from app.config import settings
from app.models import RouteAnalysis

CONVOY_LOG_ABI = [
    {
        "inputs": [
            {"internalType": "string", "name": "_convoyId", "type": "string"},
            {"internalType": "string", "name": "_ipfsCid", "type": "string"},
            {"internalType": "string", "name": "_routeHash", "type": "string"}
        ],
        "name": "logRoute",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

w3 = None
contract_instance = None

def init_web3():
    global w3, contract_instance
    try:
        if settings.ETHEREUM_RPC_URL and settings.CONTRACT_ADDRESS:
            w3 = Web3(Web3.HTTPProvider(settings.ETHEREUM_RPC_URL))
            if w3.is_connected():
                contract_instance = w3.eth.contract(address=settings.CONTRACT_ADDRESS, abi=CONVOY_LOG_ABI)
                print("SUCCESS: Web3 connected and contract initialized.")
            else:
                print("ERROR: Web3 failed to connect to RPC URL.")
        else:
            print("WARNING: Blockchain skipped (Missing RPC URL or Contract Address).")
    except Exception as e:
        print(f"CRITICAL: Error initializing Web3: {e}")

# Initialize immediately for now (or call from main startup)
init_web3()

def calculate_route_hash(analysis: RouteAnalysis) -> str:
    analysis_json = json.dumps(
        analysis.model_dump(exclude_none=True),
        sort_keys=True,
        indent=None,
        separators=(',', ':')
    )
    return hashlib.sha256(analysis_json.encode('utf-8')).hexdigest()

async def log_cid_on_chain(convoy_id: str, ipfs_cid: str, route_hash: str) -> str:
    if not w3 or not contract_instance or not settings.PRIVATE_KEY:
        print("Blockchain Log Failed: Web3/Contract/Key not ready.")
        raise ValueError("Web3 connection/contract/private key is missing.")

    def sync_send_transaction():
        account = w3.eth.account.from_key(settings.PRIVATE_KEY)
        sender_address = account.address

        transaction = contract_instance.functions.logRoute(
            convoy_id,
            ipfs_cid,
            route_hash
        ).build_transaction({
            'from': sender_address,
            'nonce': w3.eth.get_transaction_count(sender_address),
            'gas': 2000000,
            'gasPrice': w3.to_wei('50', 'gwei')
        })

        signed_txn = w3.eth.account.sign_transaction(transaction, private_key=settings.PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

        if tx_receipt.status != 1:
            raise Exception("Blockchain transaction failed to confirm.")

        return tx_hash.hex()

    return await asyncio.to_thread(sync_send_transaction)
