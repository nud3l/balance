class Agreement:
    def __init__(self, agreement):
        self.payment = agreement['payment']
        self.cost_perform = agreement['cost_perform']
        self.cost_receive = agreement['cost_receive']
        self.deposit = agreement['deposit']
        self.interest = agreement['interest']
        self.valuation_perform = agreement['valuation_perform']
        self.valuation_receive = agreement['valuation_receive']
