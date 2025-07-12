class Transaction:
    def __init__(self, sender, receiver, amount, signature=None, sender_public_key=None):
        self.sender = sender
        self.receiver = receiver
        self.amount = amount
        self.signature = signature
        self.sender_public_key = sender_public_key

    def to_dict(self, include_signature=True):
        data = {
            'sender': self.sender,
            'receiver': self.receiver,
            'amount': self.amount,
        }
        if include_signature:
            data['signature'] = self.signature
            data['sender_public_key'] = self.sender_public_key
        return data

    def payload(self):
        # used for signing/verification (signature not included)
        return {
            'sender': self.sender,
            'receiver': self.receiver,
            'amount': self.amount
        }
