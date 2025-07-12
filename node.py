from flask import Flask, request, jsonify
from blockchain import Blockchain

app = Flask(__name__)
blockchain = Blockchain()

@app.route('/transactions/new', methods=['POST'])
def new_transaction():
    tx_data = request.get_json()
    required_fields = ['sender', 'receiver', 'amount', 'signature', 'sender_public_key']

    if not all(field in tx_data for field in required_fields):
        return "Missing fields", 400

    if not blockchain.add_new_transaction(tx_data):
        return "Invalid signature", 400

    return "Transaction added", 201

@app.route('/mine', methods=['GET'])
def mine():
    result = blockchain.mine()
    if not result:
        return "No transactions to mine", 400
    return f"Block #{result} is mined.", 200

@app.route('/chain', methods=['GET'])
def get_chain():
    chain_data = [block.__dict__ for block in blockchain.chain]
    return jsonify(length=len(chain_data), chain=chain_data)

@app.route('/valid', methods=['GET'])
def validate():
    valid = blockchain.is_chain_valid()
    return jsonify(valid=valid)

if __name__ == '__main__':
    app.run(debug=True)
