import json
import requests
from wallet import generate_keys, create_signed_transaction

# Step 1: Generate key pair
private_key, public_key = generate_keys()

# Step 2: Create a signed transaction
sender = 'Alice'
receiver = 'Bob'
amount = 100
signed_tx = create_signed_transaction(sender, receiver, amount, private_key)

# Print to verify
print("Signed Transaction:", json.dumps(signed_tx, indent=2))

# Step 3: Send it to the blockchain node
response = requests.post("http://127.0.0.1:5000/transactions/new", json=signed_tx)

print("Response:", response.status_code)
print("Message:", response.text)
