class Registry:
    def __init__(self, layers, num_agents, actions):
        self.layers = layers
        self.actions = actions
        self.scores = [0] * num_agents
        self.agent_layer = [0] * num_agents  # not in registry

    def register(self, agent_id):
        self.agent_layer[agent_id] = 1

    def get_factor(self, agent_id):
        layer = self.agent_layer[agent_id]
        factor = self.layers[layer]['factor']

        return factor

    def update(self, agent_id, action_id):
        action = self.actions[action_id]

        if action == 0:
            # kick agent from registry if illegal action
            self.agent_layer[agent_id] = 0
        else:
            # update score
            self.scores[agent_id] += action

    def curate(self):
        i = 0
        for layer in self.agent_layer:
            # ignore bad/unregistered
            if layer == 0:
                i += 1
                continue

            min_layer = 1
            max_layer = len(self.layers) - 1

            if self.scores[i] < self.layers[layer]['lower'] and layer > min_layer:
                self.agent_layer[i] -= 1
            elif self.scores[i] > self.layers[layer]['upper'] and layer < max_layer:
                self.agent_layer[i] += 1

            self.scores[i] = 0

            i += 1
