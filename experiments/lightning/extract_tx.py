# Read in graph.json for all channels
# Example channel
# {
# 	"channel_id": "612246557287448576",
# 	"chan_point": "fb633bca751bca5250e87e345f9006c6eb0964bc9d6660b4212b38718041323e:0",
# 	"last_update": 1546523649,
# 	"node1_pub": "02881a55acfe466dc3698abe31f412260edeff067cafac8d5c26213a7207f19930",
# 	"node2_pub": "037eb17d0fee2d20bacea3d78940b40f4ac61a5a7040a23b6e8280c80d7ebfb420",
# 	"capacity": "500000",
# 	"node1_policy": {
# 		"time_lock_delta": 144,
# 		"min_htlc": "1000",
# 		"fee_base_msat": "1000",
# 		"fee_rate_milli_msat": "1",
# 		"disabled": false
# 	},
# 	"node2_policy": {
# 		"time_lock_delta": 144,
# 		"min_htlc": "1000",
# 		"fee_base_msat": "1000",
# 		"fee_rate_milli_msat": "1",
# 		"disabled": false
# 	}
# }
# chan_point = funding transaction
import json
from blockchain import blockexplorer


def read_graph():
    with open("graph.json") as file:
        graph = json.load(file)
        edges = graph["edges"]

    num_unique_channels = 0
    num_channels_updates = 0
    num_tx_updates = 0
    num_unique_tx = 0

    channels = dict()
    txs = dict()

    for edge in edges:
        if edge["channel_id"] in channels:
            num_channels_updates += 1
        else:
            channels[edge["channel_id"]] = False
            num_unique_channels += 1
        tx = edge["chan_point"]
        tx = tx[:-2]
        if tx in txs:
            num_tx_updates += 1
        else:
            txs[tx] = True
            num_unique_tx += 1

    if (num_tx_updates > 0 or num_channels_updates > 0):
        print("Unique channels: ", num_unique_channels)
        print("Updates of channels: ", num_channels_updates)
        print("Unique tx: ", num_unique_tx)
        print("Updates of tx: ", num_tx_updates)

    return txs

# Query blockchain.com API for tx information
# Returns transaction object
# double_spend: bool
# block_height: int(if -1, the tx is unconfirmed)
# time: int
# relayed_by: str
# hash: str
# tx_index: int
# version: int
# size: int
# inputs: array of Input objects
# outputs: array of Output objects
# Output object
# n: int
# value: int
# address: str
# tx_index: int
# script: str
# spent: bool


def get_tx_info(tx_hash):
    try:
        tx = blockexplorer.get_tx(tx_hash)
    except APIException as e:
        print(e)
    return tx


def process_outputs(tx):
    spents = []
    num_spents = 0

    for output in tx.outputs:
        tx_index = 0
        if output.spent:
            tx_index = output.tx_index
            num_spents += 1
        spents.append(tx_index)

    return spents, num_spents


transactions = read_graph()

tx_hash = next(iter(transactions.keys()))

tx_object = get_tx_info(tx_hash)
print(tx_object.hash)

spents, num_spents = process_outputs(tx_object)
print(spents, num_spents)

spent_channel_tx = dict()

if num_spents > 0:
    for spent in spents:
        print(spent)


# Return tx information

# Check if the tx is spent
# if unspent -> channel still open
# if spent
# 1) ideal close: latest commit tx should not include timelock (?)
# 2) unilateral close: latest commit tx includes a timelock
# 3) revocation close: old commit tx with timelock spend by revoke tx
