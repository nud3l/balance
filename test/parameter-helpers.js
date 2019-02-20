module.exports = {
    num_layers: function num_layers(min, max, step) {
        let layers = [];
        for (i = min; i <= max; i += step) {
            layers.push(i);
        }
        return layers;
    },
    num_agents: function num_agents(min, max, step) {
        let agents = [];
        for (i = min; i <= max; i += step) {
            agents.push(i);
        }
        return agents;
    },
    layer_ids: function layer_ids(max) {
        let ids = [];
        for (i = 1; i <= max; i++) {
            ids.push(i);
        }
        return ids;
    },
    layers: function layers(max) {
        let layers = [];
        let counter = 200;
        let lower = 0;
        let upper = 200;
        let max_factor = 1750 // does not matter for cost experiment
        let min_factor = 1000
        for (i = 1; i <= max; i++) {
            if (max == 1) {
                factor = base_factor;
            } else {
                factor = max_factor - ((i - 1) / (max - 1) * (max_factor - min_factor));
            }
            console.log(factor);

            layers.push({
                id: i,
                factor: factor.toString(),
                bound: [lower.toString(), upper.toString()]
            });
            lower += counter;
            upper += counter;
        }
        return layers;
    }
}