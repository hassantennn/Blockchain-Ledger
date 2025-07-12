import json
from ecdsa import SigningKey, SECP256k1, VerifyingKey, BadSignatureError

def generate_keys():
    private_key = SigningKey.generate(curve=SECP256k1)
    public_key = private_key.get_verifying_key()
    return private_key, public_key

def sign_message(private_key, message):
    return private_key.sign(message.encode()).hex()

def verify_signature(public_key_hex, message, signature_hex):
    try:
        public_key = VerifyingKey.from_string(bytes.fromhex(public_key_hex), curve=SECP256k1)
        signature = bytes.fromhex(signature_hex)
        return public_key.verify(signature, message.encode())
    except BadSignatureError:
        return False
    except Exception:
        return False

def create_signed_transaction(sender, receiver, amount, private_key):
    message = json.dumps({
        'sender': sender,
        'receiver': receiver,
        'amount': amount
    }, sort_keys=True)
    signature = sign_message(private_key, message)
    public_key = private_key.get_verifying_key().to_string().hex()
    return {
        'sender': sender,
        'receiver': receiver,
        'amount': amount,
        'signature': signature,
        'sender_public_key': public_key
    }
