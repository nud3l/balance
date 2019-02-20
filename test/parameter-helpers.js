module.exports = {
    num_layers: function num_layers() {
        let step = 10;
        let max = 101;
        let layers = [];
        for (i = 1; i <= max; i += step) {
            layers.push(i);
        }
        return layers;
    },
    num_agents: function num_agents() {
        let step = 50;
        let max = 1001;
        let agents = [];
        for (i = 1; i <= max; i += step) {
            agents.push(i);
        }
        return agents;
    },
    layer_ids: function layer_ids(number) {
        let ids = [];
        for (i = 1; i <= number; i++) {
            ids.push(i);
        }
        return ids;
    },
    layers: function layers(number) {
        let layers = [];
        let counter = 200;
        let lower = 0;
        let upper = 200;
        let factor = "1750" // does not matter for cost experiment
        for (i = 1; i <= number; i++) {
            layers.push({
                id: i,
                factor: factor,
                bound: [lower.toString(), upper.toString()]
            });
            lower += counter;
            upper += counter;
        }
        return layers;
    }
}