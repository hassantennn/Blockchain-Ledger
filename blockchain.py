from flask import Flask, request, jsonify
from urllib.parse import urlparse
import time
import json
from hashlib import sha256
from flask_cors import CORS
from wallet import verify_signature
from transaction import Transaction
import requests 

app = Flask(__name__)
CORS(app)

class Block:
    def __init__(self, index, transactions, timestamp, previous_hash, nonce=0):
        self.index = index
        self.transactions = transactions
        self.timestamp = timestamp
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.hash = self.compute_hash()

    def compute_hash(self):
        block_string = json.dumps(self.__dict__, sort_keys=True)
        return sha256(block_string.encode()).hexdigest()

class Blockchain:
    difficulty = 2

    def __init__(self):
        self.unconfirmed_transactions = []
        self.chain = []
        self.balances = {}
        self.nodes = set()
        self.create_genesis_block()

    def create_genesis_block(self):
        genesis_block = Block(0, [], time.time(), "0")
        self.chain.append(genesis_block)
        self.balances = {
            'Alice': 1000,
            'Bob': 500,
        }

    @property
    def last_block(self):
        return self.chain[-1]

    def proof_of_work(self, block):
        block.nonce = 0
        computed_hash = block.compute_hash()
        while not computed_hash.startswith('0' * Blockchain.difficulty):
            block.nonce += 1
            computed_hash = block.compute_hash()
        return computed_hash

    def add_block(self, block, proof):
        if proof != block.compute_hash():
            return False
        if not proof.startswith('0' * Blockchain.difficulty):
            return False
        self.chain.append(block)
        self.update_balances(block.transactions)
        return True

    def update_balances(self, transactions):
        for tx in transactions:
            sender = tx['sender']
            receiver = tx['receiver']
            amount = tx['amount']
            self.balances[sender] = self.balances.get(sender, 0) - amount
            self.balances[receiver] = self.balances.get(receiver, 0) + amount

    def add_new_transaction(self, tx_data):
        transaction = Transaction(**tx_data)
        message = json.dumps(transaction.payload(), sort_keys=True)
       # if not verify_signature(transaction.sender_public_key, message, transaction.signature):
       #     print("Invalid transaction signature")
       #     return False

        pending_amount = sum(
            tx['amount'] for tx in self.unconfirmed_transactions if tx['sender'] == transaction.sender
        )
        sender_balance = self.balances.get(transaction.sender, 0)
        if sender_balance - pending_amount < transaction.amount:
            print("Insufficient balance for transaction")
            return False

        self.unconfirmed_transactions.append(tx_data)
        return True

    def mine(self):
        if not self.unconfirmed_transactions:
            return False
        last_block = self.last_block
        new_block = Block(index=last_block.index + 1,
                          transactions=self.unconfirmed_transactions,
                          timestamp=time.time(),
                          previous_hash=last_block.hash)
        proof = self.proof_of_work(new_block)
        added = self.add_block(new_block, proof)
        if not added:
            return False
        self.unconfirmed_transactions = []
        return new_block.index

    def is_chain_valid(self, chain=None):
        if chain is None:
            chain = self.chain
        for i in range(1, len(chain)):
            curr = chain[i]
            prev = chain[i - 1]
            # If chain is a list of dicts (from other nodes), convert to Block-like dicts
            curr_hash = curr.hash if isinstance(curr, Block) else curr['hash']
            curr_prev_hash = curr.previous_hash if isinstance(curr, Block) else curr['previous_hash']
            curr_computed_hash = None

            if isinstance(curr, Block):
                curr_computed_hash = curr.compute_hash()
            else:
                # Compute hash from dict
                block_string = json.dumps({
                    'index': curr['index'],
                    'transactions': curr['transactions'],
                    'timestamp': curr['timestamp'],
                    'previous_hash': curr['previous_hash'],
                    'nonce': curr['nonce']
                }, sort_keys=True)
                curr_computed_hash = sha256(block_string.encode()).hexdigest()

            if curr_hash != curr_computed_hash:
                return False
            if curr_prev_hash != (prev.hash if isinstance(prev, Block) else prev['hash']):
                return False
            if not curr_hash.startswith('0' * Blockchain.difficulty):
                return False
        return True

    def register_node(self, address):
        parsed_url = urlparse(address)
        self.nodes.add(parsed_url.netloc)

    def resolve_conflicts(self):
        neighbours = self.nodes
        new_chain = None
        max_length = len(self.chain)

        for node in neighbours:
            try:
                response = requests.get(f'http://{node}/chain')
                if response.status_code == 200:
                    length = response.json()['length']
                    chain = response.json()['chain']

                    if length > max_length and self.is_chain_valid(chain):
                        max_length = length
                        new_chain = chain
            except requests.exceptions.RequestException:
                continue

        if new_chain:
            # Convert list of dicts to Block instances
            self.chain = []
            for block_data in new_chain:
                block = Block(
                    block_data['index'],
                    block_data['transactions'],
                    block_data['timestamp'],
                    block_data['previous_hash'],
                    block_data['nonce']
                )
                block.hash = block_data['hash']
                self.chain.append(block)
            return True
        return False

blockchain = Blockchain()

@app.route('/transactions/new', methods=['POST'])
def new_transaction():
    tx_data = request.get_json()
    success = blockchain.add_new_transaction(tx_data)
    if success:
        return "Transaction added", 201
    else:
        return "Invalid transaction or insufficient balance", 400

@app.route('/mine', methods=['GET'])
def mine():
    result = blockchain.mine()
    if result is False:
        return "No transactions to mine", 400
    return f"Block #{result} is mined.", 200

@app.route('/chain', methods=['GET'])
def full_chain():
    chain_data = []
    for block in blockchain.chain:
        chain_data.append(block.__dict__)
    return jsonify({"length": len(chain_data), "chain": chain_data})

@app.route('/balance/<wallet>', methods=['GET'])
def get_balance(wallet):
    balance = blockchain.balances.get(wallet, 0)
    return jsonify({'wallet': wallet, 'balance': balance})

@app.route('/nodes/register', methods=['POST'])
def register_nodes():
    values = request.get_json()
    nodes = values.get('nodes')
    if nodes is None:
        return "Error: Please supply a list of node URLs", 400
    for node in nodes:
        blockchain.register_node(node)
    return jsonify({'message': 'New nodes have been added', 'total_nodes': list(blockchain.nodes)}), 201

@app.route('/nodes/resolve', methods=['GET'])
def consensus():
    replaced = blockchain.resolve_conflicts()
    if replaced:
        return jsonify({'message': 'Chain was replaced'}), 200
    else:
        return jsonify({'message': 'Chain is authoritative'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
