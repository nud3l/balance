class Registry:
    def __init__(self, layers, num_agents):
        self.layers = layers
        self.actions = [100,0]
        self.scores = [0] * num_agents
        self.agent_layer = [0] * num_agent # not in registry 

    def register(self, agent_id):
        self.agent_layer[agent_id] = 1

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
            
            if self.score[i] < self.layers[layer].lower:
                self.agent_layer[i] -= 1
            elif self.score[i] > self.layers[layer].upper:
                self.agent_layer[i] += 1
            
            self.scores[i] = 0
            
            i += 1

