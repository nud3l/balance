import json
import requests
import csv
import time


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
        # get the number of the put e.g. 0 means output 0, 1 means output 1 etc.
        output = tx[-1:]
        tx = tx[:-2]
        if tx in txs:
            num_tx_updates += 1
        else:
            txs[tx] = output
            num_unique_tx += 1

    if (num_tx_updates > 0 or num_channels_updates > 0):
        print("Unique channels: ", num_unique_channels)
        print("Updates of channels: ", num_channels_updates)
        print("Unique tx: ", num_unique_tx)
        print("Updates of tx: ", num_tx_updates)

    return txs


def detect_channel_closing_variant(funding_transactions):
    with open('tx_outputs.json', 'r', encoding='utf-8') as read_file:
        try:
            funding_outputs = json.load(read_file)
        except json.decoder.JSONDecodeError:
            funding_outputs = dict()

    # get last element from csv
    with open('channel_close_status.csv', 'r') as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=',')
        channel_status = list(csv_reader)
        last_funding_tx_id = channel_status[-1][0]

    counter = 0
    length = len(funding_outputs)

    skipper = True
    # NOTE: ordering only after python 3.6!
    for funding_tx_id in funding_outputs.keys():
        counter += 1

        print("Processing ", funding_tx_id)
        print("Item ", counter, " of ", length)
        print("===============================================================================")

        if funding_tx_id == last_funding_tx_id:
            skipper = False
            continue
        if skipper:
            continue

        funding_output_num = funding_transactions[funding_tx_id]

        # check if transaction is spent, otherwise channel is still open
        continue_loop = True
        for output in funding_outputs[funding_tx_id][0]:
            if output["n"] == int(funding_output_num) and output["spent"] == True:
                continue_loop = False

        if continue_loop:
            continue

        # query the funding output information to get the txid
        funding_output = query_blockstream_api(
            funding_tx_id, funding_output_num)

        result = []

        if funding_output["txid"]:
            closing_tx_id = funding_output["txid"]
            # query the raw transaction
            closing_tx = query_blockstream_api(closing_tx_id)
            # check if the tx has a locktime
            if "locktime" in closing_tx.keys():
                # unilateral close
                if closing_tx["locktime"] > 0:
                    # https://bitcoin.org/en/developer-guide#locktime-and-sequence-number
                    # NOTE: locktime is only set if the channel is unilaterally closed
                    # Locktime is equal the channel id
                    revoke_sh_available = False  # if amount in p2wsh < dust then it's ignored
                    i = 0
                    for closing_output in closing_tx["vout"]:
                        if ("p2wsh" or "p2sh") in closing_output["scriptpubkey_type"]:
                            revoke_output_num = i
                            revoke_sh_available = True
                        i += 1

                    if revoke_sh_available:
                        revoke_output = query_blockstream_api(
                            closing_tx_id, revoke_output_num)

                        if revoke_output["txid"]:
                            revoke_tx_id = revoke_output["txid"]
                            revoke_tx = query_blockstream_api(revoke_tx_id)
                            # check if the transactions has been spent before or after the timelock of the closing tx
                            # unilateral close with revoke
                            if revoke_tx["status"]["block_height"] > (closing_tx["status"]["block_height"] + 144):
                                result = [funding_tx_id, 2]

                    # unilateral close without revoke
                    if not result:
                        result = [funding_tx_id, 1]

                # mutual close
                else:
                    result = [funding_tx_id, 0]
            else:
                print("Locktime not specified")
        # channel still open
        else:
            print("The funding tx ", funding_tx_id, " has not been spent")
            result = [funding_tx_id, -1]

        # write result to csv
        with open('channel_close_status.csv', 'a') as csv_file:
            csv_writer = csv.writer(csv_file)
            csv_writer.writerow(result)


def query_blockstream_api(tx_hash, output=False):
    tx = {}

    if output:
        query = "https://blockstream.info/api/tx/{}/outspend/{}".format(
            tx_hash, output)
    else:
        query = "https://blockstream.info/api/tx/{}".format(tx_hash)
    response = requests.get(query)

    if response.status_code != 200:
        print("API timeout. Waiting 30 seconds")
        print("----------------------------------------------------------")
        print(response.text)
        if "Invalid hash string" in response.text:
            print(query)
            print("Skipping ", tx_hash)
            print("----------------------------------------------------------")
        else:
            print("----------------------------------------------------------")
            time.sleep(31)
            tx = query_blockstream_api(tx_hash, output)
    else:
        tx = response.json()

    return tx


if __name__ == "__main__":
    funding_transactions = read_graph()
    detect_channel_closing_variant(funding_transactions)
