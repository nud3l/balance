import json
import csv

CHANNELS = 'graph.json'
CSV_FILE = 'channel_close_status_2.csv'


def read_graph():
    with open(CHANNELS) as file:
        graph = json.load(file)
        edges = graph["edges"]

    counter = 0

    channel_txs = dict()
    for edge in edges:
        if (edge["node1_policy"] and edge["node2_policy"]):
            time_lock1 = edge["node1_policy"]["time_lock_delta"]
            time_lock2 = edge["node2_policy"]["time_lock_delta"]

        if (time_lock1 != 144) or (time_lock2 != 144):
            tx = edge["chan_point"]
            # print("tx ", edge["chan_point"], "timelock 1 ",
            #       time_lock1, "timelock 2 ", time_lock2)
            # counter += 1

        channel_txs[tx[:-2]] = True

    with open(CSV_FILE, 'r') as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=',')
        channel_status = list(csv_reader)

    for tx in channel_status:
        tx_id = tx[0]
        if tx_id in channel_txs.keys():
            counter += 1

    print(counter)


if __name__ == "__main__":
    read_graph()
