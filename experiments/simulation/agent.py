class Agent:
    def __init__(self, identifier, agent_type):
        self.id = identifier
        self.utility = 0
        self.agent_type = agent_type
        self.agreements = []
        self.factor = 0

    def register_agreement(self, payment, cost, deposit, interest, valuation):
        self.agreements.append({
            'payment': payment,
            'cost': cost,
            'deposit': deposit,
            'interest': interest,
            'valuation': valuation
        })

    def set_factor(self, factor):
        self.factor = factor

    def perform_action(self, agreement_id):
        action = ''

        if self.agent_type == 'desired':
            action = 'desired'
            utility = self.utility_performing(agreement_id, 'desired')
        if self.agent_type == 'undesired':
            action = 'undesired'
            utility = self.utility_performing(agreement_id, 'undesired')
        if self.agent_type == 'rational':
            utility_no_action = self.utility_performing(
                agreement_id, 'no_action')
            utility_desired = self.utility_performing(
                agreement_id, 'desired')
            utility_undesired = self.utility_performing(
                agreement_id, 'undesired')

            if (utility_no_action > utility_desired) and (utility_no_action > utility_undesired):
                action = 'no_action'
                utility = utility_no_action
            elif utility_desired > utility_undesired:
                action = 'desired'
                utility = utility_desired
            else:
                action = 'undesired'
                utility = utility_undesired

        return action, utility

    def utility_performing(self, agreement_id, action):
        payment = self.agreements[agreement_id]['payment']
        cost = self.agreements[agreement_id]['cost']
        deposit = self.agreements[agreement_id]['deposit']
        interest = self.agreements[agreement_id]['interest']
        valuation = self.agreements[agreement_id]['valuation']
        factor = self.factor

        if action == 'desired':
            utility = payment - cost - (interest * deposit * factor)
        if action == 'undesired':
            utility = valuation - (deposit * factor) - \
                cost - (interest * deposit * factor)
        if action == 'no_action':
            utility = 0 - (interest * deposit * factor)
        return utility

    def utility_receiving(self, agreement_id, action):
        payment = self.agreements[agreement_id]['payment']
        cost = self.agreements[agreement_id]['cost']
        deposit = self.agreements[agreement_id]['deposit']
        interest = self.agreements[agreement_id]['interest']
        valuation = self.agreements[agreement_id]['valuation']
        factor = self.factor

        if action == 'desired':
            utility = valuation - payment - cost
        if action == 'undesired':
            utility = deposit * factor - valuation - cost
        if action == 'no_action':
            utility = 0 - cost
        return utility

    def update_utility(self, utility):
        self.utility += utility
